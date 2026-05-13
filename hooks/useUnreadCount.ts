"use client";

/**
 * useUnreadCount
 * Returns total unread message count across all conversations for the current user.
 * Uses Supabase Realtime to keep it live.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { logger } from "@/utils/logger";

export function useUnreadCount(userId: string | null | undefined): number {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!userId) {
      setCount(0);
      return;
    }
    try {
      // Fetch all conversations where user participates
      const { data: convos } = await supabase
        .from("conversations")
        .select("id")
        .or(`user_id.eq.${userId},provider_id.eq.${userId}`);

      if (!convos || convos.length === 0) {
        setCount(0);
        return;
      }

      const ids = convos.map(c => c.id);

      // Count unread messages not sent by this user across all conversations
      const { count: unread } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("conversation_id", ids)
        .eq("is_read", false)
        .neq("sender_id", userId);

      setCount(unread || 0);
    } catch (err) {
      logger.warn("useUnreadCount: fetch failed", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchCount();

    if (!userId) return;

    const channel = supabase
      .channel(`global-unread-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => fetchCount()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => fetchCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchCount]);

  return count;
}
