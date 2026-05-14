"use client";

import React, { useState, useEffect } from "react";
import { Headphones, X, MessageSquare, Send, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/contexts/UserContext";
import { useTranslation } from "@/hooks/useTranslation";
import SupportChatWindow from "./SupportChatWindow";
import { usePathname } from "next/navigation";
import { unbounded } from "@/app/fonts";

/**
 * SupportFloatingWidget - A production-level floating chat widget
 * designed for User and Provider dashboards.
 */
export default function SupportFloatingWidget() {
  const { user } = useUser();
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Visibility Logic: Hide on admin pages, support page, and auth pages
  const isAdminPage = pathname?.startsWith("/admin");
  const isSupportPage = pathname === "/support";
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname?.startsWith("/register");

  useEffect(() => {
    if (isOpen && user && !conversation) {
      fetchConversation();
    }
  }, [isOpen, user]);

  const fetchConversation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/conversations");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setConversation(json.data[0]);
      }
    } catch (err) {
      console.error("Failed to fetch support conversation", err);
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "Quick Support Widget", category: "GENERAL" })
      });
      const json = await res.json();
      if (json.success) {
        setConversation(json.data);
      }
    } catch (err) {
      console.error("Failed to start support conversation", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || isAdminPage || isSupportPage || isAuthPage) return null;

  return (
    <div className="fixed bottom-32 right-6 md:bottom-8 md:right-8 z-[9999] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[90vw] md:w-[380px] h-[580px] max-h-[80vh] bg-card border border-border shadow-[0_30px_90px_-20px_rgba(0,0,0,0.3)] rounded-[32px] overflow-hidden mb-6 flex flex-col pointer-events-auto"
          >
            {/* Widget Header */}
            <div className="p-5 bg-gradient-to-r from-primary to-indigo-600 text-white flex items-center justify-between flex-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                  <Headphones size={20} />
                </div>
                <div>
                  <h4 className="font-black text-sm tracking-tight">AmbiTasker Support</h4>
                  <div className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                     <p className="text-[9px] opacity-90 uppercase font-black tracking-widest">Active Assistant</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-all"
                aria-label="Minimize"
              >
                <Minus size={20} strokeWidth={3} />
              </button>
            </div>

            {/* Widget Content */}
            <div className="flex-1 overflow-hidden relative bg-background/50">
              {conversation ? (
                <SupportChatWindow
                  conversationId={conversation.id}
                  currentUserId={user.id}
                  role={user.role as any}
                  userName={user.firstName}
                  userImage={user.profileImage}
                  hideHeader={true}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                  <div className="relative mb-8">
                     <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                     <div className="w-24 h-24 bg-card border border-border/50 text-primary rounded-[32px] flex items-center justify-center relative z-10 shadow-xl group">
                       <MessageSquare size={40} className="group-hover:scale-110 transition-transform duration-500" />
                     </div>
                  </div>
                  
                  <h5 className={`${unbounded.className} text-xl font-black mb-3 tracking-tight text-foreground`}>
                    {t("support.howCanWeHelp") || "How can we help?"}
                  </h5>
                  <p className="text-xs text-text-hint font-medium mb-10 max-w-[240px] mx-auto leading-relaxed">
                    Connect with our support experts for real-time assistance with your account.
                  </p>
                  
                  <button
                    onClick={startNewConversation}
                    disabled={loading}
                    className="w-full py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:shadow-2xl hover:shadow-primary/30 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3 overflow-hidden group"
                  >
                    {loading ? (
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        <span>Initialize Chat</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 md:w-16 md:h-16 rounded-[24px] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] transition-all duration-500 pointer-events-auto border ${
          isOpen 
            ? "bg-white text-gray-400 border-border/50 hover:text-red-500" 
            : "bg-primary text-white border-primary/20 ring-4 ring-primary/10"
        }`}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div 
              key="close" 
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }} 
              animate={{ opacity: 1, rotate: 0, scale: 1 }} 
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            >
              <X size={24} strokeWidth={3} />
            </motion.div>
          ) : (
            <motion.div 
              key="open" 
              initial={{ opacity: 0, scale: 0.5 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.5 }} 
              className="relative"
            >
              <Headphones size={28} strokeWidth={2.5} />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-primary rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
