"use client";

import React, { useState, useEffect } from "react";
import SupportConversationList from "@/components/support/SupportConversationList";
import SupportChatWindow from "@/components/support/SupportChatWindow";
import { Headphones, RefreshCw, MoreVertical, MessageSquare, Clock, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { getAdminAuth } from "@/utils/admin-auth";

export default function AdminSupportPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchAdminProfile();
    fetchConversations();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const res = await fetch("/api/admin/me");
      const json = await res.json();
      if (json.success) {
        setAdmin(json.admin);
      }
    } catch (err) {
      console.error("Failed to fetch admin profile", err);
    }
  };

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support/conversations");
      const json = await res.json();
      if (json.success) {
        setConversations(json.data);
        if (json.data.length > 0 && !activeId) {
          setActiveId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch support conversations", err);
    } finally {
      setLoading(false);
    }
  };

  const activeConv = conversations.find(c => c.id === activeId);

  return (
    <div className="flex h-[calc(100vh-100px)] bg-background">
      {/* Sidebar List */}
      <div className="w-[400px] border-r border-border flex flex-col bg-card/30">
        <SupportConversationList
          conversations={conversations}
          activeConversationId={activeId || undefined}
          onSelect={setActiveId}
          isLoading={loading}
        />
        
        <div className="p-4 border-t border-border bg-card/50 mt-auto">
           <button 
             onClick={fetchConversations}
             className="w-full flex items-center justify-center gap-2 py-3 text-xs font-black uppercase text-primary hover:bg-primary/5 transition-all rounded-xl"
           >
             <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
             Refresh Inbox
           </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <AnimatePresence mode="wait">
          {activeConv ? (
            <motion.div
              key={activeConv.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex"
            >
              <div className="flex-1">
                <SupportChatWindow
                  conversationId={activeConv.id}
                  currentUserId={admin?.id || "unknown"}
                  role="ADMIN"
                  userName="Ambi Tasker"
                />
              </div>

              {/* Inspector Panel */}
              <div className="w-80 border-l border-border bg-card/20 p-6 overflow-y-auto no-scrollbar hidden xl:block">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="font-black text-xs uppercase tracking-widest text-text-hint">User Details</h3>
                   <button className="p-1.5 hover:bg-muted rounded-lg"><MoreVertical size={16} /></button>
                </div>
                
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-4 border-4 border-background shadow-lg">
                     <Headphones size={40} />
                  </div>
                  <h4 className="font-bold text-lg">{activeConv.user?.name || "Guest"}</h4>
                  <p className="text-xs text-text-hint mb-4">{activeConv.user?.email || "No email"}</p>
                  <div className="flex gap-2">
                     <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase">{activeConv.user?.role || "USER"}</span>
                     <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase">Verified</span>
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="p-4 bg-background border border-border rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                         <MessageSquare size={14} className="text-primary" />
                         <span className="text-[10px] font-black uppercase text-text-hint">Ticket Subject</span>
                      </div>
                      <p className="text-sm font-bold">{activeConv.subject || "No Subject"}</p>
                   </div>

                   <div className="p-4 bg-background border border-border rounded-2xl shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                         <Clock size={14} className="text-primary" />
                         <span className="text-[10px] font-black uppercase text-text-hint">Last Activity</span>
                      </div>
                      <p className="text-sm font-bold">Today, 10:45 AM</p>
                   </div>
                </div>
                
                <div className="mt-12">
                   <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-primary transition-all shadow-lg active:scale-95">
                      Mark as Resolved
                   </button>
                   <button className="w-full py-4 text-red-600 font-bold hover:bg-red-50 transition-all rounded-2xl mt-2">
                      Block User
                   </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-30">
              <Headphones size={120} />
              <h2 className="text-2xl font-black mt-8">Select a conversation</h2>
              <p className="max-w-xs mt-2">Pick a support thread from the list to start assisting users in real-time.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
