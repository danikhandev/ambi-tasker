"use client";

import React from "react";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";

interface LogoProps {
  /** Predefined size variants: sm (32px), md (48px), lg (80px), xl (120px) */
  size?: "sm" | "md" | "lg" | "xl";
  /** Additional CSS classes for placement only (margin/etc) */
  className?: string;
  /** Whether to prioritize loading */
  priority?: boolean;
}

export default function Logo({
  size = "md",
  className = "",
  priority = true
}: LogoProps) {
  const { t } = useTranslation();
  
  // Standard Size Scales
  const sizes = {
    sm: 32,
    md: 48,
    lg: 80,
    xl: 120
  };

  const dimension = sizes[size] || sizes.md;

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden bg-white shadow-sm ring-1 ring-black/5 ${className}`}
      style={{ 
        width: `${dimension}px`, 
        height: `${dimension}px`,
      }}
    >
      <Image
        src="/logo.png"
        alt={t("header.brandName")}
        width={dimension}
        height={dimension}
        className="object-cover scale-[1.1]" // Subtle scale to fill the perfect circle
        priority={priority}
      />
    </div>
  );
}
