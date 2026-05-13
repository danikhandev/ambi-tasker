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
        <div className="h-[calc(100vh-140px)] flex flex-col gap-8 pb-10">
            <div className="flex-1 flex gap-8 min-h-0">
                {/* Sidebar - Conversation List */}
                <div className="w-[400px] flex flex-col gap-6 bg-card rounded-[48px] border border-border p-8 shadow-sm">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-hint/50 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder={t("admin.messaging.filterPlaceholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-muted/30 border border-border/50 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="p-4 rounded-3xl border border-transparent flex gap-4 animate-pulse">
                                    <div className="w-12 h-12 bg-muted rounded-2xl" />
                                    <div className="flex-1 space-y-2 py-1">
                                        <div className="h-4 bg-muted rounded w-1/2" />
                                        <div className="h-3 bg-muted rounded w-3/4" />
                                    </div>
                                </div>
                            ))
                        ) : filteredConversations.length === 0 ? (
                            <div className="py-20 text-center opacity-40">
                                <Inbox className="mx-auto mb-4" size={32} />
                                <p className="text-xs font-bold text-text-hint">{t("admin.messaging.noActiveNodes")}</p>
                            </div>
                        ) : (
                            filteredConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelectedId(conv.id)}
                                    className={`w-full p-5 rounded-[32px] border transition-all flex items-center gap-4 group text-left ${
                                        selectedId === conv.id 
                                            ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-[1.02]' 
                                            : 'bg-muted/10 border-transparent hover:border-primary/20 hover:bg-white'
                                    }`}
                                >
                                    <div className="relative shrink-0">
                                        <CircularFrame src={conv.user.profileImage} alt={conv.user.name[0]} size={48} border={true} />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-card bg-card overflow-hidden">
                                            <img src={conv.provider.profileImage || "/placeholder.jpg"} className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <h4 className="text-xs font-black uppercase tracking-tight truncate leading-none">
                                                {conv.user.name.split(' ')[0]} & {conv.provider.name.split(' ')[0]}
                                            </h4>
                                            <span className={`text-[10px] font-medium ${selectedId === conv.id ? 'text-white/60' : 'text-text-hint'}`}>
                                                {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className={`text-[10px] font-bold truncate ${selectedId === conv.id ? 'text-white/80' : 'text-text-hint/80'}`}>
                                            {t("admin.messaging.booking")}: {conv.id.slice(-8).toUpperCase()}
                                        </p>
                                    </div>
                                    <ChevronRight className={`shrink-0 transition-transform ${selectedId === conv.id ? 'translate-x-1' : 'opacity-20'}`} size={16} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main View - Chat Transcript */}
                <div className="flex-1 flex flex-col bg-card rounded-[48px] border border-border overflow-hidden relative shadow-sm">
                    {selectedId && selectedConv ? (
                        <>
                            {/* Header */}
                            <div className="px-10 py-8 border-b border-border bg-muted/5 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex -space-x-4">
                                        <CircularFrame src={selectedConv.user.profileImage} alt="U" size={44} border={true} className="z-10" />
                                        <CircularFrame src={selectedConv.provider.profileImage} alt="P" size={44} border={true} />
                                    </div>
                                    <div>
                                        <h3 className={`${unbounded.className} text-sm font-black`}>
                                            {selectedConv.user.name} <span className="text-primary mx-2">×</span> {selectedConv.provider.name}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                <ShieldCheck size={10} /> {t("admin.messaging.authenticated")}
                                            </span>
                                            <span className="text-[10px] font-medium text-text-hint">
                                                {t("admin.messaging.activeTranscript")}: {selectedConv.id}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button className="p-4 hover:bg-muted rounded-2xl text-text-hint transition-all border border-transparent hover:border-border">
                                        <Activity size={18} />
                                    </button>
                                    <button className="p-4 hover:bg-muted rounded-2xl text-text-hint transition-all border border-transparent hover:border-border">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar bg-gray-50/50 dark:bg-transparent">
                                {messagesLoading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" />
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const isFromCustomer = msg.senderId === selectedConv.user.id;
                                        const isFromProvider = msg.senderId === selectedConv.provider.id;
                                        
                                        return (
                                            <motion.div 
                                                key={msg.id} 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex items-end gap-4 ${isFromCustomer ? 'flex-row' : 'flex-row-reverse'}`}
                                            >
                                                <CircularFrame src={msg.sender.profileImage} alt={msg.sender.name[0]} size={32} border={true} />
                                                <div className={`max-w-[70%] space-y-1 ${isFromCustomer ? 'items-start' : 'items-end flex flex-col'}`}>
                                                    <div className={`p-5 rounded-[24px] text-sm font-medium shadow-sm ${
                                                        isFromCustomer 
                                                            ? 'bg-white text-foreground rounded-bl-none border border-border' 
                                                            : 'bg-gray-900 text-white rounded-br-none'
                                                    }`}>
                                                        {msg.messageText}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-text-hint px-2">
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
                            <div className="p-8 border-t border-border bg-muted/10 backdrop-blur-md">
                                <div className="flex items-center gap-4 bg-card border border-border p-4 rounded-3xl shadow-sm opacity-50 cursor-not-allowed">
                                    <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-text-hint">
                                        <Shield size={20} />
                                    </div>
                                    <input 
                                        disabled 
                                        placeholder={t("admin.messaging.interceptionLocked")}
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-text-hint"
                                    />
                                    <button className="w-12 h-12 bg-muted text-text-disabled rounded-2xl flex items-center justify-center">
                                        <Send size={20} />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                            <div className="w-24 h-24 bg-muted rounded-[32px] flex items-center justify-center mb-8 shadow-inner">
                                <MessageSquare size={40} className="text-text-disabled" />
                            </div>
                            <h3 className={`${unbounded.className} text-2xl font-black mb-4`}>{t("admin.messaging.signalSelection")}</h3>
                            <p className="text-text-hint font-medium max-w-sm mb-10 leading-relaxed text-xs">
                                {t("admin.messaging.signalSelectionDesc")}
                            </p>
                            <div className="flex items-center gap-2 px-6 py-3 bg-emerald-50 border border-emerald-100 rounded-full">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-600">{t("admin.messaging.monitoringOnline")}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
