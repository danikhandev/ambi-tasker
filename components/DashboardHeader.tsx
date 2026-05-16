"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, User2, MessageSquare, Repeat, Settings, Search, LogOut, ChevronDown, CheckCircle2, Calendar, CreditCard, MapPin, ShieldCheck, X, Moon, Sun, Globe, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ADMIN_ROUTES, USER_ROUTES, PROVIDER_ROUTES, AUTH_ROUTES } from "@/constants/routes";
import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useUI } from "@/contexts/UIContext";
import { useTranslation } from "@/hooks/useTranslation";
import { unbounded } from "@/app/fonts";
import CircularFrame from "./CircularFrame";
import Logo from "./ui/Logo";
import Brand from "./ui/Brand";
import ProviderStatusToggle from "./ProviderStatusToggle";
import NotificationBell from "./notifications/NotificationBell";
import BackButton from "./BackButton";
import { useUnreadCount } from "@/hooks/useUnreadCount";

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function DashboardHeader({
  title = "",
  subtitle,
}: DashboardHeaderProps) {
  const { user, activePerspective, switchPerspective, logout, loading: userLoading } = useUser();
  const { admin, loading: adminLoading, logout: adminLogout, theme, switchTheme } = useAdmin();
  const { language, setLanguage } = useUI();
  const { t, isRTL } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = (id: string | number) => {
    markAsRead(id.toString());
  };

  const handleSwitchPerspective = async () => {
    const newPerspective = activePerspective === 'consumer' ? 'provider' : 'consumer';
    await switchPerspective(newPerspective);
    router.push(newPerspective === 'provider' ? PROVIDER_ROUTES.DASHBOARD : USER_ROUTES.HOME);
  };

  const getUserInfo = () => {
    const isProviderPath = pathname?.startsWith("/provider");
    const isAdminPath = pathname?.startsWith("/admin");
    const isUserPath = pathname?.startsWith("/user") || pathname?.startsWith("/dashboard") || pathname?.startsWith("/profile");

    // 1. If on Admin path, prioritize Admin info
    if (isAdminPath && admin) {
      return { 
        displayName: (admin.name && admin.name.toLowerCase().includes("primary admin")) ? t("common.superAdmin") : (admin.name || t("common.admin")), 
        displayRole: admin.role === 'SUPER_ADMIN' ? t("common.superAdmin") : t("common.subAdmin"), 
        profileImage: admin.avatar || "/admin/system-admin.jpg",
        email: admin.email
      };
    }

    // 2. If on Provider/User path, prioritize User info
    if ((isProviderPath || isUserPath) && user) {
      let roleLabel = activePerspective === "provider" ? t("common.professional") : t("common.customer");
      if (user.role === 'ADMIN') roleLabel = t("common.admin");

      return {
        displayName: `${user.firstName} ${user.lastName}`.trim() || user.email?.toLowerCase().split("@")[0] || t("common.guest"),
        displayRole: roleLabel,
        profileImage: user.avatar,
        email: user.email,
      };
    }

    // 3. Fallback to User if logged in
    if (user) {
      return {
        displayName: (user.firstName + (user.lastName ? ` ${user.lastName}` : "")) || user.email?.toLowerCase().split("@")[0] || t("common.guest"),
        displayRole: user.isUserSignUpForProvider ? (activePerspective === "provider" ? t("common.professional") : t("common.customer")) : t("common.customer"),
        profileImage: user.avatar,
        email: user.email,
      };
    }

    // 4. Fallback to Admin if logged in
    if (admin) {
      return { 
        displayName: admin.name || t("common.admin"), 
        displayRole: admin.role === 'SUPER_ADMIN' ? t("common.superAdmin") : t("common.subAdmin"), 
        profileImage: admin.avatar || "/admin/system-admin.jpg",
        email: admin.email
      };
    }

    if (adminLoading || userLoading) {
      return { displayName: "Loading...", displayRole: "Syncing...", profileImage: null, email: "" };
    }

    return { displayName: t("common.guest"), displayRole: t("common.visitor"), profileImage: null, email: "" };
  };

  const { displayName, displayRole, profileImage, email } = getUserInfo();
  const isAdminView = pathname?.startsWith("/admin");
  const isProviderView = pathname?.startsWith("/provider");



  const { 
    pageTitle: contextTitle, 
    pageTitleHighlight: contextHighlight,
    pageSubtitle: contextSubtitle, 
    setMobileSidebarOpen 
  } = useUI();
  const displayTitle = title || contextTitle;
  const displaySubtitle = subtitle || contextSubtitle;
  const unreadMessages = useUnreadCount(isAdminView ? admin?.masterId : (user?.id || ""));

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${isScrolled
        ? "bg-background/70 backdrop-blur-[20px] shadow-[0_4px_30px_-5px_rgba(0,0,0,0.05),0_10px_20px_-5px_rgba(0,0,0,0.04)] border-b border-border/60"
        : "bg-background/40 backdrop-blur-md border-b border-border/30"
        }`}
    >
      <div className="relative h-[56px] sm:h-[64px] md:h-[72px] lg:h-[80px] px-3 sm:px-4 md:px-8 lg:px-10 max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-3 md:gap-6">
        {/* Left Side */}
        <div className={`flex items-center gap-2 sm:gap-3 md:gap-8 min-w-0 ${isAdminView ? 'w-auto' : 'flex-1'}`}>
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center text-text-hint hover:text-primary bg-secondary/30 border border-border/40 rounded-xl transition-all flex-shrink-0"
            aria-label="Open Menu"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Brand Identity */}
          <Link href="/" className="flex lg:hidden items-center hover:opacity-80 transition-opacity flex-none">
            <Brand size="md" hideTextOnMobile={true} />
          </Link>

          {/* Main Navigation Links - Hidden on smaller desktops */}
          {!isAdminView && !isProviderView && (
            <nav className="hidden xl:flex items-center gap-6 ml-4">
              {[
                { name: t("nav.dashboard"), href: "/dashboard" },
                { name: t("nav.bookings"), href: "/bookings" },
                { name: t("nav.earnings"), href: "/earnings" },
                { name: t("nav.support"), href: "/support" },
                { name: t("nav.aboutUs"), href: "/about" },
              ].map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className="text-[11px] font-black uppercase tracking-widest text-text-hint hover:text-primary transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          )}

          {displayTitle && !isAdminView ? (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center gap-4 min-w-0"
            >
              <div className="flex flex-col justify-center min-w-0">
                {contextHighlight ? (
                  <h1 className={`${unbounded.className} text-[18px] lg:text-[28px] font-black text-foreground leading-none tracking-tight flex items-center gap-2 flex-wrap`}>
                    <span className="opacity-40">{displayTitle}</span>
                    <span className="bg-gradient-to-r from-primary via-indigo-600 to-primary bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient-x truncate">
                      {contextHighlight}
                    </span>
                  </h1>
                ) : (
                  <h1 className={`${unbounded.className} text-[18px] lg:text-[28px] font-black text-foreground leading-none tracking-tight truncate`}>
                    {displayTitle}
                  </h1>
                )}
                {displaySubtitle && <p className="text-[10px] md:text-[11px] font-black text-text-hint/60 uppercase tracking-[0.2em] mt-2 truncate">{displaySubtitle}</p>}
              </div>
            </motion.div>
          ) : null}
          {isAdminView && pathname !== "/admin/dashboard" && (
            <div className="ml-4">
               <BackButton fallbackUrl="/admin/dashboard" />
            </div>
          )}
        </div>

        {isAdminView && displayTitle && (
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center w-full max-w-[40%] pointer-events-none z-10">
            <h1 className={`${unbounded.className} text-[14px] md:text-[16px] lg:text-[18px] font-black uppercase tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-3`}>
              <div className="hidden xl:flex gap-1">
                <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                <div className="w-1 h-1 rounded-full bg-primary/30" />
              </div>
              {displayTitle}
              <div className="hidden xl:flex gap-1 items-center rotate-180">
                <div className="w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                <div className="w-1 h-1 rounded-full bg-primary/30" />
              </div>
            </h1>
            {displaySubtitle && (
              <p className="text-[7px] md:text-[8px] font-black text-text-hint/70 uppercase tracking-[0.2em] flex items-center gap-2 bg-secondary/40 px-2.5 py-0.5 rounded-full border border-border/40 backdrop-blur-md mt-1.5">
                {displaySubtitle}
              </p>
            )}
          </div>
        )}

        {/* Right Side Info (Admin Only) */}
        {admin && isAdminView && (
          <div className="hidden xl:flex items-center gap-4 w-[300px] justify-end">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-600 tracking-tight">{t("admin.systemPulse")}</span>
            </div>
            <div className="px-3 py-1.5 bg-primary/5 text-primary border border-primary/10 rounded-xl flex items-center gap-2">
              <ShieldCheck size={12} className="opacity-80" />
              <span className="text-[10px] font-bold tracking-tight">{t("admin.rootUplink")}</span>
            </div>
          </div>
        )}

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-6 flex-shrink-0">
          {/* Quick Actions Group */}
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-3">
            {!isAdminView && user?.isUserSignUpForProvider && user.role !== 'ADMIN' && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Active Perspective Badge — hidden on very small, compact on sm, full on md+ */}
                <div className={`hidden md:flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 rounded-2xl border ${
                  user.role === 'ADMIN'
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-600"
                  : activePerspective === 'provider' 
                    ? "bg-primary/5 border-primary/20 text-primary" 
                    : "bg-amber-500/5 border-amber-500/20 text-amber-600"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    user.role === 'ADMIN' ? "bg-indigo-500" : activePerspective === 'provider' ? "bg-primary" : "bg-amber-500"
                  }`} />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                    {user.role === 'ADMIN' ? t("common.admin") : (activePerspective === 'provider' ? t("common.professional") : t("common.customer"))}
                  </span>
                </div>

                <button
                  onClick={handleSwitchPerspective}
                  className="flex items-center gap-1.5 sm:gap-2 group px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-secondary/30 hover:bg-primary rounded-xl sm:rounded-2xl transition-all duration-400 border border-border/60 hover:border-primary shadow-sm hover:shadow-primary/20"
                  aria-label={`${t("header.switchTo")} ${activePerspective === 'consumer' ? t("common.professional") : t("common.customer")} ${t("header.mode")}`}
                >
                  <Repeat className="w-3.5 h-3.5 text-text-hint group-hover:text-white transition-all duration-300" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-text-secondary group-hover:text-white transition-colors hidden sm:inline">
                    {activePerspective === 'consumer' ? t("header.proMode") : t("header.userMode")}
                  </span>
                </button>
              </div>
            )}



            {!isAdminView && (
              <Link
                href="/messages"
                className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex items-center justify-center text-text-secondary hover:text-primary hover:bg-primary/5 rounded-xl sm:rounded-2xl transition-all relative group shadow-sm bg-secondary/30 border border-border/40"
                aria-label={t("nav.messages")}
              >
                <MessageSquare className="w-4 h-4 sm:w-[18px] sm:h-[18px] md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
                <AnimatePresence>
                  {unreadMessages > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute -top-1 -right-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] bg-red-500 text-white text-[8px] sm:text-[9px] font-black rounded-full flex items-center justify-center px-0.5 sm:px-1 border-2 border-background shadow-md"
                    >
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )}



            {!isAdminView && (
              <div className="relative">
                <NotificationBell />
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="hidden md:block w-px h-8 lg:h-10 bg-gradient-to-b from-transparent via-border to-transparent" />

          {/* User Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => { setShowProfileMenu(!showProfileMenu); }}
              className="flex items-center gap-2 sm:gap-3 md:gap-4 group p-1 sm:p-1.5 sm:pr-2 md:pr-3 bg-secondary/30 hover:bg-secondary/50 rounded-xl sm:rounded-2xl border border-border/40 transition-all active:scale-95"
              aria-label="Account menu"
            >
              <div className="relative">
                {profileImage && !profileImage.includes("dicebear.com") ? (
                  <>
                    <div className="hidden sm:block">
                      <CircularFrame
                        src={profileImage}
                        alt={displayName}
                        size={42}
                        border={true}
                        className="group-hover:ring-4 ring-primary/10 transition-all shadow-md"
                      />
                    </div>
                    <div className="block sm:hidden">
                      <CircularFrame
                        src={profileImage}
                        alt={displayName}
                        size={32}
                        border={true}
                        className="group-hover:ring-2 ring-primary/10 transition-all shadow-sm"
                      />
                    </div>
                  </>
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-background shadow-md group-hover:shadow-lg group-hover:border-primary/20 transition-all">
                    <User2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 border-2 border-background rounded-full z-10 shadow-sm" />
              </div>

              {/* Hide name text if it's already in the main title to avoid duplication */}
              {(!displayTitle?.includes(displayName) && !contextHighlight?.includes(displayName)) && (
                <div className="text-left hidden lg:block pr-2">
                  <p className="text-sm font-bold text-foreground leading-none mb-1 group-hover:text-primary transition-colors">{displayName}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] font-bold text-text-hint tracking-tight opacity-70 leading-none">
                      {displayName === displayRole ? t("admin.systemAdmin") : displayRole}
                    </p>
                    <ChevronDown size={12} className={`text-text-hint transition-transform duration-300 ${showProfileMenu ? 'rotate-180 text-primary' : ''}`} />
                  </div>
                </div>
              )}
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: 15, scale: 0.95, filter: "blur(4px)" }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="absolute top-full right-0 mt-4 w-64 bg-card/95 backdrop-blur-xl rounded-[28px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25)] border border-border/80 p-3 z-50 overflow-hidden"
                >
                  <div className="px-5 py-4 bg-secondary/30 rounded-2xl mb-2 border border-border/40">
                    <p className="text-sm font-black text-foreground truncate">{displayName}</p>
                    {email && (
                      <p className="text-[11px] font-medium text-text-secondary lowercase truncate mt-0.5 opacity-90">
                        {email}
                      </p>
                    )}
                    <p className="text-[10px] font-bold text-text-hint uppercase tracking-[0.1em] mt-1.5 opacity-80">{displayRole}</p>
                  </div>

                  <div className="space-y-1">
                    <Link
                      href={isAdminView ? ADMIN_ROUTES.USERS : (activePerspective === 'provider' ? PROVIDER_ROUTES.PROFILE : USER_ROUTES.PROFILE)}
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3.5 px-5 py-3.5 text-sm font-bold text-text-secondary hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                    >
                      <User2 size={18} className="opacity-70 group-hover:opacity-100" /> {isAdminView ? t("header.adminOverview") : t("header.myProfile")}
                    </Link>
                    <Link
                      href={isAdminView ? ADMIN_ROUTES.SETTINGS : (activePerspective === 'provider' ? PROVIDER_ROUTES.SETTINGS : USER_ROUTES.SETTINGS)}
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3.5 px-5 py-3.5 text-sm font-bold text-text-secondary hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"
                    >
                      <Settings size={18} className="opacity-70" /> {t("nav.settings")}
                    </Link>
                    {!isAdminView && (
                        <Link
                            href={activePerspective === 'provider' ? PROVIDER_ROUTES.NOTIFICATIONS : USER_ROUTES.NOTIFICATIONS}
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3.5 px-5 py-3.5 text-sm font-bold text-text-secondary hover:text-primary hover:bg-primary/5 rounded-2xl transition-all relative"
                        >
                            <Bell size={18} className="opacity-70" /> {t("nav.notifications")}
                            {unreadCount > 0 && (
                            <span className="absolute right-4 w-5 h-5 bg-primary text-white text-[10px] font-black rounded-lg flex items-center justify-center shadow-lg shadow-primary/30">
                                {unreadCount}
                            </span>
                            )}
                        </Link>
                    )}
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-3" />
                  
                  <button
                    onClick={() => {
                      if (isAdminView) { adminLogout(); router.push(ADMIN_ROUTES.DASHBOARD); }
                      else { logout(); router.push(AUTH_ROUTES.LOGIN); }
                    }}
                    className="flex items-center gap-3.5 w-full px-5 py-4 text-sm font-black text-red-500 hover:bg-red-500/5 rounded-2xl transition-all group"
                  >
                    <LogOut size={18} className="transition-transform group-hover:translate-x-1" /> {t("header.signOut")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
