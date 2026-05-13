"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, X, Send, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
  maxDurationSeconds?: number;
}

export default function VoiceRecorder({
  onRecordingComplete,
  onCancel,
  maxDurationSeconds = 600, // 10 minutes default
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useTranslation();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Check for supported mime types
      const mimeTypes = [
        "audio/webm",
        "audio/webm;codecs=opus",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];

      let selectedMimeType = "";
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        throw new Error("No supported audio format found");
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(audioChunksRef.current, {
          type: selectedMimeType,
        });

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        onRecordingComplete(audioBlob, duration);
        setIsProcessing(false);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          // Auto-stop at max duration
          if (newDuration >= maxDurationSeconds) {
            handleStop();
            return maxDurationSeconds;
          }
          return newDuration;
        });
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(t("chat.micAccessFailed") || "Failed to access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleStop = () => {
    stopRecording();
  };

  const handleCancel = () => {
    stopRecording();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    onCancel();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-sm hover:shadow-md transition-all duration-300">
          <h3 className="text-lg font-semibold text-text mb-2">
            {t("chat.micAccessRequired") || "Microphone Access Required"}
          </h3>
          <p className="text-sm text-text/60 mb-4">{error}</p>
          <button
            onClick={handleCancel}
            className="w-full px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors active:scale-95 transition-all duration-200"
          >
            {t("common.close") || "Close"}
          </button>
        </div>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-2xl p-6 flex flex-col items-center shadow-sm hover:shadow-md transition-all duration-300">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-sm text-text/60">{t("chat.processingVoiceNote") || "Processing voice note..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-sm hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text">{t("chat.voiceNote") || "Voice Note"}</h3>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-gray-100 rounded-xl transition-colors active:scale-95 transition-all duration-200"
          >
            <X className="w-5 h-5 text-text/60" />
          </button>
        </div>

        {/* Recording Animation */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <Mic className="w-10 h-10 text-white" />
            </div>
            {isRecording && (
              <>
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <div
                  className="absolute inset-0 bg-primary/10 rounded-full animate-ping"
                  style={{ animationDelay: "0.5s" }}
                />
              </>
            )}
          </div>

          {/* Duration Display */}
          <div className="text-3xl font-bold text-text mb-2">
            {formatDuration(duration)}
          </div>
          <div className="text-sm text-text/60">
            {isRecording ? (t("chat.recording") || "Recording...") : (t("chat.paused") || "Paused")}
          </div>

          {/* Max Duration Warning */}
          {duration > maxDurationSeconds - 60 && (
            <div className="mt-2 text-xs text-orange-600">
              {Math.floor((maxDurationSeconds - duration) / 60)}:
              {((maxDurationSeconds - duration) % 60)
                .toString()
                .padStart(2, "0")}{" "}
              {t("chat.remaining") || "remaining"}
            </div>
          )}
        </div>

        {/* Waveform Visualization (simplified) */}
        <div className="flex items-center justify-center gap-1 h-12 mb-6">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full transition-all duration-150"
              style={{
                height: isRecording
                  ? `${Math.random() * 100}%`
                  : "20%",
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-3 border border-primary/20 text-text rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-2 active:scale-95 transition-all duration-200"
          >
            <X className="w-5 h-5" />
            {t("common.cancel") || "Cancel"}
          </button>
          <button
            onClick={handleStop}
            disabled={duration < 1}
            className="flex-1 px-4 py-3 bg-gradient-to-br from-primary to-secondary text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95 transition-all duration-200"
          >
            <Send className="w-5 h-5" />
            {t("common.send") || "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
