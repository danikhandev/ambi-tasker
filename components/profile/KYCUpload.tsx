"use client";

import React, { useState, useRef } from "react";
import { Clock, AlertCircle, Image as ImageIcon, ArrowLeft, RefreshCw, Zap, ShieldCheck, Camera } from "lucide-react";

interface KYCUploadProps {
  currentStatus?: "PENDING" | "VERIFIED" | "REJECTED" | null;
  onSuccess?: () => void;
}

type StepKey = "cnicFront" | "cnicBack" | "selfie";

export default function KYCUpload({ currentStatus, onSuccess }: KYCUploadProps) {
  const [files, setFiles] = useState<{
    cnicFront: File | null;
    cnicBack: File | null;
    selfie: File | null;
  }>({
    cnicFront: null,
    cnicBack: null,
    selfie: null,
  });

  const [previews, setPreviews] = useState<{
    cnicFront: string | null;
    cnicBack: string | null;
    selfie: string | null;
  }>({
    cnicFront: null,
    cnicBack: null,
    selfie: null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps: { key: StepKey; title: string; desc: string }[] = [
    { key: "cnicFront", title: "CNIC Front Verification", desc: "Scan the front page of your CNIC ensuring all details are visible or upload from your phone library." },
    { key: "cnicBack", title: "CNIC Back Verification", desc: "Scan the back page of your CNIC ensuring all details are visible or upload from your phone library." },
    { key: "selfie", title: "Face Verification", desc: "Snap a quick selfie for identity verification. Ensure your face is well-lit and visible. We'll keep it secure." }
  ];

  const currentStep = steps[currentStepIndex];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      const type = currentStep.key;
      setFiles((prev) => ({ ...prev, [type]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleContinue = async () => {
    // If no file uploaded for this step, trigger file input
    if (!files[currentStep.key]) {
      fileInputRef.current?.click();
      return;
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!files.cnicFront || !files.cnicBack || !files.selfie) {
      setError("Please complete all verification steps.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("cnicFront", files.cnicFront);
      formData.append("cnicBack", files.cnicBack);
      formData.append("selfie", files.selfie);

      const res = await fetch("/api/provider/kyc", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        onSuccess?.();
      } else {
        setError(result.error || "Failed to submit KYC");
      }
    } catch (err) {
      setError("An unexpected error occurred during upload");
    } finally {
      setLoading(false);
    }
  };

  // VERIFIED SUCCESS SCREEN
  if (currentStatus === "VERIFIED") {
    return (
      <div className="max-w-md mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden min-h-[600px] flex flex-col items-center justify-center p-8 border border-gray-100">
        <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-teal-50 rounded-full scale-150 opacity-50"></div>
          <div className="absolute top-0 right-4 w-2 h-2 bg-teal-400 rounded-full"></div>
          <div className="absolute bottom-8 left-0 w-2 h-2 bg-teal-400 rounded-full"></div>
          <div className="absolute top-1/2 -right-8 w-1 h-4 bg-teal-400 rounded-full rotate-45"></div>
          <div className="absolute top-8 -left-4 w-1 h-4 bg-teal-400 rounded-full -rotate-45"></div>
          
          {/* Main Shield Icon */}
          <ShieldCheck className="w-32 h-32 text-teal-400 relative z-10" strokeWidth={1} />
        </div>
        
        <h2 className="text-2xl font-bold text-[#1A1B4B] mb-4">Verification Success</h2>
        <p className="text-center text-gray-500 text-sm leading-relaxed mb-12 px-4">
          Congrats! Your identity has been verified. You're all set to enjoy our services securely. Safe travels!
        </p>
        
        <div className="mt-auto w-full">
          <button className="w-full bg-[#1A1B4B] text-white rounded-full py-4 font-semibold text-[15px] hover:bg-[#1A1B4B]/90 transition-colors shadow-lg shadow-[#1A1B4B]/20">
            Continue
          </button>
        </div>
      </div>
    );
  }

  // PENDING SCREEN
  if (currentStatus === "PENDING") {
    return (
      <div className="max-w-md mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden min-h-[600px] flex flex-col items-center justify-center p-8 border border-gray-100">
        <div className="relative w-48 h-48 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-50 rounded-full scale-150 opacity-50 animate-pulse"></div>
          <Clock className="w-24 h-24 text-blue-500 relative z-10 animate-pulse" strokeWidth={1.5} />
        </div>
        <h2 className="text-2xl font-bold text-[#1A1B4B] mb-4">Verification Pending</h2>
        <p className="text-center text-gray-500 text-sm leading-relaxed px-4">
          Your documents are being reviewed by our team. This usually takes 24-48 hours. We'll notify you once it's complete.
        </p>
      </div>
    );
  }

  // MAIN VERIFICATION FLOW
  return (
    <div className="max-w-md mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[680px] flex flex-col border border-gray-100 relative">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-6 pt-10">
        {currentStepIndex > 0 ? (
          <button onClick={handleBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-6 h-6 text-[#1A1B4B]" />
          </button>
        ) : (
          <div className="w-10"></div> // Placeholder for alignment
        )}
        <h1 className="text-[17px] font-bold text-[#1A1B4B]">{currentStep.title}</h1>
        <div className="w-10"></div> // Placeholder for alignment
      </div>

      {/* Description */}
      <p className="text-center text-gray-500 text-[14px] leading-relaxed px-8 mt-2">
        {currentStep.desc}
      </p>

      {/* Rejection Alert */}
      {currentStatus === "REJECTED" && currentStepIndex === 0 && (
        <div className="mx-8 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">Previous submission rejected. Please ensure images are clear.</p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mx-8 mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <p className="text-xs font-medium text-red-600">{error}</p>
        </div>
      )}

      {/* Main Scanner Area */}
      <div className="mx-8 mt-8 aspect-[4/5] relative rounded-[2rem] overflow-hidden bg-gray-50 flex items-center justify-center shadow-inner group">
        {previews[currentStep.key] ? (
          <img src={previews[currentStep.key] as string} alt={currentStep.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-300 flex flex-col items-center">
            {currentStep.key === "selfie" ? <Camera className="w-16 h-16 mb-4 opacity-50" /> : <ImageIcon className="w-16 h-16 mb-4 opacity-50" />}
            <span className="text-sm font-medium opacity-50">Preview Area</span>
          </div>
        )}

        {/* Scanner Overlay (Green brackets) */}
        <div className="absolute inset-6 pointer-events-none">
          {/* Top Left */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#38B2AC] rounded-tl-3xl opacity-80"></div>
          {/* Top Right */}
          <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#38B2AC] rounded-tr-3xl opacity-80"></div>
          {/* Bottom Left */}
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#38B2AC] rounded-bl-3xl opacity-80"></div>
          {/* Bottom Right */}
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#38B2AC] rounded-br-3xl opacity-80"></div>
          
          {/* Scanning Line Animation */}
          {!previews[currentStep.key] && (
            <>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes scanLine {
                  0% { top: 10%; opacity: 0; }
                  10% { opacity: 1; }
                  90% { opacity: 1; }
                  100% { top: 90%; opacity: 0; }
                }
              `}} />
              <div 
                className="absolute left-4 right-4 h-0.5 bg-[#38B2AC] shadow-[0_0_8px_2px_rgba(56,178,172,0.6)]"
                style={{ animation: 'scanLine 2.5s ease-in-out infinite' }}
              ></div>
            </>
          )}
        </div>

        {/* Hidden File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
      </div>

      {/* Toolbar Icons */}
      <div className="flex justify-center items-center gap-12 mt-8">
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm group"
          title="Upload from gallery"
        >
          {currentStep.key === "selfie" ? (
             <Camera className="w-6 h-6 text-gray-500 group-hover:text-[#1A1B4B]" />
          ) : (
             <ImageIcon className="w-6 h-6 text-gray-500 group-hover:text-[#1A1B4B]" />
          )}
        </button>
        <button 
          onClick={() => {
            const type = currentStep.key;
            setFiles(p => ({...p, [type]: null}));
            setPreviews(p => ({...p, [type]: null}));
          }}
          className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm group"
          title="Retake / Clear"
        >
          <RefreshCw className="w-6 h-6 text-gray-500 group-hover:text-[#1A1B4B]" />
        </button>
        <button 
          className="p-3 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm group opacity-50 cursor-not-allowed"
          title="Flash (Not applicable for web upload)"
        >
          <Zap className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      {/* Footer Button */}
      <div className="mt-auto p-8 pt-6">
        <button 
          onClick={handleContinue}
          disabled={loading}
          className={`w-full py-4 rounded-full font-semibold text-[15px] transition-all shadow-lg ${
            loading 
              ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
              : "bg-[#1A1B4B] text-white hover:bg-[#1A1B4B]/90 shadow-[#1A1B4B]/20"
          }`}
        >
          {loading ? "Uploading..." : !files[currentStep.key] ? "Upload Image to Continue" : "Continue"}
        </button>
      </div>
      
    </div>
  );
}
