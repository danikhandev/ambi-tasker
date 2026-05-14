"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { logger } from "@/utils/logger";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface SupportMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  attachments?: { id: string; fileUrl: string; fileName: string; fileType: string; fileSize: number }[];
}

interface UseSupportChatOptions {
  conversationId: string | null;
  currentUserId: string | null;
  role: "USER" | "PROVIDER" | "ADMIN";
}

export function useSupportChat({ conversationId, currentUserId, role }: UseSupportChatOptions) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const broadcastChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSendingRef = useRef(false);

  // ─── 1. Load initial messages ──────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/support/messages?conversationId=${conversationId}`);
      const json = await res.json();
      if (json.success) {
        setMessages(json.data);
      }
    } catch (err) {
      logger.error("useSupportChat: fetchMessages failed", err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ─── 2. Real-time Subscriptions (Supabase) ────────────────────────
  useEffect(() => {
    if (!conversationId) return;

    // A. Listen for DB changes (new messages)
    const dbChannel = supabase
      .channel(`support-db-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as SupportMessage;
          // Avoid duplicates if we already added it optimistically
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    // B. Listen for Broadcasts (typing indicators)
    const broadcastChannel = supabase.channel(`support-broadcast-${conversationId}`, {
      config: { broadcast: { self: false } },
    });

    broadcastChannel.on("broadcast", { event: "typing" }, (payload) => {
      const data = payload.payload as { userId: string; isTyping: boolean };
      if (data.userId !== currentUserId) {
        setIsTyping(data.isTyping);
        if (data.isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      }
    });

    broadcastChannel.subscribe((status) => {
      setIsConnected(status === "SUBSCRIBED");
    });

    broadcastChannelRef.current = broadcastChannel;

    return () => {
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(broadcastChannel);
      broadcastChannelRef.current = null;
    };
  }, [conversationId, currentUserId]);

  // ─── 3. Send Message ─────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string, attachments?: any[]) => {
      if (!content.trim() || !conversationId || !currentUserId || isSendingRef.current) return false;
      isSendingRef.current = true;

      const optimisticId = `opt-${Date.now()}`;
      const optimistic: SupportMessage = {
        id: optimisticId,
        conversationId,
        senderId: currentUserId,
        senderRole: role,
        content: content.trim(),
        createdAt: new Date().toISOString(),
        isRead: false,
        attachments: attachments || []
      };

      setMessages((prev) => [...prev, optimistic]);

      try {
        const res = await fetch("/api/support/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, content, attachments }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);

        // Update with real message
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticId ? json.data : m))
        );
        isSendingRef.current = false;
        return true;
      } catch (err) {
        logger.error("useSupportChat: sendMessage failed", err);
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        isSendingRef.current = false;
        return false;
      }
    },
    [conversationId, currentUserId, role]
  );

  // ─── 4. Send Typing Indicator ────────────────────────────────────
  const sendTyping = useCallback(
    (isTypingNow: boolean) => {
      if (broadcastChannelRef.current && conversationId && currentUserId) {
        broadcastChannelRef.current.send({
          type: "broadcast",
          event: "typing",
          payload: { userId: currentUserId, isTyping: isTypingNow },
        });
      }
    },
    [conversationId, currentUserId]
  );

  return {
    messages,
    isTyping,
    isConnected,
    isLoading,
    sendMessage,
    sendTyping,
    refetch: fetchMessages,
  };
}
