"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/contexts/UserContext";
import PageHeader from "@/components/PageHeader";
import UserProfileTab from "@/components/profile/UserProfileTab";
import { AlertCircle, CheckCircle, Loader2, X } from "lucide-react";
import ConnectSection from "@/components/ConnectSection";
import { useTranslation } from "@/hooks/useTranslation";
import { Skeleton } from "@/components/Skeleton";

export default function ProfilePage() {
  const { t, isRTL } = useTranslation();
  const { user, loading: userLoading } = useUser();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSuccess = (message: string) => {
    setSuccess(message);
    setError("");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleError = (message: string) => {
    setError(message);
    setSuccess("");
  };

  if (userLoading) {
    return (
      <div className="w-full mx-auto p-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="space-y-4 mb-8">
           <Skeleton className="h-10 w-48 rounded-lg" />
           <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="bg-card rounded-[32px] p-8 border border-border space-y-8">
          <div className="flex items-center gap-6">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="space-y-3 flex-1">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
            <Skeleton className="h-14 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-6" dir={isRTL ? "rtl" : "ltr"}>
      <PageHeader 
        title={t("nav.profile")}
        highlightedText=""
        subtitle={t("settings.updatePersonalInfo")}
      />

      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm mb-6"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm mb-6"
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Content */}
      {user && (
        <UserProfileTab
          user={user}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      )}

      {/* Connect Section */}
      <div className="mt-12 pt-12 border-t border-border">
        <ConnectSection />
      </div>
    </div>
  );
}
