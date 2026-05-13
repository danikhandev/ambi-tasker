"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { unbounded } from "@/app/fonts";

interface BackButtonProps {
    label?: string;
    className?: string;
    fallbackUrl?: string;
}

/**
 * BackButton - A smart navigation component for dashboard sub-pages.
 * Returns to the previous browser history state or a fallback dashboard URL.
 */
export default function BackButton({ 
    label = "Back", 
    className = "", 
    fallbackUrl = "/admin/dashboard" 
}: BackButtonProps) {
    const router = useRouter();

    const handleBack = () => {
        // In some browsers, history.length starts at 1 or 2
        // If we have history, we go back. Otherwise we go to fallback.
        if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
        } else {
            router.push(fallbackUrl);
        }
    };

    return (
        <button
            onClick={handleBack}
            className={`flex items-center gap-2.5 px-3 py-2 text-text-secondary hover:text-primary transition-all duration-300 group active:scale-95 ${className}`}
            title="Go back"
        >
            <div className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span className={`${unbounded.className} text-[12px] font-bold tracking-tight`}>
                {label}
            </span>
        </button>
    );
}

