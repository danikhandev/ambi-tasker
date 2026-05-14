"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Paperclip, Mic, CheckCheck, Check,
  Menu, MoreVertical, Phone, Video, Smile, Clock,
  AlertCircle, RefreshCw, User2, FileText, X, Camera,
  ChevronLeft, Headphones, Info
} from "lucide-react";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";
import { useSupportChat, SupportMessage } from "@/hooks/useSupportChat";
import { format } from "date-fns";

interface SupportChatWindowProps {
  conversationId: string;
  currentUserId: string;
  role: "USER" | "PROVIDER" | "ADMIN";
  userName: string;
  userImage?: string | null;
  hideHeader?: boolean;
}

export default function SupportChatWindow({
  conversationId,
  currentUserId,
  role,
  userName,
  userImage,
  hideHeader = false,
}: SupportChatWindowProps) {
  const { t } = useTranslation();
  const {
    messages,
    isTyping,
    isConnected,
    isLoading,
    sendMessage,
    sendTyping,
  } = useSupportChat({ conversationId, currentUserId, role });

  const [draftMessage, setDraftMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleDraftChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftMessage(e.target.value);
    sendTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => sendTyping(false), 2000);
  };

  const handleSend = async () => {
    if (!draftMessage.trim() && selectedFiles.length === 0) return;
    const ok = await sendMessage(draftMessage.trim(), []); // TODO: handle attachments
    if (ok) {
      setDraftMessage("");
      setSelectedFiles([]);
      sendTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border">
      {/* Support Header */}
      {!hideHeader && (
        <div className="px-6 py-4 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <Headphones size={24} />
            </div>
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2">
                {t("support.title") || "AmbiTasker Support"}
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </h3>
              <p className="text-[10px] font-black text-text-hint uppercase tracking-widest">
                {isConnected ? (t("chat.online") || "Online") : (t("chat.connecting") || "Connecting...")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 hover:bg-muted text-text-hint rounded-xl transition-all">
              <Info size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
        {isLoading && (
          <div className="flex justify-center py-10">
            <RefreshCw className="animate-spin text-primary/40" />
          </div>
        )}

        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center p-10 opacity-60">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-6">
              <Headphones size={40} className="text-text-hint" />
            </div>
            <h4 className="font-bold mb-2">{t("support.welcomeTitle") || "How can we help?"}</h4>
            <p className="text-sm max-w-xs mx-auto text-text-hint">
              {t("support.welcomeDesc") || "Our support team is here to assist you with any questions or issues."}
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.senderId === currentUserId;
          const isSupport = msg.senderRole === "ADMIN";
          
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                <div className={`px-5 py-3.5 rounded-[24px] text-sm shadow-sm ${
                  isOwn 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-card border border-border rounded-tl-none"
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-1.5 px-2">
                  <span className="text-[9px] font-black text-text-hint uppercase tracking-tighter">
                    {format(new Date(msg.createdAt), "HH:mm")}
                  </span>
                  {!isOwn && isSupport && (
                    <span className="text-[9px] font-bold text-primary bg-primary/5 px-1.5 py-0.5 rounded-full uppercase">
                      Support Agent
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="px-5 py-3 bg-muted rounded-[24px] rounded-tl-none flex gap-1.5 items-center">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area (Instagram Style) */}
      <div className="bg-background/80 backdrop-blur-xl px-4 py-3 border-t border-border sticky bottom-0 z-30">
        {selectedFiles.length > 0 && (
           <div className="flex gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
              {selectedFiles.map((f, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl bg-secondary flex-shrink-0">
                  <button onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 bg-gray-900 text-white rounded-full p-0.5 z-10"><X size={10} /></button>
                  <FileText className="w-full h-full p-4 text-text-hint" />
                </div>
              ))}
           </div>
        )}
        <div className="flex items-center gap-2 max-w-5xl mx-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full transition-all shrink-0"
          >
            <Paperclip className="w-5 h-5" />
            <input ref={fileInputRef} type="file" className="hidden" multiple onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))} />
          </button>
          
          <div className="flex-1 relative group flex items-center bg-secondary/50 rounded-[28px] border border-border/40 focus-within:border-primary/20 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
            <textarea
              value={draftMessage}
              onChange={handleDraftChange}
              onKeyDown={handleKeyDown}
              placeholder={t("chat.typeMessage") || "Describe your issue..."}
              rows={1}
              className="flex-1 px-4 py-2.5 text-[15px] bg-transparent border-none focus:ring-0 outline-none resize-none max-h-32 no-scrollbar font-medium placeholder:text-text-hint/50"
            />
            <button className="mr-1 p-2 text-text-hint hover:text-primary transition-all">
              <Smile className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center shrink-0">
            <AnimatePresence mode="wait">
              {draftMessage.trim() || selectedFiles.length > 0 ? (
                <motion.button
                  key="send"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleSend}
                  className="text-primary font-bold text-sm px-3 hover:opacity-80 transition-opacity"
                >
                  {t("common.send") || "Send"}
                </motion.button>
              ) : (
                <motion.button
                  key="mic"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="p-2 text-text-hint hover:text-primary transition-all"
                >
                  <Mic className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
