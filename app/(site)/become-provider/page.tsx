"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Hammer, 
  ShieldCheck, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Globe, 
  TrendingUp,
  Loader2,
  AlertCircle
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import Logo from "@/components/ui/Logo";

export default function BecomeProviderLanding() {
  const { t, isRTL } = useTranslation();
  const { user, refetch } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStartApplication = async () => {
    if (!user) {
      router.push("/login?role=provider");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/become-provider", {
        method: "POST",
      });
      const data = await res.json();

      if (data.success) {
        await refetch();
        router.push("/provider/verify");
      } else {
        setError(data.error || "Failed to start application");
      }
    } catch (err) {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    {
      icon: TrendingUp,
      title: "Boost Your Income",
      desc: "Connect with thousands of local customers looking for your skills."
    },
    {
      icon: ShieldCheck,
      title: "Secure Payments",
      desc: "Get paid on time, every time through our secure escrow system."
    },
    {
      icon: Zap,
      title: "Flexible Schedule",
      desc: "Work when you want, where you want. You are the boss."
    }
  ];

  return (
    <div className="min-h-screen bg-muted relative overflow-hidden font-sans" dir={isRTL ? "rtl" : "ltr"}>
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 -z-10" />

      <main className="max-w-7xl mx-auto px-6 py-20 lg:py-32 flex flex-col lg:flex-row items-center gap-20">
        {/* Left Side: Copy */}
        <div className="flex-1 space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary"
          >
            <Hammer className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Join the Professional Grid</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`${unbounded.className} text-5xl md:text-7xl font-black text-foreground leading-[1.1] tracking-tighter`}
          >
            Turn your <span className="text-primary italic">skills</span> into <span className="relative">
              success
              <div className="absolute -bottom-2 left-0 w-full h-3 bg-primary/20 -rotate-1 rounded-full" />
            </span>.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-text-secondary text-lg md:text-xl font-medium max-w-xl leading-relaxed"
          >
            Become a verified professional on AmbiTasker. Whether you are a mechanic, electrician, or therapist, we provide the tools to grow your business.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <button
              onClick={handleStartApplication}
              disabled={isLoading}
              className="px-10 py-6 bg-primary text-white rounded-[32px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/30 hover:bg-primary-dark hover:translate-y-[-4px] active:scale-95 transition-all flex items-center justify-center gap-4 group"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {isLoading ? "Initializing Protocol..." : "Apply to Become Provider"}
              {!isLoading && <ArrowRight className={`w-5 h-5 group-hover:translate-x-1 transition-transform ${isRTL ? "rotate-180" : ""}`} />}
            </button>
            
            <button className="px-10 py-6 bg-white border-2 border-border/60 text-foreground rounded-[32px] font-black uppercase tracking-[0.2em] text-xs hover:bg-muted hover:border-primary/20 transition-all">
              Learn How it Works
            </button>
          </motion.div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </motion.p>
          )}

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-4 pt-6"
          >
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-4 border-muted bg-white overflow-hidden shadow-sm">
                  <img src={`https://i.pravatar.cc/100?u=${i + 10}`} alt="User" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Join 2,000+ verified professionals</p>
          </motion.div>
        </div>

        {/* Right Side: Benefits Card */}
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 w-full"
        >
          <div className="bg-card rounded-[48px] border border-border shadow-2xl p-10 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
            
            <h3 className={`${unbounded.className} text-2xl font-black mb-12 text-foreground`}>Why <span className="text-primary italic">AmbiTasker</span>?</h3>
            
            <div className="space-y-12">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-6 group">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                    <b.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-foreground mb-2">{b.title}</h4>
                    <p className="text-text-secondary text-sm font-medium leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-16 p-6 bg-muted/50 rounded-3xl border border-border/60">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Verified & Safe</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">All providers undergo a rigorous KYC (Know Your Customer) verification process to ensure the highest quality of service and safety for our community.</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
