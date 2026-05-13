"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useUI } from "@/contexts/UIContext";
import { Power, Loader2 } from "lucide-react";

export default function ProviderStatusToggle() {
    const { user, activePerspective } = useUser();
    const { showToast } = useUI();
    const [isOnline, setIsOnline] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || activePerspective !== 'provider') return;
        
        const fetchStatus = async () => {
            try {
                const res = await fetch("/api/provider/profile");
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && json.data) {
                        setIsOnline(json.data.isAvailable ?? false);
                        
                        // Force offline if not verified
                        if (json.data.verificationStatus !== 'VERIFIED' && json.data.isAvailable) {
                            toggleStatus(false);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch provider status:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, activePerspective]);

    if (activePerspective !== 'provider' || !user) return null;

    const toggleStatus = async (forceVal?: boolean) => {
        setLoading(true);
        try {
            // First verify approval status
            const statusRes = await fetch("/api/provider/verify");
            const statusJson = await statusRes.json();
            if (!statusJson.success || statusJson.data?.status !== 'VERIFIED') {
                showToast("You must be fully verified to go online.", "error");
                setLoading(false);
                return;
            }

            const newVal = forceVal !== undefined ? forceVal : !isOnline;
            
            const res = await fetch("/api/provider/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isAvailable: newVal })
            });

            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error || "Failed to update status");
            
            setIsOnline(newVal);
            showToast(newVal ? "You are now ONLINE. Waiting for requests." : "You are now OFFLINE.", newVal ? "success" : "info");
        } catch (e) {
            showToast("Failed to update status", "error");
        } finally {
            setLoading(false);
        }
    };

    const isVerified = user?.idVerificationStatus === "VERIFIED";

    return (
        <button
            onClick={() => toggleStatus()}
            disabled={loading || !isVerified}
            className={`flex items-center gap-2.5 px-3 sm:px-4 py-2 rounded-2xl transition-all duration-400 border shadow-sm relative ${
                isOnline 
                ? "bg-green-50 hover:bg-green-100 border-green-200" 
                : "bg-card hover:bg-muted border-border"
            } ${!isVerified ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
            ) : (
                <div className="relative">
                    <Power className={`w-4 h-4 ${isOnline ? "text-green-600" : "text-text-hint"}`} />
                    {isOnline && <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>}
                </div>
            )}
            <span className={`text-[10px] font-bold hidden sm:inline-block ${isOnline ? "text-green-700" : "text-text-secondary"}`}>
                {isOnline ? "Online" : "Offline"}
            </span>
        </button>
    );
}
