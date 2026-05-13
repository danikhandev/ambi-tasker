"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@/contexts/UserContext";

export default function LocationTracker() {
  const { user, activePerspective } = useUser();
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Only track if the user is a provider AND currently using the provider perspective
    const shouldTrack = user?.role === "PROVIDER" && activePerspective === "provider";

    if (!shouldTrack) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      return;
    }

    // Set up location watching
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await fetch("/api/provider/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude }),
          });
        } catch (err) {
          console.error("Failed to sync location:", err);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setError("Location access denied or unavailable.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000, // Update max every 5 seconds
      }
    );

    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [user, activePerspective]);

  if (error) {
    // We could show a small UI toast or alert here if tracking is critical, 
    // but typically we'll keep it silent or handle via Context/Toast
    // console.warn("Tracker Error:", error);
  }

  return null; // This is a silent background component
}
