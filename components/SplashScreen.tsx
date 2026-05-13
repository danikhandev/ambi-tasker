"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Brand from "./ui/Brand";
import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";

/**
 * High-performance Professional Splash screen for initial app load.
 * Displays the Ambi Tasker brand with professional synchronization message.
 */
export default function SplashScreen({
    children,
}: {
    children: React.ReactNode;
}) {
    const { loading: userLoading } = useUser();
    const { loading: adminLoading } = useAdmin();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userLoading && !adminLoading) {
            const timer = setTimeout(() => {
                setIsLoading(false);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [userLoading, adminLoading]);

    return (
        <>
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        key="splash"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-md flex flex-col items-center justify-center gap-6"
                    >
                        <Brand size="xl" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary animate-pulse ml-1">
                            Syncing Ambi Tasker
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className={isLoading ? "hidden" : "contents"}>
                {children}
            </div>
        </>
    );
}
