"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { logAdminActivity, type AdminAction, type TargetType } from "@/utils/admin";
import { logger } from "@/utils/logger";

// ─── Types ────────────────────────────────────────────────────────
interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  permissions?: string[];
  requiresPasswordChange?: boolean;
  masterId?: string;
}

interface AdminContextType {
  admin: Admin | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, otp?: string, step?: "credentials" | "2fa") => Promise<{ success: boolean; requires2FA?: boolean; error?: string }>;
  logout: () => void;
  refetch: () => Promise<void>;
  updateAdmin: (updates: Partial<Admin>) => void;
  logActivity: (action: AdminAction, targetType: TargetType, targetId?: string, details?: string) => Promise<void>;
  clearAdmin: () => void;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
  theme: "dark" | "light";
  switchTheme: (theme: "dark" | "light") => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// ─── Constants ────────────────────────────────────────────────────
const ADMIN_STORAGE_KEY = "serve_u_admin_data";

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // ─── Initialize from localStorage & Server ──────────────────────
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        // 1. Try localStorage first for immediate UI feedback
        const cached = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed && parsed.id && parsed.role) {
              setAdmin(parsed);
            } else {
              localStorage.removeItem(ADMIN_STORAGE_KEY);
            }
          } catch (e) {
            localStorage.removeItem(ADMIN_STORAGE_KEY);
          }
        }

        // 2. Validate with server to ensure cookies are still valid
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const resp = await fetch("/api/admin/profile", { signal: controller.signal });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const result = await resp.json();
          if (result.success && result.admin) {
            const adminUser: Admin = {
              id: result.admin.id,
              email: result.admin.email,
              name: (result.admin.name && result.admin.name.toLowerCase().includes("primary admin")) ? "Super Admin" : (result.admin.name || "Administrator"),
              role: result.admin.role,
              avatar: result.admin.avatar || "/admin/system-admin.jpg",
              permissions: result.admin.permissions || [],
              requiresPasswordChange: result.admin.requiresPasswordChange || false,
              masterId: result.masterId
            };
            setAdmin(adminUser);
            localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminUser));
          }
        } else if (resp.status === 401) {
          // Cookie is invalid or expired, clear local state
          setAdmin(null);
          localStorage.removeItem(ADMIN_STORAGE_KEY);
        }
      } catch (e) {
        logger.error("Failed to initialize admin session:", e);
      } finally {
        setLoading(false);
      }
    };

    initializeAdmin();

    // 3. Initialize theme
    const savedTheme = localStorage.getItem("serve_u_admin_theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      setTheme(savedTheme);
    }
  }, []);

  // ─── Login ──────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string, otp?: string, step: "credentials" | "2fa" = "credentials"): Promise<{ success: boolean; requires2FA?: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const resp = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, otp, step }),
      });

      const contentType = resp.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await resp.text();
        logger.error("Non-JSON response from login API:", text.slice(0, 100));
        throw new Error("Server returned an invalid response (not JSON). Please try again or contact support.");
      }

      const result = await resp.json();
      logger.debug("[Admin Context] Login Result:", result);

      if (!resp.ok) {
        throw new Error(result.error || result.message || "Login denied");
      }

      if (result.requires2FA) {
        setLoading(false);
        return { success: true, requires2FA: true };
      }

      if (!result.admin || typeof result.admin !== "object") {
        logger.error("Login response missing or invalid admin data:", result);
        throw new Error("Login successful, but profile data is missing or invalid.");
      }

      if (!result.admin.id) {
        logger.error("Admin data is missing ID:", result.admin);
        throw new Error("Login failed due to incomplete profile data from server.");
      }

      const adminUser: Admin = {
        id: result.admin.id,
        email: result.admin.email,
        name: (result.admin.name && result.admin.name.toLowerCase().includes("primary admin")) ? "Super Admin" : (result.admin.name || "Administrator"),
        role: result.admin.role,
        avatar: "/admin/system-admin.jpg",
        permissions: result.admin.permissions || [],
        requiresPasswordChange: result.admin.requiresPasswordChange || false,
        masterId: result.masterId
      };

      setAdmin(adminUser);
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminUser));

      setLoading(false);
      return { success: true };
    } catch (err: any) {
      logger.error("[AdminContext.login] Caught error:", err);
      const msg = err.message || "Login failed";
      setError(msg);
      setLoading(false);
      return { success: false, error: msg };
    }
  }, []);

  // ─── Logout ─────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (admin) {
      logAdminActivity(admin.id, "admin_logout", "system", undefined, `Admin ${admin.email} logged out`);
    }
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } catch (err) {
      logger.error("Logout API call failed:", err);
    }
    setAdmin(null);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    // Clear cookies via expired date (Client-side only)
    if (typeof document !== 'undefined') {
        document.cookie = "admin-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "auth-user-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
    if (typeof window !== 'undefined') {
        window.location.href = "/admin/login";
    }
  }, [admin]);

  // ─── Refetch (just re-validate session) ─────────────────────────
  const refetch = useCallback(async () => {
    // Session validity is handled by the httpOnly JWT cookie
    // If the cookie is expired, the next API call will fail with 401/403
    // and the middleware will redirect to login
  }, []);

  // ─── Log Activity Helper ────────────────────────────────────────
  const logActivityHelper = useCallback(async (
    action: AdminAction,
    targetType: TargetType,
    targetId?: string,
    details?: string
  ) => {
    if (!admin?.id) return;
    await logAdminActivity(admin.id, action, targetType, targetId, details);
  }, [admin]);

  // ─── Update Admin ───────────────────────────────────────────────
  const updateAdmin = useCallback((updates: Partial<Admin>) => {
    setAdmin(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAdmin = useCallback(() => {
    setAdmin(null);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
  }, []);

  const isAdmin = !!admin && ["SUPER_ADMIN", "SUB_ADMIN"].includes(admin.role);

  // ─── Permission checker ─────────────────────────────────────────
  const hasPermission = useCallback((permission: string): boolean => {
    if (!admin) return false;
    if (admin.role === "SUPER_ADMIN") return true;
    return (admin.permissions || []).includes(permission);
  }, [admin]);

  const switchTheme = useCallback((newTheme: "dark" | "light") => {
    setTheme(newTheme);
    localStorage.setItem("serve_u_admin_theme", newTheme);
  }, []);

  const contextValue = useMemo(() => ({
    admin,
    loading,
    error,
    login,
    logout,
    refetch,
    updateAdmin,
    logActivity: logActivityHelper,
    clearAdmin,
    isAdmin,
    hasPermission,
    theme,
    switchTheme,
  }), [admin, loading, error, login, logout, refetch, updateAdmin, logActivityHelper, clearAdmin, isAdmin, hasPermission, theme, switchTheme]);

  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    return {
      admin: null,
      loading: false,
      login: async () => {},
      logout: async () => {},
    } as any;
  }
  return context;
}