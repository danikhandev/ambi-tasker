"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Paperclip, Mic, CheckCheck, Check,
  Menu, MoreVertical, Phone, Video, Smile, Clock,
  AlertCircle, RefreshCw, User2, FileText, X, Camera,
  CheckCircle2, ChevronLeft, Loader2, Headphones
} from "lucide-react";
import Image from "next/image";
import FileAttachmentPreview from "./FileAttachmentPreview";
import MediaViewerModal from "./MediaViewerModal";
import VoiceRecorder from "./VoiceRecorder";
import CameraCapture from "../CameraCapture";
import { unbounded } from "@/app/fonts";
import { useTranslation } from "@/hooks/useTranslation";
import { useChat } from "@/hooks/useChat";

interface Attachment {
  id?: string;
  url?: string;
  fileUrl?: string;
  type?: string;
  fileType?: string;
  name?: string;
  fileName?: string;
  fileSize?: number;
}

interface ChatWindowProps {
  conversationId: string;
  userName: string;
  userImage?: string;
  isOnline: boolean;
  currentUserId: string;
  currentUserRole: "provider" | "consumer" | "admin";
  otherUserRole?: string;
  onToggleSidebar?: () => void;
}

export default function ChatWindow({
  conversationId,
  userName,
  userImage,
  isOnline,
  currentUserId,
  currentUserRole,
  otherUserRole,
  onToggleSidebar,
}: ChatWindowProps) {
  const [draftMessage, setDraftMessage] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Attachment | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [unreadWhileScrolledUp, setUnreadWhileScrolledUp] = useState(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const prevMessagesCount = useRef(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { t, language } = useTranslation();

  const {
    messages,
    isTyping,
    isConnected,
    isLoading,
    sendMessage,
    sendTyping,
    markAsRead,
    retryMessage,
  } = useChat({
    conversationId,
    currentUserId,
  });

  // ─── Auto-scroll to bottom (Smart Scroll) ────────────────────────
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const isInitialLoad = prevMessagesCount.current === 0 && messages.length > 0;
    const isNewMessage = messages.length > prevMessagesCount.current;
    const lastMessage = messages[messages.length - 1];
    const isOwnMessage = lastMessage?.senderId === currentUserId;

    // Tolerance for determining if we are at bottom
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;

    if (isInitialLoad || (isNewMessage && (isAtBottom || isOwnMessage))) {
      // Force scroll if initial load, or if already at bottom, or if we sent the message
      messagesEndRef.current?.scrollIntoView({ behavior: isInitialLoad ? "auto" : "smooth" });
      setUnreadWhileScrolledUp(0);
    } else if (isNewMessage && !isAtBottom) {
      // New message arrived but user is scrolled up
      setUnreadWhileScrolledUp(prev => prev + 1);
    }

    prevMessagesCount.current = messages.length;
  }, [messages, isTyping, currentUserId]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
    setShowScrollToBottom(!isAtBottom);
    if (isAtBottom) {
      setUnreadWhileScrolledUp(0);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadWhileScrolledUp(0);
  };

  // ─── Mark as read when window is focused / conversation opens ─────
  useEffect(() => {
    markAsRead();
  }, [conversationId, markAsRead]);

  // ─── Typing indicator: emit start/stop ───────────────────────────
  const handleDraftChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDraftMessage(e.target.value);

      // Emit typing start
      sendTyping(true);

      // Reset timer — emit stop after 1.5s of silence
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        sendTyping(false);
      }, 1500);
    },
    [sendTyping]
  );

  const handleSend = useCallback(async () => {
    if (!draftMessage.trim() && selectedFiles.length === 0) return;
    const text = draftMessage.trim();

    // In a real app, we would upload selectedFiles here
    console.log("Sending message with files:", selectedFiles);

    setDraftMessage("");
    setSelectedFiles([]);
    sendTyping(false);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    await sendMessage(text);
  }, [draftMessage, selectedFiles, sendMessage, sendTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSendFile = (file: File) => {
    setSelectedFiles(prev => [...prev, file]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
    e.target.value = "";
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleVoiceRecordingComplete = (audioBlob: Blob) => {
    const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: audioBlob.type });
    handleSendFile(file);
    setShowVoiceRecorder(false);
  };

  const handleCameraCapture = (image: string) => {
    const byteString = atob(image.split(",")[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    const blob = new Blob([ab], { type: "image/jpeg" });
    const file = new File([blob], `camera-shot-${Date.now()}.jpg`, { type: "image/jpeg" });
    handleSendFile(file);
    setShowCamera(false);
  };

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString(language === "ur" ? "ur-PK" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(language === "ur" ? "ur-PK" : "en-US", {
      month: "long",
      day: "numeric",
    });

  const allMediaAttachments = messages
    .flatMap(msg => msg.attachments || [])
    .filter(att => (att.fileType || att.type || "").startsWith("image/") || (att.fileType || att.type || "").startsWith("video/"));

  // Status icon
  const StatusIcon = ({ status }: { status: string }) => {
    if (status === "sending") return <Clock className="w-3 h-3 text-text-disabled animate-pulse" />;
    if (status === "sent") return <Check className="w-3.5 h-3.5 text-text-disabled" />;
    if (status === "delivered") return <CheckCheck className="w-3.5 h-3.5 text-text-disabled" />;
    if (status === "read") return <CheckCheck className="w-3.5 h-3.5 text-primary" />;
    return null;
  };

  return (
    <>
      <div className="h-full flex flex-col bg-[#F3F4F6] relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        {/* Sticky Header - Premium Design */}
        <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2 hover:bg-gray-100 text-gray-500 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <div className="relative group cursor-pointer">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border ${otherUserRole === "ADMIN" ? "bg-primary border-primary/20" : "bg-gradient-to-tr from-gray-100 to-gray-200 border-gray-200"}`}>
                {otherUserRole === "ADMIN" ? (
                  <Headphones className="w-5 h-5 text-white" />
                ) : userImage && !userImage.includes("dicebear.com") ? (
                  <Image
                    src={userImage}
                    alt={userName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User2 className="w-6 h-6 text-gray-400" />
                )}
              </div>
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
              )}
            </div>
            <div className="flex flex-col">
              <h2 className={`${unbounded.className} text-[15px] font-bold text-gray-900 leading-tight flex items-center gap-1.5`}>
                {otherUserRole === "ADMIN" ? "Ambi Tasker" : userName}
                {otherUserRole === "ADMIN" && (
                  <CheckCircle2 className="w-4 h-4 text-primary fill-primary/10" />
                )}
              </h2>
              <div className="flex items-center gap-1.5">
                {isTyping && otherUserRole !== "ADMIN" ? (
                  <p className="text-[11px] font-semibold text-primary animate-pulse italic">
                    {t("chat.typing") || "typing..."}
                  </p>
                ) : (
                  <p className={`text-[11px] font-medium ${isOnline ? "text-green-500" : "text-gray-400"}`}>
                    {isOnline 
                      ? (t("chat.activeNow") || "Active Now") 
                      : (otherUserRole === "ADMIN" ? "Support" : (t("chat.offline") || "Offline"))
                    }
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button className="p-2.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-all">
              <Phone size={20} />
            </button>
            <button className="p-2.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-all">
              <Video size={20} />
            </button>
            <button className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-all">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Message List - Dynamic Scrolling Area */}
        <div 
          ref={messagesContainerRef} 
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto space-y-4 px-4 py-6 scroll-smooth scrollbar-thin scrollbar-thumb-gray-200"
        >
          {!isConnected && (
            <div className="mx-auto bg-amber-50 text-amber-700 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-amber-100 flex items-center gap-2 animate-pulse w-fit">
              <RefreshCw className="w-3 h-3 animate-spin" />
              {t("chat.reconnecting") || "Reconnecting..."}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
            </div>
          )}
          
          {messages.map((msg, index) => {
            const isOwn = msg.senderId === currentUserId;
            const prevMsg = messages[index - 1];
            const showDate = !prevMsg || formatDate(prevMsg.createdAt) !== formatDate(msg.createdAt);
            const showAvatar = !isOwn && (!prevMsg || prevMsg.senderId !== msg.senderId || showDate);
            const isFailed = msg.content?.startsWith("❌ ");

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {showDate && (
                  <div className="flex items-center gap-4 my-8">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[10px] font-black text-text-disabled uppercase tracking-widest">
                      {formatDate(msg.createdAt)}
                    </span>
                    <div className="flex-1 h-px bg-gray-100" />
                  </div>
                )}

                <div className={`flex items-end gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                  {!isOwn && (
                    <div className="flex-shrink-0 mb-1">
                      {showAvatar ? (
                        <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                          {userImage && !userImage.includes("dicebear.com") ? (
                            <Image
                              src={userImage}
                              alt={userName}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <User2 className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      ) : (
                        <div className="w-8" /> // Spacer for grouped messages
                      )}
                    </div>
                  )}

                  <div className={`flex flex-col ${isOwn ? "items-end ml-auto" : "items-start mr-auto"} max-w-[80%] md:max-w-[70%]`}>
                    {msg.attachments?.map(att => (
                      <div key={att.id} className="mb-2 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300 border border-border">
                        <FileAttachmentPreview attachment={att} onPreview={() => setSelectedMedia(att)} />
                      </div>
                    ))}

                    {msg.content && (
                      <div
                        className={`relative px-4 py-2.5 shadow-sm text-[15px] leading-relaxed transition-all duration-200 ${
                          isOwn
                            ? isFailed
                              ? "bg-red-50 text-red-700 border border-red-100 rounded-2xl rounded-br-md"
                              : "bg-primary text-white rounded-2xl rounded-br-md"
                            : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-bl-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                        {isFailed && (
                          <button
                            onClick={() => retryMessage(msg.id)}
                            className="flex items-center gap-1 mt-2 text-xs text-red-500 hover:text-red-700 font-bold"
                          >
                            <RefreshCw className="w-3 h-3" /> {t("chat.retry")}
                          </button>
                        )}
                      </div>
                    )}

                    <div className={`flex items-center gap-1.5 mt-2 px-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                      <span className="text-[10px] font-black text-text-hint uppercase tracking-tighter">
                        {formatTime(msg.createdAt)}
                      </span>
                      {isOwn && otherUserRole !== "ADMIN" && <StatusIcon status={msg.status} />}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Typing Indicator Bubble */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                key="typing-indicator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 w-10">
                  <div className="w-10 h-10 rounded-xl bg-secondary p-0.5 relative overflow-hidden flex items-center justify-center">
                    {userImage && !userImage.includes("dicebear.com") ? (
                      <Image
                        src={userImage}
                        alt={userName}
                        fill
                        className="rounded-[9px] object-cover bg-card"
                      />
                    ) : (
                      <User2 className="w-5 h-5 text-text-hint opacity-40" />
                    )}
                  </div>
                </div>
                <div className="px-5 py-4 bg-card border border-border rounded-[24px] rounded-tl-none shadow-sm flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-text-hint rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected Files Preview (Instagram Style) */}
          <AnimatePresence>
            {selectedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-6 py-4 bg-background/50 backdrop-blur-md border-t border-border overflow-hidden"
              >
                <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                  {selectedFiles.map((file, i) => {
                    const isImg = file.type.startsWith("image/");
                    const url = URL.createObjectURL(file);
                    return (
                      <motion.div
                        key={i}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative flex-shrink-0"
                      >
                        <div className="w-24 h-24 rounded-2xl bg-secondary overflow-hidden border border-border shadow-sm flex items-center justify-center">
                          {isImg ? (
                            <Image src={url} alt="preview" fill className="object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-1 p-2">
                              <FileText size={24} className="text-text-hint" />
                              <span className="text-[8px] font-black uppercase text-center truncate w-full px-2">
                                {file.name}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeSelectedFile(i)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-500 transition-colors z-10"
                        >
                          <X size={12} />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />

          {/* New Messages Indicator / Scroll to Bottom */}
          <AnimatePresence>
            {showScrollToBottom && (
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                onClick={scrollToBottom}
                className="absolute bottom-28 left-1/2 -translate-x-1/2 z-40 bg-white/90 backdrop-blur-md border border-gray-100 shadow-xl rounded-full p-3 flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all group"
              >
                <div className="relative">
                  <ChevronLeft className="w-5 h-5 text-primary -rotate-90" />
                  {unreadWhileScrolledUp > 0 && (
                    <span className="absolute -top-3 -right-3 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white animate-bounce shadow-sm">
                      {unreadWhileScrolledUp > 5 ? "5+" : unreadWhileScrolledUp}
                    </span>
                  )}
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky Composer - Premium Production Input */}
        <div className="bg-white/95 backdrop-blur-md border-t border-gray-100 px-4 py-3 sticky bottom-0 z-30">
          <div className="max-w-5xl mx-auto flex flex-col gap-2">
            {/* Minimal Encryption Note */}
            <div className="flex items-center justify-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
              <Clock size={8} className="text-gray-400" />
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]">{t("chat.endToEndEncrypted") || "Secured"}</span>
            </div>

            <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-[24px] px-3 py-1.5 focus-within:bg-white focus-within:border-primary/20 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
              {/* Action Icons - Left Group */}
              <div className="flex items-center gap-0.5 pb-1">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                >
                  <Paperclip className="w-5 h-5" />
                  <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleFileSelect} />
                </button>
                <button 
                  onClick={() => setShowCamera(true)}
                  className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              {/* Multiline Input Field */}
              <textarea
                value={draftMessage}
                onChange={handleDraftChange}
                onKeyDown={handleKeyDown}
                placeholder={t("chat.typeMessage") || "Message..."}
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 outline-none resize-none max-h-32 py-2 text-[15px] font-medium placeholder:text-gray-400 no-scrollbar"
              />

              {/* Action Icons - Right Group */}
              <div className="flex items-center gap-0.5 pb-1">
                <button 
                  onClick={() => setShowVoiceRecorder(true)}
                  className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-full transition-all"
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSend}
                  disabled={!draftMessage.trim() && selectedFiles.length === 0}
                  className={`p-2 rounded-full transition-all active:scale-90 ${
                    draftMessage.trim() || selectedFiles.length > 0
                      ? "text-primary hover:bg-primary/5"
                      : "text-gray-300"
                  }`}
                >
                  <Send className="w-5 h-5" fill={draftMessage.trim() ? "currentColor" : "none"} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showVoiceRecorder && (
          <VoiceRecorder
            onRecordingComplete={handleVoiceRecordingComplete}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        )}
      </AnimatePresence>

      {selectedMedia && (
        <MediaViewerModal
          media={selectedMedia}
          allMedia={allMediaAttachments}
          onClose={() => setSelectedMedia(null)}
        />
      )}

      <AnimatePresence>
        {showCamera && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[999] flex items-center justify-center p-6">
            <div className="w-full max-w-xl">
              <CameraCapture
                type="selfie"
                onCapture={handleCameraCapture}
                onClose={() => setShowCamera(false)}
                allowUpload={true}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
