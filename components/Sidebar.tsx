"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  BookOpen,
  BarChart,
  UserCircle,
  Briefcase,
  Layers,
  Banknote,
  Search,
  MessageCircle,
  Bell,
  Zap,
  CheckCircle2,
  MapPin,
  History,
  CalendarCheck,
  Crown,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Activity,
  FileText,
  Mail
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useUI } from "@/contexts/UIContext";
import { useTranslation } from "@/hooks/useTranslation";
import Logo from "./ui/Logo";
import Brand from "./ui/Brand";
import CircularFrame from "./CircularFrame";
import Image from "next/image";
import { useSound } from "@/contexts/SoundContext";

import { ADMIN_ROUTES, USER_ROUTES, PROVIDER_ROUTES, AUTH_ROUTES } from "@/constants/routes";

interface SidebarProps {
  type: "provider" | "consumer" | "admin";
}

export default function Sidebar({ type }: SidebarProps) {
  const { admin, loading: adminLoading, logout: adminLogout, theme: adminTheme } = useAdmin();
  const { isMobileSidebarOpen: isMobileOpen, setMobileSidebarOpen: setIsMobileOpen, theme } = useUI();
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const { user, logout: userLogout, activePerspective, switchPerspective, loading: userLoading } = useUser();
  const { playClickSound } = useSound();
  const { t, isRTL } = useTranslation();

  if (type === "admin" && pathname === AUTH_ROUTES.LOGIN) {
    return null;
  }

  const handleLogout = async () => {
    try {
      if (type === "admin") {
        await adminLogout();
      } else {
        await userLogout();
      }
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = type === "admin" ? AUTH_ROUTES.LOGIN : AUTH_ROUTES.LOGIN;
    }
  };

  const consumerMenuItems = [
    { icon: LayoutDashboard, label: t("nav.dashboard"), href: USER_ROUTES.HOME },
    { icon: BookOpen, label: t("nav.bookings"), href: USER_ROUTES.BOOKINGS },
    { icon: UserCircle, label: t("nav.profile"), href: USER_ROUTES.PROFILE },
    { icon: Bell, label: t("nav.notifications"), href: USER_ROUTES.NOTIFICATIONS },
    { icon: Settings, label: t("nav.settings"), href: USER_ROUTES.SETTINGS },
  ];

  const providerMenuItems = [
    { icon: LayoutDashboard, label: t("nav.dashboard"), href: PROVIDER_ROUTES.DASHBOARD },
    { icon: Briefcase, label: t("nav.bookings"), href: PROVIDER_ROUTES.BOOKINGS },
    { icon: Banknote, label: t("nav.earnings"), href: PROVIDER_ROUTES.EARNINGS },
    { icon: UserCircle, label: t("nav.profile"), href: PROVIDER_ROUTES.PROFILE },
    { icon: Settings, label: t("nav.settings"), href: PROVIDER_ROUTES.SETTINGS },
    { icon: ShieldCheck, label: t("nav.kycVerification"), href: PROVIDER_ROUTES.VERIFY },
  ];

  const adminMenuItemsRaw = [
    {
      group: t("admin.sidebar.systemOverview"),
      items: [
        { icon: LayoutDashboard, label: t("admin.sidebar.dashboard"), href: ADMIN_ROUTES.DASHBOARD, requiredPerm: "overview.view" },
        { icon: Users, label: t("admin.sidebar.users"), href: ADMIN_ROUTES.USERS, requiredPerm: "users.view" },
        { icon: Briefcase, label: t("admin.sidebar.providers"), href: ADMIN_ROUTES.PROVIDERS, requiredPerm: "providers.view" },
        { icon: BookOpen, label: t("admin.sidebar.bookings"), href: ADMIN_ROUTES.BOOKINGS, requiredPerm: "bookings.view" },
        { icon: Layers, label: t("admin.sidebar.services"), href: ADMIN_ROUTES.SERVICES, requiredPerm: "services.view" },
        { icon: FileText, label: "Applications", href: ADMIN_ROUTES.APPLICATIONS, requiredPerm: "services.view" },
        { icon: MapPin, label: t("admin.sidebar.locations"), href: ADMIN_ROUTES.LOCATIONS, requiredPerm: "locations.view" },
      ]
    },
    {
      group: t("admin.sidebar.financials"),
      items: [
        { icon: Banknote, label: t("admin.sidebar.payments"), href: ADMIN_ROUTES.PAYMENTS, requiredPerm: "payments.view" },
        { icon: BarChart, label: t("admin.sidebar.analytics"), href: ADMIN_ROUTES.ANALYTICS, requiredPerm: "payments.view" },
      ]
    },
    {
      group: t("admin.sidebar.operations"),
      items: [
        { icon: MessageCircle, label: t("admin.sidebar.supportChat"), href: USER_ROUTES.MESSAGES, requiredPerm: "reports.view" },
        { icon: ShieldCheck, label: t("admin.sidebar.verifications"), href: ADMIN_ROUTES.VERIFICATIONS, requiredPerm: "providers.manage" },
        { icon: ShieldAlert, label: t("admin.sidebar.reports"), href: ADMIN_ROUTES.REPORTS, requiredPerm: "reports.view" },
        { icon: Activity, label: t("admin.sidebar.messaging"), href: ADMIN_ROUTES.MESSAGING, requiredPerm: "reports.view" },
        { icon: Bell, label: t("admin.sidebar.notifications"), href: ADMIN_ROUTES.NOTIFICATIONS, requiredPerm: "notifications.manage" },
      ]
    },
    {
      group: t("admin.sidebar.management"),
      items: [
        { icon: ShieldCheck, label: t("admin.sidebar.subAdmins"), href: ADMIN_ROUTES.SUB_ADMINS, requiredPerm: "admins.manage" },
        { icon: History, label: t("admin.sidebar.auditLogs"), href: ADMIN_ROUTES.LOGS, requiredPerm: "admins.manage" },
        { icon: Settings, label: t("admin.sidebar.settings"), href: ADMIN_ROUTES.SETTINGS, requiredPerm: "settings.view" },
      ]
    },
    {
      group: "MARKETING",
      items: [
        { icon: Mail, label: "Newsletter", href: "/admin/marketing/newsletter", requiredPerm: "settings.view" },
      ]
    }
  ];

  const filteredAdminMenu = adminMenuItemsRaw.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.requiredPerm) return true;
      if (admin?.role === "SUPER_ADMIN") return true;
      return admin?.permissions?.includes(item.requiredPerm);
    })
  })).filter(group => group.items.length > 0);

  let menuSections: any[] = [];
  if (type === "admin") {
    menuSections = filteredAdminMenu;
  } else if (type === "provider") {
    menuSections = [{ items: providerMenuItems }];
  } else {
    menuSections = [{ items: consumerMenuItems }];
  }

  const displayName = (adminLoading || userLoading)
    ? t("common.loading")
    : admin
      ? admin.name || t("admin.superAdmin")
      : user?.firstName
        ? `${user.firstName}${user.lastName ? ' ' + user.lastName : ''}`
        : user?.email?.toLowerCase().split("@")[0] || t("common.user");

  const displayRole = (adminLoading || userLoading)
    ? t("common.syncing")
    : admin
      ? t("admin.systemAdmin")
      : user?.isUserSignUpForProvider
        ? t("nav.provider")
        : t("nav.customer");

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname?.startsWith(href);
  };

  return (
    <>
      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`fixed inset-y-0 left-0 w-[280px] z-[100] flex flex-col lg:hidden ${type === 'admin' ? 'bg-secondary text-white' : 'bg-card border-e border-border/40'}`}
            >
            <div className="p-8 flex items-center justify-between">
              <Brand size="md" />
              <button onClick={() => setIsMobileOpen(false)} className="p-2 hover:bg-muted rounded-xl transition-all">
                <X size={20} className="text-text-hint" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto no-scrollbar">
              {menuSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1.5 pt-4 first:pt-0">
                  {section.group && (
                    <h5 className="px-4 text-[10px] font-black text-text-hint uppercase tracking-[0.2em] mb-3 opacity-40">
                      {section.group}
                    </h5>
                  )}
                  {section.items.map((item: any, idx: number) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={idx}
                        href={item.href}
                        onClick={() => { playClickSound(); setIsMobileOpen(false); }}
                        className={`flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${
                          active 
                            ? "bg-primary text-white shadow-lg shadow-primary/25" 
                            : "text-text-secondary hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <item.icon size={18} />
                        <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="p-6 border-t border-border/40">
              <button
                onClick={() => { handleLogout(); setIsMobileOpen(false); }}
                className="flex items-center gap-3 px-4 py-4 rounded-2xl w-full text-red-500 hover:bg-red-50 transition-all font-bold"
              >
                <LogOut size={18} />
                <span className="text-[11px] uppercase tracking-widest font-black">{t("header.signOut")}</span>
              </button>
            </div>
          </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Toggle Button */}
      <button
        onClick={() => { playClickSound(); setIsOpen(!isOpen); }}
        className="hidden lg:flex absolute top-32 -right-5 z-50 w-10 h-10 bg-card border border-border shadow-xl rounded-full items-center justify-center hover:bg-primary hover:text-white transition-all group"
      >
        <div className="group-active:scale-90 transition-transform text-text-hint group-hover:text-white">
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {/* Sidebar Container */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 280 : 100 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className={`relative h-screen sticky top-0 z-40 hidden lg:flex flex-col bg-card border-e border-border/40 shadow-sm overflow-visible`}
      >
        {/* Brand/Logo Area */}
        <div className={`p-8 pb-12 flex items-center ${!isOpen ? 'justify-center' : ''}`}>
            <Link href="/" className="transition-all hover:opacity-80 active:scale-95 flex items-center gap-3">
               {isOpen ? (
                 <Brand size="sm" className="text-foreground" />
               ) : (
                 <Logo size="md" />
               )}
            </Link>
        </div>

        {/* Scrollable Navigation Area */}
        <nav className="flex-1 px-4 py-2 space-y-6 overflow-y-auto no-scrollbar">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-2 pt-2 first:pt-0">
              {section.group && isOpen && (
                <h5 className="px-4 text-[9px] font-black uppercase tracking-[0.25em] mb-4 text-text-hint/60">
                  {section.group}
                </h5>
              )}
              <div className="space-y-1">
                {section.items.map((item: any, idx: number) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={idx}
                      href={item.href}
                      onClick={() => playClickSound()}
                      className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all duration-300 group relative ${
                        active 
                          ? "bg-primary text-white shadow-xl shadow-primary/30" 
                          : "text-text-secondary hover:bg-primary/5 hover:text-primary"
                      } ${!isOpen ? 'justify-center mx-2 px-0' : 'mx-1'}`}
                    >
                      <item.icon 
                        size={active ? 20 : 18} 
                        className={`${active ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'} transition-all duration-300`} 
                      />
                      {isOpen && <span className="text-[11px] font-black uppercase tracking-widest leading-none">{item.label}</span>}
                      
                      {/* Active Indicator (Vertical Pill) */}
                      {active && (
                        <motion.div 
                          layoutId="activeIndicator"
                          className={`absolute ${isOpen ? '-left-2' : '-left-1'} top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)]`}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Actions Section */}
        <div className="p-6 mt-auto border-t border-border/20 bg-muted/30 backdrop-blur-md">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-4 rounded-2xl w-full transition-all duration-300 font-bold group relative overflow-hidden ${
              !isOpen ? 'justify-center px-0' : ''
            } text-red-500 hover:bg-red-500 hover:text-white shadow-sm hover:shadow-red-500/20`}
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            {isOpen && <span className="text-[11px] uppercase tracking-widest font-black">{t("header.signOut")}</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
