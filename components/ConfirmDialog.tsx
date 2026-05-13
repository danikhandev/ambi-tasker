"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, ShieldAlert } from "lucide-react";
import { unbounded } from "@/app/fonts";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  type = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const themes = {
    danger: {
      bg: "bg-red-50",
      text: "text-red-900",
      icon: "bg-red-100 text-red-600",
      btn: "bg-red-600 hover:bg-red-700 shadow-red-600/20",
    },
    warning: {
      bg: "bg-amber-50",
      text: "text-amber-900",
      icon: "bg-amber-100 text-amber-600",
      btn: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20",
    },
    info: {
      bg: "bg-blue-50",
      text: "text-blue-900",
      icon: "bg-blue-100 text-blue-600",
      btn: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20",
    },
  };

  const theme = themes[type];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-card w-full max-w-md rounded-[40px] border border-border overflow-hidden shadow-2xl"
        >
          <div className={`p-8 ${theme.bg} border-b border-border flex items-center justify-between`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.icon}`}>
                {type === 'danger' ? <ShieldAlert size={24} /> : <AlertCircle size={24} />}
              </div>
              <div>
                <h3 className={`${unbounded.className} text-lg font-black ${theme.text}`}>{title}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-text-hint opacity-70">Security Verification Required</p>
              </div>
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-white/50 rounded-xl transition-all">
              <X size={20} className="text-text-hint" />
            </button>
          </div>
          <div className="p-8">
            <p className="text-sm font-medium text-text-secondary leading-relaxed">
              {message}
            </p>
            <div className="mt-10 flex gap-4">
              <button
                onClick={onCancel}
                className="flex-1 h-14 bg-muted text-text-hint font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] hover:bg-border transition-all"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-[1.5] h-14 text-white font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${theme.btn}`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
