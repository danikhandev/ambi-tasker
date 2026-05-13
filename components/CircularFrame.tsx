"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface CircularFrameProps {
    src: string;
    alt: string;
    size?: number;
    className?: string;
    priority?: boolean;
    objectFit?: "contain" | "cover";
    border?: boolean;
}

/**
 * Professional Circular Frame for Logos and Avatars.
 * Ensures images are perfectly centered and contained within a circular boundary.
 */
const CircularFrame = React.memo(({
    src,
    alt,
    size = 64,
    className = "",
    priority = false,
    objectFit = "cover",
    border = true
}: CircularFrameProps) => {
    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
            className={`
                relative shrink-0 rounded-full bg-white select-none
                ${border ? "ring-2 ring-primary/10 border-4 border-card shadow-2xl" : ""}
                transition-all duration-500 ease-out
                ${className}
            `}
            style={{ width: size, height: size }}
        >
            <div className={`relative w-full h-full rounded-full overflow-hidden flex items-center justify-center ${objectFit === "contain" ? "p-[12%]" : ""}`}>
                {src ? (
                    <Image
                        src={src}
                        alt={alt}
                        fill
                        className={`transition-transform duration-1000 ease-in-out group-hover:scale-110 ${objectFit === "contain" ? "object-contain" : "object-cover"}`}
                        priority={priority}
                        sizes={`${size}px`}
                        quality={90}
                    />
                ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-[10px] font-black text-text-hint uppercase">{alt?.[0] || "?"}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
});

CircularFrame.displayName = "CircularFrame";

export default CircularFrame;
