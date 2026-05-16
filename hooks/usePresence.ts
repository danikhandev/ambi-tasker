"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/contexts/UserContext";

/**
 * usePresence Hook
 * Manages real-time online/offline status using Supabase Presence.
 * Automatically updates the database when the user connects or disconnects.
 */
export function usePresence() {
  const { user } = useUser();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Initialize Presence Channel
    const channel = supabase.channel("online-users", {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    channelRef.current = channel;

    const updateDBStatus = async (isOnline: boolean) => {
      try {
        await fetch("/api/user/presence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isOnline }),
        });
      } catch (err) {
        console.error("Failed to update presence in DB:", err);
      }
    };

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        // You can use this to show a list of online users globally if needed
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        if (key === user.id) {
          updateDBStatus(true);
        }
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        if (key === user.id) {
          // Note: Leave might not trigger on tab close reliably, 
          // but Supabase presence handles the "untrack" server-side.
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Handle tab closing / navigation
    const handleBeforeUnload = () => {
      if (user?.id) {
        // Use sendBeacon for more reliability on exit
        const data = JSON.stringify({ isOnline: false });
        navigator.sendBeacon("/api/user/presence", data);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      updateDBStatus(false);
    };
  }, [user?.id]);

  return null;
}
