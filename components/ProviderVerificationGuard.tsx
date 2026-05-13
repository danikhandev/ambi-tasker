"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/contexts/UserContext";
import { ShieldAlert, ChevronRight, Loader2, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ProviderVerificationGuard({ children }: { children: React.ReactNode }) {
    const { user, loading: userLoading } = useUser();
    const pathname = usePathname();
    const [status, setStatus] = useState<string>("loading");
    const [pollCount, setPollCount] = useState(0);

    const checkStatus = useCallback(async () => {
        if (!user) return;

        try {
            const res = await fetch("/api/provider/verify", {
                method: "GET",
                credentials: "include",
            });

            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    setStatus(json.data.status || "PENDING_REVIEW");
                } else {
                    setStatus("PENDING_REVIEW");
                }
            } else if (res.status === 404) {
                // No provider profile → not started
                setStatus("NOT_STARTED");
            } else {
                setStatus("PENDING_REVIEW");
            }
        } catch (err) {
            console.error("Verification guard: status check failed", err);
            setStatus("PENDING_REVIEW");
        }
    }, [user]);

    useEffect(() => {
        if (userLoading) return;
        if (!user) {
            setStatus("NOT_STARTED");
            return;
        }

        checkStatus();
    }, [user, userLoading, checkStatus]);

    // Poll every 30 seconds for status updates (replaces Supabase real-time)
    useEffect(() => {
        if (status !== "PENDING_REVIEW" || !user) return;

        const interval = setInterval(() => {
            checkStatus();
            setPollCount(prev => prev + 1);
        }, 30000);

        return () => clearInterval(interval);
    }, [status, user, checkStatus]);

    const isVerificationPage = pathname === "/provider/verify";
    // Comprehensive check for Admin role
    const userRole = user?.role?.toString().toUpperCase();
    const isAdmin = userRole === "ADMIN" || userRole === "MANAGEMENT";
    const isApproved = status === "VERIFIED" || isAdmin;

    // Direct console log for your browser tools (F12)
    console.log("🛡️ VERIFICATION GUARD DEBUG:", { 
        status, 
        rawRole: user?.role,
        normalizedRole: userRole, 
        isAdmin, 
        isApproved,
        pathname 
    });

    if (status === "loading" || userLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    <p className="text-xs font-bold text-text-hint uppercase tracking-widest">Checking verification status...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col w-full">
            {/* Verification Banner — shown on all pages except the verify page itself */}
            {!isApproved && !isVerificationPage && (
                <div className={`px-6 py-3 flex items-center justify-between shadow-md z-40 shrink-0 ${
                    status === "REJECTED" 
                        ? "bg-red-500 text-white" 
                        : status === "PENDING_REVIEW" 
                            ? "bg-amber-500 text-white" 
                            : "bg-blue-500 text-white"
                }`}>
                    <div className="flex items-center gap-3">
                        {status === "PENDING_REVIEW" ? (
                            <Clock className="w-5 h-5 flex-shrink-0" />
                        ) : (
                            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                        )}
                        <span className="font-bold text-sm">
                            {status === "REJECTED" 
                                ? "Verification Rejected: Please re-submit your documents."
                                : status === "PENDING_REVIEW"
                                    ? "Your account verification is under review."
                                    : "Action Required: Complete your identity verification."
                            }
                        </span>
                    </div>
                    {status !== "PENDING_REVIEW" && (
                        <Link 
                            href="/provider/verify" 
                            className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                        >
                            {status === "REJECTED" ? "Re-submit" : "Verify Now"} <ChevronRight className="w-3 h-3" />
                        </Link>
                    )}
                    {status === "PENDING_REVIEW" && (
                        <button 
                            onClick={checkStatus}
                            className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                        >
                            <RefreshCw className="w-3 h-3" /> Refresh
                        </button>
                    )}
                </div>
            )}

            {/* Block access to earning-sensitive routes for unverified providers */}
            {!isApproved && !isVerificationPage && (pathname.includes('/dashboard') || pathname.includes('/jobs') || pathname.includes('/earnings')) ? (
                <div className="flex-1 p-8 flex items-center justify-center">
                    <div className="max-w-md text-center bg-card p-8 border border-border rounded-3xl shadow-sm">
                        <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                        <h2 className="text-xl font-black text-foreground mb-2">Access Restricted</h2>
                        <p className="text-text-secondary text-sm mb-6">
                            {status === "PENDING_REVIEW"
                                ? "Awaiting Admin Verification. Your identity verification is being reviewed. You'll be notified once approved."
                                : "Complete KYC to activate account. Identity verification is required to start receiving booking requests and viewing earnings."
                            }
                        </p>
                        {status === "PENDING_REVIEW" ? (
                            <button 
                                onClick={checkStatus}
                                className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors inline-flex items-center gap-2 w-full justify-center"
                            >
                                <RefreshCw className="w-4 h-4" /> Check Status
                            </button>
                        ) : (
                            <Link 
                                href="/provider/verify" 
                                className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors inline-block w-full"
                            >
                                Complete Verification
                            </Link>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col">
                    {children}
                </div>
            )}
        </div>
    );
}
