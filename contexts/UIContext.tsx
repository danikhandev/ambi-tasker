"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { themes, ThemeType, ThemeColors } from "@/constants/themes";
import { useSound } from "./SoundContext";

/**
 * Requirement 2: Global Theme Context or Theme Provider.
 * Requirement 4: Each theme defines background, card, primary, and text colors.
 */

export type Theme = ThemeType;
export type Language = "en" | "ur";

interface Toast {
    message: string;
    type: "success" | "error" | "info";
}

interface UIContextType {
    theme: Theme;
    colors: ThemeColors;
    language: Language;
    pageTitle: string;
    pageTitleHighlight?: string;
    pageSubtitle: string;
    isMobileSidebarOpen: boolean;
    setTheme: (theme: Theme) => void;
    setLanguage: (lang: Language) => void;
    setPageTitle: (title: string, subtitle?: string, highlight?: string) => void;
    setMobileSidebarOpen: (isOpen: boolean) => void;
    showToast: (message: string, type?: "success" | "error" | "info") => void;
    isMounted: boolean;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
    // Requirement 7: Load saved theme from storage on restart
    const [theme, setThemeState] = useState<Theme>("blue");
    const [language, setLanguage] = useState<Language>("en");

    const [toast, setToast] = useState<Toast | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    const colors = useMemo(() => themes[theme], [theme]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    /**
     * Requirement 6: Save theme in local storage.
     * Note: Using localStorage as it is the web-standard for this Next.js project.
     * In a Capacitor/React Native environment, localStorage persists.
     */
    const applyTheme = useCallback((newTheme: Theme) => {
        if (typeof window === "undefined") return;

        const html = document.documentElement;
        // Comprehensive list of all possible theme classes to avoid "class pollution"
        const allThemes = ["theme-gray", "theme-blue", "theme-black", "theme-admin", "theme-admin-light", "dark"];
        html.classList.remove(...allThemes);
        
        // Add the new theme class
        html.classList.add(`theme-${newTheme}`);
        
        // Black theme counts as dark mode for Tailwind and other utilities
        if (newTheme === "black") {
            html.classList.add("dark");
        }
        
        localStorage.setItem("serve_u_theme", newTheme);
    }, []);

    // On mount, load from localStorage
    useEffect(() => {
        const savedTheme = localStorage.getItem("serve_u_theme") as Theme;
        const savedLang = localStorage.getItem("serve_u_lang") as Language;

        if (savedTheme && themes[savedTheme]) {
            setThemeState(savedTheme);
            applyTheme(savedTheme);
        } else {
            // Default to blue theme if none saved
            applyTheme("blue");
            setThemeState("blue");
        }

        if (savedLang) {
            setLanguage(savedLang);
            applyRTL(savedLang);
        }
    }, [applyTheme]);

    const applyRTL = (lang: Language) => {
        if (typeof window === "undefined") return;
        const html = document.documentElement;
        if (lang === "ur") {
            html.setAttribute("dir", "rtl");
            html.setAttribute("lang", "ur");
            html.classList.add("urdu-font");
        } else {
            html.setAttribute("dir", "ltr");
            html.setAttribute("lang", "en");
            html.classList.remove("urdu-font");
        }
    };

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        applyTheme(newTheme);
    }, [applyTheme]);

    const handleSetLanguage = useCallback((lang: Language) => {
        setLanguage(lang);
        localStorage.setItem("serve_u_lang", lang);
        applyRTL(lang);

    }, []);

    const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const [pageTitle, setPageTitleState] = useState("");
    const [pageTitleHighlight, setPageTitleHighlightState] = useState("");
    const [pageSubtitle, setPageSubtitleState] = useState("");

    const setPageTitle = useCallback((title: string, subtitle: string = "", highlight: string = "") => {
        setPageTitleState(title);
        setPageSubtitleState(subtitle);
        setPageTitleHighlightState(highlight);
    }, []);

    const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const { playNotificationSound } = useSound();

    // Notification Listener for real-time toasts and sounds
    useEffect(() => {
        const handleNotification = (e: any) => {
            const { title, body, type } = e.detail;
            showToast(`${title}: ${body}`, "info");
            
            // Map notification type to specific tones if desired
            let tone: string | undefined = undefined;
            if (type === 'BOOKING') tone = 'alert';
            if (type === 'PAYMENT') tone = 'soft';
            
            playNotificationSound(tone);
        };
        window.addEventListener('app:notification', handleNotification);
        return () => window.removeEventListener('app:notification', handleNotification);
    }, [showToast, playNotificationSound]);

    const contextValue = useMemo(() => ({
        theme,
        colors,
        language,
        pageTitle,
        pageTitleHighlight,
        pageSubtitle,
        isMobileSidebarOpen,
        setTheme,
        setLanguage: handleSetLanguage,
        setPageTitle,
        setMobileSidebarOpen,
        showToast,
        isMounted
    }), [theme, colors, language, pageTitle, pageTitleHighlight, pageSubtitle, isMobileSidebarOpen, setTheme, handleSetLanguage, setPageTitle, setMobileSidebarOpen, showToast, isMounted]);

    return (
        <UIContext.Provider value={contextValue}>
            {children}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-3 min-w-[300px] backdrop-blur-md ${toast.type === "success" ? "bg-emerald-500/90 text-white border-emerald-400/20" :
                            toast.type === "error" ? "bg-red-500/90 text-white border-red-400/20" :
                                "bg-gray-900/90 text-white border-white/10"
                            }`}
                    >
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-sm font-black uppercase tracking-widest leading-none">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        return {
            theme: "blue",
            language: "en",
            isMounted: true,
            setLanguage: () => {},
            showToast: () => {},
        } as any;
    }
    return context;
}

