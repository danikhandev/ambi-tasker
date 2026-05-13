"use client";

import React from "react";
import AdminGuard from "@/components/AdminGuard";

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="min-h-screen">
        {children}
      </div>
    </AdminGuard>
  );
}
