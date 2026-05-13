"use client";

/**
 * useChat — Unified real-time chat hook (Supabase-only)
 *
 * Uses:
 *  1. Supabase Realtime (postgres_changes) for message persistence & sync
 *  2. Supabase Broadcast for low-latency typing indicators & delivery receipts
 *
 * Usage:
 *   const { messages, isTyping, sendMessage, sendTyping, isConnected } =
 *     useChat({ conversationId, currentUserId });
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { logger } from "@/utils/logger";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string | null;
  createdAt: string;
  readAt: string | null;
  status: "sending" | "sent" | "delivered" | "read";
  attachments?: { id?: string; fileUrl?: string; type?: string; fileType?: string; name?: string; fileName?: string; fileSize?: number }[];
}

interface UseChatOptions {
  conversationId: string | null;
  currentUserId: string | null;
  otherUserId?: string | null;
  /** Max messages per page for pagination */
  pageSize?: number;
}

export function useChat({ conversationId, currentUserId, otherUserId, pageSize = 50 }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const broadcastChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSendingRef = useRef(false);

  // ─── 1. Load initial messages from Prisma API ───────────────────
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/messages?conversationId=${conversationId}&limit=${pageSize}`);
      const json = await res.json();
      
      if (!json.success) throw new Error(json.error || "Failed to fetch messages");

      const mapped: ChatMessage[] = (json.data || []).map((m: any) => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        content: m.messageText,
        createdAt: m.createdAt,
        readAt: m.isRead ? m.createdAt : null,
        status: m.isRead ? "read" : "delivered",
        attachments: [], // Simplified for now
      }));

      setMessages(mapped);

      // Count unread incoming messages
      const unread = mapped.filter(
        m => m.senderId !== currentUserId && !m.readAt
      ).length;
      setUnreadCount(unread);
    } catch (err) {
      logger.error("useChat: fetchMessages failed", err);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, currentUserId, pageSize]);

  // ─── 2. Mark all incoming messages as read ────────────────────────
  const markAsRead = useCallback(async () => {
    if (!conversationId || !currentUserId) return;
    try {
        await fetch("/api/messages", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId })
        });
        setUnreadCount(0);
    } catch (err) {
        console.error("Mark as read failed", err);
    }
  }, [conversationId, currentUserId]);

  // ─── 3. Polling for updates (fallback for real-time) ──────────────
  useEffect(() => {
    if (!conversationId) return;

    fetchMessages();

    // Poll for new messages every 5 seconds while conversation is open
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId, fetchMessages]);

  // ─── 4. Supabase Broadcast — typing indicators & read receipts ────
  useEffect(() => {
    if (!conversationId) return;

    const broadcastChannel = supabase.channel(`chat-broadcast-${conversationId}`, {
      config: { broadcast: { self: false } },
    });

    // Typing indicator from other party
    broadcastChannel.on("broadcast", { event: "typing" }, (payload) => {
      const data = payload.payload as { userId: string; isTyping: boolean };
      if (data.userId !== currentUserId) {
        setIsTyping(data.isTyping);

        // Auto-clear typing bubble after 3 seconds of silence
        if (data.isTyping) {
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      }
    });

    // Messages were read by other party
    broadcastChannel.on("broadcast", { event: "messages-read" }, (payload) => {
      const data = payload.payload as { messageIds: string[]; readBy: string };
      setMessages(prev =>
        prev.map(m =>
          data.messageIds.includes(m.id) && m.senderId === currentUserId
            ? { ...m, status: "read", readAt: new Date().toISOString() }
            : m
        )
      );
    });

    broadcastChannel.subscribe((status) => {
      setIsConnected(status === "SUBSCRIBED");
      if (status === "SUBSCRIBED") {
        logger.info(`useChat: Connected to conversation ${conversationId}`);
      }
    });

    broadcastChannelRef.current = broadcastChannel;

    return () => {
      supabase.removeChannel(broadcastChannel);
      broadcastChannelRef.current = null;
      setIsConnected(false);
    };
  }, [conversationId, currentUserId]);

  // ─── 5. Send a text message ───────────────────────────────────────
  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text.trim() || !conversationId || !currentUserId || isSendingRef.current) return false;
      isSendingRef.current = true;

      const optimisticId = `opt-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: optimisticId,
        conversationId,
        senderId: currentUserId,
        content: text.trim(),
        createdAt: new Date().toISOString(),
        readAt: null,
        status: "sending",
        attachments: [],
      };

      // Optimistic insert
      setMessages(prev => [...prev, optimistic]);

      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, message: text.trim() })
        });
        const json = await res.json();

        if (!json.success) throw new Error(json.error || "Failed to send");

        const realMessage: ChatMessage = {
            id: json.data.id,
            conversationId: json.data.conversationId,
            senderId: json.data.senderId,
            content: json.data.messageText,
            createdAt: json.data.createdAt,
            readAt: null,
            status: "delivered",
            attachments: []
        };

        // Update with real ID from database
        setMessages(prev => prev.map(m => m.id === optimisticId ? realMessage : m));

        // Broadcast for instant delivery to other party if socket still active
        if (broadcastChannelRef.current) {
          broadcastChannelRef.current.send({
            type: "broadcast",
            event: "new-message",
            payload: { ...realMessage, status: "delivered" },
          });
        }

        isSendingRef.current = false;
        return true;
      } catch (err) {
        logger.error("useChat: sendMessage failed", err);
        // Mark optimistic message as failed
        setMessages(prev =>
          prev.map(m =>
            m.id === optimisticId ? { ...m, status: "sending", content: `❌ ${m.content}` } : m
          )
        );
        isSendingRef.current = false;
        return false;
      }
    },
    [conversationId, currentUserId]
  );

  // ─── 6. Typing indicator emitter ─────────────────────────────────
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

  // ─── 7. Retry failed message ──────────────────────────────────────
  const retryMessage = useCallback(
    async (messageId: string) => {
      const msg = messages.find(m => m.id === messageId);
      if (!msg?.content) return;
      setMessages(prev => prev.filter(m => m.id !== messageId));
      await sendMessage(msg.content.replace(/^❌ /, ""));
    },
    [messages, sendMessage]
  );

  return {
    messages,
    isTyping,
    isConnected,
    isLoading,
    unreadCount,
    sendMessage,
    sendTyping,
    markAsRead,
    retryMessage,
    refetch: fetchMessages,
  };
}
