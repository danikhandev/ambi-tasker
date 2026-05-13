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
  ArrowLeft
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import Logo from "@/components/ui/Logo";
import { useUI } from "@/contexts/UIContext";

type Step = "EMAIL" | "OTP" | "RESET" | "SUCCESS";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { theme } = useUI();
  
  const [step, setStep] = useState<Step>("EMAIL");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 1. Submit Email -> Request OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 relative overflow-hidden selection:bg-primary/30">
      {/* Background Atmosphere */}
      <div className="absolute top-0 right-0 w-[50%] h-full bg-primary blur-[150px] opacity-10 -z-10" />
      <div className="absolute bottom-0 left-0 w-[30%] h-full bg-indigo-600 blur-[120px] opacity-5 -z-10" />
      
      <div className="fixed top-8 left-8">
        <Link href="/login" className="hover:opacity-80 transition-opacity">
           <Logo size="md" />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[500px] px-6"
      >
        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[48px] p-8 md:p-12 shadow-2xl relative">
          
          {/* Progress Header */}
          <div className="mb-10">
             <Link href="/login" className="inline-flex items-center gap-2 text-[10px] font-black text-white/40 hover:text-primary uppercase tracking-widest transition-colors mb-8 group">
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Back to Login
             </Link>
             <h2 className={`${unbounded.className} text-3xl font-black text-white mb-3`}>
                {step === "SUCCESS" ? "Success!" : "Reset Access"}
             </h2>
             <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">
                {step === "EMAIL" && "Enter your email to request an access override code."}
                {step === "OTP" && "Enter the verification code sent to your sector."}
                {step === "RESET" && "Initialize your new secure access credentials."}
                {step === "SUCCESS" && "Core credentials updated. Secure link established."}
             </p>
          </div>

          <AnimatePresence mode="wait">
            {step === "EMAIL" && (
              <motion.form 
                key="email"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleEmailSubmit} className="space-y-8"
              >
                <div className="relative group">
                  <Mail className="absolute top-5 left-5 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="IDENT_MAIL@DOMAIN.COM"
                    className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl ps-14 pe-6 text-white text-sm font-black tracking-widest focus:border-primary/50 focus:bg-white/[0.08] transition-all outline-none uppercase"
                  />
                </div>
                <button
                  type="submit" disabled={isLoading}
                  className="w-full h-16 bg-primary rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl shadow-primary/30 group"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Request Code <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
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
                       <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Verification Code</label>
                       <button type="button" onClick={() => setStep("EMAIL")} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Change Email</button>
                   </div>
                   <input 
                      type="text" required value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="0 0 0 0 0 0"
                      className="w-full h-16 bg-primary/10 border-2 border-primary/30 rounded-2xl text-center text-2xl font-black text-primary tracking-[0.6em] outline-none"
                   />
                   <p className="text-[9px] text-white/20 text-center font-bold uppercase tracking-tighter">
                      Check your email sector for the 6-digit access code.
                   </p>
                </div>
                <button
                  type="submit" disabled={isLoading}
                  className="w-full h-16 bg-primary rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl shadow-primary/30 group"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Code <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </motion.form>
            )}

            {step === "RESET" && (
              <motion.form 
                key="reset"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleResetSubmit} className="space-y-6"
              >
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] px-2">New Access Credentials</label>
                  <div className="relative group">
                    <Lock className="absolute top-5 left-5 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"} required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="NEW_ALPHA_KEY"
                      className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl ps-14 pe-14 text-white text-sm font-black tracking-widest focus:border-primary/50 focus:bg-white/[0.08] transition-all outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute top-5 right-5 text-white/20 hover:text-white transition-colors">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <div className="relative group">
                    <ShieldCheck className="absolute top-5 left-5 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                    <input 
                      type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="CONFIRM_ALPHA_KEY"
                      className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl ps-14 pe-6 text-white text-sm font-black tracking-widest focus:border-primary/50 focus:bg-white/[0.08] transition-all outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit" disabled={isLoading}
                  className="w-full h-16 bg-primary rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl shadow-primary/30 group"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Finalize Reset <KeyRound size={16} className="group-hover:rotate-12 transition-transform" /></>}
                </button>
              </motion.form>
            )}

            {step === "SUCCESS" && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-10 py-6"
              >
                <div className="w-24 h-24 bg-emerald-500/20 border-4 border-emerald-500/30 rounded-[32px] flex items-center justify-center mx-auto relative">
                   <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                   <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-gray-950 flex items-center justify-center text-white text-[10px] font-black">✓</motion.div>
                </div>
                <div className="space-y-4">
                  <h3 className={`${unbounded.className} text-xl font-black text-white`}>Access Restored</h3>
                  <p className="text-white/40 text-xs font-bold uppercase leading-relaxed tracking-widest">Your security kernel has been updated. You can now authenticate with your new credentials.</p>
                </div>
                <Link 
                  href="/login"
                  className="w-full h-16 bg-white text-gray-950 rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl shadow-white/10"
                >
                  Return to Dashboard <ArrowRight size={16} />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {error && step !== "SUCCESS" && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 text-red-400"
            >
              <AlertCircle size={20} className="shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">ERR: {error}</span>
            </motion.div>
          )}

        </div>

        <div className="mt-12 text-center">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
               Powered by AmbiTasker Iron Guard
            </p>
        </div>
      </motion.div>
    </div>
  );
}
