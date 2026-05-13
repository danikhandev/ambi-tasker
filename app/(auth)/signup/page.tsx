"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Briefcase, Users, Globe } from "lucide-react";
import { unbounded } from "@/app/fonts";
import Logo from "@/components/ui/Logo";
import { useUI } from "@/contexts/UIContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Suspense } from "react";

function SignupSelector() {
  const { language, setLanguage } = useUI();
  const { t, isRTL } = useTranslation();

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-muted relative overflow-hidden font-sans"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[100px] translate-y-1/2 translate-x-1/4" />

      {/* Language Toggle */}
      <button
        onClick={() => setLanguage(language === "en" ? "ur" : "en")}
        className={`fixed top-6 ${isRTL ? "left-6" : "right-6"} z-50 flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all font-bold text-sm`}
        title={t("header.switchLanguage")}
      >
        <Globe className="w-4 h-4 text-primary" />
        <span className="text-xs font-black uppercase tracking-widest text-foreground">
          {language === "en" ? "اردو" : "EN"}
        </span>
      </button>

      <div className="w-full max-w-7xl mx-auto px-4 relative z-10 flex flex-col items-center py-20 pb-32 lg:pb-20">
        <div className="w-full max-w-4xl" dir="ltr">
          <div className="text-center mb-16">
            <Link href="/" className="inline-block mb-12">
              <Logo size="lg" />
            </Link>
            <h1 className={`${unbounded.className} text-4xl md:text-5xl font-black text-foreground mb-6`}>
              {t("auth.chooseJourney")}
            </h1>
            <p className="text-text-secondary text-lg font-medium max-w-lg mx-auto leading-relaxed">
              {t("auth.chooseJourneyDesc") || "Select your path to get started with AmbiTasker."}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 px-4">
            <motion.div whileHover={{ y: -8 }} className="group relative">
              <Link href="/signup/user" className="block h-full p-6 md:p-8 bg-card rounded-2xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:border-primary/20 transition-all duration-300 text-center shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-20 h-20 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Users className="w-10 h-10" />
                </div>
                <h3 className={`${unbounded.className} text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors`}>
                  {t("auth.forCustomers")}
                </h3>
                <p className="text-text-secondary font-medium leading-relaxed mb-8">
                  {t("auth.forCustomersDesc") || "Find and book trusted professionals for your daily tasks."}
                </p>
                <div className="inline-flex items-center gap-2 text-primary font-bold">
                  {t("auth.startBooking") || "Start Booking"} <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>

            <motion.div whileHover={{ y: -8 }} className="group relative">
              <Link href="/signup/provider" className="block h-full p-6 md:p-8 bg-card rounded-2xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:border-accent/20 transition-all duration-300 text-center shadow-sm hover:shadow-md transition-all duration-300">
                <div className="w-20 h-20 bg-accent-soft rounded-2xl flex items-center justify-center text-accent mx-auto mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Briefcase className="w-10 h-10" />
                </div>
                <h3 className={`${unbounded.className} text-2xl font-bold text-foreground mb-4 group-hover:text-accent transition-colors`}>
                  {t("auth.forProfessionals")}
                </h3>
                <p className="text-text-secondary font-medium leading-relaxed mb-8">
                  {t("auth.forProfessionalsDesc") || "Offer your services and grow your independent business."}
                </p>
                <div className="inline-flex items-center gap-2 text-accent font-bold">
                  {t("auth.startWorking") || "Start Working"} <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </motion.div>
          </div>

          <div className="mt-16 text-center">
            <p className="text-text-secondary font-medium">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link href="/login" className="text-primary font-bold hover:underline">
                {t("auth.signInLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted flex justify-center items-center"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <SignupSelector />
    </Suspense>
  );
}
