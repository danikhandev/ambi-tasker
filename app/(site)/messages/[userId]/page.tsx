"use client";

import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/services/supabase";
import Link from "next/link";
import { unbounded } from "@/app/fonts";

export default function ChatPage() {
  const { user, loading: userLoading, activePerspective } = useUser();
  const { admin, loading: adminLoading } = useAdmin();
  const params = useParams();
  const otherUserId = params.userId as string;

  const [conversation, setConversation] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    profileImage: string;
    email: string;
    isOnline?: boolean;
  } | null>(null);

  const loading = userLoading || adminLoading;
  const currentId = admin?.id || user?.id;

  const currentUserRole = admin 
    ? 'admin' 
    : (user?.isUserSignUpForProvider
        ? (activePerspective || 'consumer')
        : 'consumer');

  useEffect(() => {
    const resolveChat = async () => {
      if (!currentId || !otherUserId) return;

      try {
        setError(null);
        const res = await fetch("/api/messages/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: otherUserId })
        });
        const json = await res.json();

        if (json.success && json.data) {
          setConversation(json.data);
          setOtherUser({
            id: json.data.otherUser.id,
            firstName: json.data.otherUser.name?.split(' ')[0] || "User",
            lastName: json.data.otherUser.name?.split(' ').slice(1).join(' ') || "",
            profileImage: json.data.otherUser.avatar || "",
            email: "",
            isOnline: json.data.otherUser.isOnline
          });
        } else {
          setError(json.error || "User not found or unavailable");
        }
      } catch (err) {
        console.error("Chat resolution failed:", err);
        setError("Failed to initialize chat. Please check your connection.");
      }
    };

    resolveChat();
  }, [currentId, otherUserId]);

  if (loading || (!user && !admin)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Handle Error / User Not Found State
  if (error || (!conversation && !loading && currentId && otherUserId)) {
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

  const otherUserName = `${otherUser.firstName} ${otherUser.lastName}`;

  return (
    <div className="flex-1 bg-background overflow-hidden">
      <div className="h-full flex relative">
        <div className="hidden lg:block lg:w-96 flex-shrink-0 h-full">
          <ChatSidebar
            currentUserRole={currentUserRole}
          />
        </div>
        <div className="flex-1 h-full">
          <ChatWindow
            conversationId={conversation.id}
            userName={otherUserName}
            userImage={otherUser.profileImage}
            isOnline={!!otherUser.isOnline}
            currentUserId={currentId || ""}
            currentUserRole={currentUserRole as "consumer" | "provider" | "admin"}
          />
        </div>
      </div>
    </div>
  );
}