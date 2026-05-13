"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { unbounded } from '@/app/fonts';
import { useTranslation } from '@/hooks/useTranslation';
import { useUI } from '@/contexts/UIContext';

interface PageHeaderProps {
  title: string;
  highlightedText?: string;
  subtitle?: string | React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  dir?: 'ltr' | 'rtl';
}

/**
 * Refactored PageHeader - Now acts as a bridge to the Layout Header.
 * Sets the global page title and renders ONLY the action buttons locally.
 */
export default function PageHeader({
  title,
  highlightedText,
  subtitle,
  actions,
  icon,
  className = "",
  dir
}: PageHeaderProps) {
  const { setPageTitle } = useUI();
  const { isRTL } = useTranslation();
  const direction = dir || (isRTL ? 'rtl' : 'ltr');

  useEffect(() => {
    // Synchronize title with the SharedShell/DashboardHeader
    setPageTitle(title, typeof subtitle === 'string' ? subtitle : "", highlightedText || "");
    
    // Cleanup title on unmount
    return () => setPageTitle("", "", "");
  }, [title, highlightedText, subtitle, setPageTitle]);

  if (!actions) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center justify-end mb-8 ${className}`}
      dir={direction}
    >
      <div className="flex flex-wrap items-center gap-3 md:gap-4 shrink-0">
        {actions}
      </div>
    </motion.div>
  );
}
