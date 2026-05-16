"use client";

import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatEmptyState from "@/components/chat/ChatEmptyState";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Suspense } from "react";

function ChatContent() {
  const { user, loading: userLoading, activePerspective } = useUser();
  const { admin, loading: adminLoading } = useAdmin();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useTranslation();

  const loading = userLoading || adminLoading;

  // Determine current role based on user's active perspective
  const currentUserRole = admin 
    ? 'admin' 
    : (user?.isUserSignUpForProvider
        ? (activePerspective || 'consumer')
        : 'consumer');

  useEffect(() => {
    const targetUser = searchParams.get('user');
    if (targetUser) {
      router.replace(`/messages/${targetUser}`);
    }
  }, [searchParams, router]);

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

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Full width on mobile, dynamic width on desktop */}
        <div className="w-full lg:w-auto flex-shrink-0 h-full">
          <ChatSidebar
            currentUserRole={currentUserRole}
          />
        </div>

        {/* Main Chat Area - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:flex flex-1 h-full">
          <ChatEmptyState />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
