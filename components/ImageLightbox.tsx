"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, RotateCw, Download, ChevronLeft, ChevronRight, Loader2, ImageOff } from "lucide-react";

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

export default function ImageLightbox({ images, initialIndex = 0, isOpen, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const currentImage = images[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetView();
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetView();
  };

  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setIsLoading(true);
    setHasError(false);
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 4));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.5, 0.5));
  const handleRotate = () => setRotation((prev) => prev + 90);

  const handleDownload = async () => {
    if (!currentImage?.url) return;
    try {
      const response = await fetch(currentImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentImage.label.replace(/\s+/g, "_").toLowerCase()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(currentImage.url, "_blank");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "+") handleZoomIn();
    if (e.key === "-") handleZoomOut();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-gray-950/95 backdrop-blur-2xl" onClick={onClose} />

          {/* Top Bar */}
          <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                {currentIndex + 1} / {images.length}
              </span>
              <span className="text-xs font-bold text-white/80">{currentImage?.label}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
              <span className="text-[10px] font-black text-white/40 w-12 text-center">{Math.round(zoom * 100)}%</span>
              <button
                onClick={handleZoomIn}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={handleRotate}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
                title="Rotate"
              >
                <RotateCw size={18} />
              </button>
              <button
                onClick={handleDownload}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-all"
                title="Download"
              >
                <Download size={18} />
              </button>
              <div className="w-px h-6 bg-white/10 mx-2" />
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-all"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Image Area */}
          <div className="relative z-10 flex-1 flex items-center justify-center overflow-hidden p-8">
            {/* Prev Button */}
            {images.length > 1 && (
              <button
                onClick={handlePrev}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-md text-white/60 hover:text-white flex items-center justify-center transition-all border border-white/10 group"
              >
                <ChevronLeft size={24} className="group-hover:-translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Image */}
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              {isLoading && !hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-10 h-10 text-white/40 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Loading Document...</span>
                </div>
              )}
              
              {hasError ? (
                <div className="flex flex-col items-center justify-center gap-4 text-white/30">
                  <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center">
                    <ImageOff size={40} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Document Unavailable</span>
                  <span className="text-[9px] font-bold text-white/20">The image could not be loaded or has expired</span>
                </div>
              ) : currentImage?.url ? (
                <motion.img
                  key={currentImage.url}
                  src={currentImage.url}
                  alt={currentImage.label}
                  className="max-w-full max-h-[calc(100vh-160px)] object-contain rounded-2xl shadow-2xl select-none"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: "transform 0.3s ease",
                  }}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false);
                    setHasError(true);
                  }}
                  draggable={false}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 text-white/30">
                  <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center">
                    <ImageOff size={40} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">No Document Uploaded</span>
                </div>
              )}
            </div>

            {/* Next Button */}
            {images.length > 1 && (
              <button
                onClick={handleNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-md text-white/60 hover:text-white flex items-center justify-center transition-all border border-white/10 group"
              >
                <ChevronRight size={24} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails */}
          {images.length > 1 && (
            <div className="relative z-10 flex items-center justify-center gap-3 px-6 py-4 border-t border-white/10">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentIndex(idx);
                    resetView();
                  }}
                  className={`relative w-16 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                    idx === currentIndex
                      ? "border-primary ring-2 ring-primary/30 scale-110"
                      : "border-white/10 opacity-50 hover:opacity-80"
                  }`}
                >
                  {img.url ? (
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <ImageOff size={14} className="text-white/30" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
