"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  ChevronLeft,
  Sparkles
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import Logo from "@/components/ui/Logo";
import { useUI } from "@/contexts/UIContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useSound } from "@/contexts/SoundContext";

type Step = "EMAIL" | "OTP" | "RESET" | "SUCCESS";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { language, setLanguage } = useUI();
  const { t, isRTL } = useTranslation();
  const { playClickSound } = useSound();
  
  const [step, setStep] = useState<Step>("EMAIL");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 1. Submit Email -> Request OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("OTP");
      } else {
        setError(data.error || "Failed to initiate reset");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Verify OTP -> Get Reset Token
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (otp.length < 6) {
      setError("Enter full 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (data.success) {
        setResetToken(data.resetToken);
        setStep("RESET");
      } else {
        setError(data.error || "Invalid verification code");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Final Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, resetToken, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("SUCCESS");
      } else {
        setError(data.error || "Reset failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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
              <span className="text-gray-900">Ambi</span>
              <span className="text-primary">Tasker</span>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-8 max-w-full overflow-hidden relative">
            <h1 className={`${unbounded.className} text-5xl md:text-6xl font-black text-gray-900 leading-[1.1] tracking-tighter break-words whitespace-normal`}>
              Experience the <br />
              <span className="text-primary italic">difference</span> with <br />
              AmbiTasker
            </h1>
            <p className="text-gray-500 text-xl font-medium max-w-lg leading-relaxed">
              Your security is our priority. We'll help you get back to managing your professional bridge in no time.
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

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex flex-col items-center p-8 sm:p-12 min-h-screen relative">
        {/* Top Navigation */}
        <div className="w-full flex justify-between items-center z-20 mb-12 lg:mb-auto">
          <Link 
            href="/login" 
            onClick={() => playClickSound()}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-600 hover:bg-white hover:shadow-md transition-all active:scale-95"
          >
            <ChevronLeft size={16} />
            <span>Back to Login</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block px-5 py-2.5 bg-blue-50 border border-blue-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] text-blue-600">
              SECURE ACCESS OVERRIDE
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center w-full max-w-[460px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full space-y-10 py-12"
          >
            <div>
              <h2 className={`${unbounded.className} text-4xl font-black text-gray-900 mb-3`}>
                {step === "SUCCESS" ? "Success!" : "Reset Access"}
              </h2>
              <p className="text-gray-400 font-medium text-lg leading-relaxed">
                {step === "EMAIL" && "Enter your email to request an access override code."}
                {step === "OTP" && "Enter the 6-digit verification code sent to your email."}
                {step === "RESET" && "Initialize your new secure access credentials."}
                {step === "SUCCESS" && "Core credentials updated. Your secure link has been established."}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {step === "EMAIL" && (
                <motion.form 
                  key="email"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleEmailSubmit} className="space-y-8"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute top-1/2 -translate-y-1/2 left-5 w-5 h-5 text-gray-300 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="email" required value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full h-16 bg-[#eff6ff]/50 border border-transparent rounded-2xl ps-14 pe-6 text-gray-900 text-sm font-bold focus:bg-white focus:border-primary/30 transition-all outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit" disabled={isLoading}
                    className="w-full h-16 bg-primary rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl shadow-primary/20 text-white disabled:opacity-60 group"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>REQUEST OVERRIDE CODE <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" /></>}
                  </button>
                </motion.form>
              )}

              {step === "OTP" && (
                <motion.form 
                  key="otp"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleVerifyOtp} className="space-y-8"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification Code</label>
                        <button type="button" onClick={() => setStep("EMAIL")} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Change Email</button>
                    </div>
                    <input 
                       type="text" required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                       placeholder="0 0 0 0 0 0"
                       className="w-full h-16 bg-primary/10 border-2 border-primary/30 rounded-2xl text-center text-2xl font-black text-primary tracking-[0.5em] outline-none"
                    />
                  </div>
                  <button
                    type="submit" disabled={isLoading}
                    className="w-full h-16 bg-primary rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl shadow-primary/20 text-white disabled:opacity-60 group"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>VERIFY ACCESS CODE <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" /></>}
                  </button>
                </motion.form>
              )}

              {step === "RESET" && (
                <motion.form 
                  key="reset"
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleResetSubmit} className="space-y-6"
                >
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">New Alpha Key</label>
                      <div className="relative group">
                        <Lock className="absolute top-1/2 -translate-y-1/2 left-5 w-5 h-5 text-gray-300 group-focus-within:text-primary transition-colors" />
                        <input 
                          type={showPassword ? "text" : "password"} required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                          placeholder="ENTER NEW PASSWORD"
                          className="w-full h-16 bg-[#eff6ff]/50 border border-transparent rounded-2xl ps-14 pe-14 text-gray-900 text-sm font-bold focus:bg-white focus:border-primary/30 transition-all outline-none"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-1/2 -translate-y-1/2 right-5 text-gray-300 hover:text-gray-500 transition-colors">
                          {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Confirm Alpha Key</label>
                      <div className="relative group">
                        <ShieldCheck className="absolute top-1/2 -translate-y-1/2 left-5 w-5 h-5 text-gray-300 group-focus-within:text-primary transition-colors" />
                        <input 
                          type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="CONFIRM NEW PASSWORD"
                          className="w-full h-16 bg-[#eff6ff]/50 border border-transparent rounded-2xl ps-14 pe-14 text-gray-900 text-sm font-bold focus:bg-white focus:border-primary/30 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit" disabled={isLoading}
                    className="w-full h-16 bg-primary rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl shadow-primary/20 text-white disabled:opacity-60 group pt-2"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>FINALIZE ACCESS RESET <KeyRound size={16} className="group-hover:rotate-12 transition-transform" /></>}
                  </button>
                </motion.form>
              )}

              {step === "SUCCESS" && (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-10 py-6"
                >
                  <div className="w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center mx-auto relative shadow-sm border border-emerald-100">
                     <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                     <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center text-white text-[10px] font-black">✓</motion.div>
                  </div>
                  <div className="space-y-4">
                    <h3 className={`${unbounded.className} text-xl font-black text-gray-900`}>Access Restored</h3>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">Your security credentials have been updated successfully. You can now authenticate with your new access key.</p>
                  </div>
                  <Link 
                    href="/login"
                    onClick={() => playClickSound()}
                    className="w-full h-16 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[12px] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-xl shadow-gray-900/20"
                  >
                    RETURN TO SIGN IN <ArrowRight size={16} />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {error && step !== "SUCCESS" && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-4 text-red-600"
              >
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                  <AlertCircle size={20} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">ERROR: {error}</span>
              </motion.div>
            )}
          </motion.div>
        </div>
        
        {/* Small Logo for Mobile */}
        <div className="lg:hidden mt-20 flex items-center gap-3">
          <div className={`${unbounded.className} text-2xl font-black tracking-tighter flex items-center`}>
            <span className="text-gray-900">Ambi</span>
            <span className="text-primary">Tasker</span>
          </div>
        </div>
      </div>
    </div>
  );
}
