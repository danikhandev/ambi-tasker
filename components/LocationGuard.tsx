"use client";

import { useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { usePathname, useRouter } from "next/navigation";
import { useUI } from "@/contexts/UIContext";

export default function LocationGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { isMounted } = useUI();

  useEffect(() => {
    if (!isMounted || loading) return;

    if (user) {
      // Logic: If user has NO district set, they MUST select one
      // EXCEPT on the selection page itself or auth pages
      const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register");
      const isLocationPage = pathname === "/select-location";
      const isAdminPage = pathname?.startsWith("/admin");
      
      // We only enforce on "App" pages (Dashboard, Provider, Chat, Profile etc.)
      const isAppPage = (pathname?.startsWith("/dashboard") || 
                         pathname?.startsWith("/provider") || 
                         ["/booking", "/requests", "/profile", "/settings", "/notifications", "/support", "/verify", "/chat"].some(p => pathname?.startsWith(p)));

      if (isAppPage && !user.districtId && !isLocationPage && !isAdminPage && !isAuthPage) {
        console.log("LocationGuard: Would redirect to /select-location");
        // router.push("/select-location");
      }
    }
  }, [user, loading, pathname, router, isMounted]);

  return <>{children}</>;
}
