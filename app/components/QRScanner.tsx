"use client";
import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

/**
 * Simple QR code scanner component using the device camera.
 * It captures video frames, decodes QR codes with jsQR, and invokes `onScan`.
 * Includes a close button to dismiss the modal.
 */
export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const constraints = { video: { facingMode: 'environment' } };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true'); // required for iOS
        video.play();
        requestAnimationFrame(tick);
      })
      .catch((err) => {
        console.error('Error accessing camera', err);
        setError('Unable to access camera. Please grant permission and try again.');
      });

    return () => {
      if (video && video.srcObject) {
        const tracks = (video.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tick = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          onScan(code.data);
          onClose();
          return; // stop scanning after successful read
        }
      }
    }
    requestAnimationFrame(tick);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          aria-label="Close scanner"
        >
          ✕
        </button>
        {error ? (
          <div className="p-6 text-center text-red-600">{error}</div>
        ) : (
          <video ref={videoRef} className="w-full h-auto" />
        )}
        {/* Hidden canvas for processing frames */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
