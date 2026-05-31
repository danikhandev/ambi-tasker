"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck, Clock, Search, Eye, CheckCircle2, XCircle,
    ChevronRight, Calendar, Phone, Mail, Loader2,
    ImageIcon, ShieldAlert, Check, X, AlertTriangle, Fingerprint, ImageOff
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import CircularFrame from "@/components/CircularFrame";
import ImageLightbox from "@/components/ImageLightbox";

interface VerificationRequest {
    id: string;
    userId: string;
    professionalTitle: string | null;
    cnicFrontUrl: string | null;
    cnicBackUrl: string | null;
    selfieUrl: string | null;
    kycDocs?: {
        cnicFront: string | null;
        cnicBack: string | null;
        selfie: string | null;
    };
    kycConfidenceScore?: number;
    kycData?: {
        faceMatchScore?: number;
        documentValid?: boolean;
        blurScore?: number;
        fraudRisk?: string;
        selfieQuality?: {
            confidence?: number;
            isBlurred?: boolean;
            fraudFlags?: string[];
        };
        idQuality?: {
            fraudFlags?: string[];
        };
        ocrData?: {
            name?: string;
            cnic?: string;
            extractedText?: string;
        };
    };
    verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | "UNDER_REVIEW" | "NOT_STARTED";
    user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        profileImage: string | null;
        createdAt: string;
    };
}

