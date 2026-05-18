"use client";

import React from "react";
import Logo from "./Logo";
import { unbounded } from "@/app/fonts";
import { useTranslation } from "@/hooks/useTranslation";

interface BrandProps {
  /** Size variant for the logo emblem */
  size?: "sm" | "md" | "lg" | "xl";
  /** Additional CSS classes for the container */
  className?: string;
  /** Whether to hide text on mobile */
  hideTextOnMobile?: boolean;
}

/**
 * Authoritative Brand Component for Ambi Tasker
 * 
 * Enforces the official brand identity: [ LOGO ] Ambi Tasker
 * - Strict naming: "Ambi Tasker"
 * - Consistent spacing: 8px-12px
 * - Vertical alignment: Centered
 */
export default function Brand({
  size = "md",
  className = "",
  hideTextOnMobile = false
}: BrandProps) {
  const { t } = useTranslation();
  
  // Font sizes corresponding to logo tiers (enlarged for better prominence)
  const fontSizes = {
    sm: "text-[18px] sm:text-[20px]",      // Enlarged from 16px to ~18px/20px
    md: "text-[22px] sm:text-[24px]",      // Enlarged from 20px to ~22px/24px
    lg: "text-[26px] sm:text-[28px]",      // Enlarged from 24px to ~26px/28px
    xl: "text-[36px] sm:text-[40px]"       // Enlarged from 32px to ~36px/40px
  };

  const fontSizeClass = fontSizes[size] || fontSizes.md;

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 transition-all ${className}`} style={{ flexDirection: 'row', direction: 'ltr' }}>
      <Logo 
        size={size} 
        className="shrink-0"
      />
      <span 
        dir="ltr"
        className={`
          ${unbounded.className}
          ${fontSizeClass} 
          font-black 
          tracking-[-0.02em] 
          text-current 
          dark:text-white 
          whitespace-nowrap 
          leading-none
          ${hideTextOnMobile ? 'hidden sm:inline-block' : 'inline-block'}
          brand-font
        `}
      >
        Ambi Tasker
      </span>
    </div>
  );
}
