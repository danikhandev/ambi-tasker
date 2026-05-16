"use client";

import React, { useState, useEffect } from "react";
import { Headphones, X, MessageSquare, Send, Minus, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/contexts/UserContext";
import { useTranslation } from "@/hooks/useTranslation";
import SupportChatWindow from "./SupportChatWindow";
import { usePathname } from "next/navigation";
import { unbounded } from "@/app/fonts";
import Link from "next/link";

/**
 * SupportFloatingWidget - A production-level floating chat widget
 * designed for User and Provider dashboards.
 */
export default function SupportFloatingWidget() {
  const { user } = useUser();
  const { t } = useTranslation();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Visibility Logic: Hide on admin pages, support page, and auth pages
  const isAdminPage = pathname?.startsWith("/admin");
  const isSupportPage = pathname === "/support";
  const isAuthPage = pathname?.startsWith("/login") || 
                     pathname?.startsWith("/signup") || 
                     pathname?.startsWith("/register") ||
                     pathname?.startsWith("/messages");

  // Lock body scroll on mobile when widget is open
  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && user) {
      fetchConversations();
    }
  }, [isOpen, user]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/conversations");
      const json = await res.json();
      if (json.success) {
        setConversations(json.data);
        if (json.data.length === 1) {
          setSelectedId(json.data[0].id);
          setView("chat");
        } else if (json.data.length > 1) {
          setView("list");
        }
      }
    } catch (err) {
      console.error("Failed to sync support inbox", err);
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
        body: JSON.stringify({ subject: "Direct Support Inquiry", category: "GENERAL" })
      });
      const json = await res.json();
      if (json.success) {
        setConversations(prev => [json.data, ...prev]);
        setSelectedId(json.data.id);
        setView("chat");
      }
    } catch (err) {
      console.error("Failed to initialize support node", err);
    } finally {
      setLoading(false);
    }
  };

  if (!user || isAdminPage || isSupportPage || isAuthPage) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-6 md:bottom-8 md:right-8 z-[9999] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            className={`
              /* ── Mobile: Full-screen takeover ── */
              fixed inset-0 w-full h-full rounded-none
              /* ── Desktop: Floating card ── */
              md:relative md:inset-auto md:w-[380px] md:h-[580px] md:max-h-[80vh] md:rounded-[32px] md:mb-6
              bg-card border-0 md:border md:border-border 
              shadow-none md:shadow-[0_30px_90px_-20px_rgba(0,0,0,0.3)] 
              overflow-hidden flex flex-col pointer-events-auto z-[10000]
            `}
          >
            {/* Widget Header */}
            <div className="px-4 py-3 sm:px-5 sm:py-4 md:p-5 bg-gradient-to-r from-primary to-indigo-600 text-white flex items-center justify-between flex-none safe-area-top">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {view === "chat" && conversations.length > 0 ? (
                  <button 
                    onClick={() => setView("list")}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-white/30 transition-all flex-shrink-0"
                  >
                    <ChevronLeft size={18} />
                  </button>
                ) : (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10 flex-shrink-0">
                    <Headphones size={18} className="sm:w-5 sm:h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="font-black text-xs sm:text-sm tracking-tight leading-none mb-0.5 sm:mb-1 truncate">AmbiTasker Support</h4>
                  <div className="flex items-center gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                     <p className="text-[8px] sm:text-[9px] opacity-90 uppercase font-black tracking-widest leading-none">
                       {view === "chat" ? "Live Session" : "Active Assistant"}
                     </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                <Link 
                  href="/messages" 
                  className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-all"
                  title="Full Message Center"
                >
                  <MessageSquare size={14} className="sm:w-4 sm:h-4" />
                </Link>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-full transition-all"
                  aria-label="Close"
                >
                  <X size={18} strokeWidth={3} className="md:hidden" />
                  <Minus size={18} strokeWidth={3} className="hidden md:block" />
                </button>
              </div>
            </div>

            {/* Widget Content */}
            <div className="flex-1 overflow-hidden relative bg-background/50">
              {loading && conversations.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              ) : view === "chat" && selectedId ? (
                <SupportChatWindow
                  conversationId={selectedId}
                  currentUserId={user.id}
                  role={user.role as any}
                  userName={user.firstName}
                  userImage={user.profileImage}
                  hideHeader={true}
                />
              ) : conversations.length > 0 ? (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    {conversations.map((conv, i) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedId(conv.id);
                          setView("chat");
                        }}
                        className="w-full p-3 sm:p-4 border-b border-border/40 flex items-center gap-3 sm:gap-4 hover:bg-primary/5 transition-all group"
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-muted flex items-center justify-center text-text-hint shrink-0 group-hover:scale-105 transition-transform">
                          <MessageSquare size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <h5 className="text-[11px] sm:text-xs font-black uppercase tracking-tight text-foreground truncate">
                            Support Ticket #{conv.id.slice(-6).toUpperCase()}
                          </h5>
                          <p className="text-[9px] sm:text-[10px] font-bold text-text-hint truncate">
                            {conv.subject || "General Support Inquiry"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={startNewConversation}
                    className="p-3 sm:p-4 bg-muted/50 border-t border-border text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all safe-area-bottom"
                  >
                    Start New Inquiry
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-6 sm:p-10 text-center">
                  <div className="relative mb-6 sm:mb-8">
                     <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                     <div className="w-20 h-20 sm:w-24 sm:h-24 bg-card border border-border/50 text-primary rounded-[24px] sm:rounded-[32px] flex items-center justify-center relative z-10 shadow-xl group">
                       <MessageSquare size={32} className="sm:w-10 sm:h-10 group-hover:scale-110 transition-transform duration-500" />
                     </div>
                  </div>
                  
                  <h5 className={`${unbounded.className} text-lg sm:text-xl font-black mb-2 sm:mb-3 tracking-tight text-foreground`}>
                    {t("support.howCanWeHelp") || "How can we help?"}
                  </h5>
                  <p className="text-[11px] sm:text-xs text-text-hint font-medium mb-8 sm:mb-10 max-w-[240px] mx-auto leading-relaxed">
                    Connect with our support experts for real-time assistance.
                  </p>
                  
                  <button
                    onClick={startNewConversation}
                    disabled={loading}
                    className="w-full max-w-xs py-4 sm:py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:shadow-2xl hover:shadow-primary/30 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={14} />
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

      {/* Toggle Button — hidden when widget is open on mobile (fullscreen takes over) */}
      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-[20px] sm:rounded-[24px] flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] transition-all duration-500 pointer-events-auto border ${
          isOpen 
            ? "hidden md:flex bg-white text-gray-400 border-border/50 hover:text-red-500" 
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
              <Headphones size={22} strokeWidth={2.5} className="sm:w-7 sm:h-7" />
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-emerald-500 border-2 border-primary rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
