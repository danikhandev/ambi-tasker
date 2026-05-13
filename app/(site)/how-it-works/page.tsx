"use client";

import { motion } from 'framer-motion';
import { ArrowRight, Search, Calendar, MessageSquare, Star, UserPlus, Briefcase, Banknote, ShieldCheck, Zap, Heart, Globe, Shield, Clock, BadgeCheck, UserCheck, Phone } from 'lucide-react';
import BrandText from "@/components/BrandText";
import Link from 'next/link';
import { unbounded } from "@/app/fonts";
import { useTranslation } from "@/hooks/useTranslation";

export default function HowItWorksPage() {
  const { t, isRTL } = useTranslation();

  const consumerSteps = [
    {
      icon: Search,
      title: t("howItWorksPage.customerSteps.step1Title"),
      description: t("howItWorksPage.customerSteps.step1Desc")
    },
    {
      icon: Calendar,
      title: t("howItWorksPage.customerSteps.step2Title"),
      description: t("howItWorksPage.customerSteps.step2Desc")
    },
    {
      icon: ShieldCheck,
      title: t("howItWorksPage.customerSteps.step3Title"),
      description: t("howItWorksPage.customerSteps.step3Desc")
    },
    {
      icon: Heart,
      title: t("howItWorksPage.customerSteps.step4Title"),
      description: t("howItWorksPage.customerSteps.step4Desc")
    }
  ];

  const workerSteps = [
    {
      icon: UserPlus,
      title: t("howItWorksPage.workerSteps.step1Title"),
      description: t("howItWorksPage.workerSteps.step1Desc")
    },
    {
      icon: Zap,
      title: t("howItWorksPage.workerSteps.step2Title"),
      description: t("howItWorksPage.workerSteps.step2Desc")
    },
    {
      icon: Globe,
      title: t("howItWorksPage.workerSteps.step3Title"),
      description: t("howItWorksPage.workerSteps.step3Desc")
    },
    {
      icon: Banknote,
      title: t("howItWorksPage.workerSteps.step4Title"),
      description: t("howItWorksPage.workerSteps.step4Desc")
    }
  ];

  return (
    <div className="bg-card selection:bg-primary selection:text-white">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-muted/50">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-accent/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest rounded-full mb-6">
              <BrandText text={t("howItWorksPage.badge")} />
            </span>
            <h1
              className={`${unbounded.className} text-4xl md:text-6xl font-black text-foreground mb-8 leading-tight`}
              dangerouslySetInnerHTML={{
                __html: t("howItWorksPage.title").replace("{finest}", `<span class="text-primary italic">${t("howItWorksPage.finest")}</span>`)
              }}
            />
            <p className="text-lg text-text-secondary font-medium leading-relaxed">
              {t("howItWorksPage.desc")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Choose Your Path */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* For Consumers */}
          <div className="mb-32">
            <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
              <div className={`max-w-2xl ${isRTL ? 'text-right' : 'text-left'}`}>
                <h2 className={`${unbounded.className} text-3xl md:text-4xl font-black text-foreground mb-6`}>
                  {t("howItWorksPage.forCustomers")}
                </h2>
                <p className="text-text-secondary font-medium text-lg">
                  {t("howItWorksPage.forCustomersDesc")}
                </p>
              </div>
              <Link href="/search" className="flex items-center gap-2 text-primary font-bold group">
                {t("header.services")} <ArrowRight className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${isRTL ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {consumerSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <div className="h-full bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm hover:shadow-md border border-border/50 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-2 transition-all duration-300">
                    <div className="w-16 h-16 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                      <step.icon className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-4 block">{t("howItWorksPage.step")} 0{index + 1}</span>
                    <h3 className={`${unbounded.className} text-xl font-bold text-foreground mb-4`}>{step.title}</h3>
                    <p className="text-text-secondary font-medium leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* For Workers */}
          <div className="relative">
            <div className="absolute inset-0 bg-muted rounded-[60px] -z-10" />
            <div className="p-6 md:p-8 md:p-20">
              <div className={`flex flex-col md:flex-row items-end justify-between gap-8 mb-16 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                <div className={`max-w-2xl ${isRTL ? 'text-right' : 'text-left'}`}>
                  <h2 className={`${unbounded.className} text-3xl md:text-4xl font-black text-foreground mb-6`}>
                    {t("howItWorksPage.forProfessionals")}
                  </h2>
                  <p className="text-text-secondary font-medium text-lg">
                    {t("howItWorksPage.forProfessionalsDesc")}
                  </p>
                </div>
                <Link href="/register?role=provider" className="btn-primary h-12 px-8 bg-gray-900">
                  {t("nav.joinAsPro")}
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {workerSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="h-full bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm hover:shadow-md border border-border/50 hover:shadow-lg hover:shadow-accent/5 hover:-translate-y-2 transition-all duration-300">
                      <div className="w-16 h-16 bg-accent-soft text-accent rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                        <step.icon className="w-8 h-8" />
                      </div>
                      <span className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-4 block">{t("howItWorksPage.step")} 0{index + 1}</span>
                      <h3 className={`${unbounded.className} text-xl font-bold text-foreground mb-4`}>{step.title}</h3>
                      <p className="text-text-secondary font-medium leading-relaxed">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-primary rounded-[60px] p-6 md:p-8 md:p-24 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-card/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <h2
                className={`${unbounded.className} text-3xl md:text-5xl font-black text-white mb-8 leading-tight`}
                dangerouslySetInnerHTML={{
                  __html: t("howItWorksPage.readyToExperience").replace("{future}", `<span class="text-accent underline decoration-4 underline-offset-8">${t("howItWorksPage.future")}</span>`)
                }}
              />
              <div className="flex flex-wrap items-center justify-center gap-6">
                <Link href="/register" className="btn-secondary h-14 px-12 bg-white text-primary border-none shadow-xl">
                  {t("howItWorksPage.getStartedFree")}
                </Link>
                <Link href="/contact" className="btn-secondary h-14 px-12 bg-primary-dark/40 text-white border-white/10 hover:bg-primary-dark/60">
                  {t("howItWorksPage.contactSupport")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
