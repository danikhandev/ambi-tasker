"use client";

import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/services/supabase";
import Link from "next/link";
import { unbounded } from "@/app/fonts";

export default function ChatPage() {
  const { user, loading: userLoading, activePerspective } = useUser();
  const { admin, loading: adminLoading } = useAdmin();
  const pathname = usePathname();
  const otherUserId = pathname.split('/').pop() || "";

  const [conversation, setConversation] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(true);
  const [otherUser, setOtherUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    profileImage: string;
    email: string;
    isOnline?: boolean;
    role?: string;
  } | null>(null);

  const loading = userLoading || adminLoading;
  const currentId = admin?.id || user?.id;

  const currentUserRole = admin 
    ? 'admin' 
    : (user?.isUserSignUpForProvider
        ? (activePerspective || 'consumer')
        : 'consumer');

  useEffect(() => {
    let active = true;

    const resolveChat = async () => {
      // Wait for auth to resolve before returning early
      if (loading) return;
      if (!currentId || !otherUserId) return;

      try {
        if (!active) return;
        setIsResolving(true);
        setConversation(null); // Reset for new navigation
        setOtherUser(null);    // Reset for new navigation
        setError(null);
        setIsLoading(true);

        const res = await fetch("/api/messages/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: otherUserId })
        });
        const json = await res.json();

        if (!active) return;

        if (json.success && json.data) {
          setConversation(json.data);
          setOtherUser({
            id: json.data.otherUser?.id || "",
            firstName: json.data.otherUser?.name?.split(' ')[0] || "User",
            lastName: json.data.otherUser?.name?.split(' ').slice(1).join(' ') || "",
            profileImage: json.data.otherUser?.avatar || "",
            email: "",
            isOnline: json.data.otherUser?.isOnline,
            role: json.data.otherUser?.role
          });
        } else {
          setError(json.error || "User not found or unavailable");
        }
      } catch (err) {
        if (!active) return;
        console.error("Chat resolution failed:", err);
        setError("Failed to initialize chat. Please check your connection.");
      } finally {
        if (active) {
          setIsLoading(false);
          setIsResolving(false);
        }
      }
    };

    resolveChat();

    return () => {
      active = false;
    };
  }, [currentId, otherUserId, loading]);

  if (loading || (!user && !admin)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Handle Error / User Not Found State
  if (error || (!conversation && !loading && !isResolving && currentId && otherUserId)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className={`${unbounded.className} text-2xl font-black mb-2 text-foreground`}>
          Chat Unavailable
        </h2>
        <p className="text-text-secondary max-w-sm mb-8 font-medium">
          {error === "Target user not found" 
            ? "The user you are trying to reach is no longer available in our active network."
            : (error || "We couldn't establish a connection with this user. Please try again later.")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link 
            href="/messages" 
            className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
          >
            Back to Messages
          </Link>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-muted text-foreground border border-border rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all active:scale-95"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Still resolving conversation data
  if (!conversation || !otherUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const otherUserName = `${otherUser?.firstName || "User"} ${otherUser?.lastName || ""}`;

  return (
    <div className="flex-1 h-full flex flex-col relative bg-background">
      {/* 
          PRODUCTION LOGIC: 
          1. Key-based remounting ensures ChatWindow is destroyed/rebuilt on ID change.
          2. All internal hooks (realtime, fetching) re-initialize automatically.
          3. Layout-level sidebar preservation ensures zero flickering.
      */}
      {conversation?.id ? (
        <ChatWindow
          key={conversation.id} 
          conversationId={conversation.id}
          userName={otherUserName}
          userImage={otherUser.profileImage}
          isOnline={!!otherUser.isOnline}
          currentUserId={currentId || ""}
          currentUserRole={currentUserRole as "consumer" | "provider" | "admin"}
          otherUserRole={otherUser.role}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50/30">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
    </div>
  );
}