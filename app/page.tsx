"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  ArrowRight, ShieldCheck, Zap, Droplets, Wrench, Paintbrush, 
  Search, Calendar, CheckCircle2, Star, Users, Globe, Smartphone,
  Shield, Rocket, Sparkles, User
} from "lucide-react";
import Link from "next/link";
import { unbounded } from "./fonts";
import Brand from "@/components/ui/Brand";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/contexts/UserContext";

export default function LandingPage() {
  const { user } = useUser();
  const { t } = useTranslation();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const featuredServices = [
    { name: t("landing.services_ui.electrical") || "Electrical", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
    { name: t("landing.services_ui.plumbing") || "Plumbing", icon: Droplets, color: "text-blue-500", bg: "bg-blue-50" },
    { name: t("landing.services_ui.mechanic") || "Mechanic", icon: Wrench, color: "text-slate-500", bg: "bg-slate-50" },
    { name: t("landing.services_ui.painting") || "Painting", icon: Paintbrush, color: "text-rose-500", bg: "bg-rose-50" },
  ];

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* 1. Hero Section - Centered Production Style */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-32 pb-20 px-6 overflow-hidden bg-[rgba(248,250,252,0.5)]">
        {/* Grid Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: `radial-gradient(#2563EB 0.5px, transparent 0.5px), radial-gradient(#2563EB 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px', backgroundPosition: '0 0, 12px 12px' }} />
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          {/* Trust Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-6 py-2.5 bg-white border border-border shadow-sm rounded-full mb-12">
            <Sparkles size={16} className="text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">{t("landing.hero.badge") || "Trusted by 1,000+ Happy Customers"}</span>
          </motion.div>

          <motion.h1 
            variants={itemVariants}
            className={`${unbounded.className} text-5xl md:text-7xl font-black text-primary leading-[1.1] tracking-tighter mb-8`}
            dangerouslySetInnerHTML={{ __html: t("landing.cta.title") || "Ready to get <br /> started today?" }}
          />

          <motion.p 
            variants={itemVariants}
            className="text-lg md:text-xl text-text-secondary font-medium max-w-2xl mx-auto leading-relaxed mb-14"
          >
            {t("landing.hero.desc") || "The easiest way to find and book verified professionals for your home and lifestyle needs. Quality service, guaranteed."}
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-6">
            {user ? (
               <Link 
                href={user.role === 'PROVIDER' ? "/provider/dashboard" : "/user/dashboard"} 
                className="h-16 px-12 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-primary-dark hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-primary/20 flex items-center gap-3 group"
              >
                GO TO MY DASHBOARD
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform rtl:rotate-180" />
              </Link>
            ) : (
              <>
                <Link 
                  href="/search" 
                  className="h-16 px-12 bg-primary text-white rounded-full font-black text-xs uppercase tracking-widest hover:bg-primary-dark hover:scale-[1.02] transition-all duration-300 shadow-xl shadow-primary/20 flex items-center gap-3 group"
                >
                  {t("landing.hero.bookNow") || "BOOK NOW"}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform rtl:rotate-180" />
                </Link>
                <Link 
                  href="/signup/provider" 
                  className="h-16 px-12 bg-white border border-border rounded-full font-black text-xs uppercase tracking-widest text-foreground hover:bg-gray-50 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 shadow-sm"
                >
                  {t("nav.joinAsPro") || "JOIN AS PROVIDER"}
                  <User size={18} className="text-primary" />
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* 2. Popular Services Grid */}
      <section className="py-24 px-6 bg-white dark:bg-transparent relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className={`${unbounded.className} text-3xl font-black text-foreground`} dangerouslySetInnerHTML={{ __html: t("landing.services_ui.title") || "Popular Services" }} />
            <p className="text-text-secondary font-medium max-w-xl mx-auto opacity-70">{t("landing.services_ui.desc") || "Discover the most requested services in your area. Professional help is just a click away."}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {featuredServices.map((service, i) => (
              <Link key={service.name} href="/search">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="p-8 bg-card rounded-[40px] border border-border/60 shadow-sm hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 transition-all group text-center cursor-pointer"
                >
                  <div className={`w-16 h-16 ${service.bg} ${service.color} rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <service.icon size={28} />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-widest mb-1 text-foreground">{service.name}</h4>
                  <p className="text-[10px] font-bold text-text-hint uppercase tracking-tighter">{t("landing.services_ui.viewTopRated") || "VIEW TOP RATED"}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Workflow Section */}
      <section className="py-24 px-6 relative overflow-hidden bg-gray-50/50 dark:bg-transparent border-y border-border/40">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="relative">
             <div className="absolute inset-0 bg-primary/5 blur-[80px] rounded-full" />
             <div className="space-y-12">
                {[
                  { step: "01", title: t("landing.hiw.step1Title") || "Search Service", desc: t("landing.hiw.step1Desc") || "Tell us what you need and where you are located.", icon: Search },
                  { step: "02", title: t("landing.hiw.step2Title") || "Book a Pro", desc: t("landing.hiw.step2Desc") || "Choose a verified expert based on reviews and price.", icon: Calendar },
                  { step: "03", title: t("landing.hiw.step3Title") || "Relax & Watch", desc: t("landing.hiw.step3Desc") || "Sit back while we handle the task with perfection.", icon: CheckCircle2 },
                ].map((item, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    viewport={{ once: true }}
                    className="flex gap-8 group"
                  >
                    <div className={`${unbounded.className} text-4xl font-black text-primary/10 group-hover:text-primary/30 transition-colors pt-1`}>
                      {item.step}
                    </div>
                    <div className="space-y-2">
                      <h3 className={`${unbounded.className} text-lg font-black flex items-center gap-3 text-foreground`}>
                        {item.title}
                        <item.icon size={18} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-text-secondary font-medium leading-relaxed max-w-sm">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>
          <div className="bg-[#0F172A] text-white p-12 rounded-[56px] shadow-2xl relative">
             <div className="absolute -top-6 -left-6 w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white shadow-xl">
                <Rocket size={32} />
             </div>
             <h2 className={`${unbounded.className} text-4xl font-black leading-tight mb-8 text-white`} dangerouslySetInnerHTML={{ __html: t("landing.transform.title") || 'Ready to <span className="text-primary italic">Transform</span> your space?' }} />
             <p className="text-lg text-white/80 mb-12 font-medium leading-relaxed">{t("landing.transform.desc") || "Join thousands of satisfied customers who trust Ambi Tasker for their daily operational needs."}</p>
             <Link 
               href="/search" 
               className="inline-flex items-center gap-3 text-sm font-black uppercase tracking-widest group text-white"
             >
                {t("landing.transform.btn") || "Explore Services"}
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center group-hover:translate-x-2 transition-transform shadow-lg shadow-primary/20">
                   <ArrowRight size={20} className="text-white rtl:rotate-180" />
                </div>
             </Link>
          </div>
        </div>
      </section>

      {/* 4. Trust Pillars */}
      <section className="py-24 px-6 bg-background relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 shadow-sm">
                <Shield size={24} />
              </div>
              <h3 className={`${unbounded.className} text-lg font-black text-foreground`}>{t("landing.trustPillars.verifiedTitle") || "Verified Providers"}</h3>
              <p className="text-sm text-text-secondary leading-relaxed font-medium">{t("landing.trustPillars.verifiedDesc") || "Every professional undergoes a strict background check and identity verification process."}</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 shadow-sm">
                <Globe size={24} />
              </div>
              <h3 className={`${unbounded.className} text-lg font-black text-foreground`}>{t("landing.trustPillars.regionalTitle") || "Regional Network"}</h3>
              <p className="text-sm text-text-secondary leading-relaxed font-medium">{t("landing.trustPillars.regionalDesc") || "Local experts from your own community, ensuring fast response times and regional trust."}</p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-6 shadow-sm">
                <Smartphone size={24} />
              </div>
              <h3 className={`${unbounded.className} text-lg font-black text-foreground`}>{t("landing.trustPillars.mobileTitle") || "Mobile Optimized"}</h3>
              <p className="text-sm text-text-secondary leading-relaxed font-medium">{t("landing.trustPillars.mobileDesc") || "Manage bookings, track providers, and handle payments directly from your smartphone."}</p>
            </div>
          </div>
        </div>
      </section>
      

      

    </div>
  );
}
