"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home, Search, LayoutDashboard,
    MessageSquare, User, Hammer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/contexts/UserContext";

/**
 * MobileBottomNav
 * A professional bottom navigation bar designed for a mobile-first app experience.
 * Features smooth active tab indicators and brand-aligned styling.
 */
const MobileBottomNav = React.memo(() => {
    const pathname = usePathname();
    const { t } = useTranslation();
    const { user, activePerspective } = useUser();

    // 1. Visibility Logic
    const hideOn = ["/login", "/register", "/splash", "/provider/onboarding", "/onboarding"];
    const shouldHide = hideOn.some(path => pathname?.startsWith(path));
    if (shouldHide) return null;

    // 2. Dynamic Navigation Items
    const navItems = [
        { icon: Home, label: t("common.home"), href: "/" },
        { icon: Search, label: t("header.services"), href: "/search" },
        {
            icon: activePerspective === "provider" ? Hammer : LayoutDashboard,
            label: activePerspective === "provider" ? "Panel" : "Hub",
            href: activePerspective === "provider" ? "/provider/dashboard" : "/user/dashboard"
        },
        { icon: MessageSquare, label: t("nav.messages"), href: "/messages" },
        { icon: User, label: t("nav.profile"), href: user ? "/user/profile" : "/login" }
    ];

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] safe-area-bottom">
            <nav className="w-full bg-white/98 backdrop-blur-2xl border-t border-border/40 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] px-2 pt-2 pb-6 flex items-center justify-between relative overflow-hidden">
                {/* Minimal Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex-1 flex flex-col items-center justify-center h-10 transition-all active:scale-95"
                        >
                            <div className="relative z-10 flex flex-col items-center justify-center">
                                <item.icon
                                    size={isActive ? 20 : 18}
                                    className={`transition-all duration-300 ${isActive ? "text-primary filter drop-shadow-[0_0_5px_rgba(var(--primary-rgb),0.3)]" : "text-text-hint opacity-50"}`}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.span
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 4 }}
                                            className="text-[7px] font-black uppercase tracking-[0.1em] text-primary mt-1"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Active Indicator (Underline Dot) */}
                            {isActive && (
                                <motion.div
                                    layoutId="bottom-nav-indicator"
                                    className="absolute bottom-0 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
                                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
});

MobileBottomNav.displayName = "MobileBottomNav";

export default MobileBottomNav;
