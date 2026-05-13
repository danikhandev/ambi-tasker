"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, ShieldCheck, RefreshCw, ArrowLeft, Loader2 } from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import Logo from "@/components/ui/Logo";

export default function VerificationPendingPage() {
    const router = useRouter();
    const { user, refetch, loading: userLoading } = useUser();
    const [checking, setChecking] = useState(false);
    const [status, setStatus] = useState<string>("PENDING");

    const checkStatus = useCallback(async () => {
        setChecking(true);
        try {
            await refetch();

            const res = await fetch("/api/provider/verify", {
                credentials: "include",
            });
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data) {
                    setStatus(json.data.status);
                    if (json.data.status === "VERIFIED") {
                        router.replace("/provider/dashboard");
                    } else if (json.data.status === "REJECTED") {
                        router.replace("/provider/verify");
                    }
                }
            }
        } catch (err) {
            console.error("Status check failed:", err);
        } finally {
            setChecking(false);
        }
    }, [refetch, router]);

    // Auto-poll every 30 seconds
    useEffect(() => {
        if (status !== "PENDING") return;
        const interval = setInterval(checkStatus, 30000);
        return () => clearInterval(interval);
    }, [status, checkStatus]);

    // Redirect if already verified on mount
    useEffect(() => {
        if (!userLoading && user) {
            if (user.idVerificationStatus === "VERIFIED") {
                router.replace("/provider/dashboard");
            } else if (user.idVerificationStatus === "REJECTED") {
                router.replace("/provider/verify");
            }
        }
    }, [user, userLoading, router]);

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-lg w-full text-center space-y-10">
                {/* Logo */}
                <div className="flex justify-center mb-4">
                    <Logo size="md" />
                </div>

                {/* Status Icon */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="relative mx-auto"
                >
                    <div className="w-28 h-28 bg-amber-500/10 rounded-[36px] flex items-center justify-center mx-auto border-2 border-amber-500/20 shadow-2xl shadow-amber-500/10 relative overflow-hidden">
                        <Clock className="w-14 h-14 text-amber-500 relative z-10" />
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-tr from-amber-400/10 to-transparent"
                        />
                    </div>
                    <motion.div
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-amber-400 rounded-full border-4 border-background shadow-lg"
                    />
                </motion.div>

                {/* Title */}
                <div className="space-y-4">
                    <h1 className={`${unbounded.className} text-3xl font-black text-foreground tracking-tighter`}>
                        Verification <span className="text-amber-500 italic">In Progress</span>
                    </h1>
                    <p className="text-text-secondary text-sm font-medium leading-relaxed max-w-md mx-auto">
                        Your identity documents have been successfully submitted and are currently under review by our verification team. This process typically takes <strong className="text-foreground">24–48 hours</strong>.
                    </p>
                </div>

                {/* Status Steps */}
                <div className="bg-card rounded-[32px] border border-border p-8 space-y-6 shadow-sm text-left">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] text-center mb-2">Verification Timeline</p>
                    
                    {[
                        { label: "Documents Submitted", done: true, icon: CheckCircle2, color: "text-green-500" },
                        { label: "Identity Review", done: false, icon: ShieldCheck, color: "text-amber-500" },
                        { label: "Account Activation", done: false, icon: CheckCircle2, color: "text-text-hint" },
                    ].map((step, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                                step.done ? "bg-green-50" : i === 1 ? "bg-amber-50" : "bg-muted/50"
                            }`}>
                                {i === 1 && !step.done ? (
                                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                                ) : (
                                    <step.icon className={`w-5 h-5 ${step.color}`} />
                                )}
                            </div>
                            <div className="flex-1">
                                <p className={`text-sm font-bold ${step.done ? "text-foreground" : "text-text-secondary"}`}>{step.label}</p>
                                <p className="text-[10px] font-bold text-text-hint uppercase tracking-tight">
                                    {step.done ? "Completed" : i === 1 ? "In Progress..." : "Waiting"}
                                </p>
                            </div>
                            {step.done && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="space-y-4">
                    <button
                        onClick={checkStatus}
                        disabled={checking}
                        className="w-full h-16 bg-foreground text-background rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] shadow-xl hover:bg-primary hover:text-white active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {checking ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <RefreshCw className="w-5 h-5" />
                        )}
                        {checking ? "Checking Status..." : "Check Verification Status"}
                    </button>
                    
                    <button
                        onClick={() => router.push("/provider/dashboard")}
                        className="w-full h-14 bg-card border border-border text-text-secondary rounded-2xl font-bold text-xs hover:bg-muted transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
                    </button>
                </div>

                {/* Footer Note */}
                <p className="text-[10px] font-bold text-text-hint uppercase tracking-widest opacity-60">
                    You will receive a notification once verification is complete.
                </p>
            </div>
        </div>
    );
}
