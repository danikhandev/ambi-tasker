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
  const { user, activePerspective, loading: userLoading } = useUser();
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
      setIsAuthorized(false);
    }
  }, [user, admin, userLoading, adminLoading, activePerspective, allowedRoles]);

  if (userLoading || adminLoading || isAuthorized === null) {
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
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-card rounded-[40px] p-12 text-center border border-border shadow-2xl"
        >
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-100">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h2 className={`${unbounded.className} text-2xl font-black mb-4`}>Access Restricted</h2>
          <p className="text-text-secondary text-sm font-medium mb-10">
            Your current account type does not have the necessary authorization to access this sector of the platform.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => router.back()} 
              className="w-full py-4 bg-muted text-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-border transition-all"
            >
              Return to Previous
            </button>
            <button 
              onClick={() => router.push("/")} 
              className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
            >
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
