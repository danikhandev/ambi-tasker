"use client";

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { unbounded } from '@/app/fonts';
import { logger } from '@/utils/logger';
import { AlertCircle, Camera, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  title?: string;
}

export default function QRScanner({ onScan, onClose, title = "Scan Arrival Pass" }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Create scanner instance
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      /* verbose= */ false
    );

    scannerRef.current = scanner;

    const onScanSuccess = (decodedText: string) => {
      logger.debug(`Scan success: ${decodedText}`);
      scanner.clear().then(() => {
        onScan(decodedText);
      }).catch(err => {
        logger.error("Failed to clear scanner", err);
        onScan(decodedText);
      });
    };

    const onScanFailure = (error: string) => {
      // Quietly ignore scan failures as they happen frequently during searching
      // console.warn(`Scan failure: ${error}`);
    };

    setTimeout(() => {
        scanner.render(onScanSuccess, onScanFailure);
        setIsLoading(false);
    }, 500);

    return () => {
        if (scannerRef.current) {
        scannerRef.current.clear().catch(err => logger.error("Error clearing scanner", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-card rounded-[40px] border border-border overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-border flex items-center justify-between">
          <div>
            <h2 className={`${unbounded.className} text-xl font-black text-foreground`}>{title}</h2>
            <p className="text-[10px] font-black text-text-hint uppercase tracking-widest mt-1">Align QR code within the frame</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-text-hint hover:text-foreground transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <div className="relative aspect-square bg-muted rounded-[32px] overflow-hidden border-4 border-muted flex items-center justify-center">
            <div id="qr-reader" className="w-full h-full" />
            
            <AnimatePresence>
              {isLoading && (
                <motion.div 
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-muted flex flex-col items-center justify-center gap-4 text-text-hint"
                >
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Initializing Optical Hub</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Custom Overlay (Optional) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-[250px] h-[250px] border-2 border-primary/50 rounded-3xl relative">
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                    
                    {/* Scanning Line */}
                    <motion.div 
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                    />
                </div>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-500">
              <AlertCircle size={20} />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}

          <div className="mt-8 flex items-center gap-4 p-4 bg-muted/50 rounded-2xl border border-border">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
              <Camera size={20} />
            </div>
            <p className="text-[10px] font-bold text-text-secondary leading-relaxed">
              If camera access is denied, please enable it in your browser settings to verify arrival.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
