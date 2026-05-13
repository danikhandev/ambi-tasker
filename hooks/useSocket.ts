/**
 * useSocket.ts → useRealtime.ts
 * Replaces Socket.io with Supabase Realtime Channels (Presence + Broadcast).
 * Provides: typing indicators, user online status, message delivery receipts.
 */

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeOptions {
  conversationId?: string;
  currentUserId?: string;
  onNewMessage?: (message: any) => void;
  onUserTyping?: (data: { userId: string; isTyping: boolean }) => void;
  onMessagesRead?: (data: { messageIds: string[]; readBy: string }) => void;
  onUserStatus?: (data: { userId: string; status: "online" | "offline" }) => void;
}

export function useRealtime(options: UseRealtimeOptions = {}) {
  const {
    conversationId,
    currentUserId,
    onNewMessage,
    onUserTyping,
    onMessagesRead,
    onUserStatus,
  } = options;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const presenceChannelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<string>(new Date().toISOString());

  // Store latest callbacks in refs to avoid recreating channels
  const onNewMessageRef = useRef(onNewMessage);
  const onUserTypingRef = useRef(onUserTyping);
  const onMessagesReadRef = useRef(onMessagesRead);
  const onUserStatusRef = useRef(onUserStatus);

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
    onUserTypingRef.current = onUserTyping;
    onMessagesReadRef.current = onMessagesRead;
    onUserStatusRef.current = onUserStatus;
  }, [onNewMessage, onUserTyping, onMessagesRead, onUserStatus]);

  // ── Conversation-specific channel (Supabase Realtime) ──────────────────
  useEffect(() => {
    if (!isSupabaseConfigured || !conversationId) return;

    const channel = supabase.channel(`conversation:${conversationId}`, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "typing" }, (payload) => {
      if (onUserTypingRef.current) {
        onUserTypingRef.current(payload.payload as { userId: string; isTyping: boolean });
      }
    });

    channel.on("broadcast", { event: "new-message" }, (payload) => {
      if (onNewMessageRef.current) {
        onNewMessageRef.current(payload.payload);
        lastFetchRef.current = new Date().toISOString();
      }
    });

    channel.on("broadcast", { event: "messages-read" }, (payload) => {
      if (onMessagesReadRef.current) {
        onMessagesReadRef.current(payload.payload as { messageIds: string[]; readBy: string });
      }
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
        setError(null);
      } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
        setIsConnected(false);
        setError(status);
      }
    });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [conversationId]);

  // ── Polling Fallback (REST API) ──────────────────────────────────────────
  useEffect(() => {
    if (isSupabaseConfigured || !conversationId) return;

    console.log("Supabase Realtime disabled. Falling back to polling for conversation:", conversationId);
    setIsConnected(true); // "Connected" via polling

    const poll = async () => {
      try {
        const res = await fetch(`/api/messages?bookingId=${conversationId}&after=${encodeURIComponent(lastFetchRef.current)}`);
        const json = await res.json();
        
        if (json.success && json.data.length > 0) {
          json.data.forEach((msg: any) => {
            if (onNewMessageRef.current) onNewMessageRef.current(msg);
          });
          lastFetchRef.current = new Date().toISOString();
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    const interval = setInterval(poll, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, [conversationId]);

  // ── Global presence channel (Supabase Realtime) ─────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured || !currentUserId) return;

    const presenceChannel = supabase.channel("online-users", {
      config: { presence: { key: currentUserId } },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        Object.keys(state).forEach((userId) => {
          if (onUserStatusRef.current) {
            onUserStatusRef.current({ userId, status: "online" });
          }
        });
      })
      .on("presence", { event: "join" }, ({ key }) => {
        if (onUserStatusRef.current && key) {
          onUserStatusRef.current({ userId: key, status: "online" });
        }
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        if (onUserStatusRef.current && key) {
          onUserStatusRef.current({ userId: key, status: "offline" });
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ user_id: currentUserId, online_at: new Date().toISOString() });
        }
      });

    presenceChannelRef.current = presenceChannel;

    return () => {
      supabase.removeChannel(presenceChannel);
      presenceChannelRef.current = null;
    };
  }, [currentUserId]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (messageText: string) => {
    // 1. Always send via REST API to persist in DB
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: conversationId, message: messageText }),
      });
      const json = await res.json();
      
      if (json.success && isSupabaseConfigured && channelRef.current) {
        // 2. Broadcast via Supabase for low-latency update if available
        channelRef.current.send({
          type: "broadcast",
          event: "new-message",
          payload: json.data,
        });
      }
      return json;
    } catch (err) {
      console.error("SendMessage error:", err);
      return { success: false, error: "Network error" };
    }
  }, [conversationId]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (isSupabaseConfigured && channelRef.current && conversationId && currentUserId) {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: currentUserId, isTyping },
      });
    }
    // No REST fallback for typing indicators (too noisy for polling)
  }, [conversationId, currentUserId]);

  const markMessagesRead = useCallback(async (messageIds: string[]) => {
    try {
      const res = await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageIds }),
      });
      
      if (isSupabaseConfigured && channelRef.current && conversationId && currentUserId) {
        channelRef.current.send({
          type: "broadcast",
          event: "messages-read",
          payload: { messageIds, readBy: currentUserId },
        });
      }
    } catch (err) {
      console.error("MarkRead error:", err);
    }
  }, [conversationId, currentUserId]);

  return {
    isConnected,
    error,
    sendMessage,
    sendTyping,
    markMessagesRead,
  };
}

// Re-export with old name for backward compatibility
export { useRealtime as useSocket };
