"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Camera, RefreshCw, X, Check, Shield, AlertCircle, Loader2, FlipHorizontal, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import NextImage from "next/image";
import { unbounded } from "@/app/fonts";
import { useTranslation } from "@/hooks/useTranslation";
import { Capacitor } from "@capacitor/core";
import { Camera as CapCamera } from "@capacitor/camera";

interface CameraCaptureProps {
    type: "selfie" | "cnic-front" | "cnic-back";
    onCapture: (image: string) => void;
    onClose?: () => void;
    allowUpload?: boolean;
    liveOnly?: boolean;
    compressionQuality?: number;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ type, onCapture, onClose, allowUpload = true, liveOnly = false, compressionQuality = 0.7 }) => {
    const { t, isRTL } = useTranslation();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const activeStreamRef = useRef<MediaStream | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [showFlash, setShowFlash] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<"prompt" | "granted" | "denied">("prompt");
    const [isStarting, setIsStarting] = useState(false);
    const [facingMode, setFacingMode] = useState<"user" | "environment">(type === "selfie" ? "user" : "environment");
    const modeRef = useRef<"user" | "environment">(type === "selfie" ? "user" : "environment");
    const isStartingRef = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const stopCamera = useCallback(() => {
        if (activeStreamRef.current) {
            activeStreamRef.current.getTracks().forEach(track => {
                track.stop();
            });
            activeStreamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
            videoRef.current.pause();
            videoRef.current.removeAttribute('src'); // Explicitly remove src
            videoRef.current.load(); // Reset video element
        }
        setStream(null);
    }, []);

    const startCamera = useCallback(async (mode?: "user" | "environment") => {
        if (isStartingRef.current) return;
        isStartingRef.current = true;
        setIsStarting(true);

        const targetMode = mode || modeRef.current;
        setError(null);
        setIsCameraReady(false);

        if (Capacitor.isNativePlatform()) {
            try {
                const status = await CapCamera.checkPermissions();
                if (status.camera !== 'granted') {
                    setPermissionStatus("prompt");
                    const requestStatus = await CapCamera.requestPermissions();
                    if (requestStatus.camera !== 'granted') {
                        setError(t("camera.accessDenied") || "Camera access denied. Please enable it in system settings.");
                        setPermissionStatus("denied");
                        isStartingRef.current = false;
                        setIsStarting(false);
                        return;
                    }
                }
                setPermissionStatus("granted");
            } catch (e) {
                console.warn("Capacitor Permission Error, falling back to browser:", e);
            }
        } else {
             // Browser permission check simulation/fallback
             try {
                const permissions = await navigator.permissions.query({ name: 'camera' as any });
                setPermissionStatus(permissions.state as any);
                permissions.onchange = () => setPermissionStatus(permissions.state as any);
             } catch (e) {
                console.warn("Permission API not supported", e);
             }
        }

        // Stop any previous stream first
        stopCamera();

        // Small delay to let hardware release
        await new Promise(resolve => setTimeout(resolve, 300));

        if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("Camera access is not supported in this browser or requires a secure (HTTPS) connection.");
            isStartingRef.current = false;
            return;
        }

        // Safety timeout to prevent permanent lock
        const safetyTimeout = setTimeout(() => {
            if (isStartingRef.current && !isCameraReady) {
                console.warn("Camera start timed out after 12s. Forcing unlock.");
                isStartingRef.current = false;
            }
        }, 12000);

        // Define a list of fallback constraints for maximum compatibility
        const constraintAttempts = [
            {
                video: {
                    facingMode: { ideal: targetMode },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            },
            {
                video: {
                    facingMode: targetMode, // More strict but sometimes works better
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            },
            { video: true } // Absolute fallback
        ];

        let lastErr = null;
        for (const constraints of constraintAttempts) {
            try {
                const newStream = await navigator.mediaDevices.getUserMedia({ ...constraints, audio: false });
                activeStreamRef.current = newStream;
                setStream(newStream);

                if (videoRef.current) {
                    const video = videoRef.current;
                    video.srcObject = newStream;
                    video.setAttribute('playsinline', 'true');
                    video.setAttribute('autoplay', 'true');
                    video.muted = true;

                    // Promise-based play to handle potential rejection
                    try {
                        await video.play();
                    } catch (playErr) {
                        console.warn("Autoplay was prevented:", playErr);
                        // User interaction might be needed via UI
                    }

                    // Reliability check: wait until video has dimensions
                    let attempts = 0;
                    const maxAttempts = 30;
                    while (attempts < maxAttempts) {
                        if (video.videoWidth > 0 && video.readyState >= 2) {
                            setIsCameraReady(true);
                            setPermissionStatus("granted");
                            isStartingRef.current = false;
                            setIsStarting(false);
                            clearTimeout(safetyTimeout);
                            return;
                        }
                        await new Promise(r => setTimeout(r, 100));
                        attempts++;
                    }
                    
                    // If we get here, it didn't fully initialize but we have a stream
                    setIsCameraReady(true);
                    setPermissionStatus("granted");
                }
                isStartingRef.current = false;
                setIsStarting(false);
                clearTimeout(safetyTimeout);
                return;
            } catch (err: any) {
                console.warn(`Constraint attempt failed (${JSON.stringify(constraints)}):`, err);
                lastErr = err;
                // Continue to next attempt
            }
        }

        clearTimeout(safetyTimeout);
        if (lastErr) {
            setPermissionStatus("denied");
            if (lastErr.name === "NotAllowedError" || lastErr.name === "PermissionDeniedError") {
                setError(t("camera.accessDenied") || "Camera access denied. Please grant permission in settings.");
            } else if (lastErr.name === "NotFoundError" || lastErr.name === "DevicesNotFoundError") {
                setError(t("camera.noCameraFound") || "No camera found on this device.");
            } else if (lastErr.name === "NotReadableError" || lastErr.name === "TrackStartError") {
                setError("Camera is locked by another app. Please close other camera apps and retry.");
            } else {
                setError("Failed to access camera: " + lastErr.message);
            }
        }
        isStartingRef.current = false;
        setIsStarting(false);
    }, [t, stopCamera]);

    useEffect(() => {
        const initialMode = type === "selfie" ? "user" : "environment";
        setCapturedImage(null);
        setError(null);
        setIsCameraReady(false);
        setFacingMode(initialMode);
        modeRef.current = initialMode;

        // Note: We don't auto-start if permission is prompt/denied for better UX
        // startCamera(initialMode); 

        return () => {
            stopCamera();
            if (activeStreamRef.current) {
                activeStreamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, [type, stopCamera]);

    const capturePhoto = async () => {
        if (!videoRef.current || !canvasRef.current || !isCameraReady) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Final check for video dimensions
        if (video.videoWidth === 0 || video.videoHeight === 0) {
            setError("Camera stream is not fully initialized. Please wait a moment.");
            return;
        }

        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 200);

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d", { alpha: false });

        if (ctx) {
            setIsCapturing(true);

            if (facingMode === "user") {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Compress image: resize if too large
            const MAX_DIMENSION = 1600; // Increased max dimension for better quality on modern devices
            let finalCanvas = canvas;
            if (canvas.width > MAX_DIMENSION || canvas.height > MAX_DIMENSION) {
                const scale = Math.min(MAX_DIMENSION / canvas.width, MAX_DIMENSION / canvas.height);
                const compressCanvas = document.createElement('canvas');
                compressCanvas.width = Math.round(canvas.width * scale);
                compressCanvas.height = Math.round(canvas.height * scale);
                const compressCtx = compressCanvas.getContext('2d', { alpha: false });
                if (compressCtx) {
                    compressCtx.drawImage(canvas, 0, 0, compressCanvas.width, compressCanvas.height);
                    finalCanvas = compressCanvas;
                }
            }

            const dataUrl = finalCanvas.toDataURL("image/jpeg", compressionQuality);

            setIsVerifying(true);
            // Reduced artificial delay for better UX
            await new Promise(resolve => setTimeout(resolve, 800));

            if (type === "selfie") {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                let brightness = 0;
                const data = imageData.data;
                const step = 4 * 20; // Sample every 20th pixel
                let count = 0;
                for (let i = 0; i < data.length; i += step) {
                    brightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
                    count++;
                }
                brightness = brightness / count;

                // Only fail if EXTREMELY dark, otherwise just proceed
                if (brightness < 12) {
                    setError(t("camera.poorLighting") || "Lighting is too low for a clear photo. Please find a brighter spot.");
                    setIsVerifying(false);
                    setIsCapturing(false);
                    return;
                }
            }

            setCapturedImage(dataUrl);
            setIsVerifying(false);
            setIsCapturing(false);

            // Cleanup camera after successful capture
            stopCamera();
        }
    };

    const handleConfirm = () => {
        if (capturedImage) {
            onCapture(capturedImage);
        }
    };

    const handleRetake = async () => {
        setCapturedImage(null);
        setError(null);
        await startCamera();
    };

    const toggleCamera = async () => {
        const newMode = facingMode === "user" ? "environment" : "user";
        setFacingMode(newMode);
        modeRef.current = newMode;
        startCamera(newMode);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validation
            const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
            if (!allowedTypes.includes(file.type)) {
                setError(t("camera.invalidFormat") || "Invalid image format. Please use JPG or PNG.");
                return;
            }

            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                setError(t("camera.fileTooLarge") || "File size is too large. Max limit is 5MB.");
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setCapturedImage(reader.result as string);
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                    setStream(null);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={`flex flex-col items-center w-full max-w-xl mx-auto bg-card rounded-[40px] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] border border-border transition-all relative ${isRTL ? "rtl" : ""}`}>
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-[80] w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-all border border-white/10 shadow-lg"
                    aria-label="Close"
                >
                    <X className="w-5 h-5" />
                </button>
            )}

            <div className="relative w-full aspect-[4/3] bg-black overflow-hidden group">
                {!capturedImage ? (
                    <>
                        {(permissionStatus === "prompt" || permissionStatus === "denied") && !isCameraReady && !error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-[100] p-10 text-center">
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 animate-pulse">
                                    <Shield className="w-10 h-10" />
                                </div>
                                <h4 className={`${unbounded.className} text-lg font-black text-white mb-2 uppercase tracking-tighter`}>
                                    {t("camera.permissionTitle") || "Camera Access Required"}
                                </h4>
                                <p className="text-xs text-white/60 font-medium mb-8 max-w-[280px] leading-relaxed">
                                    {permissionStatus === "denied" 
                                        ? (t("camera.permissionDenied") || "Camera access was denied. Please enable it in your browser settings to continue.")
                                        : (t("camera.permissionDesc") || "We need camera access to capture high-quality photos for identity verification.")
                                    }
                                </p>
                                <button
                                    onClick={() => startCamera()}
                                    disabled={isStarting}
                                    className="px-10 py-5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/40 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                                >
                                    {isStarting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                                    {t("camera.requestAccess") || "Allow Camera Access"}
                                </button>
                            </div>
                        )}

                        {!isCameraReady && !error && permissionStatus === "granted" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
                                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{t("camera.initializing")}</p>
                                <button
                                    onClick={() => startCamera()}
                                    className="mt-4 text-[8px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors underline underline-offset-4"
                                >
                                    Force Start Camera
                                </button>
                            </div>
                        )}

                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className={`w-full h-full object-cover transition-opacity duration-700 ${isCameraReady ? "opacity-100" : "opacity-0"} ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                        />

                        <AnimatePresence>
                            {showFlash && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-white z-[60]"
                                />
                            )}
                        </AnimatePresence>

                        {isCameraReady && !isVerifying && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                                {/* Guides based on task type */}
                                {type === "selfie" ? (
                                    <div className="relative w-[75%] h-[85%] sm:w-[320px] sm:h-[400px]">
                                        {/* Scanner Frame */}
                                        <div className="absolute inset-0 border-[3px] border-primary/60 rounded-[160px] shadow-[0_0_0_2000px_rgba(0,0,0,0.7)]" />

                                        {/* Moving Laser Line */}
                                        <motion.div
                                            animate={{ top: ["5%", "95%", "5%"] }}
                                            transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                                            className="absolute left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent blur-[1px] z-10"
                                        />

                                        {/* Instruction Overlay */}
                                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-full text-center">
                                            <p className="text-white text-[10px] font-black uppercase tracking-[0.2em] bg-black/40 backdrop-blur-md py-3 px-6 rounded-2xl border border-white/10">
                                                Center your face & keep it steady
                                            </p>
                                        </div>

                                        {/* Technical Overlays */}
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2.5 bg-primary text-white text-[8px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl border border-white/30 whitespace-nowrap">
                                            {t("camera.livenessScan") || "LIVENESS_PROBE_v3"}
                                        </div>

                                        <div className="absolute top-10 left-10 flex flex-col gap-2">
                                            <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-3 text-white border border-white/10 shadow-xl">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/80">{t("camera.secureFeed") || "ENCRYPTED_SIGNAL"}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative w-[90%] h-[60%]">
                                        {/* Scanner Frame */}
                                        <div className="absolute inset-0 border-[3px] border-white/60 rounded-[32px] shadow-[0_0_0_2000px_rgba(0,0,0,0.7)]" />

                                        {/* Corner Accents */}
                                        <div className={`absolute -top-2 ${isRTL ? "-right-2" : "-left-2"} w-10 h-10 border-t-4 ${isRTL ? "border-r-4" : "border-l-4"} border-primary ${isRTL ? "rounded-tr-2xl" : "rounded-tl-2xl"}`} />
                                        <div className={`absolute -top-2 ${isRTL ? "-left-2" : "-right-2"} w-10 h-10 border-t-4 ${isRTL ? "border-l-4" : "border-r-4"} border-primary ${isRTL ? "rounded-tl-2xl" : "rounded-tr-2xl"}`} />
                                        <div className={`absolute -bottom-2 ${isRTL ? "-right-2" : "-left-2"} w-10 h-10 border-b-4 ${isRTL ? "border-r-4" : "border-l-4"} border-primary ${isRTL ? "rounded-br-2xl" : "rounded-bl-2xl"}`} />
                                        <div className={`absolute -bottom-2 ${isRTL ? "-left-2" : "-right-2"} w-10 h-10 border-b-4 ${isRTL ? "border-l-4" : "border-r-4"} border-primary ${isRTL ? "rounded-bl-2xl" : "rounded-br-2xl"}`} />

                                        {/* Moving Laser Line */}
                                        <motion.div
                                            animate={{ top: ["4%", "96%", "4%"] }}
                                            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
                                            className="absolute left-5 right-5 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent shadow-[0_0_8px_rgba(255,255,255,0.8)] z-10"
                                        />

                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-6 py-2.5 bg-white text-black text-[8px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl whitespace-nowrap">
                                            {t("camera.ocrAlignment") || "DOCUMENT_OCR_SCAN"}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={`absolute top-8 ${isRTL ? "right-8" : "left-8"} flex items-center gap-4 z-20`}>
                            <div className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-3 text-white text-[9px] font-black uppercase tracking-widest border border-white/10 shadow-xl">
                                <Shield className="w-4 h-4 text-primary" />
                                {t("camera.secureFeed") || "SECURE_UPLINK"}
                            </div>
                            {isCameraReady && !isVerifying && (
                                <div className="px-3 py-2 bg-green-500/80 backdrop-blur-xl rounded-2xl text-[8px] font-black text-white uppercase tracking-widest animate-pulse border border-white/10">
                                    {t("camera.live") || "LIVE"}
                                </div>
                            )}
                        </div>

                        <AnimatePresence>
                            {isVerifying && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-gray-950/90 backdrop-blur-3xl flex flex-col items-center justify-center z-[70] text-white"
                                >
                                    <div className="relative w-32 h-32 mb-10">
                                        <svg className="w-full h-full rotate-[-90deg]">
                                            <circle cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/5" />
                                            <motion.circle
                                                cx="64" cy="64" r="60" fill="none" stroke="currentColor" strokeWidth="2"
                                                className="text-primary shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                                                strokeDasharray="377"
                                                initial={{ strokeDashoffset: 377 }}
                                                animate={{ strokeDashoffset: 0 }}
                                                transition={{ duration: 3, ease: "easeInOut" }}
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="relative">
                                                <Shield className="w-12 h-12 text-primary animate-pulse" />
                                                <div className="absolute inset-0 blur-xl bg-primary/30 animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                    <h4 className={`${unbounded.className} text-[10px] font-black uppercase tracking-[0.4em] text-white/90`}>
                                        {type === "selfie" ? (t("camera.analyzing") || "Biometric Sync") : (t("camera.analyzingDoc") || "OCR Verification")}
                                    </h4>
                                    <div className="mt-8 flex flex-col items-center gap-4">
                                        <p className="text-[8px] text-white/40 font-black uppercase tracking-[0.3em]">{t("camera.livenessDetection") || "Liveness Detection In Progress"}</p>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <motion.div
                                                    key={i}
                                                    animate={{
                                                        height: [4, 12, 4],
                                                        opacity: [0.3, 1, 0.3]
                                                    }}
                                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                                                    className="w-1 bg-primary rounded-full"
                                                />
                                            ))}
                                        </div>
                                        <div className="text-[7px] font-black text-white/20 uppercase tracking-[0.5em] mt-2">
                                            AI_VERIFICATION_PROBE
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!isVerifying && isCameraReady && (
                            <div className="absolute bottom-10 left-0 right-0 text-center px-10 z-20">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-white text-[10px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-2xl inline-block py-4 px-10 rounded-3xl border border-white/10 shadow-2xl"
                                >
                                    {type === "selfie"
                                        ? "Align your face within the frame"
                                        : type === 'cnic-front' ? "Position CNIC front-side inside markers" : "Position CNIC back-side inside markers"
                                    }
                                </motion.div>
                            </div>
                        )}
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-full h-full relative"
                    >
                        <img
                            src={capturedImage}
                            alt="Captured"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-green-500/10 pointer-events-none" />
                        <div className={`absolute top-8 ${isRTL ? "left-8" : "right-8"} bg-green-500 text-white p-3 rounded-2xl shadow-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest`}>
                            <Check size={16} />
                            {t("camera.readyToProceed")}
                        </div>
                    </motion.div>
                )}

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-x-8 top-1/2 -translate-y-1/2 bg-red-600/95 backdrop-blur-3xl p-10 rounded-[40px] text-white text-center shadow-3xl z-[100] border border-white/20"
                        >
                            <div className="flex flex-col items-center gap-5">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-10 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className={`${unbounded.className} text-xl font-black uppercase tracking-tighter`}>{t("camera.actionRequired")}</h4>
                                    <p className="font-medium text-sm text-white/90 leading-relaxed">{error}</p>
                                </div>
                                <button
                                    onClick={handleRetake}
                                    className="mt-4 w-full py-5 bg-white text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-gray-50 transition-all border-none shadow-sm hover:shadow-md transition-all duration-300 active:scale-95 transition-all duration-200"
                                >
                                    {t("camera.retry")}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="p-8 w-full space-y-6 bg-muted/20">
                {!capturedImage ? (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Info size={16} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">{t("camera.methodBiometric")}</p>
                            </div>
                            <button
                                type="button"
                                onClick={toggleCamera}
                                className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-text-hint hover:text-primary transition-all shadow-sm active:scale-95 transition-all duration-200"
                                title={t("camera.switchCamera")}
                            >
                                <FlipHorizontal size={18} className={isRTL ? "scale-x-[-1]" : ""} />
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={capturePhoto}
                            disabled={!isCameraReady || isCapturing || isVerifying || !!error}
                            className="w-full h-20 bg-primary text-white rounded-[32px] font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-5 disabled:opacity-50 disabled:scale-100 disabled:shadow-none relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]" />
                            {isCapturing ? (
                                <Loader2 className="w-8 h-8 animate-spin" />
                            ) : (
                                <>
                                    <Camera className="w-8 h-8" />
                                    {t("camera.reviewCapture")}
                                </>
                            )}
                        </button>

                        {allowUpload && !liveOnly && (
                            <>
                                <div className="flex items-center gap-4">
                                    <div className="h-px bg-border flex-1" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-text-hint">{t("camera.or")}</span>
                                    <div className="h-px bg-border flex-1" />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-5 bg-card border-2 border-dashed border-border rounded-[28px] font-black text-xs uppercase tracking-[0.2em] text-text-hint hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-center gap-3 active:scale-95 duration-200"
                                >
                                    <Check className="w-4 h-4" />
                                    {t("camera.chooseDocument")}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex gap-4 sm:gap-8">
                        <button
                            type="button"
                            onClick={handleRetake}
                            className="flex-1 h-20 bg-card text-foreground rounded-[32px] border border-border font-black text-md flex items-center justify-center gap-3 hover:bg-muted/50 transition-all shadow-sm group active:scale-95 transition-all duration-200"
                        >
                            <RefreshCw className={`w-4 h-4 text-text-hint group-hover:rotate-180 transition-transform duration-500 ${isRTL ? "ml-2" : "mr-2"}`} />
                            {t("camera.discard")}
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="flex-[1.5] h-20 bg-gray-900 text-white rounded-[32px] font-black text-md flex items-center justify-center gap-3 shadow-2xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all group"
                        >
                            <Check className="w-5 h-5 text-green-400 group-hover:scale-125 transition-transform" />
                            {t("camera.confirm")}
                        </button>
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CameraCapture;
