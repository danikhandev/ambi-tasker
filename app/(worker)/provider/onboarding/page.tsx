"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  CreditCard,
  FileText,
  MapPin,
  Phone,
  Briefcase,
  ShieldCheck,
  ClipboardCheck,
  Layers,
  Shield,
  Info,
  User,
  LogOut,
  Sparkles,
  Navigation,
  ChevronDown,
  ShieldAlert
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { unbounded } from "@/app/fonts";
import { SERVICE_CATEGORIES } from "@/constants/services";
import { ENABLED_DISTRICTS, DEFAULT_DISTRICT, getCitiesForDistrict, getAreasForCity, HARIPUR_AREAS } from "@/constants/locations";
import LocationSelector from "@/components/LocationSelector";
import CameraCapture from "@/components/CameraCapture";
import { useTranslation } from "@/hooks/useTranslation";
import { uploadImage } from "@/services/supabase-storage";
import { useUI } from "@/contexts/UIContext";

const STEPS = [
  { id: 'personal', labelKey: 'providerOnboarding.personal' },
  { id: 'selfie', labelKey: 'providerOnboarding.selfie' },
  { id: 'cnic_front', labelKey: 'providerOnboarding.cnicFront' },
  { id: 'cnic_back', labelKey: 'providerOnboarding.cnicBack' },
  { id: 'location_bio', labelKey: 'providerOnboarding.locationBio' },
  { id: 'category_services', labelKey: 'providerOnboarding.categoryServices' },
  { id: 'review', labelKey: 'providerOnboarding.review' }
];

