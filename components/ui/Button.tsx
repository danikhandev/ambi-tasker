"use client";

import React from "react";
import classNames from "classnames";
import design from "@/styles/designSystem";

import { useSound } from "@/contexts/SoundContext";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export default function Button({ variant = "primary", size = "md", loading = false, className, children, onClick, ...rest }: ButtonProps) {
  const sound = useSound();
  const playClickSound = sound.playClickSound;

  const handleOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      playClickSound();
    } catch (err) {
      // Ignored
    }
    if (onClick) onClick(e);
  };

  const base = `inline-flex items-center justify-center font-semibold rounded-[12px] shadow-sm transition-all focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed`;
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-[12px]',
    md: 'px-4 py-2 text-[14px]',
    lg: 'px-6 py-3 text-[16px]'
  };

  const variants: Record<string, string> = {
    primary: `bg-[${design.COLORS.PRIMARY}] text-white hover:brightness-95`,
    secondary: `bg-[${design.COLORS.SECONDARY}] text-white hover:brightness-95`,
    ghost: `bg-transparent text-[${design.COLORS.TEXT}]`
  };

  return (
    <button 
      className={classNames(base, sizes[size], variants[variant], className)} 
      onClick={handleOnClick}
      {...rest}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
