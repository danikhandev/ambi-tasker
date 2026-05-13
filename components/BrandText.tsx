"use client";

import { unbounded } from "@/app/fonts";

interface BrandTextProps {
  text: string;
  className?: string; // Additional classes for the wrapper span
}

/**
 * Automatically detects the AmbiTasker brand name inside localized strings
 * and applies the correct English Unbounded font to it, keeping the rest of the string normal.
 */
export default function BrandText({ text, className = "" }: BrandTextProps) {
  if (!text) return null;

  // Replace "AmbiTasker Pro" and "AmbiTasker" with styled spans
  // This ensures the brand identity is preserved across all languages
  const replaced = text
    .replace(
      /Ambi Tasker Pro/g,
      `<span class="${unbounded.className} brand-font mx-1" dir="ltr">Ambi Tasker Pro</span>`
    )
    .replace(
      /Ambi Tasker(?!\sPro)/g,
      `<span class="${unbounded.className} brand-font mx-1" dir="ltr">Ambi Tasker</span>`
    );

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: replaced }}
    />
  );
}
