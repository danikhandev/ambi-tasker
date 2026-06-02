"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import { Loader2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { unbounded } from "@/app/fonts";
import { ERROR_ROUTES, AUTH_ROUTES } from "@/constants/routes";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ("USER" | "PROVIDER" | "ADMIN")[];
  fallback?: React.ReactNode;
}

/**
 * RoleGuard Component
 * 
 * Reusable component to protect UI sections based on user roles.
 * Complements middleware by providing granular UI protection.
 */
export default function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user, activePerspective, loading: userLoading, isSwitchingPerspective } = useUser();
  const { admin, loading: adminLoading } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (userLoading || adminLoading) return;

    // Determine current effective role
    let currentRole: "USER" | "PROVIDER" | "ADMIN" | null = null;
    
    if (admin) {
      currentRole = "ADMIN";
    } else if (user) {
      currentRole = activePerspective === "provider" ? "PROVIDER" : "USER";
    }

    if (!currentRole) {
      // Not logged in
      setIsAuthorized(false);
      return;
    }

    if (allowedRoles.includes(currentRole)) {
      setIsAuthorized(true);
    } else {
      console.warn("[RoleGuard] Access Denied:", { currentRole, allowedRoles, activePerspective, userRole: user?.role, user });
      setIsAuthorized(false);
    }
  }, [user, admin, userLoading, adminLoading, activePerspective, allowedRoles]);

  if (userLoading || adminLoading || isSwitchingPerspective || isAuthorized === null) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Verifying Credentials...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative background blur for production feel */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-red-500/10 rounded-full blur-[80px] md:blur-[120px] pointer-events-none -z-10" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="max-w-md w-full bg-card/80 backdrop-blur-xl rounded-[40px] md:rounded-[48px] p-8 md:p-12 text-center border border-white/20 dark:border-white/5 shadow-[0_8px_40px_-12px_rgba(239,68,68,0.2)] relative z-10"
        >
          <div className="relative inline-block mb-10">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/20 rounded-[32px] flex items-center justify-center mx-auto border border-red-200/50 dark:border-red-800/30 shadow-xl shadow-red-500/20"
            >
              <ShieldAlert className="w-12 h-12 text-red-500 drop-shadow-md" />
            </motion.div>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="absolute inset-0 bg-red-500/20 rounded-[32px] blur-xl -z-10"
            />
          </div>
          
          <h2 className={`${unbounded.className} text-2xl md:text-3xl font-black mb-3 text-foreground tracking-tight`}>Access Restricted</h2>
          <p className="text-text-secondary text-sm font-medium mb-10 leading-relaxed">
            Your current account type does not have the necessary authorization to access this sector of the platform.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => router.back()} 
              className="w-full py-4 px-6 bg-muted text-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-border transition-all active:scale-95 border border-transparent hover:border-border shadow-sm"
            >
              Go Back
            </button>
            <button 
              onClick={() => router.push("/")} 
              className="w-full py-4 px-6 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/25 transition-all active:scale-95"
            >
              Home Mesh
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
