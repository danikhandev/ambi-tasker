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
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  User as UserIcon
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useTranslation } from "@/hooks/useTranslation";
import BackButton from "@/components/BackButton";
import LocationStep, { LocationStepData } from "@/components/auth/LocationStep";
import Logo from "@/components/ui/Logo";

export default function UserSignupPage() {
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
    password: "",
    confirmPassword: "",
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
    } else if (name === "password") {
      if (value.length < 8) error = t("auth.passwordTooShort") || "Too short";
      else if (!/[0-9]/.test(value)) error = "Need 1 number";
      else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) error = "Need 1 special character (!@#$...)";
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
    if (formData.password.length < 8) errors.password = t("auth.passwordTooShort") || "Too short";
    else if (!/[0-9]/.test(formData.password)) errors.password = "Need 1 number";
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) errors.password = "Need 1 special character (!@#$...)";
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = t("auth.passwordsDoNotMatch") || "Mismatch";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setStep(2);
  };

  const handleLocationConfirm = async (data: LocationStepData) => {
    setLocationData(data);
    setError("");
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
          role: 'user',
          latitude: data.latitude,
          longitude: data.longitude,
          address: data.address,
          locationCity: data.city,
          locationArea: data.area,
          districtId: data.districtId,
          cityId: data.cityId,
          areaId: data.areaId,
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("auth.registrationFailed") || "Registration Failed");
      }

      router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (t("auth.registrationFailed") || "Failed"));
      setIsLoading(false);
    }
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isPasswordValid = formData.password.length >= 8 &&
    /[0-9]/.test(formData.password) &&
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(formData.password);
  const isStep1Invalid = !formData.firstName.trim() || 
                        !formData.lastName.trim() || 
                        !formData.email.trim() || 
                        !formData.phone.trim() ||
                        !emailRegex.test(formData.email) ||
                        !isPasswordValid ||
                        formData.password !== formData.confirmPassword;

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-muted relative overflow-hidden font-sans pt-12 pb-24"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2" />
      
      <div className="w-full max-w-6xl mx-auto px-4 relative z-10 flex flex-col lg:flex-row gap-16 items-start" dir="ltr">
        {/* Left branding panel */}
        <div className="hidden lg:flex flex-col flex-1 max-w-lg pt-10">
          <button
            onClick={() => { if (step > 1) setStep(1); else router.push("/signup"); }}
            className="flex items-center gap-3 mb-12 group w-fit"
          >
            <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-foreground group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm border border-border">
              <ArrowLeft className="w-6 h-6" />
            </div>
            <span className="text-text-secondary font-bold group-hover:text-primary transition-colors">
              {step > 1 ? t("auth.goBack") || "Go Back" : t("auth.changeType") || "Change Account Type"}
            </span>
          </button>

          <div className="mb-12">
            <Logo size="lg" />
          </div>

          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-8 shadow-sm">
            <UserIcon className="w-10 h-10" />
          </div>
          <h2 className={`${unbounded.className} text-5xl font-black text-foreground leading-tight mb-8`}>
            {t("auth.elevate") || "Elevate"} <span className="text-primary">{t("auth.userHeroTagline") || "your lifestyle"}</span>.
          </h2>
          <p className="text-text-secondary text-lg font-medium">
            {step === 1
              ? "Join the platform that connects you with expert professionals instantly. Your daily tasks, resolved."
              : "We use your location to show you nearby services and professionals in your area."
            }
          </p>
        </div>

        {/* Form card */}
        <motion.div key={step} initial={{ opacity: 0, x: isRTL ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-[600px]" dir={isRTL ? "rtl" : "ltr"}>
          <div className="bg-card rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-border p-8 md:p-10 shadow-sm hover:shadow-md transition-all duration-300 relative z-10">
            <div className="mb-6 lg:hidden">
              <button onClick={() => { if (step > 1) setStep(1); else router.push("/signup"); }} className="flex items-center text-sm font-bold text-text-secondary hover:text-primary transition-colors gap-2">
                <ArrowLeft className="w-4 h-4" /> {step > 1 ? "Go Back" : "Change Role"}
              </button>
            </div>

            <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-disabled">
                  {t("auth.stepOf") || "Step"} {step} {t("auth.of") || "of"} 2
                </span>
                <div className="flex gap-1">
                  <div className={`w-8 h-1.5 rounded-full ${step >= 1 ? "bg-primary" : "bg-gray-100"}`} />
                  <div className={`w-8 h-1.5 rounded-full ${step >= 2 ? "bg-primary" : "bg-gray-100"}`} />
                </div>
              </div>
              <h1 className={`${unbounded.className} text-2xl md:text-3xl font-black text-foreground mb-3`}>
                {step === 1
                  ? "Create User Account"
                  : "Select Your Location"
                }
              </h1>
              <p className="text-text-secondary font-medium">
                {step === 1
                  ? "Please enter your details to register."
                  : "We use your location to show nearby services."
                }
              </p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-6">
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
                      className={`w-full px-6 py-4 rounded-2xl border bg-muted focus:bg-card transition-all font-bold text-sm ${fieldErrors.firstName ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-primary/30'}`}
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
                      className={`w-full px-6 py-4 rounded-2xl border bg-muted focus:bg-card transition-all font-bold text-sm ${fieldErrors.lastName ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-primary/30'}`}
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
                      className={`w-full px-6 py-4 rounded-2xl border bg-muted focus:bg-card transition-all font-bold text-sm ${fieldErrors.email ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-primary/30'}`}
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
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), document.getElementById('password')?.focus())}
                      required
                      dir="ltr"
                      className={`w-full px-6 py-4 rounded-2xl border bg-muted focus:bg-card transition-all font-bold text-sm ${fieldErrors.phone ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-primary/30'}`}
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
                        className={`w-full px-6 py-4 rounded-2xl border bg-muted focus:bg-card transition-all font-bold text-sm pe-12 ${fieldErrors.password ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-primary/30'}`}
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
                        <span className={`text-[9px] font-black uppercase tracking-widest ${formData.password.length >= 8 ? "text-green-500" : "text-text-hint/50"}`}>8+ Chars</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/[0-9]/.test(formData.password) ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500/50" />}
                        <span className={`text-[9px] font-black uppercase tracking-widest ${/[0-9]/.test(formData.password) ? "text-green-500" : "text-text-hint/50"}`}>Number</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500/50" />}
                        <span className={`text-[9px] font-black uppercase tracking-widest ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? "text-green-500" : "text-text-hint/50"}`}>Special (!@#)</span>
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
                        className={`w-full px-6 py-4 rounded-2xl border bg-muted focus:bg-card transition-all font-bold text-sm pe-12 ${fieldErrors.confirmPassword ? 'border-red-500/50 focus:border-red-500' : 'border-border focus:border-primary/30'}`}
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

                {/* Next Step Button */}
                <button
                  type="submit"
                  disabled={isStep1Invalid}
                  className={`btn-primary w-full h-14 rounded-xl font-bold text-sm uppercase tracking-widest relative overflow-hidden group
                    ${isStep1Invalid ? "opacity-30 cursor-not-allowed shadow-none" : "hover:translate-y-[-2px] shadow-lg shadow-primary/20"}
                  `}
                >
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-bold">
                      {t("auth.nextStep") || "Next — Select Location"}
                    </span>
                    <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${isStep1Invalid ? "opacity-30" : ""}`} />
                  </div>
                </button>
              </form>
            ) : (
              /* Step 2: Location Selection */
              <div className="space-y-6">
                {/* Error display for signup failure */}
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

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm font-bold text-text-secondary">{t("auth.processing") || "Creating your account..."}</p>
                  </div>
                ) : (
                  <LocationStep
                    role="user"
                    onConfirm={handleLocationConfirm}
                    onBack={() => { setStep(1); setError(""); }}
                    initialData={locationData}
                  />
                )}
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-gray-50 dark:border-white/5 text-center">
              <p className="text-text-secondary font-medium">
                {t("auth.alreadyHaveAccount") || "Already have an account?"}{" "}
                <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4">
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