// ── KycImageCard ─────────────────────────────────────────────────────────────
// A self-contained image card with skeleton loader, error state, and click-to-expand
function KycImageCard({
    url,
    label,
    dotColor,
    aspect = "square",
    lightboxIndex,
    onOpenLightbox,
}: {
    url: string | null | undefined;
    label: string;
    dotColor: string;
    aspect?: "square" | "wide";
    lightboxIndex: number;
    onOpenLightbox: (idx: number) => void;
}) {
    const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

    // Reset when URL changes (new provider selected)
    useEffect(() => { setStatus(url ? "loading" : "error"); }, [url]);

    const hasUrl = !!url;

    return (
        <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 ml-1">
                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                {label}
            </p>

            <div
                className={`relative overflow-hidden rounded-[28px] border-4 border-white shadow-xl bg-gray-100 group ${hasUrl && status !== "error" ? "cursor-pointer" : "cursor-default"} ${aspect === "wide" ? "aspect-[16/7]" : "aspect-square"}`}
                onClick={() => hasUrl && status === "loaded" && onOpenLightbox(lightboxIndex)}
            >
                {/* Skeleton */}
                {hasUrl && status === "loading" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
                )}

                {/* Image */}
                {hasUrl && (
                    <img
                        src={url!}
                        alt={label}
                        className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${status === "loaded" ? "opacity-100" : "opacity-0"}`}
                        onLoad={() => setStatus("loaded")}
                        onError={() => setStatus("error")}
                        draggable={false}
                    />
                )}

                {/* Error / Not uploaded */}
                {(!hasUrl || status === "error") && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-300">
                        <ImageOff size={36} />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                            {!hasUrl ? "Not Uploaded" : "Failed to Load"}
                        </span>
                        {status === "error" && url && (
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="mt-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-500 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all"
                            >
                                Try Direct ↗
                            </a>
                        )}
                    </div>
                )}

                {/* Hover overlay — only when loaded */}
                {status === "loaded" && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Eye size={20} className="text-white" />
                            </div>
                            <span className="text-white text-[9px] font-black uppercase tracking-widest">
                                Full View
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminVerificationsPage() {
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED">("PENDING");
    const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const { showToast, setPageTitle } = useUI();

    // Lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const getLightboxImages = useCallback(() => {
        if (!selectedRequest) return [];
        return [
            { url: selectedRequest.kycDocs?.selfie || selectedRequest.selfieUrl || "", label: "Live Selfie" },
            { url: selectedRequest.kycDocs?.cnicFront || selectedRequest.cnicFrontUrl || "", label: "CNIC Front (OCR)" },
            { url: selectedRequest.kycDocs?.cnicBack || selectedRequest.cnicBackUrl || "", label: "CNIC Back" },
        ];
    }, [selectedRequest]);

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const fetchVerifications = async (status: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/verifications?status=${status}`);
            const json = await res.json();
            if (json.success) {
                setRequests(json.data || []);
            } else {
                showToast("Failed to load verifications", "error");
            }
        } catch {
            showToast("Sync Error", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { setPageTitle("Verification Center", ""); }, [setPageTitle]);
    useEffect(() => { fetchVerifications(activeTab); }, [activeTab]);

    // Lock background scroll when detail overlay is open
    useEffect(() => {
        const mainEl = document.querySelector("main");
        if (selectedRequest) {
            document.body.style.overflow = "hidden";
            if (mainEl) mainEl.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
            if (mainEl) mainEl.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
            if (mainEl) mainEl.style.overflow = "";
        };
    }, [selectedRequest]);

    const handleUpdateStatus = async (providerId: string, action: "VERIFIED" | "REJECTED") => {
        setSubmitting(true);
        try {
            const res = await fetch("/api/admin/verifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ providerId, action }),
            });
            const json = await res.json();
            if (json.success) {
                showToast(`Provider ${action === "VERIFIED" ? "verified" : "rejected"} successfully`, "success");
                setSelectedRequest(null);
                fetchVerifications(activeTab);
            } else {
                showToast(json.error || "Update failed", "error");
            }
        } catch {
            showToast("Update Error", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredRequests = requests.filter(req =>
        req.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const TAB_STYLES: Record<string, string> = {
        PENDING: "text-amber-600",
        UNDER_REVIEW: "text-blue-600",
        VERIFIED: "text-emerald-600",
        REJECTED: "text-red-600",
    };

    return (
        <div className="min-h-screen bg-transparent pb-20">

            {/* ── Toolbar ──────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-gray-200 w-fit shadow-sm">
                    {(["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab
                                    ? "bg-gray-900 text-white shadow-md"
                                    : `text-gray-400 hover:bg-gray-50 ${TAB_STYLES[tab]}`
                            }`}
                        >
                            {tab.replace("_", " ")}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-11 pr-5 py-3 bg-white border border-gray-200 rounded-2xl w-72 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 transition-all outline-none shadow-sm"
                    />
                </div>
            </div>

            {/* ── Content Grid ─────────────────────────────────────── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">
                        Synchronizing Identity Grid...
                    </p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="bg-white rounded-[40px] border border-gray-200 p-20 flex flex-col items-center justify-center text-center shadow-sm">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8 text-gray-300">
                        <ShieldCheck size={48} />
                    </div>
                    <h3 className={`${unbounded.className} text-xl font-bold text-gray-900 mb-2`}>
                        No Records Found
                    </h3>
                    <p className="text-sm text-gray-400 max-w-sm">
                        No verification requests match the current filter.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {filteredRequests.map((req, i) => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="bg-white rounded-[32px] border border-gray-200 p-8 hover:shadow-xl hover:shadow-indigo-500/8 transition-all group overflow-hidden relative cursor-pointer"
                            onClick={() => setSelectedRequest(req)}
                        >
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-indigo-100/50 transition-colors" />

                            <div className="flex items-start gap-5 mb-7 relative z-10">
                                <div className="relative flex-shrink-0">
                                    <CircularFrame src={req.user.profileImage || ""} alt={req.user.name} size={60} className="border-2 border-gray-100" />
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow ${
                                        req.verificationStatus === "UNDER_REVIEW" ? "bg-amber-400" :
                                        req.verificationStatus === "VERIFIED" ? "bg-emerald-500" :
                                        req.verificationStatus === "REJECTED" ? "bg-red-500" : "bg-gray-400"
                                    }`}>
                                        {req.verificationStatus === "VERIFIED" ? <Check size={10} className="text-white" /> :
                                         req.verificationStatus === "REJECTED" ? <X size={10} className="text-white" /> :
                                         <Clock size={10} className="text-white" />}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`${unbounded.className} text-base font-bold text-gray-900 truncate`}>{req.user.name}</h4>
                                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 truncate">
                                        {req.professionalTitle || "New Provider"}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1 truncate">{req.user.email}</p>
                                </div>
                                <div className="p-2.5 bg-gray-50 rounded-xl text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all flex-shrink-0">
                                    <ChevronRight size={18} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                                        <Phone size={10} /> Contact
                                    </span>
                                    <p className="text-xs font-bold text-gray-700">{req.user.phone || "—"}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5">
                                        <Calendar size={10} /> Joined
                                    </span>
                                    <p className="text-xs font-bold text-gray-700">
                                        {new Date(req.user.createdAt).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                                    <ImageIcon size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">KYC Documents</p>
                                    <p className="text-xs font-bold text-gray-700">
                                        {[req.kycDocs?.selfie || req.selfieUrl, req.kycDocs?.cnicFront || req.cnicFrontUrl, req.kycDocs?.cnicBack || req.cnicBackUrl].filter(Boolean).length} / 3 Uploaded
                                    </p>
                                </div>
                                <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    Open Audit
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* ── Detail Overlay ───────────────────────────────────── */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setSelectedRequest(null); setLightboxOpen(false); }}
                            className="absolute inset-0 bg-gray-950/80 backdrop-blur-xl"
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 24 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 24 }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="relative bg-white rounded-[44px] w-full max-w-6xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col md:flex-row"
                        >
                            {/* ── Left: Image Audit Panel ── */}
                            <div className="flex-1 bg-gray-50 p-8 md:p-10 overflow-y-auto custom-scrollbar border-r border-gray-100">
                                {/* Header */}
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-gray-200">
                                        <ShieldAlert size={22} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.3em]">Identity Audit</p>
                                        <h3 className={`${unbounded.className} text-lg font-black text-gray-900`}>Document Verification</h3>
                                    </div>
                                </div>

                                {/* Images */}
                                <div className="space-y-8">
                                    {/* Selfie + CNIC Front side by side */}
                                    <div className="grid grid-cols-2 gap-5">
                                        <KycImageCard
                                            url={selectedRequest.kycDocs?.selfie || selectedRequest.selfieUrl}
                                            label="Live Selfie"
                                            dotColor="bg-indigo-500"
                                            lightboxIndex={0}
                                            onOpenLightbox={openLightbox}
                                        />
                                        <KycImageCard
                                            url={selectedRequest.kycDocs?.cnicFront || selectedRequest.cnicFrontUrl}
                                            label="CNIC Front"
                                            dotColor="bg-emerald-500"
                                            lightboxIndex={1}
                                            onOpenLightbox={openLightbox}
                                        />
                                    </div>

                                    {/* CNIC Back — wide */}
                                    <KycImageCard
                                        url={selectedRequest.kycDocs?.cnicBack || selectedRequest.cnicBackUrl}
                                        label="CNIC Back"
                                        dotColor="bg-amber-500"
                                        aspect="wide"
                                        lightboxIndex={2}
                                        onOpenLightbox={openLightbox}
                                    />

                                    {/* Quick open hint */}
                                    <p className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-widest">
                                        Click any image to open full-screen inspector
                                    </p>
                                </div>
                            </div>

                            {/* ── Right: Controls Panel ── */}
                            <div className="w-full md:w-[380px] bg-white p-8 md:p-10 flex flex-col overflow-y-auto custom-scrollbar">
                                {/* Close */}
                                <button
                                    onClick={() => setSelectedRequest(null)}
                                    className="self-end w-10 h-10 rounded-xl bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center mb-6"
                                >
                                    <X size={20} />
                                </button>

                                {/* Provider identity */}
                                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
                                    <CircularFrame
                                        src={selectedRequest.user.profileImage || ""}
                                        alt={selectedRequest.user.name}
                                        size={72}
                                        className="border-4 border-gray-100 shadow-md flex-shrink-0"
                                    />
                                    <div className="min-w-0">
                                        <h2 className={`${unbounded.className} text-lg font-black text-gray-900 truncate`}>
                                            {selectedRequest.user.name}
                                        </h2>
                                        <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest mt-0.5">
                                            {selectedRequest.professionalTitle || "Service Partner"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-6">
                                    {/* Contact metadata */}
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Contact Info</p>
                                        {[
                                            { icon: Phone, label: "Phone", value: selectedRequest.user.phone },
                                            { icon: Mail, label: "Email", value: selectedRequest.user.email?.toLowerCase() },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                                                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm flex-shrink-0">
                                                    <item.icon size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                                                    <p className="text-[11px] font-bold text-gray-800 truncate">{item.value || "—"}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* AI / KYC analysis */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">AI Engine Analysis</p>
                                            {selectedRequest.kycConfidenceScore != null && (
                                                <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${
                                                    selectedRequest.kycConfidenceScore > 85 ? "bg-emerald-100 text-emerald-700" :
                                                    selectedRequest.kycConfidenceScore > 60 ? "bg-amber-100 text-amber-700" :
                                                    "bg-red-100 text-red-700"
                                                }`}>
                                                    {selectedRequest.kycConfidenceScore}% Confidence
                                                </span>
                                            )}
                                        </div>

                                        <div className="bg-gray-50 rounded-2xl border border-gray-100 divide-y divide-gray-100">
                                            <div className="flex justify-between items-center px-4 py-3 text-xs">
                                                <span className="text-gray-500 font-bold flex items-center gap-2">
                                                    <Fingerprint size={12} /> Face Match
                                                </span>
                                                <span className={`font-black ${
                                                    (selectedRequest.kycData?.faceMatchScore || 0) > 80 ? "text-emerald-600" :
                                                    (selectedRequest.kycData?.faceMatchScore || 0) > 60 ? "text-amber-600" : "text-red-600"
                                                }`}>
                                                    {selectedRequest.kycData?.faceMatchScore ?? "—"}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center px-4 py-3 text-xs">
                                                <span className="text-gray-500 font-bold flex items-center gap-2">
                                                    <ShieldAlert size={12} /> Fraud Risk
                                                </span>
                                                <span className={`font-black uppercase ${
                                                    selectedRequest.kycData?.fraudRisk === "HIGH" ? "text-red-600" :
                                                    selectedRequest.kycData?.fraudRisk === "MEDIUM" ? "text-amber-600" :
                                                    selectedRequest.kycData?.fraudRisk === "LOW" ? "text-emerald-600" : "text-gray-400"
                                                }`}>
                                                    {selectedRequest.kycData?.fraudRisk || "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center px-4 py-3 text-xs">
                                                <span className="text-gray-500 font-bold flex items-center gap-2">
                                                    <ImageIcon size={12} /> Document
                                                </span>
                                                <span className={`font-black ${selectedRequest.kycData?.documentValid ? "text-emerald-600" : "text-amber-600"}`}>
                                                    {selectedRequest.kycData?.documentValid ? "Valid" : "Unverified"}
                                                </span>
                                            </div>

                                            {/* Fraud flags */}
                                            {(selectedRequest.kycData?.selfieQuality?.fraudFlags?.length || selectedRequest.kycData?.idQuality?.fraudFlags?.length) ? (
                                                <div className="px-4 py-3">
                                                    <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-1">Fraud Flags Detected</p>
                                                    <p className="text-[10px] font-bold text-red-600">
                                                        {[
                                                            ...(selectedRequest.kycData?.selfieQuality?.fraudFlags || []),
                                                            ...(selectedRequest.kycData?.idQuality?.fraudFlags || []),
                                                        ].join(" · ")}
                                                    </p>
                                                </div>
                                            ) : null}

                                            {/* OCR data */}
                                            {selectedRequest.kycData?.ocrData && (
                                                <div className="px-4 py-3 space-y-1.5">
                                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Extracted OCR</p>
                                                    {selectedRequest.kycData.ocrData.cnic && (
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-gray-400">CNIC</span>
                                                            <span className="font-bold text-gray-800 font-mono">{selectedRequest.kycData.ocrData.cnic}</span>
                                                        </div>
                                                    )}
                                                    {selectedRequest.kycData.ocrData.name && (
                                                        <div className="flex justify-between text-[10px]">
                                                            <span className="text-gray-400">Name</span>
                                                            <span className="font-bold text-gray-800">{selectedRequest.kycData.ocrData.name}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Protocol notice */}
                                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                                        <div className="flex items-center gap-2 mb-1.5 text-indigo-600">
                                            <AlertTriangle size={14} />
                                            <p className="text-[9px] font-black uppercase tracking-widest">Review Protocol</p>
                                        </div>
                                        <p className="text-[10px] font-medium text-indigo-700 leading-relaxed">
                                            Confirm document text matches profile details. Check for tampering, blurriness, or spoofing artifacts before approving.
                                        </p>
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="mt-8 space-y-3 pt-6 border-t border-gray-100">
                                    <button
                                        disabled={submitting || selectedRequest.verificationStatus === "VERIFIED"}
                                        onClick={() => handleUpdateStatus(selectedRequest.id, "VERIFIED")}
                                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                    >
                                        {submitting
                                            ? <Loader2 size={15} className="animate-spin" />
                                            : <CheckCircle2 size={15} className="group-hover:scale-110 transition-transform" />
                                        }
                                        {selectedRequest.verificationStatus === "VERIFIED" ? "Already Verified" : "Approve & Verify"}
                                    </button>
                                    <button
                                        disabled={submitting || selectedRequest.verificationStatus === "REJECTED"}
                                        onClick={() => handleUpdateStatus(selectedRequest.id, "REJECTED")}
                                        className="w-full py-4 bg-white text-red-600 border-2 border-red-100 rounded-2xl font-black uppercase tracking-[0.15em] text-[10px] hover:bg-red-600 hover:text-white hover:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all flex items-center justify-center gap-3 group"
                                    >
                                        {submitting
                                            ? <Loader2 size={15} className="animate-spin" />
                                            : <XCircle size={15} className="group-hover:scale-110 transition-transform" />
                                        }
                                        {selectedRequest.verificationStatus === "REJECTED" ? "Already Rejected" : "Reject Submission"}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Image Lightbox ───────────────────────────────────── */}
            <ImageLightbox
                images={getLightboxImages()}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />
        </div>
    );
}
