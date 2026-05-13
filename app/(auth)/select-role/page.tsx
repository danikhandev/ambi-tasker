"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  User as UserIcon, 
  Wrench, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Globe
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useTranslation } from "@/hooks/useTranslation";
import { useUI } from "@/contexts/UIContext";
import Logo from "@/components/ui/Logo";
import BackButton from "@/components/BackButton";
import { useAdmin } from "@/contexts/AdminContext";

type RoleType = "user" | "provider" | "admin";

interface RoleCardProps {
  role: RoleType;
  title: string;
  description: string;
  icon: React.ElementType;
  isSelected: boolean;
  onSelect: (role: RoleType) => void;
  isRTL: boolean;
}

const RoleCard: React.FC<RoleCardProps> = ({ 
  role, 
  title, 
  description, 
  icon: Icon, 
  isSelected, 
  onSelect,
  isRTL
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(role)}
      className={`relative w-full p-6 md:p-8 rounded-[32px] border-2 transition-all duration-300 text-left flex items-center gap-6 group ${
        isSelected 
          ? "border-primary bg-primary/5 shadow-xl shadow-primary/10" 
          : "border-border/60 bg-card hover:border-primary/30 hover:shadow-lg"
      } ${isRTL ? "text-right flex-row-reverse" : "text-left"}`}
    >
      <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 ${
        isSelected ? "bg-primary text-white scale-110 shadow-lg" : "bg-muted text-text-hint group-hover:bg-primary/10 group-hover:text-primary"
      }`}>
        <Icon size={isSelected ? 32 : 28} className="transition-transform duration-500 group-hover:rotate-12" />
      </div>

      <div className="flex-1 overflow-hidden">
        <h3 className={`${unbounded.className} text-lg md:text-xl font-black mb-2 transition-colors ${isSelected ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
          {title}
        </h3>
        <p className="text-xs md:text-sm text-text-secondary font-medium leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      <div className={`shrink-0 transition-all duration-300 ${isSelected ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}>
        <CheckCircle2 className="text-primary w-8 h-8" />
      </div>
      
      {/* Selection Glow */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -inset-[2px] rounded-[32px] border-2 border-primary ring-4 ring-primary/10 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default function SelectRolePage() {
  const router = useRouter();
  const { t, isRTL, language } = useTranslation();
  const { setLanguage, theme } = useUI();
  const { isAdmin } = useAdmin();
  const [selectedRole, setSelectedRole] = useState<RoleType | null>(null);

  // Load last selected role from storage
  useEffect(() => {
    const saved = localStorage.getItem("serve_u_last_selected_role");
    if (saved && (saved === "user" || saved === "provider" || saved === "admin")) {
      setSelectedRole(saved as RoleType);
    }
  }, []);

  const handleRoleSelection = (role: RoleType) => {
    setSelectedRole(role);
    localStorage.setItem("serve_u_last_selected_role", role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/login?role=${selectedRole}`);
    }
  };

  return (
    <div className="min-h-screen bg-muted relative overflow-hidden font-sans py-12 px-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Decorative background blobs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 -z-10" />

      {/* Language Toggle */}
      <button
        onClick={() => setLanguage(language === "en" ? "ur" : "en")}
        className={`fixed top-6 ${isRTL ? "left-6" : "right-6"} z-50 flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-foreground font-bold text-sm`}
      >
        <Globe className="w-4 h-4 text-primary" />
        <span className="text-xs font-black uppercase tracking-widest">
          {language === "en" ? "اردو" : "EN"}
        </span>
      </button>

      <div className="max-w-xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <Logo size="lg" />
        </motion.div>

        <div className="w-full text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${unbounded.className} text-3xl md:text-4xl font-black text-foreground mb-4 leading-tight whitespace-pre-line`}
          >
            {t("auth.selectRoleTitle")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-text-secondary text-[16px] md:text-lg font-medium px-4"
          >
            {t("auth.selectRoleSubtitle")}
          </motion.p>
        </div>

        <div className="w-full space-y-4 mb-12">
          <motion.div 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { 
                opacity: 1, 
                y: 0,
                transition: {
                  staggerChildren: 0.15,
                  delayChildren: 0.3
                }
              }
            }}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <RoleCard
                role="user"
                title={t("auth.asUser")}
                description={t("auth.asUserDesc")}
                icon={UserIcon}
                isSelected={selectedRole === "user"}
                onSelect={handleRoleSelection}
                isRTL={isRTL}
              />
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <RoleCard
                role="provider"
                title={t("auth.asProvider")}
                description={t("auth.asProviderDesc")}
                icon={Wrench}
                isSelected={selectedRole === "provider"}
                onSelect={handleRoleSelection}
                isRTL={isRTL}
              />
            </motion.div>

            {isAdmin && (
              <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <RoleCard
                  role="admin"
                  title={t("auth.asAdmin")}
                  description={t("auth.asAdminDesc")}
                  icon={ShieldCheck}
                  isSelected={selectedRole === "admin"}
                  onSelect={handleRoleSelection}
                  isRTL={isRTL}
                />
              </motion.div>
            )}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full"
        >
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`btn-primary w-full h-16 rounded-[24px] text-lg font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-primary/20 ${
              !selectedRole ? "opacity-50 grayscale cursor-not-allowed" : "hover:shadow-primary/40"
            }`}
          >
            <span>{t("onboarding.getStarted") || "Continue"}</span>
            <ArrowRight className={`w-6 h-6 transition-transform ${isRTL ? "rotate-180" : "group-hover:translate-x-1"}`} />
          </button>
          
          <div className="mt-8 text-center flex flex-col items-center gap-4">
             <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-[10px] font-black text-text-hint uppercase tracking-widest">Powered by AmbiTasker Engine</span>
             </div>
             <p className="text-xs font-bold text-text-secondary">
               Already have an account? <span className="text-primary hover:underline cursor-pointer">Sign in.</span>
             </p>
          </div>
        </motion.div>
      </div>
      
      {/* Bottom padding for mobile devices */}
      <div className="h-10" />
    </div>
  );
}
