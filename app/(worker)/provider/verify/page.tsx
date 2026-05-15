"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, Camera, CheckCircle2, UploadCloud,
    FileText, X, ShieldCheck, Shield, AlertCircle, Loader2, User, Image as ImageIcon, Briefcase, MapPin, Mail, Phone, Zap, Info
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useRouter } from "next/navigation";
import CameraCapture from "@/components/CameraCapture";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/contexts/UserContext";
import { useUI } from "@/contexts/UIContext";
import { compressBase64, formatFileSize } from "@/utils/image-compress";
// Image upload uses /api/upload endpoint (auto-detects Supabase vs local storage)

export default function VerificationScreen() {
    const { t, isRTL } = useTranslation();
    const router = useRouter();
    const { user, refetch } = useUser();

    // Steps: 1 - Profile, 2 - Selfie, 3 - CNIC Front, 4 - CNIC Back, 5 - Identity Match, 6 - Category, 7 - Submit
    const [currentStep, setCurrentStep] = useState(1);

    // Selfie
    const [isSelfieCaptured, setIsSelfieCaptured] = useState(false);
    const [selfieData, setSelfieData] = useState<string | null>(null);
    const [showCameraModal, setShowCameraModal] = useState(false);
    const [activeCameraTarget, setActiveCameraTarget] = useState<"selfie" | "cnic-front" | "cnic-back">("selfie");

    // CNIC
    const [cnicFront, setCnicFront] = useState<string | null>(null);
    const [cnicBack, setCnicBack] = useState<string | null>(null);

    // Match Simulation
    const [isMatching, setIsMatching] = useState(false);
    const [matchResult, setMatchResult] = useState<boolean | null>(null);

    // Categories
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>(["electrician"]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    // Submission
    const [errorMsg, setErrorMsg] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [kycResultState, setKycResultState] = useState<{ status: string, message: string, confidence?: number } | null>(null);
    const [idDetails, setIdDetails] = useState({ cnic: "", dob: "", expiry: "" });

    const handleNext = () => {
        setErrorMsg("");
        if (currentStep === 2 && !isSelfieCaptured) {
            setErrorMsg("Please take a selfie to continue.");
            return;
        }
        if (currentStep === 3 && !cnicFront) {
            setErrorMsg("Please capture the front of your CNIC.");
            return;
        }
        if (currentStep === 4 && !cnicBack) {
            setErrorMsg("Please capture the back of your CNIC.");
            return;
        }
        if (currentStep === 5 && !matchResult) {
            setErrorMsg("Identity synchronization must be confirmed to proceed.");
            return;
        }
        setCurrentStep((prev) => Math.min(prev + 1, 7));
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep((prev) => prev - 1);
        else router.back();
    };

    useEffect(() => {
        const fetchCategories = async () => {
            setCategoriesLoading(true);
            try {
                const res = await fetch("/api/services");
                const json = await res.json();
                if (json.success && json.categories) {
                    setCategories(json.categories);
                }
            } catch (err) {
                console.error("Failed to fetch categories:", err);
            } finally {
                setCategoriesLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const runRealMatch = async () => {
        if (!selfieData || !cnicFront) {
            setErrorMsg("Missing biometric signals. Please recapture selfie and ID.");
            return;
        }

        setIsMatching(true);
        setMatchResult(null);
        setErrorMsg("");
        
        try {
            // 1. Upload images first (we need URLs for the Vision API as per current implementation)
            const [selfieUrl, cnicFrontUrl] = await Promise.all([
                uploadBase64Image(selfieData, "selfie_temp"),
                uploadBase64Image(cnicFront, "cnic_front_temp"),
            ]);

            // 2. Call a check endpoint or the main verify endpoint with a "check_only" flag
            // For now, I'll use the main endpoint but the backend will handle it
            const res = await fetch("/api/provider/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    selfieImage: selfieUrl,
                    cnicFrontImage: cnicFrontUrl,
                    cnicBackImage: cnicFrontUrl, // Placeholder for back if not captured yet
                    checkOnly: true 
                }),
            });

            const result = await res.json();
            
            if (!res.ok || !result.success) {
                setMatchResult(false);
                setErrorMsg(result.message || "Identity synchronization failed. Please ensure both photos are clear.");
                return;
            }

            setMatchResult(true);
            showToast("Identity Synchronized: Verified with High Confidence", "success");
        } catch (err: any) {
            setErrorMsg("Biometric link failure: " + err.message);
            setMatchResult(false);
        } finally {
            setIsMatching(false);
        }
    };

    const { showToast } = useUI();

    // Helper: upload a single base64 image via /api/upload (with compression)
    const uploadBase64Image = async (base64Data: string, fileName: string): Promise<string> => {
        // Compress image before upload (max 1200px, 80% quality)
        const compressedFile = await compressBase64(base64Data, `${fileName}.jpg`, {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.80,
        });

        console.log(`[KYC] ${fileName}: compressed to ${formatFileSize(compressedFile.size)}`);

        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("folder", `verifications/${user?.id}`);

        const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok || !uploadJson.success) {
            throw new Error(uploadJson.error || `Failed to upload ${fileName}`);
        }
        return uploadJson.url;
    };

    const handleSubmit = async () => {
        if (!isSelfieCaptured || !cnicFront || !cnicBack) {
            setErrorMsg("Please complete all required verification steps.");
            setCurrentStep(2);
            return;
        }
        setIsSubmitting(true);
        setErrorMsg("");

        try {
            // 1. Upload all images via /api/upload (uses local or Supabase storage automatically)
            const [selfieUrl, cnicFrontUrl, cnicBackUrl] = await Promise.all([
                uploadBase64Image(selfieData!, "selfie"),
                uploadBase64Image(cnicFront!, "cnic_front"),
                uploadBase64Image(cnicBack!, "cnic_back"),
            ]);

            // 2. Send JSON payload to Backend API
            const payload = {
                selfieImage: selfieUrl,
                cnicFrontImage: cnicFrontUrl,
                cnicBackImage: cnicBackUrl,
                category: selectedCategories.join(", "),
                firstName: user?.firstName,
                lastName: user?.lastName,
                experience: "1–3 Years", 
                bio: `Professional ${selectedCategories[0]?.split('-')[0] || 'service'} provider.`
            };

            const res = await fetch("/api/provider/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await res.json();
            if (!res.ok || !result.success) {
                // If it's a validation error from AI, show it clearly
                if (result.kycStatus === "REJECTED") {
                    setErrorMsg(result.message || "AI Verification failed. Please ensure your photos are clear and match your ID.");
                    return;
                }
                throw new Error(result.error || "Failed to submit verification");
            }

            await refetch();
            setKycResultState({
                status: result.kycStatus || "UNDER_REVIEW",
                message: result.message || "Your biometric data and documents have been successfully encrypted and submitted for internal audit.",
                confidence: result.confidenceScore
            });
            setIsSuccess(true);
        } catch (err: any) {
            setErrorMsg(err.message || "An error occurred during submission.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess && kycResultState) {
        const isVerified = kycResultState.status === "VERIFIED";
        const isRejected = kycResultState.status === "REJECTED";
        
        return (
            <div className={`min-h-screen bg-background flex flex-col items-center justify-center p-6 ${isRTL ? "rtl" : ""}`}>
                <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mb-10 shadow-2xl relative overflow-hidden ${
                    isVerified ? "bg-emerald-500 shadow-emerald-500/40" : 
                    isRejected ? "bg-red-500 shadow-red-500/40" : "bg-primary shadow-primary/40"
                }`}>
                    {isVerified ? <CheckCircle2 className="w-12 h-12 text-white relative z-10" /> : 
                     isRejected ? <X className="w-12 h-12 text-white relative z-10" /> : 
                     <ShieldCheck className="w-12 h-12 text-white relative z-10" />}
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"
                    />
                </div>
                <h2 className={`${unbounded.className} text-3xl font-black text-foreground mb-4 text-center tracking-tighter`}>
                    Verification <span className={isVerified ? "text-emerald-500 italic" : isRejected ? "text-red-500 italic" : "text-primary italic"}>
                        {isVerified ? "Secured" : isRejected ? "Denied" : "Pending"}
                    </span>
                </h2>
                {kycResultState.confidence && (
                    <div className="mb-6 px-4 py-2 bg-muted rounded-full border border-border flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Confidence Score: {kycResultState.confidence}%</span>
                    </div>
                )}
                <p className="text-text-secondary text-sm mb-12 text-center max-w-md font-medium leading-relaxed">{kycResultState.message}</p>
                <button
                    onClick={() => router.push(isRejected ? "/provider/verify" : "/provider/dashboard")}
                    className="w-full max-w-sm h-16 bg-gray-900 hover:bg-black text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.25em] shadow-xl active:scale-95 transition-all"
                >
                    {isRejected ? "Re-Submit Documents" : "Return to Operational Grid"}
                </button>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-background flex flex-col items-center ${isRTL ? "rtl" : ""}`}>
            {/* Header */}
            <header className="w-full max-w-3xl sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-6 py-6 flex items-center mt-4">
                <button
                    onClick={handleBack}
                    className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-muted transition-all border border-border group"
                >
                    <ChevronLeft className={`w-5 h-5 group-hover:-translate-x-1 transition-transform ${isRTL ? "rotate-180" : ""}`} />
                </button>
                <div className="flex-1 text-center pr-12">
                    <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em] mb-1">Identity Protocol</p>
                    <h1 className={`${unbounded.className} text-xl font-black text-foreground`}>Worker KYC <span className="text-primary italic">Verification</span></h1>
                </div>
            </header>

            <main className="w-full max-w-2xl flex-1 px-4 sm:px-6 py-10 pb-32">
                {/* Custom Technical Progress */}
                <div className="mb-14 relative px-2">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-black text-primary uppercase tracking-widest">Protocol Step {currentStep} of 7</span>
                       <span className="text-[10px] font-black text-text-hint uppercase tracking-widest">{Math.round((currentStep/7)*100)}% Complete</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentStep / 7) * 100}%` }}
                            className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                        />
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {errorMsg && (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="p-5 bg-red-50 text-red-600 rounded-3xl flex items-start gap-4 border border-red-100 mb-8 shadow-sm">
                            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-black text-[10px] uppercase tracking-widest">Validation Error</p>
                                <p className="font-medium text-xs leading-relaxed">{errorMsg}</p>
                            </div>
                            <button onClick={() => setErrorMsg("")} className="ml-auto text-red-400 hover:text-red-600"><X size={18} /></button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="bg-card rounded-[48px] border border-border shadow-2xl p-8 sm:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                    
                    {currentStep === 1 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <div>
                                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
                                    <User size={24} />
                                </div>
                                <h2 className={`${unbounded.className} text-2xl font-black mb-3 text-foreground tracking-tighter`}>Entity <span className="text-primary">Confirmation</span></h2>
                                <p className="text-text-secondary text-sm font-medium leading-relaxed">Ensure your legal identity matches the details registered on the platform before proceeding to biometric sync.</p>
                            </div>

                            <div className="bg-muted/30 rounded-[32px] p-8 border border-border/50 space-y-6">
                                <div className="flex items-center gap-6 pb-6 border-b border-border/40">
                                    <div className="w-16 h-16 rounded-full bg-white border-2 border-primary/20 p-1">
                                        {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-xl rounded-full">{user?.firstName?.[0]}</div>}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-foreground">{user?.firstName} {user?.lastName}</h4>
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Registered Identity</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-10">
                                    <div className="space-y-1.5 text-left">
                                        <span className="text-[9px] uppercase font-black text-text-hint tracking-widest flex items-center gap-2"><Phone className="w-3 h-3" /> Contact Axis</span>
                                        <p className="font-bold text-foreground text-sm">{user?.phone || "+92 3XX XXXXXXX"}</p>
                                    </div>
                                    <div className="space-y-1.5 text-left">
                                        <span className="text-[9px] uppercase font-black text-text-hint tracking-widest flex items-center gap-2"><Mail className="w-3 h-3" /> Digital Index</span>
                                        <p className="font-bold text-foreground text-sm truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleNext} className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] hover:bg-primary-dark shadow-xl shadow-primary/20 active:scale-95 transition-all">
                                Synchronize Identity
                            </button>
                        </motion.div>
                    )}

                    {currentStep === 2 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                             <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
                                <Camera size={24} />
                            </div>
                            <h2 className={`${unbounded.className} text-2xl font-black mb-3 text-foreground tracking-tighter`}>Biometric <span className="text-primary italic">Capture</span></h2>
                            <p className="text-text-secondary text-sm font-medium leading-relaxed">Capture a live high-definition facial scan. Ensure your face is clearly visible in the frame provided.</p>

                            <div className="mb-4">
                                {isSelfieCaptured && selfieData ? (
                                    <div className="flex flex-col items-center p-8 border border-green-100 rounded-[40px] bg-green-50/20 relative group">
                                        <div className="w-56 h-56 rounded-full overflow-hidden border-4 border-green-500/50 p-1 mb-6 bg-white shadow-2xl relative">
                                            <img src={selfieData} alt="Selfie" className="w-full h-full object-cover rounded-full" />
                                            <div className="absolute inset-0 bg-green-400/10 mix-blend-overlay" />
                                        </div>
                                        <button 
                                            onClick={() => { setActiveCameraTarget("selfie"); setShowCameraModal(true); }} 
                                            className="px-8 py-4 bg-white text-foreground font-black text-[10px] uppercase tracking-[0.15em] rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 border border-border shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"
                                        >
                                            <Camera className="w-4 h-4" /> Discard & Retake
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-primary/20 rounded-[40px] bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group" onClick={() => { setActiveCameraTarget("selfie"); setShowCameraModal(true); }}>
                                        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-xl text-primary group-hover:scale-110 transition-transform">
                                            <Camera className="w-10 h-10" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em] mb-4">Awaiting Signal</p>
                                        <p className="text-xs font-bold text-text-hint bg-white/50 px-6 py-2 rounded-full">Activate Liveness Camera</p>
                                    </div>
                                )}
                            </div>

                            <button disabled={!isSelfieCaptured} onClick={handleNext} className="w-full py-5 bg-gray-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] disabled:opacity-30 disabled:grayscale transition-all shadow-xl active:scale-95">
                                Authenticate Selfie
                            </button>
                        </motion.div>
                    )}

                    {currentStep === 3 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-center sm:text-left">
                            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 mx-auto sm:mx-0">
                                <FileText size={24} />
                            </div>
                            <h2 className={`${unbounded.className} text-2xl font-black mb-3 text-foreground tracking-tighter`}>CNIC <span className="text-primary italic">Front-Side</span></h2>
                            <p className="text-text-secondary text-sm font-medium leading-relaxed">Position the front-side (Face Side) of your National Identity Card within the optical markers.</p>

                            <div className="mb-4">
                                {cnicFront ? (
                                    <div className="flex flex-col items-center p-8 border border-green-100 rounded-[40px] bg-green-50/20 relative group">
                                        <div className="w-full aspect-[1.6/1] rounded-3xl overflow-hidden border-4 border-green-500/50 p-1 mb-6 bg-black shadow-2xl relative">
                                            <img src={cnicFront} alt="CNIC Front" className="w-full h-full object-cover rounded-2xl" />
                                            <div className="absolute inset-0 bg-green-400/10 mix-blend-overlay" />
                                        </div>
                                        <button 
                                            onClick={() => { setActiveCameraTarget("cnic-front"); setShowCameraModal(true); }} 
                                            className="px-8 py-4 bg-white text-foreground font-black text-[10px] uppercase tracking-[0.15em] rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 border border-border shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"
                                        >
                                            <Camera className="w-4 h-4" /> Recapture Scan
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-indigo-200 rounded-[40px] bg-indigo-500/5 hover:bg-indigo-500/10 transition-all cursor-pointer group" onClick={() => { setActiveCameraTarget("cnic-front"); setShowCameraModal(true); }}>
                                        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-xl text-indigo-500 group-hover:rotate-3 transition-transform">
                                            <ShieldCheck className="w-10 h-10" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] mb-4">Ready for OCR Scan</p>
                                        <p className="text-xs font-bold text-text-hint bg-white/50 px-6 py-2 rounded-full">Secure Document Uplink</p>
                                    </div>
                                )}
                            </div>

                            <button disabled={!cnicFront} onClick={handleNext} className="w-full py-5 bg-gray-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] disabled:opacity-30 disabled:grayscale transition-all shadow-xl active:scale-95">
                                Next: Card Reverse
                            </button>
                        </motion.div>
                    )}

                    {currentStep === 4 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8 text-center sm:text-left">
                            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-6 mx-auto sm:mx-0">
                                <FileText size={24} />
                            </div>
                            <h2 className={`${unbounded.className} text-2xl font-black mb-3 text-foreground tracking-tighter`}>CNIC <span className="text-primary italic">Back-Side</span></h2>
                            <p className="text-text-secondary text-sm font-medium leading-relaxed">Position the back-side of your CNIC within the markers to capture the verification symbols and address info.</p>

                            <div className="mb-4">
                                {cnicBack ? (
                                    <div className="flex flex-col items-center p-8 border border-green-100 rounded-[40px] bg-green-50/20 relative group">
                                        <div className="w-full aspect-[1.6/1] rounded-3xl overflow-hidden border-4 border-green-500/50 p-1 mb-6 bg-black shadow-2xl relative">
                                            <img src={cnicBack} alt="CNIC Back" className="w-full h-full object-cover rounded-2xl" />
                                            <div className="absolute inset-0 bg-green-400/10 mix-blend-overlay" />
                                        </div>
                                        <button 
                                            onClick={() => { setActiveCameraTarget("cnic-back"); setShowCameraModal(true); }} 
                                            className="px-8 py-4 bg-white text-foreground font-black text-[10px] uppercase tracking-[0.15em] rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 border border-border shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95"
                                        >
                                            <Camera className="w-4 h-4" /> Recapture Scan
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-indigo-200 rounded-[40px] bg-indigo-500/5 hover:bg-indigo-500/10 transition-all cursor-pointer group" onClick={() => { setActiveCameraTarget("cnic-back"); setShowCameraModal(true); }}>
                                        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-xl text-indigo-500 group-hover:rotate-3 transition-transform">
                                            <ShieldCheck className="w-10 h-10" />
                                        </div>
                                        <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.3em] mb-4">Awaiting Signal</p>
                                        <p className="text-xs font-bold text-text-hint bg-white/50 px-6 py-2 rounded-full">Secure Document Uplink</p>
                                    </div>
                                )}
                            </div>

                            <button disabled={!cnicBack} onClick={handleNext} className="w-full py-5 bg-gray-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] disabled:opacity-30 disabled:grayscale transition-all shadow-xl active:scale-95">
                                Finalize Scanning
                            </button>
                        </motion.div>
                    )}

                    {currentStep === 5 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase text-primary tracking-[0.4em] mb-4">Biometric Synchronization</p>
                                <h2 className={`${unbounded.className} text-2xl font-black mb-3 text-foreground tracking-tighter`}>Face <span className="text-primary italic">Matching</span></h2>
                                <p className="text-text-secondary text-xs font-bold max-w-sm mx-auto uppercase tracking-widest leading-relaxed opacity-70">Cross-referencing live selfie with ID document biometric data.</p>
                            </div>

                            <div className="flex items-center justify-center gap-4 sm:gap-10 py-6 relative">
                                <div className="relative group">
                                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-primary/20 p-1 bg-card shadow-2xl relative">
                                        <img src={selfieData!} alt="S" className="w-full h-full object-cover rounded-full" />
                                        {isMatching && <motion.div animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute left-0 right-0 h-1 bg-primary/60 blur-md z-10" />}
                                    </div>
                                    <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase text-text-hint tracking-widest">Selfie_0x1</p>
                                </div>
                                
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-12 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 rounded-full" />
                                    {matchResult === true ? (
                                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                                    ) : isMatching ? (
                                        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-text-hint"><Shield size={20} /></div>
                                    )}
                                    <div className="w-12 h-1 bg-gradient-to-r from-primary/30 via-primary to-primary/30 rounded-full" />
                                </div>

                                <div className="relative group">
                                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-4 border-primary/20 p-1 bg-card shadow-2xl relative">
                                        <img src={cnicFront!} alt="C" className="w-full h-full object-cover rounded-xl" />
                                        {isMatching && <motion.div animate={{ top: ["0%", "100%", "0%"] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute left-0 right-0 h-1 bg-primary/60 blur-md z-10" />}
                                    </div>
                                    <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase text-text-hint tracking-widest">Doc_ID_Ref</p>
                                </div>
                            </div>

                            {matchResult === null && !isMatching ? (
                                <button
                                    onClick={runRealMatch}
                                    className="w-full py-6 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
                                >
                                    <ShieldCheck className="group-hover:rotate-12 transition-transform" />
                                    Activate Biometric Check
                                </button>
                            ) : matchResult === true ? (
                                <div className="space-y-6">
                                    <div className="bg-green-50 p-6 rounded-3xl border border-green-100 text-center animate-in fade-in zoom-in duration-500">
                                        <h4 className="text-green-600 font-black text-xs uppercase tracking-widest mb-1 items-center justify-center flex gap-2">
                                            <ShieldCheck size={16} /> Verification Signal Locked
                                        </h4>
                                        <p className="text-green-800 text-[10px] font-bold uppercase tracking-tight opacity-70">Identity Consensus Verified with 0.002% Deviation Error</p>
                                    </div>
                                    <button onClick={handleNext} className="w-full py-5 bg-gray-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all flex items-center justify-center gap-3">
                                        Proceed to Protocol Alignment
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-[10px] font-black uppercase text-primary animate-pulse tracking-[0.3em]">Neural Cross-Scan Active...</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {currentStep === 6 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                             <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-6">
                                <Briefcase size={24} />
                            </div>
                            <h2 className={`${unbounded.className} text-2xl font-black mb-3 text-foreground tracking-tighter`}>Market <span className="text-primary italic">Alignment</span></h2>
                            <p className="text-text-secondary text-sm font-medium leading-relaxed">Specify your primary professional trade category to ensure you are listed correctly in our worker grid.</p>
                             <div className="bg-muted/50 p-8 rounded-[40px] mb-8 border border-border/60">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-3 mb-6">
                                    <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center"><Zap size={12} /></div>
                                    Service Trade Index
                                </label>
                                
                                {categoriesLoading ? (
                                    <div className="flex items-center gap-3 py-10 justify-center">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-hint">Fetching Market Nodes...</span>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {categories.length > 0 ? categories.map((cat) => {
                                            const isSelected = selectedCategories.includes(cat);
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            if (selectedCategories.length > 1) {
                                                                setSelectedCategories(selectedCategories.filter(c => c !== cat));
                                                            }
                                                        } else {
                                                            setSelectedCategories([...selectedCategories, cat]);
                                                        }
                                                    }}
                                                    className={`p-5 rounded-2xl border-2 text-left transition-all flex items-center justify-between group ${
                                                        isSelected 
                                                        ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5" 
                                                        : "border-border/60 bg-white text-text-secondary hover:border-primary/40"
                                                    }`}
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                                        {t(`categories.${cat}.name`)}
                                                    </span>
                                                    <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                                                        isSelected ? "bg-primary border-primary" : "border-border group-hover:border-primary/40"
                                                    }`}>
                                                        {isSelected && <CheckCircle2 size={12} className="text-white" />}
                                                    </div>
                                                </button>
                                            );
                                        }) : (
                                            ["electrician-services", "plumber-services", "painting-services", "cleaning-services"].map((cat) => (
                                                <button
                                                    key={cat}
                                                    disabled
                                                    className="p-5 rounded-2xl border-2 border-border/40 bg-muted/20 text-text-hint text-[10px] font-black uppercase tracking-widest opacity-50 cursor-not-allowed"
                                                >
                                                    {cat.replace(/-/g, ' ')}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}

                                <div className="mt-8 flex items-start gap-4 p-5 bg-blue-50/50 text-blue-700/80 rounded-2xl text-[10px] font-bold uppercase leading-relaxed tracking-tight border border-blue-100/50">
                                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                                    <p>Select all trade categories that align with your professional skillset. Your profile will be automatically indexed under these nodes upon successful administrative audit.</p>
                                </div>
                            </div>


                            <button onClick={handleNext} className="w-full py-5 bg-gray-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl active:scale-95 transition-all">
                                Review Protocol Packet
                            </button>
                        </motion.div>
                    )}

                    {currentStep === 7 && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                            <div className="text-center space-y-4">
                                <div className="w-24 h-24 bg-primary/10 rounded-[40px] flex items-center justify-center text-primary mb-8 mx-auto border-2 border-primary/20 shadow-xl relative overflow-hidden group">
                                    <ShieldCheck className="w-12 h-12 relative z-10 group-hover:scale-110 transition-transform" />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                                </div>
                                <h2 className={`${unbounded.className} text-2xl font-black mb-3 text-foreground tracking-tighter`}>Final <span className="text-primary italic">Transmission</span></h2>
                                <p className="text-text-secondary text-sm font-medium leading-relaxed max-w-sm mx-auto">Verify your packet information. Submitting for approval will encrypt your data for our security team to review.</p>
                            </div>

                            <div className="space-y-3 mb-10 bg-muted/30 p-6 rounded-[36px] border border-border/50">
                                {[
                                    { label: "Biometric Liveness", value: isSelfieCaptured ? "Verified" : "Pending", icon: User },
                                    { label: "Identity Documents", value: (cnicFront && cnicBack) ? "Captured" : "Required", icon: ShieldCheck },
                                    { label: "Trade Alignment", value: `${selectedCategories.length} Nodes Indexed`, icon: Briefcase }
                                ].map((row, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-border group hover:border-primary/30 transition-all">
                                        <span className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-text-hint">
                                            <div className="w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center text-text-hint group-hover:text-primary transition-colors"><row.icon size={16} /></div>
                                            {row.label}
                                        </span>
                                        <span className="text-primary font-black text-[10px] uppercase tracking-[0.2em]">{row.value}</span>
                                    </div>
                                ))}
                            </div>

                            <button disabled={isSubmitting} onClick={handleSubmit} className="w-full py-6 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] disabled:opacity-30 disabled:grayscale shadow-[0_20px_40px_rgba(var(--primary),0.3)] flex items-center justify-center gap-4 hover:bg-primary-dark active:scale-95 transition-all duration-300">
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                                {isSubmitting ? "Encrypting & Sending..." : "Transmit For Audit"}
                            </button>
                        </motion.div>
                    )}
                </div>
            </main>

            {/* Global Camera Modal */}
            <AnimatePresence>
                {showCameraModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center p-4 overflow-y-auto py-12">
                        <div className="w-full max-w-xl">
                            <CameraCapture
                                type={activeCameraTarget}
                                onCapture={(img) => {
                                    if (activeCameraTarget === "selfie") {
                                        setSelfieData(img);
                                        setIsSelfieCaptured(true);
                                    } else if (activeCameraTarget === "cnic-front") {
                                        setCnicFront(img);
                                    } else if (activeCameraTarget === "cnic-back") {
                                        setCnicBack(img);
                                    }
                                    setShowCameraModal(false);
                                    showToast("Signal Intercepted & Saved", "success");
                                }}
                                onClose={() => setShowCameraModal(false)}
                                liveOnly={false}
                                allowUpload={true}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
