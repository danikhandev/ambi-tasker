"use client";

import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import ChatSidebar from "@/components/chat/ChatSidebar";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: userLoading, activePerspective } = useUser();
  const { admin, loading: adminLoading } = useAdmin();
  const { t } = useTranslation();

  const loading = userLoading || adminLoading;

  const currentUserRole = admin 
    ? 'admin' 
    : (user?.isUserSignUpForProvider
        ? (activePerspective || 'consumer')
        : 'consumer');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user && !admin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-text mb-2">
            {t("dashboard.loginToChat")}
          </h2>
          <p className="text-sm text-text/60">
            {t("dashboard.loginToChatDesc")}
          </p>
        </div>
      </div>
    );
  }

  const pathname = usePathname();
  const isIndex = pathname === "/messages";

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Persistent on desktop, toggle-able on mobile */}
        <div className={`
          ${isIndex ? "flex" : "hidden lg:flex"} 
          w-full lg:w-96 flex-shrink-0 h-full border-r border-border
        `}>
          <ChatSidebar currentUserRole={currentUserRole} />
        </div>

        {/* Content Area - Responsive visibility */}
        <div className={`
          ${!isIndex ? "flex" : "hidden lg:flex"} 
          flex-1 h-full overflow-hidden relative
        `}>
          <Suspense fallback={
            <div className="h-full flex items-center justify-center bg-gray-50/50 w-full">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          }>
            {children}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
