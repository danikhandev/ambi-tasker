import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AmbiTasker - Dashboard",
  description: "User dashboard for AmbiTasker",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
