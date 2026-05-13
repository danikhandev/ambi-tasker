"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  Globe,
  ShieldCheck,
  Star,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/services/supabase";
import { useAdmin } from "@/contexts/AdminContext";
import Logo from "@/components/ui/Logo";
import { useUI } from "@/contexts/UIContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useSound } from "@/contexts/SoundContext";

import { Suspense } from "react";

function LoginContent() {
  const { login: userLogin } = useUser();
  const { login: adminLogin, clearAdmin } = useAdmin();
  const { language, setLanguage } = useUI();
  const { t, isRTL } = useTranslation();
  const { playClickSound } = useSound();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = (searchParams.get("role") || "user") as "user" | "provider" | "admin";

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [showOTP, setShowOTP] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

  const validateField = (name: string, value: string) => {
    let err = "";
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value) err = t("auth.emailRequired") || "Email is required";
      else if (!emailRegex.test(value)) err = t("auth.invalidEmail") || "Enter a valid email";
    } else if (name === "password") {
      if (!value) err = t("auth.passwordRequired") || "Password is required";
    }
    setFieldErrors(prev => ({ ...prev, [name]: err }));
    if (err) setError("");
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name as keyof typeof fieldErrors]) validateField(name, value);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    playClickSound();
    setError("");

    const emailError = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) ? "" : (t("auth.invalidEmail") || "Enter a valid email");
    const passError = formData.password ? "" : (t("auth.passwordRequired") || "Password is required");

    if (emailError || passError) {
      setFieldErrors({ email: emailError, password: passError });
      return;
    }

    setIsLoading(true);

    try {
      if (roleParam === "admin") {
        const result = await adminLogin(formData.email, formData.password, otp, showOTP ? "2fa" : "credentials");
        if (result.success) {
          if (result.requires2FA) {
            setShowOTP(true);
            setIsLoading(false);
          } else {
            router.push("/admin/dashboard");
          }
        } else {
          setError(result.error || "Access denied. Please check your credentials.");
          setIsLoading(false);
        }
        return;
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response from server:", text.substring(0, 200));
        throw new Error(
          response.ok 
            ? "Invalid response format from server." 
            : `Server error (${response.status}). Please try again later.`
        );
      }

      if (data.success) {
        const userRole = data.user.role?.toLowerCase();
        if (roleParam === "provider" && userRole !== "provider") throw new Error(t("auth.incorrectAccountType") || "This account is not registered as a provider.");
        if (roleParam === "user" && userRole === "admin") throw new Error("Admin accounts must use the admin portal.");

        if (data.token) {
          localStorage.setItem("serve_u_auth_token", data.token);
        }

        if (userRole === "provider") {
          clearAdmin();
          await userLogin(formData.email, true);
          router.push("/provider/dashboard");
        } else {
          clearAdmin();
          await userLogin(formData.email, false);
          router.push("/user/dashboard");
        }
      } else {
        if (data.code === "EMAIL_NOT_VERIFIED" && data.email) {
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }
        setError(data.error || t("auth.invalidCredentials") || "Incorrect email or password.");
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const roleLabel = roleParam === "provider" ? "Provider" : roleParam === "admin" ? "Admin" : "Customer";
  const portalName = roleParam === "provider" ? "PROFESSIONAL PROVIDER PORTAL" : roleParam === "admin" ? "SECURE ADMIN PORTAL" : "TRUSTED CUSTOMER PORTAL";

  return (
    <div className="min-h-screen flex bg-white font-sans" dir={isRTL ? "rtl" : "ltr"}>
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#f8fafc] p-16 flex-col justify-center relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400 blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10 space-y-12"
        >
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
              <Logo size="sm" />
            </div>
            <div className={`${unbounded.className} text-4xl font-black tracking-tighter flex items-center`}>
              <span className="text-gray-900">Serve</span>
              <span className="text-primary">-U</span>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-8">
            <h1 className={`${unbounded.className} text-7xl md:text-8xl font-black text-gray-900 leading-[0.95] tracking-tighter`}>
              Experience the <br />
              <span className="text-primary italic">difference</span> with <br />
              AmbiTasker
            </h1>
            <p className="text-gray-500 text-xl font-medium max-w-lg leading-relaxed">
              Join thousands of satisfied users and verified providers today. Your bridge to professional excellence.
            </p>
          </div>

          {/* Footer Subtext */}
          <div className="flex items-center gap-6 pt-8">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                  <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="User" />
                </div>
              ))}
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              Trusted by 10k+ people
            </p>
          </div>
        </motion.div>
      </div>

      {/* Right login form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 relative">
        {/* Top Navigation */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-20">
          <Link 
            href="/" 
            onClick={() => playClickSound()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-600 hover:bg-white hover:shadow-md transition-all active:scale-95"
          >
            <ChevronLeft size={16} />
            <span>Back Home</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block px-5 py-2.5 bg-blue-50 border border-blue-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">
              {portalName}
            </div>
            <button
              onClick={() => { playClickSound(); setLanguage(language === "en" ? "ur" : "en"); }}
              className="w-12 h-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center hover:shadow-lg transition-all active:scale-95 text-gray-600"
            >
              <span className="text-[10px] font-black uppercase tracking-widest">{language === "en" ? "اردو" : "EN"}</span>
            </button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[460px] space-y-10"
        >
          <div>
            <h2 className={`${unbounded.className} text-4xl font-black text-gray-900 mb-3`}>
              {roleLabel} Sign In
            </h2>
            <p className="text-gray-400 font-medium text-lg">
              {roleParam === "admin"
                ? "Sign in to access the admin dashboard."
                : `Sign in to manage your ${roleParam === "provider" ? "services" : "bookings"} and account.`}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute top-1/2 -translate-y-1/2 left-5 w-5 h-5 text-gray-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email"
                  className="w-full h-16 bg-[#eff6ff]/50 border border-transparent rounded-2xl ps-14 pe-6 text-gray-900 text-sm font-bold focus:bg-white focus:border-primary/30 transition-all outline-none"
                  required
                />
              </div>
              {fieldErrors.email && <p className="text-[10px] font-bold text-red-500 ps-2">{fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-end ml-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Password</label>
                <Link
                  href="/forgot-password"
                  onClick={() => playClickSound()}
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute top-1/2 -translate-y-1/2 left-5 w-5 h-5 text-gray-300 group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Enter your password"
                  className="w-full h-16 bg-[#eff6ff]/50 border border-transparent rounded-2xl ps-14 pe-14 text-gray-900 text-sm font-bold focus:bg-white focus:border-primary/30 transition-all outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => { playClickSound(); setShowPassword(!showPassword); }}
                  className="absolute top-1/2 -translate-y-1/2 right-5 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-[10px] font-bold text-red-500 ps-2">{fieldErrors.password}</p>}
            </div>

            {/* 2FA OTP (admin) */}
            {showOTP && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-3"
              >
                <div className="relative">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="0  0  0  0  0  0"
                    className="w-full h-16 bg-primary/10 border-2 border-primary/30 rounded-2xl text-center text-2xl font-black text-primary tracking-[0.5em] outline-none"
                    required
                  />
                </div>
                <p className="text-center text-[10px] font-bold text-primary/70 uppercase tracking-widest">Enter Verification Code</p>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <div className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <span className="text-xs font-bold leading-relaxed">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
                roleParam === "admin" ? "bg-gray-900 shadow-gray-900/20" : "bg-primary shadow-primary/20"
              } group text-white disabled:opacity-60`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>SIGN IN AS {roleLabel}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="pt-6 text-center">
            <p className="text-gray-400 text-sm font-medium">
              Don't have an account?{" "}
              <Link href="/signup" onClick={() => playClickSound()} className="text-primary hover:underline font-bold ml-1">
                Create account
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Small Logo for Mobile */}
        <div className="lg:hidden mt-20 flex items-center gap-3">
          <div className={`${unbounded.className} text-2xl font-black tracking-tighter flex items-center`}>
            <span className="text-gray-900">Serve</span>
            <span className="text-primary">-U</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
