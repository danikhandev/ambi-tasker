"use client";

import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/services/supabase";

export default function ChatPage() {
  const { user, loading: userLoading, activePerspective } = useUser();
  const { admin, loading: adminLoading } = useAdmin();
  const params = useParams();
  const otherUserId = params.userId as string;

  const [conversation, setConversation] = useState<any | null>(null);
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
        }
      } catch (err) {
        console.error("Chat resolution failed:", err);
      }
    };

    resolveChat();
  }, [currentId, otherUserId]);

  if (loading || (!user && !admin) || !conversation || !otherUser) {
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