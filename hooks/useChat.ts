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
        content: m.messageText || null,
        createdAt: m.createdAt,
        readAt: m.isRead ? m.createdAt : null,
        status: m.isRead ? "read" : "delivered",
        attachments: m.attachmentUrl ? [{
          id: `${m.id}-att`,
          fileUrl: m.attachmentUrl,
          type: m.attachmentUrl.endsWith(".webm") || m.attachmentUrl.includes("voice-note")
            ? "audio/webm"
            : m.attachmentUrl.endsWith(".jpg") || m.attachmentUrl.endsWith(".jpeg") || m.attachmentUrl.endsWith(".png")
              ? "image/jpeg"
              : "application/octet-stream",
          fileType: m.attachmentUrl.endsWith(".webm") || m.attachmentUrl.includes("voice-note")
            ? "audio/webm"
            : m.attachmentUrl.endsWith(".jpg") || m.attachmentUrl.endsWith(".jpeg") || m.attachmentUrl.endsWith(".png")
              ? "image/jpeg"
              : "application/octet-stream",
          name: m.attachmentUrl.split("/").pop() || "Attachment",
          fileName: m.attachmentUrl.split("/").pop() || "Attachment",
        }] : [],
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

  // ─── 3. Real-time Message Subscription ───────────────────────────
  useEffect(() => {
    // RESET: Clear old messages when switching conversations to prevent ghosting
    setMessages([]);
    
    if (!conversationId) return;

    fetchMessages();

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const newMessage = payload.new;
          // Only add if not already in list (prevent duplicates from optimistic updates)
          setMessages(prev => {
            if (prev.some(m => m.id === newMessage.id)) return prev;
            
            const mapped: ChatMessage = {
              id: newMessage.id,
              conversationId: newMessage.conversation_id,
              senderId: newMessage.sender_id,
              content: newMessage.message_text || null,
              createdAt: newMessage.created_at,
              readAt: newMessage.is_read ? newMessage.created_at : null,
              status: newMessage.is_read ? "read" : "delivered",
              attachments: newMessage.attachment_url ? [{
                id: `${newMessage.id}-att`,
                fileUrl: newMessage.attachment_url,
                type: newMessage.attachment_url.endsWith(".webm") || newMessage.attachment_url.includes("voice-note")
                  ? "audio/webm"
                  : newMessage.attachment_url.endsWith(".jpg") || newMessage.attachment_url.endsWith(".jpeg") || newMessage.attachment_url.endsWith(".png")
                    ? "image/jpeg"
                    : "application/octet-stream",
                fileType: newMessage.attachment_url.endsWith(".webm") || newMessage.attachment_url.includes("voice-note")
                  ? "audio/webm"
                  : newMessage.attachment_url.endsWith(".jpg") || newMessage.attachment_url.endsWith(".jpeg") || newMessage.attachment_url.endsWith(".png")
                    ? "image/jpeg"
                    : "application/octet-stream",
                name: newMessage.attachment_url.split("/").pop() || "Attachment",
                fileName: newMessage.attachment_url.split("/").pop() || "Attachment",
              }] : [],
            };
            return [...prev, mapped];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          const updated = payload.new;
          setMessages(prev => prev.map(m => 
            m.id === updated.id 
              ? { ...m, status: updated.is_read ? "read" : "delivered", readAt: updated.is_read ? updated.created_at : null } 
              : m
          ));
        }
      )
      .subscribe();

    // Occasional safety poll (less aggressive)
    const interval = setInterval(fetchMessages, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
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

  const sendMessage = useCallback(
    async (text: string, attachmentUrl?: string): Promise<boolean> => {
      if (!text.trim() && !attachmentUrl) return false;
      if (!conversationId || !currentUserId || isSendingRef.current) return false;
      isSendingRef.current = true;

      const optimisticId = `opt-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: optimisticId,
        conversationId,
        senderId: currentUserId,
        content: text.trim() || null,
        createdAt: new Date().toISOString(),
        readAt: null,
        status: "sending",
        attachments: attachmentUrl ? [{
          id: `${optimisticId}-att`,
          fileUrl: attachmentUrl,
          type: attachmentUrl.endsWith(".webm") || attachmentUrl.includes("voice-note")
            ? "audio/webm"
            : attachmentUrl.endsWith(".jpg") || attachmentUrl.endsWith(".jpeg") || attachmentUrl.endsWith(".png")
              ? "image/jpeg"
              : "application/octet-stream",
          fileType: attachmentUrl.endsWith(".webm") || attachmentUrl.includes("voice-note")
            ? "audio/webm"
            : attachmentUrl.endsWith(".jpg") || attachmentUrl.endsWith(".jpeg") || attachmentUrl.endsWith(".png")
              ? "image/jpeg"
              : "application/octet-stream",
          name: attachmentUrl.split("/").pop() || "Attachment",
          fileName: attachmentUrl.split("/").pop() || "Attachment",
        }] : [],
      };

      // Optimistic insert
      setMessages(prev => [...prev, optimistic]);

      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, message: text.trim(), attachmentUrl })
        });
        const json = await res.json();

        if (!json.success) throw new Error(json.error || "Failed to send");

        const realMessage: ChatMessage = {
            id: json.data.id,
            conversationId: json.data.conversationId,
            senderId: json.data.senderId,
            content: json.data.messageText || null,
            createdAt: json.data.createdAt,
            readAt: null,
            status: "delivered",
            attachments: json.data.attachmentUrl ? [{
              id: `${json.data.id}-att`,
              fileUrl: json.data.attachmentUrl,
              type: json.data.attachmentUrl.endsWith(".webm") || json.data.attachmentUrl.includes("voice-note")
                ? "audio/webm"
                : json.data.attachmentUrl.endsWith(".jpg") || json.data.attachmentUrl.endsWith(".jpeg") || json.data.attachmentUrl.endsWith(".png")
                  ? "image/jpeg"
                  : "application/octet-stream",
              fileType: json.data.attachmentUrl.endsWith(".webm") || json.data.attachmentUrl.includes("voice-note")
                ? "audio/webm"
                : json.data.attachmentUrl.endsWith(".jpg") || json.data.attachmentUrl.endsWith(".jpeg") || json.data.attachmentUrl.endsWith(".png")
                  ? "image/jpeg"
                  : "application/octet-stream",
              name: json.data.attachmentUrl.split("/").pop() || "Attachment",
              fileName: json.data.attachmentUrl.split("/").pop() || "Attachment",
            }] : [],
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
