"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Briefcase,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  CreditCard
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useTranslation } from "@/hooks/useTranslation";
import BackButton from "@/components/BackButton";
import LocationStep, { LocationStepData } from "@/components/auth/LocationStep";
import { SERVICE_CATEGORIES } from "@/constants/services";
import Logo from "@/components/ui/Logo";

export default function ProviderSignupPage() {
  const router = useRouter();
  const { t, isRTL } = useTranslation();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    cnic: "",
    password: "",
    confirmPassword: "",
    category: "",
  });
  const [locationData, setLocationData] = useState<LocationStepData | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateField = (name: string, value: string) => {
    let error = "";
    if (name === "firstName" || name === "lastName") {
      if (!value.trim()) error = t("auth.fieldRequired") || "Required";
    } else if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) error = t("auth.emailRequired") || "Required";
      else if (!emailRegex.test(value)) error = t("auth.invalidEmail") || "Invalid Email";
    } else if (name === "phone") {
      const phoneRegex = /^(\+92|0|92)?[0-9]{10}$/;
      if (!value) error = t("auth.phoneRequired") || "Required";
      else if (!phoneRegex.test(value.replace(/\s/g, ""))) error = "Invalid number";
    } else if (name === "cnic") {
      const cnicRegex = /^[0-9+]{5}-[0-9+]{7}-[0-9]{1}$/;
      if (value && !cnicRegex.test(value)) error = "Invalid CNIC format (e.g., 12345-1234567-1)";
    } else if (name === "password") {
      if (value.length < 8) error = t("auth.passwordTooShort") || "Too short";
    } else if (name === "confirmPassword") {
      if (value !== formData.password) error = t("auth.passwordsDoNotMatch") || "Mismatch";
    }
    
    setFieldErrors(prev => ({ ...prev, [name]: error }));
    if (error) setError("");
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, (formData as any)[name]);
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleNextStep = (e?: React.FormEvent) => {
    e?.preventDefault();
    // Mark all as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => allTouched[key] = true);
    setTouched(allTouched);

    // Validate all step 1 fields
    const errors: Record<string, string> = {};
    if (!formData.firstName.trim()) errors.firstName = "Required";
    if (!formData.lastName.trim()) errors.lastName = "Required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = t("auth.invalidEmail") || "Invalid Email";
    if (!formData.phone.trim()) errors.phone = "Required";
    if (formData.cnic && !/^[0-9+]{5}-[0-9+]{7}-[0-9]{1}$/.test(formData.cnic)) errors.cnic = "Invalid CNIC format";
    if (formData.password.length < 8) errors.password = t("auth.passwordTooShort") || "Too short";
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = t("auth.passwordsDoNotMatch") || "Mismatch";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setStep(2);
  };

  const handleLocationConfirm = (data: LocationStepData) => {
    setLocationData(data);
    setError("");
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationData) {
      setError("Please go back and select your location.");
      return;
    }
    if (!formData.category) {
      setError(t("auth.selectSpecialization") || "Please select a specialization");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          cnic: formData.cnic,
          role: 'provider',
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address: locationData.address,
          locationCity: locationData.city,
          locationArea: locationData.area,
          districtId: locationData.districtId,
          cityId: locationData.cityId,
          areaId: locationData.areaId,
          serviceRadius: locationData.serviceRadius,
          category: formData.category
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("auth.registrationFailed") || "Registration Failed");
      }

      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (t("auth.registrationFailed") || "Failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-muted relative overflow-hidden font-sans pt-12 pb-24"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2" />
      
      <div className="w-full max-w-6xl mx-auto px-4 relative z-10 flex flex-col lg:flex-row gap-16 items-start" dir="ltr">
        {/* Left branding panel */}
        <div className="hidden lg:flex flex-col flex-1 max-w-lg pt-10">
          <Link
            href="/signup"
            className="flex items-center gap-3 mb-12 group w-fit"
          >
            <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-foreground group-hover:bg-accent group-hover:text-white transition-all duration-300 shadow-sm border border-border">
              <ArrowLeft className="w-6 h-6" />
            </div>
            <span className="text-text-secondary font-bold group-hover:text-accent transition-colors">
              {step > 1 ? t("auth.goBack") || "Go Back" : t("auth.changeType") || "Change Account Type"}
            </span>
          </Link>

          <div className="mb-12">
            <Logo size="lg" />
          </div>

          <div className="w-20 h-20 bg-accent-soft rounded-3xl flex items-center justify-center text-accent mb-8 shadow-sm">
            <Briefcase className="w-10 h-10" />
          </div>
          <h2 className={`${unbounded.className} text-5xl font-black text-foreground leading-tight mb-8`}>
            {t("auth.empower") || "Empower"} <span className="text-accent">{t("auth.workerHeroTagline") || "your business"}</span>.
          </h2>
          <p className="text-text-secondary text-lg font-medium">
            Join thousands of independent professionals growing their careers on AmbiTasker. Flexible hours, reliable income.
          </p>
        </div>

        {/* Form card */}
        <motion.div key={step} initial={{ opacity: 0, x: isRTL ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-[600px]" dir={isRTL ? "rtl" : "ltr"}>
          <div className="bg-card rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-border p-8 md:p-10 shadow-sm hover:shadow-md transition-all duration-300 relative z-10">
            <div className="mb-6 lg:hidden">
              <button onClick={() => { if (step > 1) setStep(step - 1); else router.push("/signup"); }} className="flex items-center text-sm font-bold text-text-secondary hover:text-accent transition-colors gap-2">
                <ArrowLeft className="w-4 h-4" /> {step > 1 ? "Go Back" : "Change Role"}
              </button>
            </div>
            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-disabled">
                  {t("auth.stepOf") || "Step"} {step} {t("auth.of") || "of"} 3
                </span>
                <div className="flex gap-1">
                  <div className={`w-8 h-1.5 rounded-full ${step >= 1 ? "bg-accent" : "bg-gray-100"}`} />
                  <div className={`w-8 h-1.5 rounded-full ${step >= 2 ? "bg-accent" : "bg-gray-100"}`} />
                  <div className={`w-8 h-1.5 rounded-full ${step >= 3 ? "bg-accent" : "bg-gray-100"}`} />
                </div>
              </div>
              <h1 className={`${unbounded.className} text-2xl md:text-3xl font-black text-foreground mb-3`}>
                {step === 1 ? t("auth.personalInfo") || "Personal Information" : step === 2 ? "Select Your Location" : t("auth.localitySetup") || "Professional Setup"}
              </h1>
              <p className="text-text-secondary font-medium">
                {step === 1 ? "Enter your personal details to get started." : step === 2 ? "Set your service location so customers can find you." : "Choose your trade to start receiving job requests."}
              </p>
            </div>

            <form onSubmit={step === 1 ? handleNextStep : step === 3 ? handleFinalSubmit : (e) => e.preventDefault()} className="space-y-6">
              {step === 1 ? (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-hint block">
                        {t("auth.firstName") || "First Name"}
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        onBlur={() => handleBlur("firstName")}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), document.getElementById('lastName')?.focus())}
                        required
                        className={`w-full px-6 py-4 rounded-2xl border bg-muted focus:bg-card transition-all font-bold text-sm ${fieldErrors.firstName ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-accent/30'}`}
                        placeholder={isRTL ? "دانیال" : "Danyal"}
                      />
                      <AnimatePresence mode="wait">
                        {fieldErrors.firstName && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, y: -5 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -5 }}
                            className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1 flex items-center gap-1 mt-1"
                          >
                            <AlertCircle size={10} /> {fieldErrors.firstName}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-hint block">
                        {t("auth.lastName") || "Last Name"}
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        onBlur={() => handleBlur("lastName")}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), document.getElementById('email')?.focus())}
                        required
                        className={`w-full px-6 py-4 rounded-2xl border bg-muted focus:bg-card transition-all font-bold text-sm ${fieldErrors.lastName ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-accent/30'}`}
                        placeholder={isRTL ? "خان" : "Khan"}
                      />
                      <AnimatePresence mode="wait">
                        {fieldErrors.lastName && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, y: -5 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -5 }}
                            className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1 flex items-center gap-1 mt-1"
                          >
                            <AlertCircle size={10} /> {fieldErrors.lastName}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-hint block">
                        {t("auth.email") || "Email"}
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        onBlur={() => handleBlur("email")}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), document.getElementById('phone')?.focus())}
                        required
                        dir="ltr"
                        className={`w-full px-6 py-4 rounded-2xl border bg-muted focus:bg-card transition-all font-bold text-sm ${fieldErrors.email ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-accent/30'}`}
                        placeholder="danyal@email.com"
                      />
                      <AnimatePresence mode="wait">
                        {fieldErrors.email && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, y: -5 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -5 }}
                            className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1 flex items-center gap-1 mt-1"
                          >
                            <AlertCircle size={10} /> {fieldErrors.email}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-hint block">
                        {t("auth.phoneNumber") || "Phone Number"}
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                        onBlur={() => handleBlur("phone")}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), document.getElementById('cnic')?.focus())}
                        required
                        dir="ltr"
                        className={`w-full px-6 py-4 rounded-2xl border bg-muted focus:bg-card transition-all font-bold text-sm ${fieldErrors.phone ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-accent/30'}`}
                        placeholder="0300 1234567"
                      />
                      <AnimatePresence mode="wait">
                        {fieldErrors.phone && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, y: -5 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -5 }}
                            className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1 flex items-center gap-1 mt-1"
                          >
                            <AlertCircle size={10} /> {fieldErrors.phone}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-text-hint flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> CNIC Number (Optional)</span>
                      <span className="text-[9px] text-text-disabled">For KYC Verification</span>
                    </label>
                    <input
                      id="cnic"
                      type="text"
                      value={formData.cnic}
                      onChange={(e) => handleInputChange("cnic", e.target.value)}
                      onBlur={() => handleBlur("cnic")}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), document.getElementById('password')?.focus())}
                      dir="ltr"
                      className={`w-full px-6 py-4 rounded-2xl border bg-muted focus:bg-card transition-all font-bold text-sm ${fieldErrors.cnic ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-accent/30'}`}
                      placeholder="XXXXX-XXXXXXX-X"
                    />
                    <AnimatePresence mode="wait">
                      {fieldErrors.cnic && (
                        <motion.p
                          initial={{ opacity: 0, height: 0, y: -5 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -5 }}
                          className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1 flex items-center gap-1 mt-1"
                        >
                          <AlertCircle size={10} /> {fieldErrors.cnic}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-hint block">
                        {t("auth.passwordLabel") || "Password"}
                      </label>
                      <div className="relative group">
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => handleInputChange("password", e.target.value)}
                          onBlur={() => handleBlur("password")}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), document.getElementById('confirmPassword')?.focus())}
                          required
                          dir="ltr"
                          className={`w-full px-6 py-4 rounded-2xl border bg-muted focus:bg-card transition-all font-bold text-sm pe-12 ${fieldErrors.password ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-accent/30'}`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-4" : "right-4"} text-text-hint hover:text-text-secondary transition-colors`}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 px-1">
                        <div className="flex items-center gap-1.5">
                          {formData.password.length >= 8 ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500/50" />}
                          <span className={`text-[9px] font-black uppercase tracking-widest ${formData.password.length >= 8 ? "text-green-500" : "text-text-hint/50"}`}>Minimum 8 Characters</span>
                        </div>
                      </div>
                      <AnimatePresence mode="wait">
                        {fieldErrors.password && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, y: -5 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -5 }}
                            className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1 flex items-center gap-1 mt-1"
                          >
                            <AlertCircle size={10} /> {fieldErrors.password}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-text-hint block">
                        {t("auth.confirmPassword") || "Confirm Password"}
                      </label>
                      <div className="relative group">
                        <input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                          onBlur={() => handleBlur("confirmPassword")}
                          onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
                          required
                          dir="ltr"
                          className={`w-full px-6 py-4 rounded-2xl border bg-muted focus:bg-card transition-all font-bold text-sm pe-12 ${fieldErrors.confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-accent/30'}`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "left-4" : "right-4"} text-text-hint hover:text-text-secondary transition-colors`}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <AnimatePresence mode="wait">
                        {fieldErrors.confirmPassword && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, y: -5 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -5 }}
                            className="text-[10px] font-black text-red-500 uppercase tracking-widest px-1 flex items-center gap-1 mt-1"
                          >
                            <AlertCircle size={10} /> {fieldErrors.confirmPassword}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              ) : step === 2 ? (
                /* Step 2: Location Selection (GPS/Map) */
                <LocationStep
                  role="provider"
                  onConfirm={handleLocationConfirm}
                  onBack={() => { setStep(1); setError(""); }}
                  initialData={locationData}
                />
              ) : (
                /* Step 3: Service Specialization */
                <div className="space-y-8">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-accent flex items-center gap-2">
                      <Briefcase className="w-4 h-4" /> {t("auth.serviceSpecialist") || "Service Specialization"}
                    </label>
                    <div className="bg-accent/5 p-4 rounded-[32px] border border-accent/20">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-transparent text-accent-dark font-black text-sm p-2 outline-none cursor-pointer appearance-none"
                      >
                        <option value="">{t("auth.selectYourTrade") || "Select Your Trade"}</option>
                        {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{t(`categories.${c.id}.name`) || c.name}</option>)}
                      </select>
                    </div>
                  </motion.div>

                  {/* Location Summary */}
                  {locationData && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-primary/5 rounded-2xl border border-primary/20">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">📍 Your Service Location</p>
                      <p className="text-xs font-bold text-foreground line-clamp-2">{locationData.address}</p>
                      {locationData.serviceRadius && (
                        <p className="text-[10px] font-bold text-text-hint mt-1">Radius: {locationData.serviceRadius} km</p>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Error Display */}
              <div className="min-h-[40px]">
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 rounded-2xl text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest border border-red-100 dark:border-red-500/20"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit / Next Button (step 1 and 3 only — step 2 has its own buttons) */}
              {step !== 2 && (() => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const isPasswordStrong = formData.password.length >= 8;
                const isStep1Invalid = !formData.firstName.trim() || 
                                      !formData.lastName.trim() || 
                                      !formData.email.trim() || 
                                      !formData.phone.trim() ||
                                      !emailRegex.test(formData.email) ||
                                      (formData.cnic && !/^[0-9+]{5}-[0-9+]{7}-[0-9]{1}$/.test(formData.cnic)) ||
                                      !isPasswordStrong ||
                                      formData.password !== formData.confirmPassword;
                const isStep3Invalid = !formData.category;
                const isFormInvalid = step === 1 ? isStep1Invalid : isStep3Invalid;

                return (
                  <div className="space-y-3">
                    {step === 3 && (
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="w-full h-12 rounded-xl border border-border bg-card hover:bg-muted transition-all text-sm font-bold text-text-secondary hover:text-foreground flex items-center justify-center gap-2"
                      >
                        <ArrowLeft className="w-4 h-4" /> Change Location
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isLoading || isFormInvalid}
                      className={`w-full h-14 rounded-xl font-bold text-sm uppercase tracking-widest relative overflow-hidden group text-white
                        ${isLoading || isFormInvalid ? "bg-accent/50 cursor-not-allowed shadow-none" : "bg-accent hover:bg-accent-dark hover:translate-y-[-2px] shadow-lg shadow-accent/20 transition-all duration-300"}
                      `}
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-3">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{t("auth.processing") || "Processing..."}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <span className="font-bold">
                            {step === 1 ? t("auth.nextStep") || "Next — Select Location" : t("auth.completeRegistration") || "Create Account"}
                          </span>
                          <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isFormInvalid ? "opacity-30" : ""}`} />
                        </div>
                      )}
                    </button>
                  </div>
                );
              })()}
            </form>

            <div className="mt-8 pt-8 border-t border-gray-50 dark:border-white/5 text-center">
              <p className="text-text-secondary font-medium">
                {t("auth.alreadyHaveAccount") || "Already have an account?"}{" "}
                <Link href="/login" className="text-accent font-bold hover:underline underline-offset-4">
                  {t("auth.signInLink") || "Sign In"}
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
