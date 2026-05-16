"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { logger } from "@/utils/logger";
import { supabase } from "@/services/supabase";

// Types based on Prisma Schema
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isUserSignUpForProvider: boolean;
  isEmailVerified: boolean;
  idVerificationStatus: "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED";
  rejectionReason?: string;
  dob?: string;
  gender?: "MALE" | "FEMALE" | "OTHER" | "PREFER_NOT_TO_SAY";
  bio?: string;
  rating?: number;
  reviews?: number;
  address?: string;
  phone?: string;
  districtId?: string;
  cityId?: string;
  areaId?: string;
  role: "USER" | "PROVIDER" | "ADMIN"; // Original DB role
}

export type UserPerspective = "consumer" | "provider" | "admin";

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  activePerspective: UserPerspective;
  login: (email: string, isProvider?: boolean) => Promise<void>;
  logout: () => void;
  refetch: () => Promise<void>;
  switchPerspective: (perspective: UserPerspective) => void;
  clearAllUsers: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = "serve_u_user_data";
const PERSPECTIVE_STORAGE_KEY = "serve_u_user_perspective";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePerspective, setActivePerspective] = useState<UserPerspective>("consumer");

  const refetch = useCallback(async () => {
    try {
      const token = localStorage.getItem("serve_u_auth_token");
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await fetch("/api/user/profile", { headers, signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.user) {
          const dbUser = data.user;
          const dbEmail = dbUser.email?.toLowerCase();
          const dbName = dbUser.name || "";
          
          // Safety Net: Force Super Admin identity regardless of DB state for primary email
          const isSuperAdminEmail = dbEmail === "adminambitasker@gmail.com";
          const isPrimaryAdmin = isSuperAdminEmail || dbName === "AmbiTasker Primary Admin" || dbName === "Super Admin";
          const isGenericAdmin = (dbName.toLowerCase().includes("admin") || dbEmail.includes("admin")) && !dbUser.firstName;

          const contextUser: User = {
            id: dbUser.id,
            email: dbUser.email,
            firstName: isPrimaryAdmin ? "Super" : (dbUser.firstName || (isGenericAdmin ? "User" : dbName.split(" ")[0]) || ""),
            lastName: isPrimaryAdmin ? "Admin" : (dbUser.lastName || (isGenericAdmin ? "" : dbName.split(" ").slice(1).join(" ")) || ""),
            avatar: dbUser.avatar || dbUser.profileImage || undefined,
            isUserSignUpForProvider: dbUser.isUserSignUpForProvider || false,
            isEmailVerified: dbUser.isEmailVerified || false,
            idVerificationStatus: dbUser.idVerificationStatus as User["idVerificationStatus"] || "NOT_STARTED",
            rejectionReason: dbUser.providerProfile?.rejectionReason || undefined,
            gender: dbUser.gender || undefined,
            dob: dbUser.dob || undefined,
            bio: dbUser.providerProfile?.serviceDescription || undefined,
            phone: dbUser.phone || undefined,
            address: dbUser.address || undefined,
            districtId: dbUser.districtId || undefined,
            cityId: dbUser.cityId || undefined,
            areaId: dbUser.areaId || undefined,
            role: isPrimaryAdmin ? "ADMIN" : (dbUser.role as "USER" | "PROVIDER" | "ADMIN"),
          };
          setUser(contextUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(contextUser));
        }
      } else if (res.status === 401 || res.status === 403) {
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem(PERSPECTIVE_STORAGE_KEY);
      } else {
        logger.warn(`Profile refetch responded with ${res.status} - keeping existing state`);
      }
    } catch (err) {
      logger.warn("Profile refetch network error, keeping existing state:", err);
    }
  }, []);

  // Load from local storage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    const savedPerspective = localStorage.getItem(PERSPECTIVE_STORAGE_KEY);

    const initializeUserAndPerspective = async () => {
      // 1. Initial hydration from cache
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          // VALIDATION: Ensure essential fields exist to prevent downstream crashes
          if (parsedUser && parsedUser.id && parsedUser.email && parsedUser.role) {
            setUser(parsedUser);
          } else {
            logger.warn("UserContext: Stale or invalid user data detected in cache. Clearing.");
            localStorage.removeItem(USER_STORAGE_KEY);
            localStorage.removeItem(PERSPECTIVE_STORAGE_KEY);
          }
        } catch (e) {
          logger.error("Failed to parse cached user:", e);
          localStorage.removeItem(USER_STORAGE_KEY);
        }
      }

      // 2. Sync perspective from URL or cache
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);
        
        // Safely check for super admin email from local storage or current state
        let isSuperAdminEmail = false;
        if (savedUser) {
          try {
            const pUser = JSON.parse(savedUser);
            isSuperAdminEmail = pUser?.email?.toLowerCase() === "adminambitasker@gmail.com";
          } catch (e) {}
        }

        if (isSuperAdminEmail) {
          setActivePerspective("admin");
          localStorage.setItem(PERSPECTIVE_STORAGE_KEY, "admin");
        } else if (savedUser) {
          try {
            const pUser = JSON.parse(savedUser);
            const userRole = pUser?.role;
            
            if (userRole === "PROVIDER") {
              setActivePerspective("provider");
            } else if (userRole === "USER" || userRole === "CUSTOMER") {
              setActivePerspective("consumer");
            }
          } catch (e) {}

          if (savedPerspective && ["consumer", "provider"].includes(savedPerspective)) {
            setActivePerspective(savedPerspective as UserPerspective);
          }
        }
      }

      // 3. Mark loading as false once hydration is done
      setLoading(false);

      // 4. Silently refetch in background if we had a user
      if (savedUser) {
        refetch().catch((e) => logger.error("Background refetch failed:", e));
      }
    };

    initializeUserAndPerspective();
  }, [refetch]);

  // Real-time Profile Sync
  useEffect(() => {
    if (!user?.id) return;

    const channelName = `user-profile-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'users',
        filter: `id=eq.${user.id}` 
      }, (payload) => {
        logger.info("Real-time profile update detected:", payload.new);
        refetch(); // Trigger a clean refetch to update state
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  const login = useCallback(
    async (email: string, isProvider: boolean = false) => {
      setLoading(true);
      setError(null);
      try {
        await refetch();
        const perspective: UserPerspective = isProvider ? "provider" : "consumer";
        setActivePerspective(perspective);
        localStorage.setItem(PERSPECTIVE_STORAGE_KEY, perspective);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [refetch]
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout API call failed:", err);
    }
    setUser(null);
    setActivePerspective("consumer");
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(PERSPECTIVE_STORAGE_KEY);
    localStorage.removeItem("serve_u_auth_token");
    window.location.href = "/login";
  }, []);

  const switchPerspective = useCallback(
    async (perspective: UserPerspective) => {
      if (!user) return;

      // Lock Super Admin to admin perspective
      if (user.email?.toLowerCase() === "adminambitasker@gmail.com" && perspective !== "admin") {
        logger.warn("Super Admin cannot switch to non-admin perspectives");
        return;
      }

      if (user.role === "USER" && perspective === "provider") {
        window.location.href = "/profile";
        return;
      }

      setActivePerspective(perspective);
      localStorage.setItem(PERSPECTIVE_STORAGE_KEY, perspective);

      // Persist perspective to backend cookie
      try {
        await fetch("/api/user/switch-role", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ perspective }),
        });
      } catch (err) {
        console.error("Failed to persist role switch:", err);
      }
    },
    [user]
  );

  const clearAllUsers = useCallback(() => {
    setUser(null);
    setActivePerspective("consumer");
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(PERSPECTIVE_STORAGE_KEY);
    localStorage.removeItem("serve_u_auth_token");
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      loading,
      error,
      activePerspective,
      login,
      logout,
      refetch,
      switchPerspective,
      clearAllUsers,
    }),
    [user, loading, error, activePerspective, login, logout, refetch, switchPerspective, clearAllUsers]
  );

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    return {
      user: null,
      loading: false,
      activePerspective: "consumer",
      logout: async () => {},
      switchPerspective: async () => {},
    } as any;
  }
  return context;
}
