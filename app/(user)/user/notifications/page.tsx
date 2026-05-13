"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell, CheckCircle2, CreditCard, Calendar, MapPin,
    Star, MessageCircle, ShieldCheck, Trash2, Check,
    Filter, ChevronDown, Clock, AlertCircle, Package, Zap
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import Link from "next/link";
import { supabase } from "@/services/supabase";
import { useUser } from "@/contexts/UserContext";
import PageHeader from "@/components/PageHeader";
import { useEffect } from "react";

type NotifType = "booking" | "payment" | "provider" | "system" | "review" | "reminder" | "announcement" | "alert" | "update" | "promotion";

interface Notification {
    id: string;
    type: NotifType;
    title: string;
    message: string;
    time: string;
    read: boolean;
    actionUrl?: string;
    actionLabel?: string;
}

// All notifications are fetched dynamically from Supabase


const typeConfig: Record<NotifType, { icon: any; color: string; bg: string }> = {
    booking: { icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    payment: { icon: CreditCard, color: "text-green-600", bg: "bg-green-50" },
    provider: { icon: MapPin, color: "text-violet-600", bg: "bg-violet-50" },
    system: { icon: ShieldCheck, color: "text-text-secondary", bg: "bg-gray-100" },
    review: { icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
    reminder: { icon: Clock, color: "text-pink-600", bg: "bg-pink-50" },
    announcement: { icon: Bell, color: "text-indigo-600", bg: "bg-indigo-50" },
    alert: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    update: { icon: Zap, color: "text-blue-600", bg: "bg-blue-50" },
    promotion: { icon: Star, color: "text-purple-600", bg: "bg-purple-50" },
};

type FilterType = "all" | NotifType;

export default function NotificationsPage() {
    const { user } = useUser();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>("all");
    const [showFilterMenu, setShowFilterMenu] = useState(false);

    useEffect(() => {
        if (!user?.id) return;

        async function fetchNotifications() {
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('receiver_id', user!.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    setNotifications(data.map(n => ({
                        id: n.id,
                        type: (n.type?.toLowerCase() as NotifType) || 'system',
                        title: n.title,
                        message: n.message,
                        time: new Date(n.created_at).toLocaleDateString(),
                        read: n.is_read,
                        actionUrl: n.action_url,
                        actionLabel: n.action_label
                    })));
                }
            } catch (e) {
                console.error("Notifications fetch failed:", e);
            } finally {
                setIsLoading(false);
            }
        }

        fetchNotifications();
    }, [user?.id]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const filteredNotifs = filter === "all"
        ? notifications
        : notifications.filter(n => (n.type as string) === filter);

    const markAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    };

    const markAllRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        if (user?.id) {
            await supabase.from('notifications').update({ is_read: true }).eq('receiver_id', user.id);
        }
    };

    const deleteNotif = async (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        await supabase.from('notifications').delete().eq('id', id);
    };

    const clearAll = async () => {
        setNotifications(prev => prev.filter(n => !n.read));
        if (user?.id) {
            await supabase.from('notifications').delete().eq('receiver_id', user.id).eq('is_read', true);
        }
    };

    const filterOptions: { value: FilterType; label: string }[] = [
        { value: "all", label: "All" },
        { value: "booking", label: "Bookings" },
        { value: "payment", label: "Payments" },
        { value: "provider", label: "Provider" },
        { value: "review", label: "Reviews" },
        { value: "reminder", label: "Reminders" },
        { value: "system", label: "System" },
    ];

    return (
        <div className="flex-1 bg-muted/50 min-h-screen">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                <PageHeader 
                    title="Notifications"
                    subtitle="Stay updated on your bookings and services"
                    actions={
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="px-4 py-2.5 text-xs font-bold text-primary bg-primary/5 border border-primary/10 rounded-xl hover:bg-primary/10 transition-all active:scale-95 transition-all duration-200"
                                >
                                    Mark All Read
                                </button>
                            )}
                            {notifications.some(n => n.read) && (
                                <button
                                    onClick={clearAll}
                                    className="px-4 py-2.5 text-xs font-bold text-text-secondary bg-gray-100 rounded-xl hover:bg-gray-200 transition-all active:scale-95 transition-all duration-200"
                                >
                                    Clear Read
                                </button>
                            )}
                        </div>
                    }
                />

                {/* Filter Pills */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="flex gap-2 overflow-x-auto no-scrollbar mb-6 pb-1"
                >
                    {filterOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setFilter(opt.value)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${filter === opt.value
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "bg-card text-text-secondary border border-border hover:border-border hover:text-foreground"
                                }`}
                        >
                            {opt.label}
                            {opt.value === "all" && unreadCount > 0 && (
                                <span className={`ml-1.5 ${filter === opt.value ? "text-white/70" : "text-text-hint"}`}>
                                    ({unreadCount})
                                </span>
                            )}
                        </button>
                    ))}
                </motion.div>

                {/* Notifications List */}
                <div className="space-y-3">
                    <AnimatePresence>
                        {filteredNotifs.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-card rounded-[28px] border border-border p-16 text-center shadow-sm"
                            >
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Bell className="w-8 h-8 text-text-disabled" />
                                </div>
                                <h3 className={`${unbounded.className} text-lg font-bold text-foreground mb-2`}>No Notifications</h3>
                                <p className="text-sm text-text-hint font-medium">
                                    {filter === "all" ? "You're all caught up!" :`No ${filter} notifications found.`}
                                </p>
                            </motion.div>
                        ) : (
                            filteredNotifs.map((notif, i) => {
                                const config = typeConfig[notif.type];
                                return (
                                    <motion.div
                                        key={notif.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100 }}
                                        transition={{ delay: i * 0.03 }}
                                        onClick={() => markAsRead(notif.id)}
                                        className={`bg-card rounded-[20px] border transition-all cursor-pointer group relative overflow-hidden ${notif.read
                                                ? "border-border opacity-70 hover:opacity-100"
                                                : "border-primary/20 shadow-sm hover:shadow-md"
                                            }`}
                                    >
                                        {/* Unread indicator */}
                                        {!notif.read && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-[20px]" />
                                        )}

                                        <div className="p-5 flex gap-4">
                                            <div className={`w-12 h-12 rounded-2xl ${config.bg} ${config.color} flex items-center justify-center flex-shrink-0`}>
                                                <config.icon className="w-5 h-5" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                                            {notif.title}
                                                            {!notif.read && (
                                                                <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                                                            )}
                                                        </h4>
                                                        <p className="text-xs text-text-secondary font-medium mt-1 leading-relaxed line-clamp-2">
                                                            {notif.message}
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                                                        className="p-2 text-text-disabled hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                                                        aria-label="Delete notification"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between mt-3">
                                                    <span className="text-[10px] font-bold text-text-disabled uppercase tracking-wider">{notif.time}</span>
                                                    {notif.actionUrl && (
                                                        <Link
                                                            href={notif.actionUrl}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="text-xs font-bold text-primary hover:underline"
                                                        >
                                                            {notif.actionLabel} →
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
