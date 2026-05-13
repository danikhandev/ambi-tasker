"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface MediaAttachment {
  id?: string;
  fileName?: string;
  fileUrl?: string;
  fileType?: string;
  thumbnailUrl?: string | null;
  url?: string;
  type?: string;
  name?: string;
}

interface MediaViewerModalProps {
  media: MediaAttachment;
  allMedia?: MediaAttachment[];
  onClose: () => void;
}

export default function MediaViewerModal({
  media: initialMedia,
  allMedia = [],
  onClose,
}: MediaViewerModalProps) {
  const { t } = useTranslation();
  const [currentMedia, setCurrentMedia] = useState(initialMedia);
  const [currentIndex, setCurrentIndex] = useState(
    allMedia.findIndex((m) => m.id === initialMedia.id)
  );
  const [zoom, setZoom] = useState(1);

  const fileType = currentMedia.fileType || currentMedia.type || '';
  const fileName = currentMedia.fileName || currentMedia.name || '';
  const fileUrl = currentMedia.fileUrl || currentMedia.url || '';

  const isImage =
    fileType.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp"].some((ext) =>
      fileName.toLowerCase().endsWith(ext)
    );

  const isVideo =
    fileType.startsWith("video/") ||
    ["mp4", "webm", "mov"].some((ext) =>
      fileName.toLowerCase().endsWith(ext)
    );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  const handlePrevious = () => {
    if (allMedia.length > 0 && currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCurrentMedia(allMedia[newIndex]);
      setZoom(1);
    }
  };

  const handleNext = () => {
    if (allMedia.length > 0 && currentIndex < allMedia.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentMedia(allMedia[newIndex]);
      setZoom(1);
    }
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

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-card/10 rounded-xl transition-colors active:scale-95 transition-all duration-200"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div>
            <h3 className="text-sm font-medium text-white">
              {fileName}
            </h3>
            {allMedia.length > 1 && (
              <p className="text-xs text-white/60">
                {currentIndex + 1} {t("chat.of") || "of"} {allMedia.length}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isImage && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomOut();
                }}
                disabled={zoom <= 0.5}
                className="p-2 hover:bg-card/10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t("chat.zoomOut") || "Zoom Out"}
              >
                <ZoomOut className="w-5 h-5 text-white" />
              </button>
              <span className="text-sm text-white/80 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleZoomIn();
                }}
                disabled={zoom >= 3}
                className="p-2 hover:bg-card/10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t("chat.zoomIn") || "Zoom In"}
              >
                <ZoomIn className="w-5 h-5 text-white" />
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="p-2 hover:bg-card/10 rounded-xl transition-colors"
            title={t("chat.download") || "Download"}
          >
            <Download className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex-1 flex items-center justify-center p-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Navigation Buttons */}
        {allMedia.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              disabled={currentIndex === allMedia.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}

        {/* Media Display */}
        <div className="max-w-7xl max-h-full overflow-auto custom-scrollbar">
          {isImage ? (
            <div
              style={{
                transform: `scale(${zoom})`,
                transition: "transform 0.2s",
              }}
            >
              <Image
                src={fileUrl}
                alt={fileName}
                width={1920}
                height={1080}
                className="max-w-full h-auto object-contain"
                priority
              />
            </div>
          ) : isVideo ? (
            <video
              src={fileUrl}
              controls
              autoPlay
              className="max-w-full max-h-[80vh] rounded-xl"
            >
              {t("chat.videoNotSupported") || "Your browser does not support the video tag."}
            </video>
          ) : (
            <div className="text-white text-center">
              <p>{t("chat.previewNotAvailable") || "Preview not available for this file type"}</p>
              <button
                onClick={handleDownload}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors active:scale-95 transition-all duration-200"
              >
                {t("chat.downloadFile") || "Download File"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer with thumbnails if multiple media */}
      {allMedia.length > 1 && (
        <div className="p-4 bg-black/50">
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
            {allMedia.map((m, idx) => {
              const isCurrent = idx === currentIndex;
              const mFileType = m.fileType || m.type || '';
              const mFileName = m.fileName || m.name || '';
              const isThumbImage =
                mFileType.startsWith("image/") ||
                ["jpg", "jpeg", "png", "gif", "webp"].some((ext) =>
                  mFileName.toLowerCase().endsWith(ext)
                );

              return (
                <button
                  key={m.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                    setCurrentMedia(m);
                    setZoom(1);
                  }}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${isCurrent
                    ? "border-primary scale-110"
                    : "border-white/20 hover:border-white/50"
                    }`}
                >
                  {isThumbImage ? (
                    <Image
                      src={m.thumbnailUrl || m.fileUrl || m.url || ''}
                      alt={mFileName}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-card/10 flex items-center justify-center">
                      <span className="text-white text-xs">{t("chat.video") || "Video"}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
