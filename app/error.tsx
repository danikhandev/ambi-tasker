"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, Activity } from 'lucide-react';
import { unbounded } from './fonts';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical System Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Aesthetics */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full translate-y-1/2 translate-x-1/2" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full text-center relative z-10"
      >
        <div className="mb-10 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-red-500 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-red-500/20 relative z-10">
              <AlertTriangle size={48} />
            </div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -inset-4 bg-red-500 blur-2xl rounded-full -z-10" 
            />
          </div>
        </div>

        <h1 className={`${unbounded.className} text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tighter`}>
          System <span className="text-red-500">Anomaly</span>
        </h1>
        <p className="text-[10px] font-black uppercase text-text-hint tracking-[0.3em] mb-8">
          Error Core: {error.digest || "UNSPECIFIED_FAILURE"}
        </p>
        
        <div className="bg-card border border-border p-6 rounded-3xl mb-12 text-left relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity size={80} />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-text-hint mb-3 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Diagnostic Message
          </h3>
          <p className="text-sm font-medium text-foreground leading-relaxed break-words">
            {error.message || "An unexpected exception occurred during task execution. Our engineers have been notified."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-10 py-5 bg-gray-900 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-primary/10 group active:scale-95"
          >
            <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
            Recalibrate System
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full sm:w-auto px-10 py-5 bg-white border border-border text-foreground rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-muted transition-all active:scale-95"
          >
            <Home size={18} />
            Abort to Hub
          </button>
        </div>
      </motion.div>
    </div>
  );
}
