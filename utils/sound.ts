/**
 * Notification Sound Utility
 * 
 * Supports both Web (standard Audio API) and Native (Expo AV fallback).
 * In a Capacitor environment, the standard Audio API usually works within the webview.
 * For dedicated Expo/React Native apps, use the playNativeNotificationSound function.
 */

// Web Playback
export const playNotificationSound = (tone: string = "default") => {
    if (typeof window === "undefined") return;
    
    try {
        const audio = new Audio(`/sounds/${tone}.mp3`);
        audio.play().catch(err => {
            console.warn("Web audio playback failed. This often happens if the user hasn't interacted with the page yet.", err);
        });
    } catch (error) {
        console.error("Sound playback error:", error);
    }
};

export const playClickSound = () => {
    if (typeof window === "undefined") return;
    
    try {
        const audio = new Audio("/sounds/click.mp3");
        audio.volume = 0.4;
        audio.play().catch(err => console.warn("Click sound failed:", err));
    } catch (error) {
        console.error("Click sound error:", error);
    }
};

// Native (Expo) Playback - Placeholder for native environments
// To use this, you must run: expo install expo-av
export const playNativeNotificationSound = async () => {
    try {
        // We use dynamic import to avoid breaking the web build if expo-av is missing
        // @ts-ignore
        const { Audio } = await import("expo-av");
        const { sound } = await Audio.Sound.createAsync(
            // @ts-ignore
            require("../assets/sounds/notification.mp3")
        );
        await sound.playAsync();
    } catch (error) {
        console.log("Native sound error:", error);
    }
};

export const playNativeClickSound = async () => {
    try {
        // @ts-ignore
        const { Audio } = await import("expo-av");
        const { sound } = await Audio.Sound.createAsync(
            // @ts-ignore
            require("../assets/sounds/click.mp3")
        );
        await sound.playAsync();
    } catch (error) {
        console.log("Native click sound error:", error);
    }
};
