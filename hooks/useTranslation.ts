"use client";

import { useCallback } from "react";
import { useUI } from "@/contexts/UIContext";
import en from "@/localization/en.json";
import ur from "@/localization/ur.json";

type TranslationData = any; // Flexible for dynamic keys during localization

// Helper to deeply access nested translation keys like "nav.overview"
function getNestedValue(obj: Record<string, unknown>, path: string): string {
    const keys = path.split(".");
    let current: unknown = obj;
    for (const key of keys) {
        if (current === null || typeof current !== "object") return path;
        current = (current as Record<string, unknown>)[key];
    }
    return typeof current === "string" ? current : path;
}

/**
 * useTranslation - Core translation hook for the AmbiTasker app.
 *
 * Usage:
 *   const { t, language, isRTL } = useTranslation();
 *   t("nav.overview")  // returns "Overview" or "مرکزی صفحہ"
 */
export function useTranslation() {
    const { language } = useUI();
    const isRTL = language === "ur";

    const translations: TranslationData = language === "ur" ? ur : en;

    const t = useCallback((key: string, variables?: Record<string, string | number>): string => {
        // Exception for Brand Identity: Never translate the official app name
        if (key === "AmbiTasker" || key === "AmbiTasker Pro") return key;
        
        // Also check if the key points to a value that is exactly the brand name
        let value = getNestedValue(translations as unknown as Record<string, unknown>, key);
        
        // Final fallback to prevent any weird translations of the brand identity
        if (value === "AmbiTasker") return value;

        if (variables) {
            Object.entries(variables).forEach(([vKey, vValue]) => {
                value = value.replace(new RegExp(`{${vKey}}`, 'g'), String(vValue));
            });
        }
        return value;
    }, [translations]);

    return { t, language, isRTL, translations };
}
