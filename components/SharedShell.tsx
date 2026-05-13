"use client";

import { usePathname } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import DashboardHeader from "./DashboardHeader";
import MobileBottomNav from "./MobileBottomNav";
import Footer from "./Footer";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import LocationGuard from "./LocationGuard";

/**
 * SharedShell - The ONLY layout wrapper for the entire application.
 * Ensures consistent design, background, and navigation structure across all pages.
 */
export default function SharedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, activePerspective, loading: userLoading } = useUser();
  const { admin, loading: adminLoading, theme: adminTheme } = useAdmin();
  const { isRTL } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    console.log("[SharedShell] Mounted");
  }, []);

  // Pages with NO header/shell (Pure Focus Mode)
  const isAuthPage = pathname?.startsWith("/login") || 
                     pathname?.startsWith("/register") || 
                     pathname?.startsWith("/select-role") || 
                     pathname?.startsWith("/onboarding") || 
                     pathname?.startsWith("/splash") || 
                     pathname === "/admin" || 
                     pathname?.startsWith("/admin/login");
  
  // Dashboard/App-like pages (require sidebar)
  const isAppPage = (pathname?.startsWith("/dashboard") || 
                     pathname?.startsWith("/provider") || 
                     pathname?.startsWith("/user") ||
                     (pathname?.startsWith("/admin") && !pathname?.startsWith("/admin/login") && pathname !== "/admin") || 
                     pathname?.startsWith("/chat") ||
                     ["/booking", "/requests", "/profile", "/settings", "/notifications", "/support", "/verify"].some(p => pathname?.includes(p))) &&
                     !isAuthPage;

  // Site pages (Home, Search, About, etc.)
  const isSitePage = !isAppPage && !isAuthPage;

  // Determine Sidebar type based on Route first, then Role
  let sidebarType: "consumer" | "provider" | "admin" = "consumer";
  if (pathname?.startsWith("/admin")) {
    sidebarType = "admin";
  } else if (pathname?.startsWith("/provider") || activePerspective === "provider") {
    sidebarType = "provider";
  } else if (admin && !pathname?.startsWith("/user") && !pathname?.startsWith("/dashboard")) {
    sidebarType = "admin";
  }

  // Global Loading State (Unified)
  if (!isMounted) return null;



  return (
    <div className={`h-screen flex flex-col relative selection:bg-primary/20 ${pathname?.startsWith("/admin") ? (adminTheme === 'light' ? 'theme-admin-light' : 'theme-admin') : ''}`} dir={isRTL ? "rtl" : "ltr"}>
      {/* 1. Global Background Design (Neutral & Unified) */}
      <div className="fixed inset-0 z-[-1] pointer-events-none transition-bg duration-1000">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[140px] rounded-full -translate-y-1/3 translate-x-1/3 opacity-40" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 blur-[140px] rounded-full translate-y-1/3 -translate-x-1/3 opacity-40" />
      </div>

      <div className="flex flex-1 w-full overflow-hidden">
        {/* 2. Unified Sidebar for App Pages */}
        {isAppPage && (
          <div className="hidden lg:block h-full">
            <Sidebar type={sidebarType} />
          </div>
        )}

        <div className={`flex-1 flex flex-col h-full w-full relative ${isAppPage ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {/* 3. Unified Header System */}
          <AnimatePresence mode="wait">
            {!isAuthPage && (
              <motion.div
                key={isAppPage ? "dashboard-header" : "site-header"}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className={`${isAppPage ? 'flex-none' : 'sticky top-0'} z-50 w-full`}
              >
                {isAppPage ? <DashboardHeader /> : <Header />}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 4. Page Content with Unified Padding/Animation */}
          <main className={`flex-1 flex flex-col w-full mx-auto ${isAppPage ? 'p-4 md:p-8 lg:p-10 overflow-y-auto no-scrollbar' : ''}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="flex-1 flex flex-col w-full"
              >
                <LocationGuard>{children}</LocationGuard>
              </motion.div>
            </AnimatePresence>
            
            {/* Shared Footer for Site Pages */}
            {isSitePage && <Footer />}
          </main>
        </div>
      </div>
      {/* 6. Unified Mobile Navigation */}
      {(isSitePage || isAppPage) && (
        <div className="lg:hidden">
          <MobileBottomNav />
        </div>
      )}

      {/* 7. Global Unified Loader Overlay (Appears on route changes) */}
      {(userLoading || adminLoading) && (
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
            Syncing Ambi Tasker...
          </p>
        </div>
      )}
    </div>
  );
}
