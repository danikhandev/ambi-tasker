"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, Trash2, Calendar, CreditCard, MessageSquare, ShieldCheck, AlertCircle, Clock, Zap, Star } from "lucide-react";
import { useNotifications, Notification, NotificationType } from "@/contexts/NotificationContext";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { unbounded } from "@/app/fonts";

const ICON_MAP: Record<NotificationType, any> = {
    booking: Calendar,
    payment: CreditCard,
    message: MessageSquare,
    provider: ShieldCheck,
    system: AlertCircle,
    announcement: Bell,
    alert: AlertCircle,
    update: Zap,
    promotion: Star,
};

const COLOR_MAP: Record<NotificationType, string> = {
    booking: "bg-blue-500",
    payment: "bg-emerald-500",
    message: "bg-primary",
    provider: "bg-purple-500",
    system: "bg-amber-500",
    announcement: "bg-indigo-500",
    alert: "bg-red-500",
    update: "bg-blue-500",
    promotion: "bg-pink-500",
};

export default function NotificationBell() {
    const { notifications, unreadCount, markAsRead, markAllRead, removeNotification } = useNotifications();
    const { t, isRTL } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
        // Potential routing based on type
        // if (notification.type === 'booking') router.push('/dashboard/bookings');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2.5 rounded-2xl transition-all relative outline-none ring-primary/20 ${
                    isOpen 
                    ? "bg-primary/10 text-primary shadow-inner" 
                    : "text-text-secondary hover:text-primary hover:bg-primary/5"
                }`}
                aria-label={t("notifications.title") || "Notifications"}
            >
                <Bell className={`w-[22px] h-[22px] transition-transform duration-300 ${isOpen ? "scale-110" : ""}`} />
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [1, 0.8, 1]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm z-10"
                    />
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`absolute top-full mt-3 w-[400px] max-w-[90vw] bg-card rounded-[32px] shadow-2xl border border-border overflow-hidden z-[100] ${isRTL ? "left-0 origin-top-left" : "right-0 origin-top-right"}`}
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-border bg-muted/30 flex items-center justify-between">
                            <div>
                                <h3 className={`${unbounded.className} text-lg font-black text-foreground`}>
                                    {t("notifications.title") || "Alert Center"}
                                </h3>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mt-1">
                                    {unreadCount} {t("notifications.unread") || "Unread Messages"}
                                </p>
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); markAllRead(); }}
                                    className="p-2.5 hover:bg-primary/5 text-primary rounded-xl transition-all group flex items-center gap-2"
                                    title={t("notifications.markAllRead") || "Mark all read"}
                                >
                                    <Check className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Read All</span>
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[450px] overflow-y-auto no-scrollbar py-2 bg-card">
                            {notifications.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-center px-8">
                                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-6">
                                        <Bell className="w-8 h-8 text-text-hint opacity-20" />
                                    </div>
                                    <p className="font-bold text-foreground mb-1">{t("notifications.emptyTitle") || "Quiet for now!"}</p>
                                    <p className="text-sm text-text-hint max-w-xs">{t("notifications.emptyDesc") || "We'll notify you when something important happens."}</p>
                                </div>
                            ) : (
                                <div className="space-y-0.5">
                                    {notifications.map((notif) => {
                                        const Icon = ICON_MAP[notif.type] || Bell;
                                        const color = COLOR_MAP[notif.type] || "bg-gray-500";
                                        
                                        return (
                                            <div
                                                key={notif.id}
                                                onClick={() => handleNotificationClick(notif)}
                                                className={`group relative px-8 py-5 transition-all cursor-pointer flex gap-5 ${
                                                    notif.read 
                                                    ? "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 hover:bg-muted/30" 
                                                    : "bg-primary/[0.02] hover:bg-primary/[0.05]"
                                                }`}
                                            >
                                                {/* Left Indicator */}
                                                {!notif.read && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                                )}

                                                {/* Icon */}
                                                <div className="relative flex-shrink-0">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${color} transition-transform group-hover:scale-110 duration-300`}>
                                                        <Icon size={20} strokeWidth={2.5} />
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-4 mb-2">
                                                        <h4 className={`text-sm font-black text-foreground truncate ${!notif.read ? "pr-2" : ""}`}>
                                                            {notif.title}
                                                        </h4>
                                                        <span className="flex-shrink-0 text-[9px] font-bold text-text-hint flex items-center gap-1.5 uppercase tracking-tighter mt-0.5">
                                                            <Clock size={10} />
                                                            {formatTime(notif.time)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                                                        {notif.message}
                                                    </p>
                                                </div>

                                                {/* Actions Overlay */}
                                                <div className="absolute top-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                                     <button
                                                        onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                                                        className="p-1.5 bg-card border border-border rounded-lg text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                                                        title="Remove"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="px-8 py-5 bg-muted/30 border-t border-border">
                                <Link 
                                    href="/dashboard/notifications" 
                                    className="w-full h-11 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-xl transition-all"
                                    onClick={() => setIsOpen(false)}
                                >
                                    View Detailed Activity Logs
                                </Link>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function formatTime(timestamp: string) {
    try {
        const date = new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true }).replace('about ', '');
    } catch {
        return "recently";
    }
}
