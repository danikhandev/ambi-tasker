"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import {
  X, ZoomIn, ZoomOut, RotateCw, Download,
  ChevronLeft, ChevronRight, Loader2, ImageOff,
  Maximize2, RotateCcw,
} from "lucide-react";

interface LightboxImage {
  url: string;
  label: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Framer Motion values for drag-to-pan
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const currentImage = images[currentIndex];

  // Sync when initialIndex changes (user clicks a different thumbnail card)
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetView();
    }
  }, [initialIndex, isOpen]);

  // Auto-focus the container for keyboard events & reset on open
  useEffect(() => {
    if (isOpen) {
      resetView();
      setTimeout(() => containerRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset position & zoom when image changes
  useEffect(() => {
    resetView();
  }, [currentIndex]);

  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setIsLoading(true);
    setHasError(false);
    x.set(0);
    y.set(0);
  };

  const resetPosition = () => {
    x.set(0);
    y.set(0);
  };

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 5));
  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.25, 0.5);
      if (next <= 1) resetPosition();
      return next;
    });
  };
  const handleRotateCW = () => setRotation((prev) => prev + 90);
  const handleRotateCCW = () => setRotation((prev) => prev - 90);
  const handleResetZoom = () => { setZoom(1); setRotation(0); resetPosition(); };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.12 : -0.12;
    setZoom((prev) => {
      const next = Math.max(0.5, Math.min(5, prev + delta));
      if (next <= 1) resetPosition();
      return next;
    });
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Escape":   onClose(); break;
      case "ArrowLeft":  handlePrev(); break;
      case "ArrowRight": handleNext(); break;
      case "+": case "=": handleZoomIn(); break;
      case "-": handleZoomOut(); break;
      case "r": case "R": handleRotateCW(); break;
      case "0": handleResetZoom(); break;
    }
  }, [handlePrev, handleNext, onClose]);

  const handleDownload = async () => {
    if (!currentImage?.url) return;
    try {
      const response = await fetch(currentImage.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${currentImage.label.replace(/\s+/g, "_").toLowerCase()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(currentImage.url, "_blank");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          key="lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex flex-col bg-gray-950/98 backdrop-blur-2xl outline-none"
          onKeyDown={handleKeyDown}
          onWheel={handleWheel}
          tabIndex={-1}
        >
          {/* ── Top Bar ───────────────────────────────────────────── */}
          <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/20 flex-shrink-0">
            {/* Left: label + counter */}
            <div className="flex items-center gap-4 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/30 flex-shrink-0">
                {currentIndex + 1}&nbsp;/&nbsp;{images.length}
              </span>
              <span className="text-xs font-bold text-white/70 truncate">{currentImage?.label}</span>
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Zoom controls */}
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 0.5}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white/60 hover:text-white flex items-center justify-center transition-all"
                title="Zoom Out (−)"
              >
                <ZoomOut size={16} />
              </button>
              <button
                onClick={handleResetZoom}
                className="h-9 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-[10px] font-black transition-all min-w-[52px]"
                title="Reset (0)"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 5}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white/60 hover:text-white flex items-center justify-center transition-all"
                title="Zoom In (+)"
              >
                <ZoomIn size={16} />
              </button>

              <div className="w-px h-5 bg-white/10 mx-1" />

              {/* Rotate */}
              <button
                onClick={handleRotateCCW}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
                title="Rotate Left"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={handleRotateCW}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
                title="Rotate Right (R)"
              >
                <RotateCw size={16} />
              </button>

              <div className="w-px h-5 bg-white/10 mx-1" />

              {/* Download */}
              <button
                onClick={handleDownload}
                disabled={!currentImage?.url}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white/60 hover:text-white flex items-center justify-center transition-all"
                title="Download"
              >
                <Download size={16} />
              </button>

              {/* Open in new tab */}
              {currentImage?.url && (
                <a
                  href={currentImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
                  title="Open in New Tab"
                >
                  <Maximize2 size={15} />
                </a>
              )}

              <div className="w-px h-5 bg-white/10 mx-1" />

              {/* Close */}
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 flex items-center justify-center transition-all"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Image Area ────────────────────────────────────────── */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden">
            {/* Prev */}
            {images.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/12 backdrop-blur-md text-white/50 hover:text-white flex items-center justify-center transition-all border border-white/8 group"
              >
                <ChevronLeft size={22} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Image or placeholder */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className="flex items-center justify-center w-full h-full"
              >
                {/* Loading shimmer */}
                {isLoading && !hasError && currentImage?.url && (
                  <div className="absolute flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-white/30 animate-spin" />
                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white/25">
                      Loading…
                    </span>
                  </div>
                )}

                {hasError ? (
                  <div className="flex flex-col items-center gap-4 text-white/25">
                    <div className="w-28 h-28 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <ImageOff size={44} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Document Unavailable</span>
                    <span className="text-[9px] text-white/15">The image could not be loaded or the URL has expired.</span>
                    {currentImage?.url && (
                      <a
                        href={currentImage.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        Try Opening Directly ↗
                      </a>
                    )}
                  </div>
                ) : !currentImage?.url ? (
                  <div className="flex flex-col items-center gap-4 text-white/25">
                    <div className="w-28 h-28 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <ImageOff size={44} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Not Uploaded</span>
                  </div>
                ) : (
                  <motion.img
                    key={`img-${currentImage.url}`}
                    src={currentImage.url}
                    alt={currentImage.label}
                    drag={zoom > 1}
                    dragMomentum={false}
                    dragElastic={0}
                    style={{ x, y, scale: zoom, rotate: rotation }}
                    className={`max-w-[90vw] max-h-[calc(100vh-180px)] object-contain rounded-xl shadow-2xl select-none ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
                    onLoad={() => { setIsLoading(false); setHasError(false); }}
                    onError={() => { setIsLoading(false); setHasError(true); }}
                    draggable={false}
                    transition={{ scale: { duration: 0.15 }, rotate: { duration: 0.15 } }}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Next */}
            {images.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/12 backdrop-blur-md text-white/50 hover:text-white flex items-center justify-center transition-all border border-white/8 group"
              >
                <ChevronRight size={22} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Keyboard hint */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 text-[8px] font-bold text-white/15 uppercase tracking-widest pointer-events-none select-none">
              <span>← → Navigate</span>
              <span>·</span>
              <span>+/− Zoom</span>
              <span>·</span>
              <span>R Rotate</span>
              <span>·</span>
              <span>Drag to Pan</span>
              <span>·</span>
              <span>Scroll to Zoom</span>
              <span>·</span>
              <span>Esc Close</span>
            </div>
          </div>

          {/* ── Bottom Thumbnails ─────────────────────────────────── */}
          <div className="relative z-10 flex items-center justify-center gap-2.5 px-6 py-3 border-t border-white/10 bg-black/20 flex-shrink-0 overflow-x-auto no-scrollbar">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative flex-shrink-0 w-16 h-11 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  idx === currentIndex
                    ? "border-indigo-500 ring-2 ring-indigo-500/30 scale-110 shadow-lg shadow-indigo-500/20"
                    : "border-white/10 opacity-45 hover:opacity-75 hover:border-white/25"
                }`}
                title={img.label}
              >
                {img.url ? (
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" draggable={false} />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <ImageOff size={12} className="text-white/25" />
                  </div>
                )}
                {/* Active indicator dot */}
                {idx === currentIndex && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
