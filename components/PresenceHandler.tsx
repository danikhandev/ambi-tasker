"use client";

import { usePresence } from "@/hooks/usePresence";

/**
 * PresenceHandler Component
 * A headless component that simply runs the usePresence hook.
 * Placed within the global Providers tree to ensure real-time status tracking.
 */
export default function PresenceHandler() {
    usePresence();
    return null;
}
