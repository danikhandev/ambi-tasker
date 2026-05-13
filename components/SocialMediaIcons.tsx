"use client";

import { motion } from "framer-motion";
import { Facebook, Instagram, Twitter, Linkedin, Youtube, Globe, Music2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSettings } from "@/contexts/SettingsContext";

type SocialLink = {
    name: string;
    icon: React.ElementType;
    url: string;
    color: string;
    bgHover: string;
};

export default function SocialMediaIcons({ className = "" }: { className?: string }) {
    const { isRTL } = useTranslation();
    const { socialLinks } = useSettings();

    const allLinks: SocialLink[] = [
        {
            name: "Facebook",
            icon: Facebook,
            url: socialLinks.facebook,
            color: "text-[#1877F2]",
            bgHover: "hover:bg-[#1877F2]/10 dark:hover:bg-[#1877F2]/20"
        },
        {
            name: "Instagram",
            icon: Instagram,
            url: socialLinks.instagram,
            color: "text-[#E4405F]",
            bgHover: "hover:bg-[#E4405F]/10 dark:hover:bg-[#E4405F]/20"
        },
        {
            name: "Twitter",
            icon: Twitter,
            url: socialLinks.twitter,
            color: "text-foreground dark:text-white",
            bgHover: "hover:bg-black/5 dark:hover:bg-white/10"
        },
        {
            name: "LinkedIn",
            icon: Linkedin,
            url: socialLinks.linkedin,
            color: "text-[#0A66C2]",
            bgHover: "hover:bg-[#0A66C2]/10 dark:hover:bg-[#0A66C2]/20"
        },
        {
            name: "YouTube",
            icon: Youtube,
            url: socialLinks.youtube,
            color: "text-[#FF0000]",
            bgHover: "hover:bg-[#FF0000]/10 dark:hover:bg-[#FF0000]/20"
        },
        {
            name: "TikTok",
            icon: Music2,
            url: socialLinks.tiktok,
            color: "text-foreground dark:text-white",
            bgHover: "hover:bg-black/5 dark:hover:bg-white/10"
        },
        {
            name: "Website",
            icon: Globe,
            url: socialLinks.website,
            color: "text-primary",
            bgHover: "hover:bg-primary/10"
        }
    ];

    // Filter out empty links
    const socialLinksToDisplay = allLinks.filter(link => link.url && link.url.trim() !== "");

    // Reorder for RTL if needed, though social icons generally stay LTR
    const displayLinks = isRTL ? [...socialLinksToDisplay].reverse() : socialLinksToDisplay;

    if (displayLinks.length === 0) return null;

    return (
        <div className={`flex flex-wrap items-center justify-center gap-4 ${className}`}>
            {displayLinks.map((social) => {
                const Icon = social.icon;
                return (
                    <motion.a
                        key={social.name}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={social.name}
                        className={`
              relative flex items-center justify-center
              w-12 h-12 rounded-2xl min-w-[44px] min-h-[44px]
              bg-card dark:bg-gray-900 
              border border-border dark:border-gray-800
              shadow-sm hover:shadow-md
              transition-all duration-300
              ${social.bgHover}
            `}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Icon className={`w-6 h-6 sm:w-[28px] sm:h-[28px] transition-colors ${social.color}`} />
                    </motion.a>
                );
            })}
        </div>
    );
}

