"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle2, ChevronLeft,
    ShieldCheck, Shield, Loader2,
    Camera, User, AlertCircle,
    X, RefreshCw, Fingerprint
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useRouter } from "next/navigation";
import CameraCapture from "@/components/CameraCapture";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/contexts/UserContext";

// ─── TYPES ───────────────────────────────────────────────────────
type VerifyState = "intro" | "capturing" | "submitting" | "success" | "error";

// ─── PROGRESS DOTS ───────────────────────────────────────────────
function ProgressIndicator({ current, total }: { current: number; total: number }) {
    return (
        <div className="flex items-center gap-2 justify-center">
            {Array.from({ length: total }).map((_, i) => (
                <motion.div
                    key={i}
                    animate={{
                        width: i + 1 === current ? 28 : 8,
                        backgroundColor: i + 1 <= current ? "rgba(34,197,94,1)" : "rgba(255,255,255,0.1)"
                    }}
                    className="h-2 rounded-full transition-all"
                />
            ))}
        </div>
    );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────
export default function UserVerificationPage() {
    const { t, isRTL } = useTranslation();
    const router = useRouter();
    const { user, refetch } = useUser();

    const [state, setState] = useState<VerifyState>("intro");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.idVerificationStatus === "VERIFIED") {
            setState("success");
        }
    }, [user]);

    const handleCapture = useCallback((image: string) => {
        setCapturedImage(image);
    }, []);

    const handleSubmit = async () => {
        if (!capturedImage) return;

        setState("submitting");
        setSubmitError(null);

        try {
            const formData = new FormData();

            const response = await fetch(capturedImage);
            const blob = await response.blob();

            if (blob.size > 2 * 1024 * 1024) {
                throw new Error(t("verification.imageTooLarge") || "Image is too large. Please retake with better lighting.");
            }

            formData.append("selfie", new File([blob], "selfie-verification.jpg", { type: "image/jpeg" }));

            const res = await fetch("/api/provider/verify", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Verification failed");
            }

            await refetch();
            setState("success");
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "An error occurred.";
            console.error("Verification error:", error);
            setSubmitError(errorMessage);
            setState("error");
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setState("capturing");
    };

    const handleStartCamera = () => {
        setState("capturing");
    };

    return (
        <div className={`min-h-screen bg-gray-950 text-white flex flex-col relative overflow-hidden ${isRTL ? "rtl" : ""}`}>
            {/* Ambient background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/8 blur-[180px] rounded-full" />
                <div className="absolute bottom-[-5%] right-[-10%] w-[400px] h-[400px] bg-green-500/6 blur-[150px] rounded-full" />
                <div className="absolute top-1/2 left-[-10%] w-[300px] h-[300px] bg-accent/5 blur-[120px] rounded-full" />
            </div>

            {/* Header */}
            <header className="relative z-50 px-6 pt-6 pb-3 safe-area-top">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => {
                            if (state === "capturing" && !capturedImage) {
                                setState("intro");
                            } else {
                                router.back();
                            }
                        }}
                        className="w-12 h-12 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center text-white hover:bg-white/10 transition-all group border border-white/10"
                    >
                        <ChevronLeft className={`w-5 h-5 group-hover:-translate-x-0.5 transition-transform ${isRTL ? "rotate-180" : ""}`} />
                    </button>
                    <div className="text-center flex-1 px-4">
                        <h1 className={`${unbounded.className} text-base font-bold tracking-tight`}>
                            {t("verification.title") || "Identity Verification"}
                        </h1>
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.35em] mt-0.5">
                            {t("verification.subtitle") || "Secure Camera Verification"}
                        </p>
                    </div>
                    <div className="w-12" />
                </div>
            </header>

            {/* Main Content */}
            <div className="relative z-10 flex-1 flex flex-col">
                <AnimatePresence mode="wait">

                    {/* INTRO */}
                    {state === "intro" && (
                        <motion.div
                            key="intro"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center"
                        >
                            <div className="mb-10">
                                <ProgressIndicator current={1} total={3} />
                            </div>

                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.15 }}
                                className="relative w-28 h-28 mb-8"
                            >
                                <div className="absolute inset-0 bg-primary/20 rounded-[36px] blur-xl animate-pulse" />
                                <div className="relative w-full h-full bg-gradient-to-br from-primary to-primary/80 rounded-[36px] flex items-center justify-center shadow-2xl shadow-primary/30 border border-white/10">
                                    <Fingerprint className="w-14 h-14 text-white" />
                                </div>
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/40">
                                    <Shield className="w-4 h-4 text-white" />
                                </div>
                            </motion.div>

                            <h2 className={`${unbounded.className} text-2xl font-black tracking-tight mb-3`}>
                                {t("verification.cameraVerifyTitle") || "Camera Verification"}
                            </h2>
                            <p className="text-white/50 text-sm font-medium leading-relaxed max-w-xs mb-10">
                                {t("verification.cameraVerifyDesc") || "Please take a clear selfie for identity verification. This helps us ensure the safety of our community."}
                            </p>

                            <div className="w-full max-w-sm space-y-3 mb-10">
                                {[
                                    { icon: Camera, text: t("verification.instruction1") || "Use a well-lit environment" },
                                    { icon: User, text: t("verification.instruction2") || "Face the camera directly" },
                                    { icon: ShieldCheck, text: t("verification.instruction3") || "Remove glasses or face coverings" }
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.1 }}
                                        className="flex items-center gap-4 bg-white/[0.03] rounded-2xl px-5 py-4 border border-white/5"
                                    >
                                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                            <item.icon className="w-5 h-5 text-primary" />
                                        </div>
                                        <p className="text-white/70 text-xs font-semibold text-left">{item.text}</p>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="w-full max-w-sm bg-green-500/5 rounded-2xl px-5 py-4 border border-green-500/10 mb-8">
                                <div className="flex items-center gap-3">
                                    <ShieldCheck className="w-5 h-5 text-green-400 shrink-0" />
                                    <div className="text-left">
                                        <p className="text-green-300 text-[11px] font-bold">
                                            {t("verification.secureCapture") || "Secure Live Capture"}
                                        </p>
                                        <p className="text-green-400/40 text-[10px] font-medium">
                                            {t("verification.secureCaptureDesc") || "Only live camera capture is allowed. Gallery uploads are disabled for security."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleStartCamera}
                                className="w-full max-w-sm h-16 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]" />
                                <Camera className="w-5 h-5 relative z-10" />
                                <span className="relative z-10">{t("verification.openCamera") || "Open Camera"}</span>
                            </button>

                            {user?.idVerificationStatus === "PENDING" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full max-w-sm mt-6 bg-yellow-500/10 rounded-2xl px-5 py-4 border border-yellow-500/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                                        <p className="text-yellow-400 text-xs font-bold">
                                            {t("verification.verificationPending") || "Your previous verification is pending review."}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {user?.idVerificationStatus === "REJECTED" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="w-full max-w-sm mt-6 bg-red-500/10 rounded-2xl px-5 py-4 border border-red-500/20"
                                >
                                    <div className="flex items-center gap-3">
                                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                        <p className="text-red-400 text-xs font-bold">
                                            {t("verification.verificationRejected") || "Your verification was rejected. Please resubmit with a clearer photo."}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* CAPTURING */}
                    {state === "capturing" && (
                        <motion.div
                            key="capturing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col px-4 pb-6"
                        >
                            <div className="mb-4 px-2">
                                <ProgressIndicator current={capturedImage ? 3 : 2} total={3} />
                            </div>

                            {!capturedImage ? (
                                <>
                                    <div className="text-center mb-4">
                                        <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                                            {t("verification.cameraCaptureInstruction") || "Please take a clear selfie for identity verification"}
                                        </p>
                                    </div>

                                    <div className="flex-1 flex items-center justify-center">
                                        <CameraCapture
                                            type="selfie"
                                            onCapture={handleCapture}
                                            onClose={() => setState("intro")}
                                            allowUpload={false}
                                            liveOnly={true}
                                            compressionQuality={0.7}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
                                    <div className="text-center mb-6">
                                        <h3 className={`${unbounded.className} text-xl font-black tracking-tight mb-1`}>
                                            {t("verification.reviewPhoto") || "Review Your Photo"}
                                        </h3>
                                        <p className="text-white/40 text-xs font-medium">
                                            {t("verification.reviewPhotoDesc") || "Make sure your face is clearly visible"}
                                        </p>
                                    </div>

                                    <div className="relative w-full max-w-xs aspect-[3/4] rounded-[32px] overflow-hidden bg-gray-900 border-2 border-green-500/30 shadow-2xl shadow-green-500/10 mb-8">
                                        <img
                                            src={capturedImage}
                                            alt="Verification selfie"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-green-500/90 backdrop-blur-xl px-5 py-2.5 rounded-full flex items-center gap-2 border border-white/20 shadow-xl">
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">
                                                {t("verification.photoCaptured") || "Photo Captured"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full space-y-3">
                                        <button
                                            onClick={handleSubmit}
                                            className="w-full h-16 bg-green-500 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-2xl shadow-green-500/30 hover:bg-green-600 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3"
                                        >
                                            <ShieldCheck className="w-5 h-5" />
                                            {t("verification.submitVerification") || "Submit Verification"}
                                        </button>

                                        <button
                                            onClick={handleRetake}
                                            className="w-full h-14 bg-white/5 text-white/60 font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 border border-white/5"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            {t("verification.retake") || "Retake Photo"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* SUBMITTING */}
                    {state === "submitting" && (
                        <motion.div
                            key="submitting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center text-center px-6"
                        >
                            <div className="relative w-36 h-36 mb-12 mx-auto">
                                <div className="absolute inset-0 rounded-full border-[3px] border-white/5" />
                                <div className="absolute inset-0 rounded-full border-[3px] border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                                <div className="absolute inset-3 rounded-full border-[2px] border-b-green-500 border-r-transparent border-t-transparent border-l-transparent animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative">
                                        <Loader2 className="w-12 h-12 text-primary animate-pulse" />
                                        <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
                                    </div>
                                </div>
                            </div>

                            <h3 className={`${unbounded.className} text-xl font-black mb-3 tracking-tight`}>
                                {t("verification.submitting") || "Submitting Verification"}
                            </h3>
                            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">
                                {t("verification.encryptingData") || "Encrypting & Uploading Securely"}
                            </p>
                        </motion.div>
                    )}

                    {/* SUCCESS */}
                    {state === "success" && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-md mx-auto"
                        >
                            <motion.div
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                className="relative w-28 h-28 mb-10"
                            >
                                <div className="absolute inset-0 bg-green-500/30 rounded-[32px] blur-2xl animate-pulse" />
                                <div className="relative w-full h-full bg-green-500 rounded-[32px] flex items-center justify-center shadow-2xl shadow-green-500/40">
                                    <CheckCircle2 className="w-14 h-14 text-white" />
                                </div>
                            </motion.div>

                            <h2 className={`${unbounded.className} text-3xl font-black mb-4 tracking-tight`}>
                                {t("verification.submitted") || "Verification Submitted!"}
                            </h2>
                            <p className="text-white/50 text-sm font-medium mb-8 leading-relaxed max-w-xs">
                                {t("verification.submittedDesc") || "Your identity verification has been submitted successfully. Our team will review your photo within 24-48 hours."}
                            </p>

                            <div className="w-full max-w-sm bg-white/[0.03] backdrop-blur-sm rounded-2xl p-5 border border-white/5 mb-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-400/80">
                                            {t("verification.statusPending") || "Status: Pending Review"}
                                        </span>
                                    </div>
                                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-wider">24-48h</span>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push("/dashboard")}
                                className="w-full max-w-sm h-16 bg-white text-gray-900 font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-gray-100 active:scale-95 transition-all"
                            >
                                {t("providerOnboarding.dashboard") || "Go to Dashboard"}
                            </button>
                        </motion.div>
                    )}

                    {/* ERROR */}
                    {state === "error" && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-md mx-auto"
                        >
                            <div className="w-24 h-24 bg-red-500 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-red-500/40">
                                <X className="w-12 h-12 text-white" />
                            </div>

                            <h2 className={`${unbounded.className} text-2xl font-black mb-4 tracking-tight`}>
                                {t("verification.errorTitle") || "Submission Failed"}
                            </h2>

                            {submitError && (
                                <div className="w-full max-w-sm bg-red-500/10 rounded-2xl px-5 py-4 border border-red-500/20 mb-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                        <p className="text-red-300 text-xs font-medium text-left">{submitError}</p>
                                    </div>
                                </div>
                            )}

                            <p className="text-white/50 text-sm font-medium mb-10 leading-relaxed max-w-xs">
                                {t("verification.errorDesc") || "Something went wrong. Please try again."}
                            </p>

                            <div className="w-full max-w-sm space-y-3">
                                <button
                                    onClick={handleRetake}
                                    className="w-full h-16 bg-primary text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    {t("verification.tryAgain") || "Try Again"}
                                </button>

                                <button
                                    onClick={() => router.back()}
                                    className="w-full h-14 bg-white/5 text-white/50 font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                                >
                                    {t("common.back") || "Go Back"}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
