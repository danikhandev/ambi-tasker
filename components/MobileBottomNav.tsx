"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home, Search, LayoutDashboard,
    MessageSquare, User, Hammer
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/contexts/UserContext";

/**
 * MobileBottomNav
 * A professional bottom navigation bar designed for a mobile-first app experience.
 * Features smooth active tab indicators and brand-aligned styling.
 */
const MobileBottomNav = React.memo(() => {
    const pathname = usePathname();
    const { t, isRTL } = useTranslation();
    const { user, activePerspective } = useUser();

    // Define navigation items based on role
    const navItems = [
        { icon: Home, label: t("common.home") || "Home", href: "/" },
        { icon: Search, label: t("header.services") || "Explore", href: "/search" },
        {
            icon: activePerspective === "provider" ? Hammer : LayoutDashboard,
            label: activePerspective === "provider" ? t("header.workerPanel") : t("nav.dashboard"),
            href: activePerspective === "provider" ? "/provider/dashboard" : "/user/dashboard"
        },
        { icon: MessageSquare, label: t("nav.messages") || "Chat", href: "/messages" },
        { icon: User, label: t("nav.profile") || "Profile", href: user ? "/user/profile" : "/login" }
    ];

    // Hide on specific pages where it might be intrusive
    const hideOn = ["/login", "/register", "/splash", "/provider/onboarding", "/onboarding"];
    if (hideOn.some(path => pathname?.startsWith(path))) return null;

    return (
        <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[100]">
            <nav className="bg-white/80 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[32px] px-4 py-3 flex items-center justify-between relative overflow-hidden">
                {/* Background active pill decoration */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center w-14 h-14 group"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bottom-nav-active"
                                    className="absolute inset-0 bg-primary/10 rounded-2xl border border-primary/5"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <item.icon
                                size={22}
                                className={`transition-all duration-300 ${isActive ? "text-primary scale-110" : "text-text-hint group-hover:text-text-secondary"}`}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            {isActive && (
                                <motion.span
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[9px] font-black uppercase tracking-tighter text-primary mt-1"
                                >
                                    {item.label}
                                </motion.span>
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
