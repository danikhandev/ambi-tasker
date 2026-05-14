"use client";

import React from "react";
import { motion } from "framer-motion";
import { Headphones, Clock, Search, Filter, Circle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import { User2 } from "lucide-react";

interface SupportConversationListProps {
  conversations: any[];
  activeConversationId?: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

export default function SupportConversationList({
  conversations,
  activeConversationId,
  onSelect,
  isLoading,
}: SupportConversationListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card/50">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Headphones className="text-primary" />
          {t("admin.supportInbox") || "Support Inbox"}
        </h2>
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-hint group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder={t("common.search") || "Search conversations..."}
            className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-transparent focus:border-primary/20 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
        {conversations.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <Headphones size={48} className="mx-auto mb-4" />
            <p className="text-sm font-medium">{t("support.noConversations") || "No support threads found"}</p>
          </div>
        ) : (
          conversations.map((conv, i) => {
            const isActive = activeConversationId === conv.id;
            const user = conv.user;
            const lastMsg = conv.messages?.[0];
            const hasUnread = lastMsg && !lastMsg.isRead && lastMsg.senderRole !== "ADMIN";

            return (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left p-4 rounded-2xl transition-all relative group ${
                  isActive 
                    ? "bg-card border border-border shadow-[0_10px_30px_rgba(0,0,0,0.04)]" 
                    : "hover:bg-muted/80 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 overflow-hidden flex items-center justify-center relative">
                      {user?.profileImage && !user.profileImage.includes("dicebear.com") ? (
                        <Image src={user.profileImage} alt={user.name} fill className="object-cover" />
                      ) : (
                        <User2 className="w-6 h-6 text-primary/40" />
                      )}
                    </div>
                    {hasUnread && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm font-bold truncate ${hasUnread ? "text-foreground" : "text-foreground/80"}`}>
                        {user?.name || "Guest User"}
                      </h4>
                      <span className="text-[10px] font-black text-text-hint uppercase tracking-tighter">
                        {conv.updatedAt ? formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: false }) : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate max-w-[180px] ${hasUnread ? "font-bold text-foreground" : "text-text-hint"}`}>
                        {lastMsg?.content || t("support.newThread") || "New support thread"}
                      </p>
                      {conv.priority === "HIGH" && (
                         <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-[8px] font-black rounded-full uppercase">High</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
}
