"use client";

import { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { unbounded } from '@/app/fonts';
import { logger } from '@/utils/logger';
import { AlertCircle, Camera, Loader2, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  title?: string;
}

export default function QRScanner({ onScan, onClose, title = "Scan Arrival Pass" }: QRScannerProps) {
  const [error, setError] = useState<string | null>(null);

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const decodedText = detectedCodes[0].rawValue;
      if (decodedText) {
        logger.debug(`Scan success: ${decodedText}`);
        onScan(decodedText);
      }
    }
  };

  const handleError = (err: unknown) => {
    logger.error("QR Scan Error", err);
    if (err instanceof Error && err.name === "NotAllowedError") {
        setError("Camera permission denied.");
    }
  };

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
            
            <Scanner 
              onScan={handleScan}
              onError={handleError}
              formats={["qr_code"]}
              constraints={{ facingMode: "environment" }}
              components={{
                onOff: false,
                finder: false, // We use custom finder overlay
                zoom: false,
              }}
              styles={{
                container: { width: '100%', height: '100%', padding: 0 },
                video: { objectFit: 'cover' }
              }}
            />

            {/* Custom Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
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
