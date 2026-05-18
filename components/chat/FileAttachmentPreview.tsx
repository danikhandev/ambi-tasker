"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Download,
  FileText,
  File,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Music,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";

interface FileAttachmentPreviewProps {
  attachment: {
    id?: string;
    fileName?: string;
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;
    thumbnailUrl?: string | null;
    url?: string;
    type?: string;
    name?: string;
  };
  onPreview?: () => void;
}

export default function FileAttachmentPreview({
  attachment,
  onPreview,
}: FileAttachmentPreviewProps) {
  const { t } = useTranslation();
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  const fileType = attachment.fileType || attachment.type || '';
  const fileName = attachment.fileName || attachment.name || '';
  const fileUrl = attachment.fileUrl || attachment.url || '';

  const isImage =
    fileType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp"].some((ext) =>
      fileName.toLowerCase().endsWith(ext)
    );

  const isVideo =
    fileType.startsWith("video/") ||
    (["mp4", "webm", "mov"].some((ext) =>
      fileName.toLowerCase().endsWith(ext)
    ) && !fileType.startsWith("audio/"));

  const isAudio =
    fileType.startsWith("audio/") ||
    (["mp3", "wav", "ogg", "webm", "m4a"].some((ext) =>
      fileName.toLowerCase().endsWith(ext)
    ) && !fileType.startsWith("video/"));

  const isDocument =
    fileType.includes("pdf") ||
    fileType.includes("document") ||
    fileType.includes("word") ||
    fileType.includes("text") ||
    ["pdf", "doc", "docx", "txt"].some((ext) =>
      fileName.toLowerCase().endsWith(ext)
    );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (isImage) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className="relative group"
      >
        <div
          className="relative rounded-[24px] overflow-hidden cursor-pointer shadow-sm group-hover:shadow-sm border border-border hover:shadow-md transition-all duration-500 bg-gray-100"
          onClick={onPreview}
        >
          <Image
            src={attachment.thumbnailUrl || fileUrl}
            alt={fileName}
            width={400}
            height={300}
            className="object-cover max-w-full md:max-w-sm rounded-[24px]"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 flex items-center justify-center">
            <ExternalLink className="text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500" size={32} />
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className="absolute top-4 right-4 p-2.5 bg-card/90 backdrop-blur-md text-foreground rounded-xl opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500 shadow-lg hover:bg-card hover:text-primary shadow-sm hover:shadow-md transition-all duration-300"
          title={t("chat.download") || "Download"}
        >
          <Download className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  if (isVideo) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className="relative group max-w-full md:max-w-sm"
      >
        <div
          className="relative rounded-[24px] overflow-hidden cursor-pointer shadow-sm group-hover:shadow-sm border border-border hover:shadow-md transition-all duration-500"
          onClick={onPreview}
        >
          <video
            src={fileUrl}
            className="w-full rounded-[24px]"
            controls={false}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-all duration-500">
            <div className="w-16 h-16 bg-card/20 backdrop-blur-xl border border-white/30 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-500">
              <Play className="w-6 h-6 text-white ml-1 fill-white" />
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className="absolute top-4 right-4 p-2.5 bg-card/90 backdrop-blur-md text-foreground rounded-xl opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-500 shadow-lg hover:bg-card hover:text-primary shadow-sm hover:shadow-md transition-all duration-300"
          title={t("chat.download") || "Download"}
        >
          <Download className="w-4 h-4" />
        </button>
      </motion.div>
    );
  }

  if (isAudio) {
    return (
      <div className="bg-card rounded-[32px] p-4 shadow-sm border border-border min-w-[280px] max-w-sm hover:shadow-sm border border-border hover:shadow-md hover:shadow-gray-200/50 transition-all duration-500 group">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const audio = document.getElementById(`audio-${attachment.id}`) as HTMLAudioElement;
              if (audio) {
                if (audioPlaying) {
                  audio.pause();
                } else {
                  // Pause all other audio elements playing in the page
                  const allAudios = document.querySelectorAll("audio");
                  allAudios.forEach((el) => {
                    if (el.id !== `audio-${attachment.id}`) {
                      el.pause();
                    }
                  });
                  audio.play().catch((err) => {
                    console.error("Audio play failed:", err);
                  });
                }
              }
            }}
            className="flex-shrink-0 w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center hover:bg-primary transition-colors relative group-hover:scale-105 duration-500"
          >
            {audioPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 ml-0.5 fill-white" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Music size={12} className="text-primary flex-shrink-0" />
                <span className="text-[10px] font-black uppercase text-text-hint tracking-widest truncate">
                  {audioPlaying ? (t("chat.playingNow") || "Playing Now") : (t("chat.voiceNote") || "Voice Note")}
                </span>
              </div>
              <span className="text-[10px] font-black text-text-disabled">
                {audioDuration > 0
                  ? formatDuration(audioCurrentTime) + " / " + formatDuration(audioDuration)
                  : formatFileSize(attachment.fileSize || 0)}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5 relative overflow-hidden group/progress cursor-pointer">
              <motion.div
                className="bg-primary h-full rounded-full relative z-10"
                style={{ width: `${audioProgress}%` }}
              />
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/progress:opacity-100 transition-opacity" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                const audio = document.getElementById(`audio-${attachment.id}`) as HTMLAudioElement;
                if (audio) {
                  audio.muted = !isMuted;
                  setIsMuted(!isMuted);
                }
              }}
              className="p-1.5 hover:bg-muted text-text-hint hover:text-primary rounded-xl transition-colors"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 hover:bg-muted text-text-hint hover:text-primary rounded-xl transition-colors active:scale-95 transition-all duration-200"
              title={t("chat.download") || "Download"}
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        <audio
          id={`audio-${attachment.id}`}
          src={fileUrl}
          onPlay={() => setAudioPlaying(true)}
          onPause={() => setAudioPlaying(false)}
          onTimeUpdate={(e) => {
            const audio = e.currentTarget;
            const progress = (audio.currentTime / audio.duration) * 100;
            setAudioProgress(progress);
            setAudioCurrentTime(audio.currentTime);
          }}
          onLoadedMetadata={(e) => {
            setAudioDuration(e.currentTarget.duration);
          }}
          onEnded={() => {
            setAudioPlaying(false);
            setAudioProgress(0);
            setAudioCurrentTime(0);
          }}
        />
      </div>
    );
  }

  if (isDocument) {
    return (
      <motion.div
        whileHover={{ x: 4 }}
        className="bg-card rounded-[24px] p-4 border border-border shadow-sm hover:shadow-sm border border-border hover:shadow-md hover:shadow-gray-200/50 transition-all duration-500 group flex items-center gap-4 min-w-[240px] max-w-sm"
      >
        <div className="flex-shrink-0 w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500">
          <FileText size={24} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate mb-0.5">
            {fileName}
          </p>
          <p className="text-[10px] font-black text-text-disabled uppercase tracking-widest">
            {formatFileSize(attachment.fileSize || 0)}
          </p>
        </div>

        <button
          onClick={handleDownload}
          className="w-10 h-10 bg-muted text-text-hint hover:bg-gray-900 hover:text-white rounded-xl flex items-center justify-center transition-all duration-500 active:scale-95 transition-all duration-200"
          title={t("chat.download") || "Download"}
        >
          <Download size={18} />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-card rounded-[24px] p-4 border border-border shadow-sm hover:shadow-lg transition-all duration-500 group flex items-center gap-4 min-w-[200px] max-w-sm"
    >
      <div className="flex-shrink-0 w-12 h-12 bg-muted text-text-hint rounded-2xl flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-all duration-500">
        <File size={24} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate mb-0.5">
          {fileName}
        </p>
        <p className="text-[10px] font-black text-text-disabled uppercase tracking-widest">
          {formatFileSize(attachment.fileSize || 0)}
        </p>
      </div>

      <button
        onClick={handleDownload}
        className="w-10 h-10 bg-muted text-text-hint hover:bg-gray-900 hover:text-white rounded-xl flex items-center justify-center transition-all duration-500 active:scale-95 transition-all duration-200"
        title={t("chat.download") || "Download"}
      >
        <Download size={18} />
      </button>
    </motion.div>
  );
}
