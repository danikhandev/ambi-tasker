"use client";

import ProviderVerificationGuard from "@/components/ProviderVerificationGuard";
import RoleGuard from "@/components/guards/RoleGuard";

export default function ProviderDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Removed automatic admin redirect to allow admins to view provider pages
  
  return (
    <RoleGuard allowedRoles={["PROVIDER", "ADMIN"]}>
      <ProviderVerificationGuard>
        {children}
      </ProviderVerificationGuard>
    </RoleGuard>
  );
}