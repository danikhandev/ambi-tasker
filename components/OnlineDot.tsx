"use client";

import React from "react";
import { motion } from "framer-motion";

interface OnlineDotProps {
  isOnline: boolean;
  size?: number;
  showPulse?: boolean;
}

/**
 * OnlineDot Component
 * A premium status indicator with subtle animations and pulse effects.
 */
export default function OnlineDot({ isOnline, size = 8, showPulse = true }: OnlineDotProps) {
  return (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div 
        className={`w-full h-full rounded-full transition-all duration-500 ${
          isOnline ? "bg-green-500" : "bg-gray-300"
        }`}
      />
      {isOnline && showPulse && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut"
          }}
          className="absolute inset-0 rounded-full bg-green-400 z-0"
        />
      )}
    </div>
  );
}