export default function ProviderOnboardingPage() {
  const { t, isRTL } = useTranslation();
  const { user, logout } = useUser();
  const { showToast } = useUI();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(STEPS[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState("");
  const [showExitModal, setShowExitModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    gender: "",
    phoneNumber: "",
    district: DEFAULT_DISTRICT,
    city: "",
    area: "",
    address: "",
    experience: "",
    category: "",
    bio: "",
    selfieImage: null as string | null,
    cnicFrontImage: null as string | null,
    cnicBackImage: null as string | null,
  });

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  // Ensure scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep]);

  const isStepValid = (stepId: string) => {
    switch (stepId) {
      case "personal":
        const cleanPhone = formData.phoneNumber.replace(/[\s-]/g, '');
        return formData.firstName.trim() !== "" &&
          formData.lastName.trim() !== "" &&
          /^(\+92|0|92)[0-9]{10}$/.test(cleanPhone) &&
          formData.gender !== "";
      case "selfie":
        return !!formData.selfieImage;
      case "cnic_front":
        return !!formData.cnicFrontImage;
      case "cnic_back":
        return !!formData.cnicBackImage;
      case "location_bio":
        return !!formData.district &&
          !!formData.area &&
          formData.address.trim() !== "" &&
          formData.bio.trim().length >= 20 &&
          !!formData.experience;
      case "category_services":
        return !!formData.category;
      case "review":
        const cleanP = formData.phoneNumber.replace(/[\s-]/g, '');
        return formData.firstName.trim() !== "" &&
          formData.lastName.trim() !== "" &&
          /^(\+92|0|92)[0-9]{10}$/.test(cleanP) &&
          !!formData.selfieImage &&
          !!formData.cnicFrontImage &&
          !!formData.cnicBackImage &&
          !!formData.category;
      default:
        return true;
    }
  };

  const validateStep = (stepId: string) => {
    setError("");
    if (!isStepValid(stepId)) {
      switch (stepId) {
        case "personal":
          const cleanPhone = formData.phoneNumber.replace(/[\s-]/g, '');
          if (formData.firstName.trim() === "" || formData.lastName.trim() === "" || formData.gender === "") {
            setError(t("auth.firstLastNameRequired") || "Please complete all personal identification fields");
          } else if (!/^(\+92|0|92)[0-9]{10}$/.test(cleanPhone)) {
            setError(t("auth.invalidPhone") || "Invalid format. Use +92-XXX-XXXXXXX or 03XX-XXXXXXX");
          }
          break;
        case "selfie":
          setError(t("providerOnboarding.steps.selfieMandatory") || "A live biometric selfie is mandatory for account verification");
          break;
        case "cnic_front":
          setError(t("providerOnboarding.steps.cnicFrontRequired") || "Clear scan of CNIC front is required for identity matching");
          break;
        case "cnic_back":
          setError(t("providerOnboarding.steps.cnicBackRequired") || "Clear scan of CNIC back (address side) is required");
          break;
        case "location_bio":
          if (formData.bio.trim().length < 20) {
            setError(t("providerOnboarding.steps.bioTooShort") || "Your professional bio must be at least 20 characters long");
          } else {
            setError(t("auth.selectDistrict") || "Please specify your district, area, and work address");
          }
          break;
        case "category_services":
          setError(t("auth.selectSpecialization") || "Please select your primary trade from the available categories");
          break;
      }
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const nextIdx = currentStepIndex + 1;
      if (nextIdx < STEPS.length) {
        setCurrentStep(STEPS[nextIdx].id);
      }
    }
  };

  const handlePrev = () => {
    const prevIdx = currentStepIndex - 1;
    if (prevIdx >= 0) {
      setCurrentStep(STEPS[prevIdx].id);
    } else {
      setShowExitModal(true);
    }
  };

  const handleImageCapture = async (stepId: string, base64Image: string) => {
    try {
      setIsUploading(true);
      setError("");

      const response = await fetch(base64Image);
      const blob = await response.blob();
      
      let filePath = "";
      let stateKey = "";
      
      if (stepId === "selfie") {
        filePath = `${user?.id || 'guest'}/onboarding/selfie`;
        stateKey = "selfieImage";
      } else if (stepId === "cnic_front") {
        filePath = `${user?.id || 'guest'}/onboarding/cnic_front`;
        stateKey = "cnicFrontImage";
      } else if (stepId === "cnic_back") {
        filePath = `${user?.id || 'guest'}/onboarding/cnic_back`;
        stateKey = "cnicBackImage";
      }

      const publicUrl = await uploadImage(blob, 'verifications', filePath);
      
      setFormData(prev => ({ ...prev, [stateKey]: publicUrl }));
      showToast(t("settings.imageCaptured") || "Image uploaded and verified!", "success");
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(t("common.error") || "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitAll = async () => {
    if (!validateStep(currentStep)) return;
    setIsSubmitting(true);
    setError("");

    try {
      // 1. Prepare data (images are already uploaded and are now URLs)
      const submissionData = {
        ...formData,
        // The API expects either File or URL, but our updated API handles both if we modify it.
        // Actually, let's keep the API consistent or modify it to take URLs.
      };

      const res = await fetch("/api/provider/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const data = await res.json();

      if (data.success) {
        setIsFinished(true);
      } else {
        setError(data.error || "Submission failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setError("Connection error. Please check your internet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const getStepHint = (stepId: string) => {
    switch (stepId) {
      case "personal": return t("providerOnboarding.hints.personal");
      case "selfie": return t("providerOnboarding.hints.selfie");
      case "cnic_front": return t("providerOnboarding.hints.cnicFront");
      case "cnic_back": return t("providerOnboarding.hints.cnicBack");
      case "location_bio": return t("providerOnboarding.hints.locationBio");
      case "category_services": return t("providerOnboarding.hints.categoryServices");
      case "review": return t("providerOnboarding.hints.review");
      default: return "";
    }
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-card flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center mb-10 shadow-md border border-border/50 hover:shadow-lg shadow-green-100"
        >
          <CheckCircle className="w-16 h-16 text-green-600" />
        </motion.div>
        <h1 className={`${unbounded.className} text-4xl font-black text-foreground mb-6 tracking-tighter leading-tight`}>
          {t("providerOnboarding.applicationVerified").split(' ')[0]}<br />{t("providerOnboarding.applicationVerified").split(' ')[1]}
        </h1>
        <div className="bg-primary/5 px-8 py-4 rounded-[32px] flex items-center gap-3 border border-primary/10 mb-10">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <p className="text-primary font-black text-xs uppercase tracking-[0.2em]">
            {t("providerOnboarding.onboardingComplete")}
          </p>
        </div>
        <p className="text-text-secondary font-medium max-w-md mx-auto mb-16 leading-relaxed text-lg">
          {t("providerOnboarding.reviewMessage")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Link
            href="/provider/dashboard"
            className="flex-1 py-5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-md border border-border/50 hover:shadow-lg flex items-center justify-center gap-3 group hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
          >
            {t("providerOnboarding.dashboard")}
            <ChevronRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${isRTL ? "rotate-180" : ""}`} />
          </Link>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case "personal":
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            <div className="p-8 bg-card rounded-[40px] border border-border/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-5 mb-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group">
                  <User className="w-7 h-7 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className={`${unbounded.className} text-xl font-black text-foreground`}>{t("providerOnboarding.steps.personalTitle")}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">{t("providerOnboarding.steps.personalSubtitle")}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-hint ml-2">{t("providerOnboarding.steps.firstName")}</label>
                  <div className="relative group/input">
                    <User className={`absolute ${isRTL ? "right-6" : "left-6"} top-1/2 -translate-y-1/2 w-5 h-5 text-text-hint group-focus-within/input:text-primary transition-colors`} />
                    <input
                      type="text"
                      autoComplete="nope"
                      className={`w-full ${isRTL ? "pr-16 pl-6" : "pl-16 pr-6"} py-5 bg-muted/40 border border-border/60 rounded-[20px] focus:bg-card focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all font-bold text-foreground text-md outline-none`}
                      value={formData.firstName}
                      placeholder={t("providerOnboarding.steps.firstName")}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-hint ml-2">{t("providerOnboarding.steps.lastName")}</label>
                  <div className="relative group/input">
                    <User className={`absolute ${isRTL ? "right-6" : "left-6"} top-1/2 -translate-y-1/2 w-5 h-5 text-text-hint group-focus-within/input:text-primary transition-colors`} />
                    <input
                      type="text"
                      autoComplete="nope"
                      className={`w-full ${isRTL ? "pr-16 pl-6" : "pl-16 pr-6"} py-5 bg-muted/40 border border-border/60 rounded-[20px] focus:bg-card focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all font-bold text-foreground text-md outline-none`}
                      value={formData.lastName}
                      placeholder={t("providerOnboarding.steps.lastName")}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-hint ml-2">{t("providerOnboarding.steps.phoneNumber")}</label>
                  <div className="relative group/input">
                    <Phone className={`absolute ${isRTL ? "right-6" : "left-6"} top-1/2 -translate-y-1/2 w-5 h-5 text-text-hint group-focus-within/input:text-primary transition-colors`} />
                    <input
                      type="tel"
                      autoComplete="nope"
                      placeholder="+92 3XX XXXXXXX"
                      className={`w-full ${isRTL ? "pr-16 pl-6" : "pl-16 pr-6"} py-5 bg-muted/40 border border-border/60 rounded-[20px] focus:bg-card focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all font-bold text-foreground text-md outline-none`}
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-hint ml-2">{t("providerOnboarding.steps.gender")}</label>
                  <div className="flex gap-4">
                    {['male', 'female', 'other'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: g })}
                        className={`flex-1 py-5 rounded-[20px] border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.gender === g
                          ? "border-primary bg-primary/5 text-primary shadow-lg shadow-primary/5 scale-[1.02]"
                          : "border-border/60 bg-muted/20 text-text-hint hover:border-border hover:bg-muted/40"
                          }`}
                      >
                        {t(`common.${g}`) || g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case "selfie":
        return (
          <motion.div key="selfie" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="bg-amber-50 rounded-[32px] p-6 border border-amber-100 mb-8 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-amber-500 flex-shrink-0 shadow-sm">
                <Info size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-xs uppercase tracking-widest text-amber-800">{t("providerOnboarding.steps.selfieTitle")}</h4>
                <p className="text-sm text-amber-700 font-medium leading-relaxed">{t("providerOnboarding.steps.selfieDesc")}</p>
              </div>
            </div>

            {!formData.selfieImage ? (
              <CameraCapture
                type="selfie"
                allowUpload={false}
                onCapture={(img) => handleImageCapture("selfie", img)}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-1 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-[48px] overflow-hidden"
              >
                <div className="p-10 bg-card rounded-[46px] border border-white/40 shadow-2xl relative text-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-green-500 mx-auto mb-6 shadow-xl relative bg-card">
                    <Image
                      src={formData.selfieImage || "/default-avatar.svg"}
                      alt="Selfie"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-green-500/10 mix-blend-overlay" />
                  </div>
                  <h3 className={`${unbounded.className} text-xl font-black text-foreground mb-2`}>{t("providerOnboarding.steps.identityVerified")}</h3>
                  <p className="text-text-hint text-xs font-bold uppercase tracking-widest mb-8">{t("providerOnboarding.steps.biometricMatch")}</p>

                  <button
                    onClick={() => setFormData(prev => ({ ...prev, selfieImage: "" }))}
                    className="px-8 py-4 bg-muted text-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-3 mx-auto"
                  >
                    <ArrowLeft size={14} className={isRTL ? "rotate-180" : ""} />
                    {t("providerOnboarding.steps.retakePhoto")}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      case "cnic_front":
      case "cnic_back":
        const isFront = currentStep === "cnic_front";
        const cnicImg = isFront ? formData.cnicFrontImage : formData.cnicBackImage;
        return (
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <div className="bg-blue-50 rounded-[32px] p-6 border border-blue-100 mb-8 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-500 flex-shrink-0 shadow-sm">
                <CreditCard size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-xs uppercase tracking-widest text-blue-800">
                  {isFront ? t("providerOnboarding.steps.cnicFrontTitle") : t("providerOnboarding.steps.cnicBackTitle")}
                </h4>
                <p className="text-sm text-blue-700 font-medium leading-relaxed">
                  {isFront ? t("providerOnboarding.steps.cnicFrontDesc") : t("providerOnboarding.steps.cnicBackDesc")}
                </p>
              </div>
            </div>

            {!cnicImg ? (
              <CameraCapture
                type={isFront ? "cnic-front" : "cnic-back"}
                allowUpload={false}
                onCapture={(img) => handleImageCapture(currentStep, img)}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-1 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-[42px] overflow-hidden"
              >
                <div className="p-10 bg-card rounded-[40px] border border-white/40 shadow-2xl relative text-center">
                  <div className="w-72 aspect-video rounded-3xl overflow-hidden border-4 border-blue-500 mx-auto mb-8 shadow-xl relative bg-black">
                    <Image
                      src={cnicImg || "/default-avatar.svg"}
                      alt="CNIC"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-blue-500/10 mix-blend-overlay" />
                  </div>
                  <h3 className={`${unbounded.className} text-xl font-black text-foreground mb-2`}>{t("providerOnboarding.steps.documentCaptured")}</h3>
                  <p className="text-text-hint text-xs font-bold uppercase tracking-widest mb-10">{t("providerOnboarding.steps.scanQualityVerified")}</p>

                  <button
                    onClick={() => setFormData(prev => ({ ...prev, [isFront ? 'cnicFrontImage' : 'cnicBackImage']: "" }))}
                    className="px-8 py-4 bg-muted text-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-3 mx-auto"
                  >
                    <ArrowLeft size={14} className={isRTL ? "rotate-180" : ""} />
                    {t("providerOnboarding.steps.retakeScan")}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      case "location_bio":
        return (
          <motion.div key="location_bio" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
            <div className="p-8 bg-card rounded-[40px] border border-border/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-5 mb-10">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 group">
                  <MapPin className="w-7 h-7 group-hover:translate-y-[-2px] transition-transform" />
                </div>
                <div>
                  <h3 className={`${unbounded.className} text-xl font-black text-foreground`}>{t("providerOnboarding.steps.regionTitle")}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">{t("providerOnboarding.steps.regionSubtitle")}</p>
                </div>
              </div>

              <div className="mb-8">
                <LocationSelector
                  value={{ districtName: formData.district, areaName: formData.area }}
                  onChange={(loc) => setFormData({ ...formData, district: loc.districtName || "", area: loc.areaName || "" })}
                  fields={["district", "area"]}
                />
              </div>

              <div className="space-y-3 mb-10">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-hint ml-2">{t("providerOnboarding.steps.workAddress")}</label>
                <div className="relative group">
                  <div className={`absolute ${isRTL ? "right-6" : "left-6"} top-1/2 -translate-y-1/2 w-10 h-10 bg-white shadow-sm border border-border/40 rounded-xl flex items-center justify-center text-text-hint group-focus-within:text-teal-600 group-focus-within:border-teal-500/30 transition-all`}>
                    <MapPin size={18} />
                  </div>
                  <input
                    type="text"
                    autoComplete="nope"
                    placeholder="e.g. House #123, Sector G-11/2..."
                    className={`w-full ${isRTL ? "pr-20 pl-6" : "pl-20 pr-6"} py-5 bg-muted/30 border border-border/60 rounded-[24px] focus:bg-card focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/5 transition-all font-bold text-foreground text-md outline-none`}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-text-hint ml-2">{t("providerOnboarding.steps.workExperience")}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { val: '< 1 Year', key: 'expLess1' },
                    { val: '1–3 Years', key: 'exp1to3' },
                    { val: '3–5 Years', key: 'exp3to5' },
                    { val: '5+ Years', key: 'expMore5' }
                  ].map(exp => (
                    <button
                      key={exp.val}
                      type="button"
                      onClick={() => setFormData({ ...formData, experience: exp.val })}
                      className={`py-4 rounded-[20px] border-2 font-black text-[10px] uppercase tracking-widest transition-all duration-300 ${formData.experience === exp.val
                        ? "border-teal-500 bg-teal-500/5 text-teal-600 shadow-md shadow-teal-500/5 scale-[1.02]"
                        : "border-border/50 bg-muted/20 text-text-hint hover:border-border hover:bg-muted/40"
                        }`}
                    >
                      {t(`providerOnboarding.steps.${exp.key}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-hint ml-2">{t("providerOnboarding.steps.bioTitle")}</label>
                <div className="relative group">
                  <textarea
                    rows={4}
                    placeholder={t("providerOnboarding.steps.bioPlaceholder")}
                    className="w-full px-8 py-6 bg-muted/30 border border-border/60 rounded-[32px] focus:bg-card focus:border-primary/30 focus:ring-4 focus:ring-primary/5 transition-all font-medium text-foreground text-md resize-none leading-relaxed outline-none"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  />
                  <div className={`absolute bottom-6 ${isRTL ? "left-8" : "right-8"} text-[9px] font-black uppercase tracking-widest transition-colors ${formData.bio.length >= 20 ? 'text-green-500' : 'text-text-disabled'}`}>
                    {formData.bio.length} / 20 {t("providerOnboarding.steps.minChars")}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case "category_services":
        return (
          <motion.div key="category_services" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-10">
            <div className="p-8 bg-card rounded-[40px] border border-border/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

              <div className="flex items-center gap-5 mb-10">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 group">
                  <Briefcase className="w-7 h-7 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className={`${unbounded.className} text-xl font-black text-foreground`}>{t("providerOnboarding.steps.expertiseTitle")}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">{t("providerOnboarding.steps.expertiseSubtitle")}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {SERVICE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setFormData({ ...formData, category: cat.name })}
                    className={`relative p-8 rounded-[42px] border-2 transition-all duration-500 flex flex-col items-start text-left group overflow-hidden ${formData.category === cat.name
                      ? "border-primary bg-primary/[0.03] shadow-[0_32px_64px_-16px_rgba(79,70,229,0.2)] scale-[1.02] z-10"
                      : "border-border/50 bg-card hover:border-primary/20 hover:bg-muted/30"
                      }`}
                  >
                    {formData.category === cat.name && (
                      <motion.div
                        layoutId="activeCategoryBg"
                        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-[40px]"
                      />
                    )}

                    <div className="flex w-full items-start justify-between mb-8 relative z-10">
                      <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-500 shadow-sm border border-border/40 group-hover:scale-110 ${cat.color} font-black`}>
                        <cat.icon size={28} />
                      </div>
                      {cat.stats && (
                        <div className={`flex flex-col ${isRTL ? "items-start" : "items-end"}`}>
                          <span className="text-[10px] font-black text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100/50">+{cat.stats.growth}% {t("services.growth")}</span>
                        </div>
                      )}
                    </div>

                    <div className="relative z-10">
                      <h4 className={`${unbounded.className} text-lg font-black text-foreground mb-1 group-hover:text-primary transition-colors ${isRTL ? "text-right" : "text-left"}`}>{t(`categories.${cat.id}.name`)}</h4>
                      <p className={`text-[10px] text-text-hint font-medium leading-relaxed mb-6 line-clamp-2 ${isRTL ? "text-right" : "text-left"}`}>{t(`categories.${cat.id}.desc`)}</p>

                      <div className={`flex items-center gap-4 ${isRTL ? "flex-row-reverse" : ""}`}>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-widest text-text-hint">{t("services.availableJobs")}</span>
                          <span className="text-sm font-black text-foreground">{cat.stats?.activeJobs}+</span>
                        </div>
                        <div className="w-px h-8 bg-border/60" />
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-widest text-text-hint">{t("services.activePros")}</span>
                          <span className="text-sm font-black text-foreground">{(cat.stats?.totalWorkers || 0) / 100}k+</span>
                        </div>
                      </div>
                    </div>

                    {/* Decorative selection indicator */}
                    <div className={`absolute bottom-6 right-6 w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 ${formData.category === cat.name ? "bg-primary border-primary text-white scale-100" : "border-border/40 bg-muted/20 text-transparent scale-50 opacity-0"}`}>
                      <CheckCircle size={20} />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-12 p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100/50 flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                  <Layers size={22} />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-[10px] uppercase tracking-widest text-indigo-800 mb-1">{t("providerOnboarding.steps.serviceIntelligence")}</h4>
                  <p className="text-xs text-indigo-700/80 font-medium leading-relaxed">{t("providerOnboarding.steps.serviceIntelligenceDesc")}</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      case "review":
        return (
          <motion.div key="review" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
            <div className="p-8 bg-card rounded-[40px] border border-border/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="flex items-center gap-5 mb-12">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group">
                  <ClipboardCheck className="w-7 h-7 group-hover:rotate-6 transition-transform" />
                </div>
                <div>
                  <h3 className={`${unbounded.className} text-xl font-black text-foreground`}>{t("providerOnboarding.steps.finalAuth")}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">{t("providerOnboarding.steps.encryptedSubmission")}</p>
                </div>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-muted/20 border border-border/40 rounded-[30px] relative overflow-hidden group hover:bg-muted/30 transition-colors">
                    <div className={`absolute top-4 ${isRTL ? "left-6" : "right-6"} text-[8px] font-black text-text-hint/40 uppercase tracking-[0.3em]`}>{t("providerOnboarding.steps.identityBio")}</div>
                    <div className="flex items-center gap-5">
                      {formData.selfieImage ? (
                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-xl relative bg-card">
                          <Image
                            src={formData.selfieImage}
                            alt="S"
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-text-hint"><User size={24} /></div>
                      )}
                      <div>
                        <p className="text-md font-black text-foreground">{formData.firstName} {formData.lastName}</p>
                        <p className="text-[11px] font-black text-primary uppercase tracking-widest mt-0.5">{formData.phoneNumber}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-muted/20 border border-border/40 rounded-[30px] relative overflow-hidden group hover:bg-muted/30 transition-colors">
                    <div className={`absolute top-4 ${isRTL ? "left-6" : "right-6"} text-[8px] font-black text-text-hint/40 uppercase tracking-[0.3em]`}>{t("providerOnboarding.steps.tradeProfile")}</div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-border/40 text-primary">
                        <Briefcase size={22} />
                      </div>
                      <div>
                        <h4 className="text-md font-black text-foreground">{formData.category || "Not selected"}</h4>
                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-0.5">{formData.experience || "No experience info"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-muted/20 border border-border/40 rounded-[30px] relative overflow-hidden group hover:bg-muted/30 transition-colors">
                  <div className={`absolute top-4 ${isRTL ? "left-6" : "right-6"} text-[8px] font-black text-text-hint/40 uppercase tracking-[0.3em]`}>{t("providerOnboarding.steps.operationalBase")}</div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-border/40 text-text-hint mt-1">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground mt-0.5">{formData.area}, {formData.district}</p>
                      <p className="text-xs text-text-secondary font-medium leading-relaxed max-w-sm">{formData.address}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-muted/20 border border-border/40 rounded-[30px] relative overflow-hidden group hover:bg-muted/30 transition-colors">
                  <div className={`absolute top-4 ${isRTL ? "left-6" : "right-6"} text-[8px] font-black text-text-hint/40 uppercase tracking-[0.3em]`}>{t("providerOnboarding.steps.documentProofs")}</div>
                  <div className="flex gap-3">
                    {formData.cnicFrontImage && (
                      <div className="flex-1 aspect-video rounded-2xl bg-black border-2 border-white shadow-xl overflow-hidden relative group/img">
                        <Image
                          src={formData.cnicFrontImage}
                          alt="F"
                          fill
                          className="object-cover group-hover/img:scale-110 transition-transform duration-700"
                        />
                        <div className={`absolute top-2 ${isRTL ? "right-2" : "left-2"} px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[7px] font-black text-white uppercase tracking-widest`}>{t("providerOnboarding.steps.frontView")}</div>
                      </div>
                    )}
                    {formData.cnicBackImage && (
                      <div className="flex-1 aspect-video rounded-2xl bg-black border-2 border-white shadow-xl overflow-hidden relative group/img">
                        <Image
                          src={formData.cnicBackImage}
                          alt="B"
                          fill
                          className="object-cover group-hover/img:scale-110 transition-transform duration-700"
                        />
                        <div className={`absolute top-2 ${isRTL ? "right-2" : "left-2"} px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[7px] font-black text-white uppercase tracking-widest`}>{t("providerOnboarding.steps.reverseView")}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-8 bg-gray-950 rounded-[32px] text-white flex items-center justify-between group overflow-hidden relative">
                  <div className="absolute -top-12 -right-12 p-2 opacity-5 scale-150 group-hover:rotate-12 group-hover:scale-[1.6] transition-all duration-1000">
                    <ShieldCheck size={200} />
                  </div>
                  <div className="relative z-10 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <Shield className="text-primary-light" size={28} />
                    </div>
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-[0.4em] mb-1">{t("providerOnboarding.steps.authenticatedEntry")}</h4>
                      <p className="text-[10px] text-white/50 font-medium tracking-widest">{t("providerOnboarding.steps.encryptionStatus")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 relative z-10">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-none">{t("dashboard.liveStatus")}</span>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 selection:bg-primary/10 selection:text-primary">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-3xl border-b border-border transition-all duration-300">
        <div className="max-w-3xl mx-auto px-6 h-24 flex items-center justify-between">
          <button
            onClick={handlePrev}
            className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center text-text-hint hover:text-foreground hover:bg-muted transition-all group active:scale-95 duration-200"
          >
            <ArrowLeft size={18} className={`group-hover:${isRTL ? "translate-x-1" : "-translate-x-1"} transition-transform ${isRTL ? "rotate-180" : ""}`} />
          </button>

          <div className="flex flex-col items-center">
            <h1 className={`${unbounded.className} text-[10px] font-black uppercase tracking-[0.3em] text-text-hint mb-1`}>{t("providerOnboarding.steps.personalSubtitle").split(':')[1].trim()}</h1>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 bg-primary/10 rounded-full">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                  {t("auth.stepOf")} {currentStepIndex + 1} <span className="text-primary/40 mx-1">/</span> {STEPS.length}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-100/50 shadow-sm active:scale-95 duration-200"
            title="Exit"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Progress System - Premium Version */}
        <div className="w-full h-1 bg-muted relative overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="h-full bg-primary relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            <div className="absolute top-0 right-0 w-16 h-full bg-primary blur-md" />
          </motion.div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-16">
        {/* Left Side: Step Guide (Desktop) */}
        <div className="hidden lg:block lg:col-span-3 sticky top-40 space-y-6">
          <div className="p-8 bg-card rounded-[32px] border border-border/60 shadow-sm relative overflow-hidden">
            <div className={`absolute top-0 ${isRTL ? "left-0" : "right-0"} w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 ${isRTL ? "-translate-x-1/2" : "translate-x-1/2"}`} />
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-hint mb-6 flex items-center gap-2">
              <ShieldCheck size={12} className="text-primary" />
              {t("common.verified")}
            </h4>
            <div className="space-y-4">
              {STEPS.map((step, i) => (
                <div key={step.id} className="flex items-start gap-4 group">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${i < currentStepIndex ? "bg-green-500 border-green-500 text-white" :
                    i === currentStepIndex ? "border-primary bg-primary/10 text-primary" :
                      "border-border text-text-hint/40"
                    }`}>
                    {i < currentStepIndex ? <CheckCircle size={10} strokeWidth={3} /> : <span className="text-[8px] font-black">{i + 1}</span>}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${i === currentStepIndex ? "text-foreground" : "text-text-hint/60"
                    }`}>
                    {t(step.labelKey)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-orange-600">Trust Level</p>
                  <p className="text-[10px] font-bold text-text-hint mt-0.5">Vetting Active</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-primary/5 rounded-[24px] border border-primary/10">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2">{t("onboarding.nextStep")}</p>
            <p className="text-sm font-bold text-primary">~ 4 {t("booking.time").toLowerCase()} {t("status.pending").toLowerCase()}</p>
          </div>
        </div>

        {/* Center: Main Content */}
        <div className="lg:col-span-9 space-y-14">
          <div className="text-center lg:text-left">
            {/* Step Guidance Chip */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={`hint-${currentStep}`}
              className="inline-flex items-center gap-3 px-6 py-3 bg-primary/5 border border-primary/10 rounded-2xl mb-8"
            >
              <Info size={14} className="text-primary shrink-0" />
              <p className="text-[10px] font-black text-primary/80 uppercase tracking-widest">
                {getStepHint(currentStep)}
              </p>
            </motion.div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h2 className={`${unbounded.className} text-4xl md:text-5xl font-black text-foreground tracking-tighter leading-[1.1]`}>
                  {t(STEPS[currentStepIndex].labelKey)}
                </h2>
                <p className="text-text-secondary text-lg font-medium max-w-lg leading-relaxed">
                  {currentStep === 'personal' && t("providerOnboarding.hints.personal")}
                  {currentStep === 'selfie' && t("providerOnboarding.hints.selfie")}
                  {currentStep === 'cnic_front' && t("providerOnboarding.hints.cnicFront")}
                  {currentStep === 'cnic_back' && t("providerOnboarding.hints.cnicBack")}
                  {currentStep === 'location_bio' && t("providerOnboarding.hints.locationBio")}
                  {currentStep === 'category_services' && t("providerOnboarding.hints.categoryServices")}
                  {currentStep === 'review' && t("providerOnboarding.hints.review")}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Global Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-5 bg-red-50 border border-red-100 text-red-600 rounded-[32px] mb-12 flex items-center gap-4 shadow-sm"
              >
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-red-500 shadow-sm border border-red-50 flex-shrink-0">
                  <AlertCircle size={24} />
                </div>
                <p className="font-black text-xs uppercase tracking-widest">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step Component View */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Action Controls Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-20 gap-8">
            <button
              onClick={handlePrev}
              type="button"
              className="order-2 sm:order-1 px-10 py-5 text-text-hint font-black text-xs uppercase tracking-[0.2em] hover:text-foreground hover:bg-muted/30 rounded-2xl transition-all active:scale-95 transition-all duration-200"
            >
              {currentStepIndex === 0 ? t("common.cancel") : t("common.back")}
            </button>

            {currentStep === "review" ? (
              <button
                onClick={handleSubmitAll}
                disabled={isSubmitting || !isStepValid(currentStep)}
                type="button"
                className="order-1 sm:order-2 w-full sm:w-auto min-w-[280px] p-6 bg-gray-900 text-white rounded-[32px] font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl hover:shadow-black/20 flex items-center justify-center gap-4 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed active:scale-95 group"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /> {t("common.loading")}</>
                ) : (
                  <>
                    <ClipboardCheck className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                    {t("providerOnboarding.review")}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!isStepValid(currentStep) || isUploading}
                type="button"
                className="order-1 sm:order-2 w-full sm:w-auto min-w-[240px] p-6 bg-primary text-white rounded-[32px] font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-4 group disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("common.continue")}
                {!isUploading && <ChevronRight size={22} className={`group-hover:${isRTL ? "-translate-x-1" : "translate-x-1"} transition-transform ${isRTL ? "rotate-180" : ""}`} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] p-6 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl" />
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-card max-w-sm w-full p-10 rounded-[48px] shadow-2xl border border-white relative z-10 text-center"
            >
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[36px] flex items-center justify-center mx-auto mb-8 border border-red-100 shadow-inner">
                <ShieldAlert size={48} />
              </div>
              <h3 className={`${unbounded.className} text-2xl font-black text-foreground mb-4 tracking-tighter leading-tight`}>{t("common.cancel")}?</h3>
              <p className="text-text-secondary font-medium mb-12 leading-relaxed text-sm">{t("providerOnboarding.hints.review")}</p>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gray-900/20"
                >
                  {t("providerOnboarding.steps.retakeScan")}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/provider/dashboard")}
                  className="w-full py-5 text-text-hint font-black text-xs uppercase tracking-[0.2em] hover:text-red-500 transition-all rounded-[24px]"
                >
                  {t("common.back")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <footer className="mt-20 py-12 border-t border-border/40 text-center px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-4 opacity-50 mb-6 group">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck size={16} className="text-primary group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-hint">Identity Trust Network</p>
          </div>
          <p className="text-[10px] text-text-disabled font-medium leading-[2]">By proceeding, you agree to AmbiTasker&apos;s Provider Compliance Policy and biometric data processing for identity validation purposes.</p>
        </div>
      </footer>
    </div >
  );
}
