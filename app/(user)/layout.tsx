"use client";

import RoleGuard from "@/components/guards/RoleGuard";

export default function UserGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["USER", "ADMIN"]}>
      {children}
    </RoleGuard>
  );
}
