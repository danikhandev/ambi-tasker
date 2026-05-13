"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Calendar, CreditCard, MapPin, ShieldCheck, MessageSquare, AlertCircle, Bell, Star, Zap } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import { useUser } from "./UserContext";
import { useUI } from "./UIContext";

export type NotificationType = "booking" | "payment" | "provider" | "system" | "message" | "announcement" | "alert" | "update" | "promotion";

export interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    type: NotificationType;
    icon?: any;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, "id" | "time" | "read">) => void;
    markAsRead: (id: string) => void;
    markAllRead: () => void;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useUser();
    const { showToast } = useUI();
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;

        try {
            if (isSupabaseConfigured) {
                const { data, error } = await supabase
                    .from('user_notifications')
                    .select(`
                        id,
                        is_read,
                        created_at,
                        notification:notifications (
                            title,
                            body,
                            type
                        )
                    `)
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    const mappedNotifs: Notification[] = data.map((un: any) => {
                        const n = un.notification;
                        const dbType = n?.type || 'GENERAL';
                        let notifType: NotificationType = "system";
                        
                        if (dbType === "BOOKING") notifType = "booking";
                        else if (dbType === "PAYMENT") notifType = "payment";
                        else if (dbType === "ALERT") notifType = "alert";
                        else if (dbType === "PROMOTION") notifType = "promotion";
                        else if (dbType === "SYSTEM") notifType = "system";
                        else if (dbType === "MESSAGE") notifType = "message";

                        return {
                            id: un.id,
                            title: n?.title || "Notification",
                            message: n?.body || "",
                            time: un.created_at,
                            read: un.is_read || false,
                            type: notifType,
                        };
                    });
                    setNotifications(mappedNotifs);
                }
            } else {
                const res = await fetch('/api/notifications');
                const json = await res.json();
                if (json.success) {
                    const mapped: Notification[] = json.data.map((un: any) => {
                         let notifType: NotificationType = "system";
                         const dbType = un.type;
                         if (dbType === "BOOKING") notifType = "booking";
                         else if (dbType === "PAYMENT") notifType = "payment";
                         else if (dbType === "ALERT") notifType = "alert";
                         else if (dbType === "PROMOTION") notifType = "promotion";
                         else if (dbType === "MESSAGE") notifType = "message";

                         return {
                             id: un.id,
                             title: un.title,
                             message: un.body,
                             time: un.createdAt,
                             read: un.isRead,
                             type: notifType
                         };
                    });
                    setNotifications(mapped);
                }
            }
        } catch (error: any) {
            if (error.message?.includes("Offline") || error === "Offline") return;
            console.error("Error fetching notifications:", error.message || error);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) {
            setNotifications([]);
            return;
        }

        fetchNotifications();

        if (isSupabaseConfigured) {
            const dbChannel = supabase
                .channel(`notifications-${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'user_notifications',
                    filter: `user_id=eq.${user.id}`,
                }, () => {
                    fetchNotifications();
                })
                .subscribe();

            const broadcastChannel = supabase.channel('system-notifications');
            broadcastChannel
                .on('broadcast', { event: 'new-notification' }, ({ payload }) => {
                    const isRecipient = 
                        payload.recipientIds?.includes(user.id) || 
                        payload.targetType === 'ALL_USERS' ||
                        (payload.targetType === 'ALL_PROVIDERS' && user.role === 'PROVIDER');

                    if (isRecipient) {
                        fetchNotifications();
                        // Show Real-time Toast for production-level experience
                        showToast(payload.title, "success", payload.body);
                        window.dispatchEvent(new CustomEvent('app:notification', { detail: payload }));
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(dbChannel);
                supabase.removeChannel(broadcastChannel);
            };
        } else {
            const interval = setInterval(fetchNotifications, 10000);
            return () => clearInterval(interval);
        }
    }, [user?.id, fetchNotifications, user?.role, showToast]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const addNotification = useCallback(async (notif: Omit<Notification, "id" | "time" | "read">) => {
        const newNotif: Notification = {
            ...notif,
            id: Math.random().toString(36).substr(2, 9),
            time: new Date().toISOString(),
            read: false,
        };
        setNotifications(prev => [newNotif, ...prev]);
    }, []);

    const markAsRead = useCallback(async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        try {
            if (isSupabaseConfigured) {
                await supabase.from('user_notifications').update({ is_read: true }).eq('id', id);
            } else {
                await fetch('/api/notifications/read', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notificationId: id })
                });
            }
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    }, []);

    const markAllRead = useCallback(async () => {
        if (!user?.id) return;
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        try {
            if (isSupabaseConfigured) {
                await supabase.from('user_notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
            } else {
                await fetch('/api/notifications/read/all', { method: 'POST' });
            }
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    }, [user?.id]);

    const removeNotification = useCallback(async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        try {
            if (isSupabaseConfigured) {
                await supabase.from('user_notifications').delete().eq('id', id);
            } else {
                await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
            }
        } catch (error) {
            console.error("Failed to remove notification:", error);
        }
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            addNotification,
            markAsRead,
            markAllRead,
            removeNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
