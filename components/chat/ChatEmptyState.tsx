"use client";

import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  ShieldCheck,
  Zap,
  Plus,
  Lock,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { unbounded } from "@/app/fonts";

export default function ChatEmptyState() {
  const { t } = useTranslation();

  const features = [
    { icon: Zap, label: t("chat.instantResponse") || "Instant Response", desc: t("chat.instantResponseDesc") || "Connect with verified pros in seconds" },
    { icon: ShieldCheck, label: t("chat.securePayments") || "Secure Payments", desc: t("chat.securePaymentsDesc") || "Your data and funds are always safe" },
    { icon: Sparkles, label: t("chat.qualityService") || "Quality Service", desc: t("chat.qualityServiceDesc") || "Top-rated professionals at your door" }
  ];

  return (
    <div className="h-full w-full flex items-center justify-center bg-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 text-center max-w-xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-24 h-24 bg-card rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] flex items-center justify-center mx-auto mb-10 relative"
        >
          <div className="absolute inset-0 bg-primary/5 rounded-[32px] animate-pulse" />
          <MessageSquare className="w-10 h-10 text-primary relative z-10" />
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-white rounded-xl shadow-lg flex items-center justify-center">
            <Plus size={16} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className={`${unbounded.className} text-3xl font-black text-foreground mb-4`}>
            {t("chat.secure") || "Secure"} <span className="text-primary italic">{t("chat.messaging") || "Messaging"}</span>
          </h2>
          <p className="text-text-secondary font-medium text-lg leading-relaxed mb-12">
            {t("chat.emptyStateSub") || "Select a professional from your contacts or browse our marketplace to start a new collaboration."}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
        >
          {features.map((item, i) => (
            <div key={i} className="bg-card p-6 rounded-[32px] border border-border shadow-sm hover:shadow-sm border border-border hover:shadow-md hover:shadow-gray-200/50 transition-all group">
              <div className="w-10 h-10 bg-muted text-text-hint group-hover:bg-primary/10 group-hover:text-primary rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors">
                <item.icon size={20} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground mb-1">{item.label}</h3>
              <p className="text-[10px] text-text-hint font-bold leading-tight">{item.desc}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center"
        >
          <button className="px-8 py-4 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary hover:shadow-sm border border-border hover:shadow-md hover:shadow-primary/20 transition-all flex items-center gap-3 group active:scale-95 transition-all duration-200">
            {t("chat.exploreMarketplace") || "Explore Our Marketplace"}
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase text-text-disabled tracking-[0.2em]">
            <Lock size={12} className="text-green-500" />
            <span>{t("chat.endToEndEncrypted") || "End-to-End Encrypted"}</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
