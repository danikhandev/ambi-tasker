"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight, ChevronLeft, Check, Loader2, AlertCircle,
    CheckCircle2, Image, DollarSign, FileText, Tag, Clock,
    Send, Briefcase, MapPin, Calendar as CalendarIcon, Upload, X, Info
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import { SERVICE_CATEGORIES } from "@/constants/services";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { useUI } from "@/contexts/UIContext";

const getSteps = (t: any) => [
    { id: 1, title: t("providerServices.steps.info"), icon: Tag },
    { id: 2, title: t("providerServices.steps.pricing"), icon: DollarSign },
    { id: 3, title: t("providerServices.steps.availability"), icon: Clock },
    { id: 4, title: t("providerServices.steps.portfolio"), icon: Image }
];

const DAYS = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

function AddServiceContent() {
    const { t, isRTL } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useUI();
    const editId = searchParams.get("id");
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [form, setForm] = useState({
        name: "",
        category: "",
        description: "",
        priceMin: "",
        priceMax: "",
        experience: "",
        location: "",
        coverageArea: "",
        availabilityDays: [] as string[],
        startTime: "09:00",
        endTime: "18:00",
    });

    const [images, setImages] = useState<string[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Form is initialized blank for new services.

    const validateStep = (step: number) => {
        const errs: Record<string, string> = {};
        if (step === 1) {
            if (!form.name.trim()) errs.name = "Service name is required";
            if (!form.category) errs.category = "Please select a category";
            if (!form.description.trim() || form.description.length < 20) errs.description = "Description must be at least 20 characters";
        } else if (step === 2) {
            if (!form.priceMin) errs.priceMin = "Min price is required";
            if (!form.priceMax) errs.priceMax = "Max price is required";
            if (Number(form.priceMin) > Number(form.priceMax)) errs.priceMax = "Max must be higher than min";
            if (!form.experience) errs.experience = "Experience is required";
            if (!form.location) errs.location = "Primary location is required";
        } else if (step === 3) {
            if (form.availabilityDays.length === 0) errs.days = "Select at least one day";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    const { user } = useUser();

    const handleSubmit = async (isDraft: boolean = false) => {
        if (!isDraft && !validateStep(4)) return;

        setIsSubmitting(true);

        try {
            const avgPrice = ((Number(form.priceMin) || 0) + (Number(form.priceMax) || 0)) / 2;

            // 1. Update Provider Profile (Existing functionality)
            const profileRes = await fetch('/api/provider/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    professionalTitle: form.name,
                    serviceDescription: form.description,
                    hourlyRate: avgPrice,
                    experienceYears: parseInt(form.experience.split(' ')[0]) || 0
                })
            });
            const profileJson = await profileRes.json();
            if (!profileJson.success) throw new Error(profileJson.error || "Failed to update profile");

            // 2. Submit Service Application for Admin Approval
            const applyRes = await fetch('/api/provider/services/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name,
                    category: form.category,
                    description: form.description,
                    price: avgPrice
                })
            });
            const applyJson = await applyRes.json();
            if (!applyJson.success) throw new Error(applyJson.error || "Failed to submit application");

            setIsSubmitting(false);
            setIsSuccess(true);
        } catch (err: any) {
            showToast("Failed to submit service: " + err.message, "error");
            setIsSubmitting(false);
        }
    };

    const handleImageAdd = () => {
        const demoImages = [
            "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&h=300&fit=crop",
            "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?q=80&w=400&h=300&fit=crop",
            "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=400&h=300&fit=crop",
        ];
        if (images.length < 5) {
            setImages(prev => [...prev, demoImages[prev.length % demoImages.length]]);
        }
    };

    const toggleDay = (day: string) => {
        setForm(prev => ({
            ...prev,
            availabilityDays: prev.availabilityDays.includes(day)
                ? prev.availabilityDays.filter(d => d !== day)
                : [...prev.availabilityDays, day]
        }));
        if (errors.days) setErrors(prev => ({ ...prev, days: "" }));
    };

    if (isSuccess) {
        return (
            <div className="flex-1 bg-muted/30 min-h-screen flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card max-w-lg w-full rounded-[40px] border border-border p-12 text-center shadow-sm hover:shadow-md transition-all duration-300"
                >
                    <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h1 className={`${unbounded.className} text-2xl font-black text-foreground mb-4`}>{t("providerServices.success.title")}</h1>
                    <p className="text-text-secondary font-medium mb-10 leading-relaxed px-4">
                        {t("providerServices.success.message")}
                    </p>
                    <button
                        onClick={() => router.push("/provider/services")}
                        className="w-full py-5 bg-gray-900 text-white font-black rounded-3xl hover:bg-primary transition-all flex items-center justify-center gap-3 active:scale-95 transition-all duration-200"
                    >
                        {t("providerServices.success.back")} <ChevronRight className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-muted/30 min-h-screen pb-20">
            <div className="max-w-4xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="mb-12">
                    <Link
                        href="/provider/services"
                        className="inline-flex items-center gap-2 text-text-hint hover:text-primary font-bold text-sm mb-6 group transition-colors"
                    >
                        <ChevronLeft className={`w-4 h-4 ${isRTL ? "rotate-180 group-hover:translate-x-1" : "group-hover:-translate-x-1"} transition-transform`} /> {t("common.back")}
                    </Link>
                    <h1 className={`${unbounded.className} text-4xl font-black text-foreground mb-4`}>{t("providerServices.addTitle")}</h1>
                    <p className="text-text-secondary font-medium">{t("providerServices.addSubtitle")}</p>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-between mb-16 relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />
                    {getSteps(t).map((step) => {
                        const Icon = step.icon;
                        const isCompleted = currentStep > step.id;
                        const isActive = currentStep === step.id;

                        return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center">
                                <div
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${isCompleted ? "bg-primary border-primary text-white" :
                                        isActive ? "bg-white border-primary text-primary shadow-lg shadow-primary/20 scale-110" :
                                            "bg-white border-border text-text-hint"
                                        }`}
                                >
                                    {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span className={`absolute top-16 whitespace-nowrap text-[10px] font-black uppercase tracking-widest ${isActive ? "text-primary" : "text-text-hint"
                                    }`}>
                                    {step.title}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Form Content */}
                <form onSubmit={(e) => e.preventDefault()} autoComplete="off" className="bg-card rounded-[40px] border border-border shadow-sm hover:shadow-md transition-all duration-300 p-8 md:p-12">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-hint uppercase tracking-widest flex items-center gap-2">
                                            <Tag className="w-3 h-3" /> {t("providerServices.form.name")}
                                        </label>
                                        <input
                                            type="text"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            autoComplete="nope"
                                            className={`w-full px-6 py-4 bg-muted border rounded-2xl text-sm font-bold focus:ring-4 transition-all ${errors.name ? "border-red-500 ring-red-500/10" : "border-border focus:ring-primary/5 focus:border-primary/30"
                                                }`}
                                            placeholder="e.g., Deep Home Cleaning"
                                        />
                                        {errors.name && <p className="text-xs text-red-500 font-bold mt-1">{errors.name}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-hint uppercase tracking-widest flex items-center gap-2">
                                            <Briefcase className="w-3 h-3" /> Category
                                        </label>
                                        <select
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            className={`w-full px-6 py-4 bg-muted border rounded-2xl text-sm font-bold focus:ring-4 transition-all appearance-none ${errors.category ? "border-red-500 ring-red-500/10" : "border-border focus:ring-primary/5 focus:border-primary/30"
                                                }`}
                                        >
                                            <option value="">Select Category</option>
                                            {SERVICE_CATEGORIES.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        {errors.category && <p className="text-xs text-red-500 font-bold mt-1">{errors.category}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-hint uppercase tracking-widest flex items-center gap-2">
                                        <FileText className="w-3 h-3" /> Description
                                    </label>
                                    <textarea
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        rows={6}
                                        className={`w-full px-6 py-4 bg-muted border rounded-2xl text-sm font-bold focus:ring-4 transition-all resize-none ${errors.description ? "border-red-500 ring-red-500/10" : "border-border focus:ring-primary/5 focus:border-primary/30"
                                            }`}
                                        placeholder="Detailed description of your service (min 20 characters)..."
                                    />
                                    <div className="flex justify-end">
                                        <span className={`text-[10px] font-black uppercase ${form.description.length >= 20 ? "text-green-500" : "text-text-hint"}`}>
                                            {form.description.length} / 20 min
                                        </span>
                                    </div>
                                    {errors.description && <p className="text-xs text-red-500 font-bold mt-1">{errors.description}</p>}
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-hint uppercase tracking-widest flex items-center gap-2">
                                            <DollarSign className="w-3 h-3" /> Price Range (PKR)
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={form.priceMin}
                                                onChange={(e) => setForm({ ...form, priceMin: e.target.value })}
                                                autoComplete="nope"
                                                className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-bold"
                                                placeholder="Min"
                                            />
                                            <span className="text-text-hint font-black">-</span>
                                            <input
                                                type="number"
                                                value={form.priceMax}
                                                onChange={(e) => setForm({ ...form, priceMax: e.target.value })}
                                                autoComplete="nope"
                                                className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-bold"
                                                placeholder="Max"
                                            />
                                        </div>
                                        {errors.priceMin || errors.priceMax ? <p className="text-xs text-red-500 font-bold mt-1">{errors.priceMin || errors.priceMax}</p> : null}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-hint uppercase tracking-widest flex items-center gap-2">
                                            <Briefcase className="w-3 h-3" /> Experience
                                        </label>
                                        <input
                                            type="text"
                                            value={form.experience}
                                            onChange={(e) => setForm({ ...form, experience: e.target.value })}
                                            autoComplete="nope"
                                            className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-bold"
                                            placeholder="e.g., 5 years"
                                        />
                                        {errors.experience && <p className="text-xs text-red-500 font-bold mt-1">{errors.experience}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-hint uppercase tracking-widest flex items-center gap-2">
                                            <MapPin className="w-3 h-3" /> {t("providerServices.form.location")}
                                        </label>
                                        <input
                                            type="text"
                                            value={form.location}
                                            onChange={(e) => setForm({ ...form, location: e.target.value })}
                                            autoComplete="nope"
                                            className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-bold"
                                            placeholder="City (e.g., Haripur)"
                                        />
                                        {errors.location && <p className="text-xs text-red-500 font-bold mt-1">{errors.location}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-hint uppercase tracking-widest flex items-center gap-2">
                                            <Info className="w-3 h-3" /> {t("providerServices.form.coverage")}
                                        </label>
                                        <input
                                            type="text"
                                            value={form.coverageArea}
                                            onChange={(e) => setForm({ ...form, coverageArea: e.target.value })}
                                            autoComplete="nope"
                                            className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-bold"
                                            placeholder="e.g., Khalabat, Hattar"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-hint uppercase tracking-widest flex items-center gap-2">
                                        <CalendarIcon className="w-3 h-3" /> Available Days
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {DAYS.map(day => (
                                            <button
                                                key={day}
                                                onClick={() => toggleDay(day)}
                                                className={`px-6 py-3 rounded-xl text-xs font-bold transition-all border ${form.availabilityDays.includes(day)
                                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                                    : "bg-muted border-border text-text-hint hover:border-primary/30"
                                                    }`}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.days && <p className="text-xs text-red-500 font-bold mt-1">{errors.days}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-hint uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> Start Time
                                        </label>
                                        <input
                                            type="time"
                                            value={form.startTime}
                                            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                                            className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-bold"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-text-hint uppercase tracking-widest flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> End Time
                                        </label>
                                        <input
                                            type="time"
                                            value={form.endTime}
                                            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                                            className="w-full px-6 py-4 bg-muted border border-border rounded-2xl text-sm font-bold"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 4 && (
                            <motion.div
                                key="step4"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-hint uppercase tracking-widest flex items-center gap-2">
                                        <Image className="w-3 h-3" /> Service Images (Optional)
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                        {images.map((img, i) => (
                                            <div key={i} className="aspect-square relative rounded-3xl overflow-hidden border border-border group">
                                                <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                <button
                                                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                                                >
                                                    <X className="w-6 h-6 text-white" />
                                                </button>
                                            </div>
                                        ))}
                                        {images.length < 5 && (
                                            <button
                                                onClick={handleImageAdd}
                                                className="aspect-square rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-text-hint hover:border-primary hover:text-primary transition-all active:scale-95 transition-all duration-200"
                                            >
                                                <Upload className="w-6 h-6" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Add Image</span>
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-black text-text-hint uppercase tracking-widest">{images.length} / 5 Images</p>
                                </div>

                                <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center shrink-0">
                                            <Info className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-primary mb-1">Final Review</h4>
                                            <p className="text-xs font-medium text-text-secondary leading-relaxed">
                                                Please Ensure all information is accurate. Once submitted, your service will be reviewed by our team. You&apos;ll be notified via email about the status.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="mt-16 flex items-center justify-between gap-4 pt-12 border-t border-border">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1 || isSubmitting}
                            className={`px-10 py-5 rounded-3xl text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-all ${currentStep === 1 ? "opacity-0 invisible" : "bg-muted text-text-hint hover:bg-border active:scale-95 transition-all duration-200"
                                }`}
                        >
                            <ChevronLeft className="w-5 h-5" /> Back
                        </button>

                        {currentStep < 4 ? (
                            <button
                                onClick={() => handleNext()}
                                className="px-12 py-5 bg-gray-900 text-white rounded-3xl text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary transition-all active:scale-95 shadow-lg shadow-black/5 hover:shadow-primary/20 transition-all duration-200"
                            >
                                {t("common.next")} <ChevronRight className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
                            </button>
                        ) : (
                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleSubmit(true)}
                                    disabled={isSubmitting}
                                    className="px-8 py-5 bg-muted text-text-hint rounded-3xl text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:bg-border transition-all active:scale-95 disabled:opacity-70 transition-all duration-200"
                                >
                                    Save as Draft
                                </button>
                                <button
                                    onClick={() => handleSubmit(false)}
                                    disabled={isSubmitting}
                                    className="px-12 py-5 bg-primary text-white rounded-3xl text-sm font-black uppercase tracking-widest flex items-center gap-2 hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-primary/20 disabled:opacity-70 transition-all duration-200"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> {t("verification.submitting")}</>
                                    ) : (
                                        <><Send className="w-5 h-5" /> {t("providerServices.form.submit")}</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AddServicePage() {
    return (
        <Suspense fallback={<div className="flex-1 bg-muted/30 min-h-screen flex items-center justify-center p-6"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <AddServiceContent />
        </Suspense>
    );
}

