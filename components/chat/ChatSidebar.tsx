"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, MoreVertical, CheckCircle2, MessageSquare, User2 } from "lucide-react";
import Image from "next/image";
// All chat data is fetched from Supabase
import { unbounded } from "@/app/fonts";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/services/supabase";
import { useUser } from "@/contexts/UserContext";
import { useAdmin } from "@/contexts/AdminContext";
import { useEffect, useCallback } from "react";

interface ChatUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  isOnline?: boolean;
}

interface Conversation {
  id: string;
  providerId: string;
  consumerId: string;
  lastMessageAt: string | null;
  lastMessageText: string;
  consumerUnreadCount: number;
  providerUnreadCount: number;
  otherUser?: ChatUser;
}

interface ChatSidebarProps {
  currentUserRole: "consumer" | "provider" | "admin";
}

export default function ChatSidebar({
  currentUserRole,
}: ChatSidebarProps) {
  const { user } = useUser();
  const { admin } = useAdmin();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { t, language } = useTranslation();

  const currentId = admin?.id || user?.id;

  const fetchConversations = useCallback(async () => {
    if (!currentId) return;

    try {
      const res = await fetch("/api/messages/conversations");
      const json = await res.json();
      
      if (!json.success) throw new Error(json.error || "Failed to fetch conversations");

      const mapped: Conversation[] = json.data.map((c: any) => ({
        id: c.id,
        providerId: "", // Not strictly needed for UI listing logic
        consumerId: "",
        lastMessageAt: c.lastMessageAt,
        lastMessageText: c.lastMessage,
        consumerUnreadCount: (currentUserRole === "consumer" || currentUserRole === "admin") ? c.unreadCount : 0,
        providerUnreadCount: currentUserRole === "provider" ? c.unreadCount : 0,
        otherUser: {
          id: c.otherUser.id,
          firstName: c.otherUser.name?.split(' ')[0] || "User",
          lastName: c.otherUser.name?.split(' ').slice(1).join(' ') || "",
          email: "",
          avatar: c.otherUser.avatar,
          isOnline: c.otherUser.isOnline
        }
      }));

      setConversations(mapped);
    } catch (err) {
      console.error("Chat fetch error:", err);
    }
  }, [currentId, currentUserRole]);

  useEffect(() => {
    if (currentId) {
      fetchConversations();

      // Poll as fallback for real-time since DB migrated from Supabase
      const interval = setInterval(fetchConversations, 10000);
      return () => clearInterval(interval);
    }
  }, [currentId, fetchConversations]);

  const filteredConversations = conversations.filter((conv) => {
    const fullName = `${conv.otherUser?.firstName || ""} ${conv.otherUser?.lastName || ""}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return fullName.includes(query);
  });

  const getUnreadCount = (conv: Conversation): number => {
    return (currentUserRole === "consumer" || currentUserRole === "admin")
      ? conv.consumerUnreadCount
      : conv.providerUnreadCount;
  };

  const formatTimestamp = (timestamp: string | null): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("chat.now") || "Now";
    if (diffMins < 60) return `${diffMins}${t("chat.min") || "m"}`;
    if (diffHours < 24) return `${diffHours}${t("chat.hour") || "h"}`;
    if (diffDays < 7) return `${diffDays}${t("chat.day") || "d"}`;

    return date.toLocaleDateString(language === "ur" ? "ur-PK" : "en-US", { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`h-full bg-card border-r border-border flex flex-col transition-all duration-500 ease-in-out relative z-10 ${isOpen ? "w-80 xl:w-96" : "w-24"
        }`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.h2
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`${unbounded.className} text-xl font-bold text-foreground flex items-center gap-2`}
              >
                {t("chat.chats") || "Chats"} <span className="w-6 h-6 bg-primary/10 text-primary text-[10px] rounded-xl flex items-center justify-center font-black">
                  {conversations.reduce((acc, c) => acc + getUnreadCount(c), 0)}
                </span>
              </motion.h2>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2.5 hover:bg-muted text-text-hint hover:text-primary rounded-2xl transition-all border border-transparent hover:border-border"
          >
            {isOpen ? <ChevronLeft className="w-5 h-5" /> : <MoreVertical className="w-5 h-5" />}
          </button>
        </div>

        {isOpen && (
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-hint group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={t("chat.searchMessages") || "Search messages..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 text-sm bg-muted border border-transparent focus:bg-card focus:border-primary/20 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm hover:shadow-md transition-all duration-300"
            />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-4">
        {!isOpen ? (
          <div className="flex flex-col items-center gap-4 py-2">
            {filteredConversations.map(conv => {
              const otherUser = conv.otherUser;
              if (!otherUser) return null;
              const isActive = pathname === `/messages/${otherUser.id}`;
              const unreadCount = getUnreadCount(conv);
              return (
                <div key={conv.id} className="relative group">
                  <Link href={`/messages/${otherUser.id}`} className={`block relative transition-all duration-300 ${isActive ? "scale-110" : "hover:scale-105"}`}>
                    <div className={`w-14 h-14 rounded-2xl p-0.5 overflow-hidden transition-all relative ${isActive ? "bg-primary shadow-lg shadow-primary/20" : "bg-gray-100 group-hover:bg-primary/20"}`}>
                      <Image src={otherUser.avatar || "/avatar-placeholder.png"} alt={otherUser.firstName || "User"} fill className="rounded-[14px] object-cover bg-card" />
                    </div>
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-[10px] font-black text-white rounded-xl flex items-center justify-center border-2 border-white shadow-sm shimmer">
                        {unreadCount}
                      </div>
                    )}
                    {isActive && <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-primary rounded-r-full" />}
                  </Link>
                </div>
              );
            })}
          </div>
        ) : filteredConversations.length > 0 ? (
          <div className="space-y-1">
            {filteredConversations.map((conv, i) => {
              const otherUser = conv.otherUser;
              if (!otherUser) return null;
              const isActive = pathname === `/messages/${otherUser.id}`;
              const unreadCount = getUnreadCount(conv);
              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/messages/${otherUser.id}`}
                    className={`group block p-4 rounded-[24px] transition-all relative ${isActive
                      ? "bg-card border border-border shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
                      : "hover:bg-muted/80 border border-transparent"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <div className={`w-14 h-14 rounded-2xl p-0.5 transition-all relative overflow-hidden ${isActive ? "bg-primary/10" : "bg-gray-100 group-hover:bg-primary/5"}`}>
                          <Image src={otherUser.avatar || "/avatar-placeholder.png"} alt={otherUser.firstName || "User"} fill className="rounded-[14px] object-cover bg-card" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-card rounded-xl shadow-sm flex items-center justify-center">
                          <div className={`w-2.5 h-2.5 rounded-full ${otherUser.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`${unbounded.className} text-sm font-bold truncate ${isActive ? 'text-primary' : 'text-foreground group-hover:text-primary transition-colors'}`}>
                            {otherUser.firstName} {otherUser.lastName}
                          </h3>
                          <span className="text-[10px] font-black text-text-disabled uppercase tracking-tighter ml-2 flex-shrink-0">
                            {formatTimestamp(conv.lastMessageAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs truncate font-medium ${unreadCount > 0 ? 'text-foreground font-bold' : 'text-text-hint'}`}>
                            {conv.lastMessageText}
                          </p>
                          {unreadCount > 0 && (
                            <div className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-xl shadow-lg shadow-primary/20 shimmer">
                              {unreadCount}
                            </div>
                          )}
                          {isActive && unreadCount === 0 && (
                            <CheckCircle2 size={12} className="text-primary flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 text-text-disabled">
              <MessageSquare size={32} />
            </div>
            <p className="text-sm font-bold text-text-hint">{t("chat.noConversations") || "No conversations found"}</p>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-border">
        <div className={`bg-gray-900 rounded-[28px] p-4 text-white flex items-center transition-all ${isOpen ? "gap-4" : "justify-center"}`}>
          <div className="w-10 h-10 rounded-xl bg-card/10 flex items-center justify-center text-primary flex-shrink-0">
            <User2 size={20} />
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-0.5">{t("chat.currentRole") || "Current Role"}</p>
              <p className="text-xs font-bold truncate capitalize">
                {currentUserRole === "provider" ? (t("nav.professional") || "Professional") : (t("nav.customer") || "Customer")} {t("chat.account") || "Account"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}