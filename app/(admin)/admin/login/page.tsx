"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Shield, AlertCircle, Loader2, ArrowRight, CheckCircle2, Globe, ShieldAlert, Cpu, Network, Zap } from "lucide-react";
import Image from "next/image";
import { unbounded } from "@/app/fonts";
import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import Logo from "@/components/ui/Logo";

export default function AdminLoginPage() {
  const { clearAllUsers } = useUser();
  const { login: contextLogin, admin } = useAdmin();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);

  React.useEffect(() => {
    if (admin) window.location.href = "/admin/dashboard";
  }, [admin]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    otp: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      clearAllUsers();
      
      const payload = requires2FA 
        ? { otp: formData.otp, step: "2fa" as const }
        : { password: formData.password, step: "credentials" as const };

      const result = await contextLogin(
        formData.email, 
        payload.password || "", 
        payload.otp, 
        payload.step
      );

      if (!result.success) {
        throw new Error(result.error || "Login failed");
      }

      if (result.requires2FA) {
        setRequires2FA(true);
        setIsLoading(false);
        return;
      }

      // If successful (and no 2FA required now), redirect will be handled by useEffect
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-card flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[120px] rounded-full animate-pulse animation-delay-2000" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] grayscale" />
      </div>

      <div className="w-full max-w-[1200px] grid grid-cols-1 lg:grid-cols-2 gap-12 relative z-10 items-center">
        {/* Visual Brand Column */}
        <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="hidden lg:flex flex-col justify-center space-y-12"
        >
            <div className="space-y-6">
                <motion.div 
                    initial={{ scale: 0.8, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="flex items-center justify-start group relative"
                >
                    <div className="absolute inset-0 bg-primary/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                    <Logo size="xl" className="relative z-10" />
                </motion.div>
                <div className="space-y-2">
                    <h1 className={`${unbounded.className} text-6xl font-black text-foreground tracking-tighter leading-[1.1]`}>
                        Operational <br />
                        <span className="text-primary italic">Intelligence</span>.
                    </h1>
                    <p className="text-text-secondary text-lg font-medium max-w-md mt-4">
                        Secure uplink to the platform's core infrastructure. Authorized access only via encrypted protocols.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {[
                    { icon: Network, label: "Neural Mesh", desc: "Distributed system sync" },
                    { icon: ShieldAlert, label: "Iron Guard", desc: "Encryption layer v4.2" },
                    { icon: Globe, label: "Geo-Fence", desc: "Regional node control" },
                    { icon: Zap, label: "Pulse Rate", desc: "Real-time telemetry" },
                ].map((item, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + (i * 0.1) }}
                        className="p-6 bg-white dark:bg-card border border-border dark:border-white/5 rounded-[32px] shadow-sm hover:shadow-xl transition-all group"
                    >
                        <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center mb-4 text-text-hint group-hover:bg-primary/10 group-hover:text-primary transition-all">
                            <item.icon size={20} />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">{item.label}</h4>
                        <p className="text-[10px] text-text-hint font-bold mt-1 uppercase tracking-tighter">{item.desc}</p>
                    </motion.div>
                ))}
            </div>

            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-text-hint">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                Connectivity: Optimal (12ms)
            </div>
        </motion.div>

        {/* Login Core Column */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full flex justify-center lg:justify-end"
        >
            <div className="bg-card w-full max-w-md p-10 md:p-12 rounded-[48px] border border-border shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl opacity-50" />
                
                <div className="text-center mb-12">
                    <div className="lg:hidden flex justify-center mb-6">
                        <Logo size="lg" />
                    </div>
                    <h2 className={`${unbounded.className} text-3xl font-black text-foreground mb-3`}>
                      {requires2FA ? "Security" : "Authorized"} <span className="text-primary italic">{requires2FA ? "Challenge" : "Entry"}</span>
                    </h2>
                    <p className="text-[10px] font-black text-text-hint uppercase tracking-widest">
                      {requires2FA ? "Identity Verification Required" : "Administrative Terminal Access"}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-8 p-5 bg-red-50 border border-red-100 rounded-[24px] flex items-start gap-4"
                        >
                            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-red-700 leading-relaxed">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleLogin} className="space-y-8">
                    {!requires2FA ? (
                      <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="space-y-8"
                      >
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-2">Node Identity / Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-hint group-focus-within:text-primary transition-colors" />
                                <input 
                                    type="email"
                                    required
                                    disabled={isLoading}
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="admin@ambitasker.com"
                                    className="w-full pl-16 pr-6 py-5 bg-muted border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-[24px] focus:outline-none font-bold text-sm transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-2">Access Key / Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-hint group-focus-within:text-primary transition-colors" />
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    required
                                    disabled={isLoading}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full pl-16 pr-16 py-5 bg-muted border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-[24px] focus:outline-none font-bold text-sm transition-all"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-text-hint hover:text-foreground transition-all"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="space-y-6 text-center"
                      >
                        <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10 mb-4">
                          <Cpu className="w-10 h-10 text-primary mx-auto mb-4 animate-pulse" />
                          <p className="text-xs font-bold text-text-secondary leading-relaxed">
                            A verification code has been sent to <span className="text-foreground">{formData.email}</span>. Please enter it below to complete security authentication.
                          </p>
                        </div>
                        
                        <div className="space-y-4 text-left">
                          <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-2">One-Time Password (OTP)</label>
                          <div className="relative group">
                              <Shield className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-hint group-focus-within:text-primary transition-colors" />
                              <input 
                                  type="text"
                                  required
                                  autoFocus
                                  disabled={isLoading}
                                  maxLength={6}
                                  value={formData.otp}
                                  onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                                  placeholder="000000"
                                  className="w-full pl-16 pr-6 py-5 bg-muted border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-[24px] focus:outline-none font-black text-xl tracking-[0.5em] transition-all text-center"
                              />
                          </div>
                          <button 
                            type="button" 
                            onClick={() => { setRequires2FA(false); setFormData({...formData, otp: ""}); }}
                            className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest ml-2"
                          >
                            Back to credentials
                          </button>
                        </div>

                         <div className="mt-8 pt-6 border-t border-dashed border-border text-left">
                           <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest mb-2 flex items-center gap-2">
                             <AlertCircle size={12} className="text-primary" /> Verification Support
                           </h4>
                           <p className="text-[10px] font-bold text-text-hint leading-relaxed uppercase tracking-tighter">
                             If you are not receiving the security code, please verify the system's SMTP configuration or contact technical support for nodal synchronization.
                           </p>
                         </div>
                      </motion.div>
                    )}

                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-5 bg-gray-950 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-gray-950/20 hover:bg-primary transition-all active:scale-95 flex items-center justify-center gap-3 group disabled:opacity-50"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>{requires2FA ? "Verifying Token..." : "Initial Verification..."}</span>
                            </>
                        ) : (
                            <>
                                {requires2FA ? "Finalize Authentication" : "Initialize Uplink"}
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-12 pt-8 border-t border-border flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-full">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <span className="text-[9px] font-black uppercase text-text-hint tracking-widest">End-to-End Secure Segment</span>
                    </div>
                    <p className="text-[10px] font-black uppercase text-text-disabled tracking-[0.4em]">AmbiTasker Administrative Suite</p>
                </div>

            </div>
        </motion.div>
      </div>
    </div>
  );
}
