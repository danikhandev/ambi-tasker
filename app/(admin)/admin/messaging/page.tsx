"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Search, Filter, User, Briefcase, Clock, Send, 
  ChevronRight, Shield, ShieldCheck, MoreVertical, Loader2, Inbox, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import { useTranslation } from "@/hooks/useTranslation";
import CircularFrame from "@/components/CircularFrame";

interface Conversation {
    id: string;
    user: { id: string; name: string; profileImage: string; role: string };
    provider: { id: string; name: string; profileImage: string; role: string };
    lastMessageAt: string;
    messageCount: number;
}

interface Message {
    id: string;
    senderId: string;
    messageText: string;
    createdAt: string;
    sender: { id: string; name: string; profileImage: string };
}

export default function AdminMessagingPage() {
    const { showToast, setPageTitle } = useUI();
    const { t } = useTranslation();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [search, setSearch] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setPageTitle(t("admin.messaging.title") + " " + t("admin.messaging.highlight"), "");
        fetchConversations();
    }, [setPageTitle, t]);

    useEffect(() => {
        if (selectedId) {
            fetchMessages(selectedId);
        }
    }, [selectedId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConversations = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/messaging");
            const json = await res.json();
            if (json.success) {
                setConversations(json.data);
            }
        } catch (error: any) {
            showToast("Failed to sync conversations", "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (id: string) => {
        setMessagesLoading(true);
        try {
            const res = await fetch(`/api/admin/messaging/${id}`);
            const json = await res.json();
            if (json.success) {
                setMessages(json.data);
            }
        } catch (error: any) {
            showToast("Failed to fetch transcript", "error");
        } finally {
            setMessagesLoading(false);
        }
    };

    const filteredConversations = conversations.filter(c => 
        c.user.name.toLowerCase().includes(search.toLowerCase()) || 
        c.provider.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedConv = conversations.find(c => c.id === selectedId);

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col gap-6 pb-6">
            <div className="flex-1 flex gap-6 min-h-0">
                {/* Sidebar - Conversation List */}
                <div className="w-[360px] flex flex-col gap-6 bg-card rounded-[32px] border border-border p-6 shadow-sm overflow-hidden">
                    <div className="px-2">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-hint/40 group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text" 
                                placeholder={t("admin.messaging.filterPlaceholder")}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-11 pr-5 py-3 bg-muted/20 border border-border/60 rounded-xl text-xs font-bold focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none placeholder:text-text-hint/40"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 px-2 pb-4">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="p-4 rounded-2xl border border-transparent flex gap-4 animate-pulse">
                                    <div className="w-10 h-10 bg-muted rounded-xl" />
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-3 bg-muted rounded w-1/2" />
                                        <div className="h-2 bg-muted rounded w-3/4" />
                                    </div>
                                </div>
                            ))
                        ) : filteredConversations.length === 0 ? (
                            <div className="py-20 text-center opacity-30">
                                <Inbox className="mx-auto mb-4" size={32} />
                                <p className="text-[10px] font-black uppercase tracking-widest">{t("admin.messaging.noActiveNodes")}</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedId(conv.id)}
                                    className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 group text-left ${
                                        selectedId === conv.id 
                                            ? 'bg-primary/5 text-primary border-primary/20 shadow-sm' 
                                            : 'bg-transparent border-transparent hover:bg-muted/30'
                                    }`}
                                >
                                    <div className="relative shrink-0">
                                        <CircularFrame src={conv.user.profileImage} alt={conv.user.name[0]} size={42} border={true} />
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-card bg-card overflow-hidden shadow-sm">
                                            <img src={conv.provider.profileImage || "/placeholder.jpg"} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <h4 className="text-[11px] font-black uppercase tracking-tight truncate leading-none text-foreground">
                                                {conv.user.name.split(' ')[0]} & {conv.provider.name.split(' ')[0]}
                                            </h4>
                                            <span className="text-[9px] font-bold text-text-hint/60">
                                                {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-[9px] font-bold truncate text-text-hint/80 uppercase tracking-tighter">
                                            Booking: {conv.id.slice(-8).toUpperCase()}
                                        </p>
                                    </div>
                                    <ChevronRight className={`shrink-0 transition-all ${selectedId === conv.id ? 'translate-x-0.5 text-primary' : 'opacity-0 group-hover:opacity-40'}`} size={14} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main View - Chat Transcript */}
                <div className="flex-1 flex flex-col bg-card rounded-[32px] border border-border overflow-hidden relative shadow-sm">
                    {selectedId && selectedConv ? (
                        <>
                            {/* Header */}
                            <div className="px-8 py-6 border-b border-border bg-muted/5 flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="flex -space-x-3">
                                        <CircularFrame src={selectedConv.user.profileImage} alt="U" size={40} border={true} className="z-10 shadow-md" />
                                        <CircularFrame src={selectedConv.provider.profileImage} alt="P" size={40} border={true} className="shadow-sm" />
                                    </div>
                                    <div>
                                        <h3 className={`${unbounded.className} text-xs font-black text-foreground`}>
                                            {selectedConv.user.name} <span className="text-primary/40 mx-1.5 font-normal">/</span> {selectedConv.provider.name}
                                        </h3>
                                        <div className="flex items-center gap-2.5 mt-1">
                                            <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-full border border-emerald-500/10">
                                                <ShieldCheck size={10} /> Authenticated
                                            </span>
                                            <span className="text-[9px] font-bold text-text-hint uppercase tracking-tighter opacity-60">
                                                Trace ID: {selectedConv.id.slice(0, 12)}...
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-xl text-text-hint transition-all">
                                        <Activity size={16} />
                                    </button>
                                    <button className="w-10 h-10 flex items-center justify-center hover:bg-muted rounded-xl text-text-hint transition-all">
                                        <MoreVertical size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar bg-gray-50/30 dark:bg-transparent">
                                {messagesLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isFromCustomer = msg.senderId === selectedConv.user.id;
                                        
                                        return (
                                            <motion.div 
                                                key={msg.id} 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex items-end gap-3 ${isFromCustomer ? 'flex-row' : 'flex-row-reverse'}`}
                                            >
                                                <CircularFrame src={msg.sender.profileImage} alt={msg.sender.name[0]} size={30} border={true} />
                                                <div className={`max-w-[75%] space-y-1 ${isFromCustomer ? 'items-start' : 'items-end flex flex-col'}`}>
                                                    <div className={`px-5 py-3.5 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm ${
                                                        isFromCustomer 
                                                            ? 'bg-white text-slate-700 rounded-bl-none border border-border' 
                                                            : 'bg-slate-900 text-white rounded-br-none'
                                                    }`}>
                                                        {msg.messageText}
                                                    </div>
                                                    <span className="text-[9px] font-bold text-text-hint/40 px-2 uppercase">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Admin Intercept Placeholder */}
                            <div className="px-8 py-6 border-t border-border bg-muted/5">
                                <div className="flex items-center gap-4 bg-card border border-border/60 p-2.5 rounded-2xl shadow-sm opacity-60">
                                    <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-text-hint/40">
                                        <Shield size={18} />
                                    </div>
                                    <input 
                                        disabled 
                                        placeholder="Channel Interception Locked"
                                        className="flex-1 bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-widest text-text-hint/40"
                                    />
                                    <button className="w-10 h-10 bg-muted/30 text-text-disabled rounded-xl flex items-center justify-center cursor-not-allowed">
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                            <div className="w-20 h-20 bg-muted/40 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
                                <MessageSquare size={32} className="text-text-disabled/40" />
                            </div>
                            <h3 className={`${unbounded.className} text-xl font-black mb-3 text-foreground`}>Select Communications Node</h3>
                            <p className="text-text-hint font-medium max-w-[280px] mb-8 leading-relaxed text-[11px] opacity-60">
                                Select an active conversation to monitor real-time message flow and verify marketplace compliance.
                            </p>
                            <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Surveillance Mode Online</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
