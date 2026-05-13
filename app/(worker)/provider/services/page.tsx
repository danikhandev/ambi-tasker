"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Upload, X, Check, Loader2, ChevronDown, AlertCircle,
    CheckCircle2, Image, DollarSign, FileText, Tag, Clock,
    Send, Eye, Briefcase
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import { SERVICE_CATEGORIES } from "@/constants/services";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/contexts/UserContext";
import { useUI } from "@/contexts/UIContext";

type SubmissionStatus = "idle" | "submitting" | "success";
type RequestStatus = "pending" | "approved" | "rejected" | "draft";

interface ServiceRequest {
    id: string;
    name: string;
    category: string;
    description: string;
    priceMin: number;
    priceMax: number;
    status: RequestStatus;
    submittedAt: string;
    adminNote?: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    active: { label: "Active", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle2 },
    inactive: { label: "Inactive", color: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle },
    paused: { label: "Paused", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
    pending: { label: "Pending Review", color: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
};

export default function AddServicePage() {
    const { t } = useTranslation();
    const { user } = useUser();
    const { showToast } = useUI();
    const [isLoading, setIsLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);

    useEffect(() => {
        if (user?.id) {
            fetchServices();
        }
    }, [user]);

    const fetchServices = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/provider/profile");
            const data = await res.json();
            
            if (data.success && data.data) {
                // Formatting into array to match existing mapping logic UI
                const profile = data.data;
                setRequests([{
                    id: profile.id,
                    title: profile.professionalTitle || "General Service",
                    description: profile.serviceDescription || "No description provided",
                    category: { category_name: profile.professionalTitle || "General" },
                    price: profile.hourlyRate || 0,
                    service_status: profile.verificationStatus === "VERIFIED" ? "active" 
                                  : profile.verificationStatus === "REJECTED" ? "inactive" : "paused",
                    created_at: new Date().toISOString()
                }]);
            } else {
                setRequests([]);
            }
        } catch (error: any) {
            showToast("Relay Error: " + error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const [status, setStatus] = useState<SubmissionStatus>("idle");
    const pendingCount = requests.filter(r => r.service_status === "paused").length;

    return (
        <div className="flex-1 bg-muted/50 min-h-screen">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div>
                        <h1 className={`${unbounded.className} text-2xl font-black text-foreground`}>{t("providerServices.title")}</h1>
                        <p className="text-sm text-text-secondary font-medium mt-1">{t("providerServices.subtitle")}</p>
                    </div>
                    <Link
                        href="/provider/services/add"
                        className="flex items-center gap-2 px-5 py-3 bg-primary text-white font-bold text-sm rounded-2xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        {t("providerServices.addNew")}
                    </Link>
                </motion.div>

                {/* Success Toast */}
                <AnimatePresence>
                    {status === "success" && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-4 rounded-2xl shadow-sm border border-border hover:shadow-md shadow-green-600/20 flex items-center gap-3"
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-bold text-sm">Service submitted for review!</span>
                        </motion.div>
                    )}
                </AnimatePresence>


                {/* Pending Info */}
                {pendingCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3"
                    >
                        <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <p className="text-sm font-semibold text-amber-800">
                            You have <span className="font-black">{pendingCount}</span> service{pendingCount > 1 ? "s" : ""} pending admin approval
                        </p>
                    </motion.div>
                )}

                {/* Submissions List */}
                <div className="space-y-4">
                    <h2 className={`${unbounded.className} text-base font-bold text-foreground`}>Your Submissions</h2>

                    {isLoading ? (
                        <div className="py-20 flex items-center justify-center bg-card rounded-2xl border border-border">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="bg-card rounded-[28px] border border-border p-16 text-center shadow-sm">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Briefcase className="w-8 h-8 text-text-disabled" />
                            </div>
                            <h3 className={`${unbounded.className} text-lg font-bold text-foreground mb-2`}>No Services Yet</h3>
                            <p className="text-sm text-text-hint font-medium mb-6">Create your first service listing to start receiving jobs</p>
                            <Link
                                href="/provider/services/add"
                                className="px-6 py-3 bg-primary text-white font-bold text-sm rounded-2xl hover:bg-primary/90 transition-all font-black"
                            >
                                Create Service Listing
                            </Link>
                        </div>
                    ) : (
                        requests.map((req, i) => {
                            const status = req.service_status || "pending";
                            const sc = statusConfig[status] || statusConfig.pending;
                            const categoryName = req.category?.category_name || "Uncategorized";
                            
                            return (
                                <motion.div
                                    key={req.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-card rounded-[20px] border border-border p-5 shadow-sm hover:border-primary/20 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-sm font-black text-foreground">{req.title}</h3>
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-bold uppercase ${sc.color}`}>
                                                    <sc.icon className="w-3 h-3" />
                                                    {status}
                                                </span>
                                            </div>
                                            <p className="text-xs text-text-hint font-medium mb-2">
                                                {categoryName} • Rs. {Number(req.price).toLocaleString()}
                                            </p>
                                            <p className="text-xs text-text-secondary font-medium leading-relaxed line-clamp-2">{req.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                        <span className="text-[10px] font-bold text-text-disabled uppercase tracking-wider">
                                            Created {new Date(req.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            {status === "active" && (
                                                <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider flex items-center gap-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Published
                                                </span>
                                            )}
                                            {status === "paused" && (
                                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" /> Under Review
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
