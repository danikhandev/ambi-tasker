"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck, Clock, Search, Filter, Eye, CheckCircle2, XCircle, 
    ChevronRight, Calendar, Phone, Mail, User, ArrowLeft, Loader2,
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

export default function AdminVerificationsPage() {
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"PENDING" | "VERIFIED" | "REJECTED">("PENDING");
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
            { url: selectedRequest.kycDocs?.selfie || selectedRequest.selfieUrl || "", label: "Live Liveness Capture" },
            { url: selectedRequest.kycDocs?.cnicFront || selectedRequest.cnicFrontUrl || "", label: "CNIC Front (OCR)" },
            { url: selectedRequest.kycDocs?.cnicBack || selectedRequest.cnicBackUrl || "", label: "CNIC Back" },
        ].filter(img => img.url);
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
        } catch (error) {
            showToast("Sync Error", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPageTitle("Verification Center", "");
    }, [setPageTitle]);

    useEffect(() => {
        fetchVerifications(activeTab);
    }, [activeTab]);

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
                showToast(`Provider ${action.toLowerCase()} successfully`, "success");
                setSelectedRequest(null);
                fetchVerifications(activeTab);
            } else {
                showToast(json.error || "Update failed", "error");
            }
        } catch (error) {
            showToast("Update Error", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredRequests = requests.filter(req => 
        req.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-transparent pb-20">
            <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 w-fit">
                    {(["PENDING", "UNDER_REVIEW", "VERIFIED", "REJECTED"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === tab 
                                    ? "bg-gray-900 text-white shadow-lg" 
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                        >
                            {tab.replace("_", " ")}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Search by name or email..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-3.5 bg-white border border-gray-200 rounded-2xl w-full md:w-80 text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Synchronizing Identity Grid...</p>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="bg-white rounded-[40px] border border-gray-200 p-20 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8 text-gray-300">
                        <ShieldCheck size={48} />
                    </div>
                    <h3 className={`${unbounded.className} text-xl font-bold text-gray-900 mb-2`}>No Records Found</h3>
                    <p className="text-sm text-gray-500 max-w-sm">There are no verification requests matching the current filter and search criteria.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {filteredRequests.map((req) => (
                        <motion.div
                            key={req.id}
                            layoutId={req.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[32px] border border-gray-200 p-8 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group overflow-hidden relative cursor-pointer"
                            onClick={() => setSelectedRequest(req)}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-indigo-100/50 transition-colors" />
                            
                            <div className="flex items-start gap-6 mb-8 relative z-10">
                                <div className="relative">
                                    <CircularFrame src={req.user.profileImage || ""} alt={req.user.name} size={64} className="border-2 border-gray-100" />
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-md ${
                                        req.verificationStatus === 'PENDING' ? 'bg-gray-400' :
                                        req.verificationStatus === 'UNDER_REVIEW' ? 'bg-amber-400' :
                                        req.verificationStatus === 'VERIFIED' ? 'bg-emerald-500' : 'bg-red-500'
                                    }`}>
                                        {(req.verificationStatus === 'PENDING' || req.verificationStatus === 'UNDER_REVIEW') ? <Clock size={12} className="text-white" /> : 
                                         req.verificationStatus === 'VERIFIED' ? <Check size={12} className="text-white" /> : <X size={12} className="text-white" />}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`${unbounded.className} text-lg font-bold text-gray-900 truncate mb-1`}>{req.user.name}</h4>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        {req.professionalTitle || "New Provider"}
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    <ChevronRight size={20} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><Phone size={12} /> Contact</span>
                                    <p className="text-sm font-bold text-gray-700">{req.user.phone}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><Calendar size={12} /> Joined</span>
                                    <p className="text-sm font-bold text-gray-700">{new Date(req.user.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-6 border-t border-gray-100">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <ImageIcon size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Digital Packet</p>
                                    <p className="text-xs font-bold text-gray-900">3 Verification Assets Uploaded</p>
                                </div>
                                <span className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                    Open Audit
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Detail Overlay */}
            <AnimatePresence>
                {selectedRequest && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedRequest(null)}
                            className="absolute inset-0 bg-gray-900/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[48px] w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl relative flex flex-col md:flex-row"
                        >
                            {/* Comparison Side */}
                            <div className="flex-1 bg-gray-50 p-8 md:p-12 overflow-y-auto custom-scrollbar">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-gray-200">
                                        <ShieldAlert size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.3em]">Identity Audit</p>
                                        <h3 className={`${unbounded.className} text-xl font-black text-gray-900 tracking-tighter`}>Visual Synchronization</h3>
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    {/* Selfie vs Front */}
                                    <div className="flex flex-col xl:flex-row gap-8">
                                        <div className="flex-1 space-y-4">
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 transform translate-x-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Live Liveness Capture
                                            </p>
                                            <div className="aspect-square bg-gray-200 rounded-[32px] overflow-hidden border-4 border-white shadow-xl relative group cursor-pointer" onClick={() => openLightbox(0)}>
                                                {(selectedRequest.kycDocs?.selfie || selectedRequest.selfieUrl) ? (
                                                  <>
                                                    <img src={selectedRequest.kycDocs?.selfie || selectedRequest.selfieUrl || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Selfie" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                                                    <div className="hidden flex-col items-center justify-center absolute inset-0 bg-gray-100 text-gray-400"><ImageOff size={32} /><span className="text-[9px] font-black mt-2 uppercase tracking-widest">Failed</span></div>
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center"><span className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Eye size={14} /> Full View</span></div>
                                                  </>
                                                ) : (
                                                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400"><ImageOff size={32} /><span className="text-[9px] font-black mt-2 uppercase tracking-widest">Not Uploaded</span></div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-4">
                                             <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 transform translate-x-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Document Front (OCR)
                                            </p>
                                            <div className="aspect-square bg-gray-200 rounded-[32px] overflow-hidden border-4 border-white shadow-xl relative group cursor-pointer" onClick={() => openLightbox(1)}>
                                                {(selectedRequest.kycDocs?.cnicFront || selectedRequest.cnicFrontUrl) ? (
                                                  <>
                                                    <img src={selectedRequest.kycDocs?.cnicFront || selectedRequest.cnicFrontUrl || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="CNIC Front" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                                                    <div className="hidden flex-col items-center justify-center absolute inset-0 bg-gray-100 text-gray-400"><ImageOff size={32} /><span className="text-[9px] font-black mt-2 uppercase tracking-widest">Failed</span></div>
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center"><span className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Eye size={14} /> Full View</span></div>
                                                  </>
                                                ) : (
                                                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400"><ImageOff size={32} /><span className="text-[9px] font-black mt-2 uppercase tracking-widest">Not Uploaded</span></div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Back Side */}
                                    <div className="space-y-4">
                                         <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2 transform translate-x-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Document Reverse Node
                                        </p>
                                        <div className="aspect-[16/6] bg-gray-200 rounded-[32px] overflow-hidden border-4 border-white shadow-xl relative group cursor-pointer" onClick={() => openLightbox(2)}>
                                            {(selectedRequest.kycDocs?.cnicBack || selectedRequest.cnicBackUrl) ? (
                                              <>
                                                <img src={selectedRequest.kycDocs?.cnicBack || selectedRequest.cnicBackUrl || ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="CNIC Back" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                                                <div className="hidden flex-col items-center justify-center absolute inset-0 bg-gray-100 text-gray-400"><ImageOff size={32} /><span className="text-[9px] font-black mt-2 uppercase tracking-widest">Failed</span></div>
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center"><span className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Eye size={14} /> Full View</span></div>
                                              </>
                                            ) : (
                                              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400"><ImageOff size={32} /><span className="text-[9px] font-black mt-2 uppercase tracking-widest">Not Uploaded</span></div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Controls Side */}
                            <div className="w-full md:w-[400px] bg-white p-8 md:p-12 flex flex-col border-l border-gray-100">
                                <button 
                                    onClick={() => setSelectedRequest(null)}
                                    className="self-end w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center mb-8"
                                >
                                    <X size={24} />
                                </button>

                                <div className="flex-1 space-y-10">
                                    <div className="text-center md:text-left">
                                        <CircularFrame src={selectedRequest.user.profileImage || ""} alt={selectedRequest.user.name} size={96} className="mx-auto md:mx-0 mb-6 border-4 border-gray-100 shadow-lg" />
                                        <h2 className={`${unbounded.className} text-2xl font-black text-gray-900 tracking-tight`}>{selectedRequest.user.name}</h2>
                                        <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest mt-1">{selectedRequest.professionalTitle || "Service Partner"}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Metadata Analysis</p>
                                        {[
                                            { label: "Phone Sync", value: selectedRequest.user.phone, icon: Phone },
                                            { label: "Digital Index", value: selectedRequest.user.email, icon: Mail },
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100/50">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm"><item.icon size={18} /></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tight">{item.label}</p>
                                                    <p className="text-[11px] font-bold text-gray-900 truncate">{item.label === "Digital Index" ? item.value?.toLowerCase() : item.value}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* AI Engine Results */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Engine Analysis</p>
                                            <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${
                                                (selectedRequest.kycConfidenceScore || 0) > 85 ? "bg-emerald-100 text-emerald-700" :
                                                (selectedRequest.kycConfidenceScore || 0) > 60 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                                            }`}>
                                                {selectedRequest.kycConfidenceScore}% Confidence
                                            </span>
                                        </div>
                                        
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100/50 space-y-3">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500 font-bold flex items-center gap-2"><Fingerprint size={12}/> Face Match Score</span>
                                                <span className="font-black text-gray-900">{selectedRequest.kycData?.faceMatchScore || 0}%</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-500 font-bold flex items-center gap-2"><ImageIcon size={12}/> Document Validity</span>
                                                <span className={`font-black ${selectedRequest.kycData?.documentValid ? "text-emerald-600" : "text-red-600"}`}>
                                                    {selectedRequest.kycData?.documentValid ? "Pass" : "Fail"}
                                                </span>
                                            </div>
                                            
                                            {/* OCR Data Display */}
                                            {selectedRequest.kycData?.ocrData && (
                                                <div className="pt-3 mt-3 border-t border-gray-200">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Extracted OCR Data</p>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[11px]">
                                                            <span className="text-gray-500">Document CNIC:</span>
                                                            <span className="font-bold text-gray-900">{selectedRequest.kycData.ocrData.cnic || "N/A"}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[11px]">
                                                            <span className="text-gray-500">Document Name:</span>
                                                            <span className="font-bold text-gray-900">{selectedRequest.kycData.ocrData.name || "N/A"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                                        <div className="flex items-center gap-3 mb-2 text-indigo-600">
                                            <AlertTriangle size={18} />
                                            <p className="text-xs font-black uppercase tracking-widest">Protocol Notice</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-indigo-800 leading-relaxed uppercase tracking-tighter opacity-70">
                                            Ensure document text matches profile metadata. Check for photo tampering or low-fidelity image artifacts.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-12 space-y-4 pt-8 border-t border-gray-100">
                                    <button 
                                        disabled={submitting}
                                        onClick={() => handleUpdateStatus(selectedRequest.id, "VERIFIED")}
                                        className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-emerald-700 shadow-xl shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-4 group"
                                    >
                                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 className="group-hover:rotate-12 transition-transform" size={16} />}
                                        Verify Protocol 
                                    </button>
                                    <button 
                                        disabled={submitting}
                                        onClick={() => handleUpdateStatus(selectedRequest.id, "REJECTED")}
                                        className="w-full py-5 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-red-600 hover:text-white shadow-xl shadow-red-50 active:scale-95 transition-all flex items-center justify-center gap-4 group"
                                    >
                                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <XCircle className="group-hover:rotate-12 transition-transform" size={16} />}
                                        Reject Transmission
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Image Lightbox */}
            <ImageLightbox
                images={getLightboxImages()}
                initialIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
            />
        </div>
    );
}
