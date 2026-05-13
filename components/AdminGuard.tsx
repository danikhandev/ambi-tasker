// components/AdminGuard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NextRequest } from "next/server";
import { getAdminAuth } from "@/utils/admin-auth";
import { Loader2 } from "lucide-react";

/**
 * AdminGuard – client‑side wrapper that verifies an admin session before rendering
 * protected UI. It performs a lightweight fetch to an internal endpoint that
 * validates the JWT stored in the httpOnly cookie. If validation fails the user
 * is redirected to the admin login page.
 *
 * The server‑side verification is performed in `utils/admin-auth.ts` and the
 * `admin` API (e.g. `/api/admin/me`). This ensures that the guard cannot be
 * bypassed by tampering with client state.
 */
export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    // Minimal endpoint that returns the admin payload if token is valid.
    // The endpoint is protected by the same `getAdminAuth` logic used in
    // other admin APIs.
    fetch("/api/admin/me")
      .then(async (res) => {
        if (res.ok) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          router.replace("/admin/login");
        }
      })
      .catch(() => {
        setIsAuthorized(false);
        router.replace("/admin/login");
      });
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!isAuthorized) {
    // While router.replace navigates away, render nothing to avoid UI flash.
    return null;
  }

  return <>{children}</>;
}
