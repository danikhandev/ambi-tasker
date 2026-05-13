"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft, Home, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { unbounded } from "@/app/fonts";

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-red-500/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full text-center"
      >
        <div className="relative inline-block mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-32 h-32 bg-red-50 rounded-[40px] flex items-center justify-center border border-red-100 shadow-2xl shadow-red-500/10"
          >
            <ShieldAlert className="w-16 h-16 text-red-500" />
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-border"
          >
            <Lock className="w-6 h-6 text-gray-900" />
          </motion.div>
        </div>

        <h1 className={`${unbounded.className} text-4xl md:text-5xl font-black text-foreground mb-6`}>
          403
        </h1>
        <h2 className={`${unbounded.className} text-xl md:text-2xl font-black text-foreground mb-4 uppercase tracking-tight`}>
          Access Protected
        </h2>
        
        <p className="text-text-secondary text-lg font-medium mb-12 leading-relaxed max-w-md mx-auto">
          You do not have the necessary permissions to access this administrative module. This area is strictly restricted.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto px-10 py-5 bg-white border border-border text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-muted transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl shadow-black/5"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full sm:w-auto px-10 py-5 bg-gray-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl"
          >
            <Home className="w-4 h-4" />
            Home Mesh
          </button>
        </div>

        <div className="mt-16 pt-16 border-t border-border/50">
          <p className="text-[10px] font-black uppercase text-text-hint tracking-widest leading-none">
            Security Status: Enforced
          </p>
          <p className="text-[10px] font-bold text-text-hint mt-2 opacity-60">
            Unauthorized access attempts are logged for security audits.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
