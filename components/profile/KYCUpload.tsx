"use client";

import React, { useState } from "react";
import { Upload, CheckCircle, Clock, AlertCircle, X, Image as ImageIcon } from "lucide-react";

interface KYCUploadProps {
  currentStatus?: "PENDING" | "VERIFIED" | "REJECTED" | null;
  onSuccess?: () => void;
}

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

  const handleFileChange = (type: keyof typeof files, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setFiles((prev) => ({ ...prev, [type]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews((prev) => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!files.cnicFront || !files.cnicBack || !files.selfie) {
      setError("Please upload all three required documents");
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

  if (currentStatus === "VERIFIED") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-green-900">Identity Verified</h3>
        <p className="text-green-700 text-sm">Your KYC verification is complete. You can now accept bookings.</p>
      </div>
    );
  }

  if (currentStatus === "PENDING") {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
        <Clock className="w-12 h-12 text-blue-500 mx-auto mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-blue-900">Verification Pending</h3>
        <p className="text-blue-700 text-sm">Your documents are being reviewed by our team. This usually takes 24-48 hours.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Upload className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-gray-900">Submit KYC Documents</h2>
        </div>

        {currentStatus === "REJECTED" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900">Previous Submission Rejected</p>
              <p className="text-xs text-red-700">Your documents were rejected. Please ensure the images are clear and valid.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DocUploader
            label="CNIC Front"
            preview={previews.cnicFront}
            onChange={(e) => handleFileChange("cnicFront", e)}
            onClear={() => {
              setFiles(p => ({...p, cnicFront: null}));
              setPreviews(p => ({...p, cnicFront: null}));
            }}
          />
          <DocUploader
            label="CNIC Back"
            preview={previews.cnicBack}
            onChange={(e) => handleFileChange("cnicBack", e)}
            onClear={() => {
              setFiles(p => ({...p, cnicBack: null}));
              setPreviews(p => ({...p, cnicBack: null}));
            }}
          />
          <DocUploader
            label="Selfie with CNIC"
            preview={previews.selfie}
            onChange={(e) => handleFileChange("selfie", e)}
            onClear={() => {
              setFiles(p => ({...p, selfie: null}));
              setPreviews(p => ({...p, selfie: null}));
            }}
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-4 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !files.cnicFront || !files.cnicBack || !files.selfie}
          className={`w-full mt-6 py-3 rounded-xl font-bold transition-all ${
            loading || !files.cnicFront || !files.cnicBack || !files.selfie
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20"
          }`}
        >
          {loading ? "Uploading..." : "Submit for Verification"}
        </button>
      </div>
    </div>
  );
}

interface DocUploaderProps {
  label: string;
  preview: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

function DocUploader({ label, preview, onChange, onClear }: DocUploaderProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-gray-700">{label}</label>
      <div className="relative group">
        {preview ? (
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-primary/20">
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <button
              onClick={onClear}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center aspect-[4/3] rounded-lg border-2 border-dashed border-gray-200 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group">
            <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-primary transition-colors">
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs font-medium">Click to upload</span>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={onChange} />
          </label>
        )}
      </div>
    </div>
  );
}
