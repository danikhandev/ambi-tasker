"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Paperclip, Mic, CheckCheck, Check,
  Menu, MoreVertical, Phone, Video, Smile, Clock,
  AlertCircle, RefreshCw, User2, FileText, X, Camera
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
  onToggleSidebar?: () => void;
}

export default function ChatWindow({
  conversationId,
  userName,
  userImage,
  isOnline,
  currentUserId,
  currentUserRole,
  onToggleSidebar,
}: ChatWindowProps) {
  const [draftMessage, setDraftMessage] = useState("");
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Attachment | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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

  // ─── Auto-scroll to bottom on new messages ────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

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
      <div className="h-full flex flex-col bg-card overflow-hidden">
        {/* Header */}
        <div className="bg-card/80 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="lg:hidden p-2.5 hover:bg-muted text-text-hint rounded-2xl transition-all active:scale-95 duration-200"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <div className="relative group cursor-pointer">
              <div className="w-12 h-12 rounded-2xl bg-secondary p-0.5 transition-transform hover:scale-105 duration-300 relative overflow-hidden flex items-center justify-center">
                {userImage && !userImage.includes("dicebear.com") ? (
                  <Image
                    src={userImage}
                    alt={userName}
                    fill
                    className="rounded-[14px] object-cover bg-card"
                  />
                ) : (
                  <User2 className="w-6 h-6 text-text-hint opacity-40" />
                )}
              </div>
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-xl shadow-sm" />
              )}
            </div>
            <div>
              <h2 className={`${unbounded.className} text-base font-bold text-foreground leading-none mb-1`}>
                {userName}
              </h2>
              <div className="flex items-center gap-1.5">
                {isTyping ? (
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">
                    {t("chat.typing") || "typing..."}
                  </p>
                ) : (
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isOnline ? "text-green-500" : "text-text-hint"}`}>
                    {isOnline ? (t("chat.activeNow") || "Active Now") : (t("chat.offline") || "Offline")}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Socket connection indicator */}
            <div
              className={`w-2 h-2 rounded-full transition-colors ${isConnected ? "bg-green-400" : "bg-amber-400"}`}
              title={isConnected ? "Real-time connected" : "Reconnecting..."}
            />
            <button className="hidden md:flex p-2.5 hover:bg-muted text-text-hint hover:text-primary rounded-2xl transition-all border border-transparent hover:border-border active:scale-95 duration-200">
              <Phone size={20} />
            </button>
            <button className="hidden md:flex p-2.5 hover:bg-muted text-text-hint hover:text-primary rounded-2xl transition-all border border-transparent hover:border-border active:scale-95 duration-200">
              <Video size={20} />
            </button>
            <div className="w-px h-6 bg-gray-100 mx-2 hidden md:block" />
            <button className="p-2.5 hover:bg-muted text-text-hint hover:text-primary rounded-2xl transition-all border border-transparent hover:border-border active:scale-95 duration-200">
              <MoreVertical size={20} />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 bg-background">
          {isLoading && (
            <div className="py-8 text-center">
              <div className="inline-flex items-center gap-2 text-xs text-text-hint font-medium">
                <RefreshCw className="w-3 h-3 animate-spin" />
                {t("chat.loadingMessages")}
              </div>
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

                <div className={`flex gap-4 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                    {!isOwn && (
                      <div className="flex-shrink-0 w-10">
                        {showAvatar && (
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
                        )}
                      </div>
                    )}

                  <div className={`max-w-[75%] md:max-w-[60%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                    {msg.attachments?.map(att => (
                      <div key={att.id} className="mb-2 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300 border border-border">
                        <FileAttachmentPreview attachment={att} onPreview={() => setSelectedMedia(att)} />
                      </div>
                    ))}

                    {msg.content && (
                      <div
                        className={`px-5 py-3.5 rounded-[24px] text-sm leading-relaxed shadow-sm ${
                          isOwn
                            ? isFailed
                              ? "bg-red-50 text-red-700 border border-red-100 rounded-tr-none"
                              : "bg-primary text-white rounded-tr-none shadow-primary/10 font-medium"
                            : "bg-card text-foreground border border-border rounded-tl-none font-medium"
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
                      {isOwn && <StatusIcon status={msg.status} />}
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
        </div>

        {/* Input Area (Instagram Style) */}
        <div className="bg-background/80 backdrop-blur-xl px-4 py-3 border-t border-border sticky bottom-0 z-30">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full transition-all shrink-0"
              title={t("chat.attachFile") || "Attach File"}
            >
              <Paperclip className="w-5 h-5" />
              <input ref={fileInputRef} type="file" className="hidden" multiple onChange={handleFileSelect} />
            </button>
            <div className="flex-1 relative group flex items-center bg-secondary/50 rounded-[28px] border border-border/40 focus-within:border-primary/20 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
              <button
                onClick={() => setShowCamera(true)}
                className="ml-2 p-2 text-text-hint hover:text-primary transition-all active:scale-95"
                title={t("chat.openCamera") || "Open Camera"}
              >
                <Camera className="w-5 h-5" />
              </button>
              <textarea
                value={draftMessage}
                onChange={handleDraftChange}
                onKeyDown={handleKeyDown}
                placeholder={t("chat.typeMessage") || "Message..."}
                rows={1}
                className="flex-1 px-3 py-2.5 text-[15px] bg-transparent border-none focus:ring-0 outline-none resize-none max-h-32 no-scrollbar font-medium placeholder:text-text-hint/50"
              />
              <button
                className="mr-1 p-2 text-text-hint hover:text-primary transition-all"
                title={t("chat.addEmoji") || "Add Emoji"}
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center shrink-0">
              <AnimatePresence mode="wait">
                {draftMessage.trim() ? (
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
                  <div className="flex items-center gap-1">
                    <motion.button
                      key="mic"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => setShowVoiceRecorder(true)}
                      className="p-2 text-text-hint hover:text-primary transition-all"
                    >
                      <Mic className="w-5 h-5" />
                    </motion.button>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1 text-[9px] font-black text-text-disabled uppercase tracking-widest">
              <Clock size={10} />
              <span>{t("chat.endToEndEncrypted") || "End-to-end encrypted"}</span>
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
