"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Search, Zap } from 'lucide-react';
import { unbounded } from './fonts';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Aesthetics */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full text-center relative z-10"
      >
        <div className="mb-12 relative inline-block">
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-32 h-32 bg-primary rounded-[40px] flex items-center justify-center text-white shadow-2xl shadow-primary/30 mx-auto relative z-10"
          >
            <Zap size={64} fill="currentColor" />
          </motion.div>
          <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full -z-10 animate-pulse" />
        </div>

        <h1 className={`${unbounded.className} text-6xl md:text-8xl font-black text-foreground mb-6 tracking-tighter`}>
          404
        </h1>
        <h2 className={`${unbounded.className} text-xl md:text-2xl font-black text-foreground uppercase tracking-widest mb-6`}>
          Route <span className="text-primary italic">Not Found</span>
        </h2>
        <p className="text-text-secondary text-lg mb-12 max-w-md mx-auto leading-relaxed">
          The task you&apos;re looking for doesn&apos;t exist or has been relocated to a different sector.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/" className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-primary/10 group active:scale-95">
            <Home size={18} />
            Back to Hub
          </Link>
          <Link href="/search" className="w-full sm:w-auto px-8 py-4 bg-white border border-border text-foreground rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-muted transition-all active:scale-95">
            <Search size={18} />
            Find Services
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
