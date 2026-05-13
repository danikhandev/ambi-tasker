"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface SoundContextType {
    isSoundEnabled: boolean;
    setSoundEnabled: (enabled: boolean) => void;
    isUISoundEnabled: boolean;
    setUISoundEnabled: (enabled: boolean) => void;
    playNotificationSound: (tone?: string) => void;
    playClickSound: () => void;
    availableTones: string[];
    selectedTone: string;
    setSelectedTone: (tone: string) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
    const [isSoundEnabled, setIsSoundEnabled] = useState(true);
    const [isUISoundEnabled, setIsUISoundEnabled] = useState(true);
    const [selectedTone, setSelectedToneState] = useState("default");
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [clickAudio, setClickAudio] = useState<HTMLAudioElement | null>(null);

    const availableTones = ["default", "soft", "alert"];

    useEffect(() => {
        // Load settings from localStorage
        const savedSound = localStorage.getItem("serve_u_sound_enabled");
        const savedUISound = localStorage.getItem("serve_u_ui_sound_enabled");
        const savedTone = localStorage.getItem("serve_u_selected_tone");

        if (savedSound !== null) setIsSoundEnabled(savedSound === "true");
        if (savedUISound !== null) setIsUISoundEnabled(savedUISound === "true");
        if (savedTone) setSelectedToneState(savedTone);

        // Preload audio
        if (typeof window !== "undefined") {
            const initialAudio = new Audio(`/sounds/${savedTone || "default"}.mp3`);
            initialAudio.preload = "auto";
            setAudio(initialAudio);

            const initialClick = new Audio("/sounds/click.mp3");
            initialClick.preload = "auto";
            initialClick.volume = 0.4; // Soft click
            setClickAudio(initialClick);
        }
    }, []);

    const setSoundEnabled = useCallback((enabled: boolean) => {
        setIsSoundEnabled(enabled);
        localStorage.setItem("serve_u_sound_enabled", String(enabled));
    }, []);

    const setUISoundEnabled = useCallback((enabled: boolean) => {
        setIsUISoundEnabled(enabled);
        localStorage.setItem("serve_u_ui_sound_enabled", String(enabled));
    }, []);

    const setSelectedTone = useCallback((tone: string) => {
        setSelectedToneState(tone);
        localStorage.setItem("serve_u_selected_tone", tone);
        
        // Update preloaded audio
        if (typeof window !== "undefined") {
            const newAudio = new Audio(`/sounds/${tone}.mp3`);
            newAudio.preload = "auto";
            setAudio(newAudio);
        }
    }, []);

    const playNotificationSound = useCallback((toneOverride?: string) => {
        if (!isSoundEnabled) return;

        try {
            const toneToPlay = toneOverride || selectedTone;
            let soundToPlay = audio;

            if (toneOverride && toneOverride !== selectedTone) {
                soundToPlay = new Audio(`/sounds/${toneOverride}.mp3`);
            }

            if (soundToPlay) {
                soundToPlay.currentTime = 0;
                soundToPlay.play().catch(err => console.warn("Notification audio failed:", err));
            }
        } catch (error) {
            console.error("Sound playback error:", error);
        }
    }, [isSoundEnabled, selectedTone, audio]);

    const playClickSound = useCallback(() => {
        if (!isUISoundEnabled) return;

        try {
            if (clickAudio) {
                clickAudio.currentTime = 0;
                clickAudio.play().catch(err => console.warn("Click audio failed:", err));
            }
        } catch (error) {
            console.error("Click sound error:", error);
        }
    }, [isUISoundEnabled, clickAudio]);

    return (
        <SoundContext.Provider value={{
            isSoundEnabled,
            setSoundEnabled,
            isUISoundEnabled,
            setUISoundEnabled,
            playNotificationSound,
            playClickSound,
            availableTones,
            selectedTone,
            setSelectedTone
        }}>
            {children}
        </SoundContext.Provider>
    );
}

export function useSound() {
    const context = useContext(SoundContext);
    if (context === undefined) {
        throw new Error("useSound must be used within a SoundProvider");
    }
    return context;
}
