"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import SupportChatWindow from "@/components/support/SupportChatWindow";
import { Headphones, MessageSquare, ShieldCheck, Clock, ArrowRight, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import SharedShell from "@/components/SharedShell";

export default function SupportPage() {
  const { user } = useUser();
  const { t } = useTranslation();
  const [conversation, setConversation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversation();
    }
  }, [user]);

  const fetchConversation = async () => {
    try {
      const res = await fetch("/api/support/conversations");
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setConversation(json.data[0]); // Get the latest thread
      }
    } catch (err) {
      console.error("Failed to fetch support conversation", err);
    } finally {
      setLoading(false);
    }
  };

  const startNewThread = async (category: string = "GENERAL") => {
    setCreating(true);
    try {
      const res = await fetch("/api/support/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject: `Support Request - ${category}` })
      });
      const json = await res.json();
      if (json.success) {
        setConversation(json.data);
      }
    } catch (err) {
      console.error("Failed to create support thread", err);
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <SharedShell>
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <Headphones size={64} className="text-primary/20 mb-6" />
          <h1 className="text-3xl font-black mb-4">Please Login</h1>
          <p className="text-text-hint max-w-sm mb-8">You need to be logged in to access our support chat and view your conversation history.</p>
          <a href="/login" className="px-8 py-4 bg-primary text-white rounded-2xl font-bold hover:shadow-xl transition-all">Login Now</a>
        </div>
      </SharedShell>
    );
  }

  return (
    <SharedShell>
      <div className="max-w-6xl mx-auto w-full h-[calc(100vh-140px)] flex flex-col">
        <AnimatePresence mode="wait">
          {!conversation ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex-1 flex flex-col items-center justify-center p-6"
            >
              <div className="w-24 h-24 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mb-8 animate-bounce">
                <Headphones size={48} />
              </div>
              <h1 className="text-4xl font-black mb-4 text-center">{t("support.howCanWeHelp") || "How can we help?"}</h1>
              <p className="text-text-hint text-center max-w-lg mb-12">
                Our support team is available 24/7 to assist you with booking issues, payments, or any other questions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                {[
                  { id: 'BOOKING', label: 'Booking Support', icon: <MessageSquare size={20} />, desc: 'Issues with existing service requests' },
                  { id: 'PAYMENT', label: 'Payments & Refunds', icon: <Clock size={20} />, desc: 'Billing questions or refund status' },
                  { id: 'SAFETY', label: 'Safety & Quality', icon: <ShieldCheck size={20} />, desc: 'Report an incident or poor service' },
                  { id: 'GENERAL', label: 'General Inquiry', icon: <Headphones size={20} />, desc: 'Anything else you need help with' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => startNewThread(cat.id)}
                    disabled={creating}
                    className="p-6 bg-card border border-border rounded-3xl text-left hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="text-primary" />
                    </div>
                    <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                      {cat.icon}
                    </div>
                    <h3 className="font-bold text-lg mb-1">{cat.label}</h3>
                    <p className="text-xs text-text-hint">{cat.desc}</p>
                  </button>
                ))}
              </div>
              
              {loading && (
                <div className="mt-8 flex items-center gap-2 text-primary font-bold">
                  <RefreshCw size={20} className="animate-spin" />
                  <span>Checking for existing threads...</span>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 bg-card border border-border rounded-3xl overflow-hidden shadow-2xl flex"
            >
              <div className="flex-1 relative">
                <SupportChatWindow
                  conversationId={conversation.id}
                  currentUserId={user.id}
                  role={user.role as any}
                  userName={user.name}
                  userImage={user.profileImage}
                />
                
                {/* Back Button for Support Home */}
                <button
                  onClick={() => setConversation(null)}
                  className="absolute top-4 left-4 z-[40] p-2 bg-card/80 backdrop-blur-md rounded-xl border border-border shadow-sm hover:text-primary transition-all md:hidden"
                >
                  <ArrowRight className="rotate-180" />
                </button>
              </div>
              
              {/* Support Info Sidebar (Desktop Only) */}
              <div className="w-80 border-l border-border bg-muted/30 p-6 hidden lg:flex flex-col">
                 <div className="mb-8">
                    <h3 className="font-black text-xs uppercase tracking-widest text-text-hint mb-4">Ticket Info</h3>
                    <div className="space-y-4">
                       <div>
                          <p className="text-[10px] font-black text-text-disabled uppercase">Category</p>
                          <p className="text-sm font-bold">{conversation.category}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-text-disabled uppercase">Started On</p>
                          <p className="text-sm font-bold">{new Date(conversation.createdAt).toLocaleDateString()}</p>
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-text-disabled uppercase">Status</p>
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">{conversation.status}</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="mt-auto p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-[10px] text-primary font-black uppercase mb-1">Average Response Time</p>
                    <p className="text-xl font-black text-primary">~15 Minutes</p>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SharedShell>
  );
}
