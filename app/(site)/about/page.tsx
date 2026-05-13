"use client";

import { motion } from "framer-motion";
import { Shield, Target, Users, Award, ArrowRight, CheckCircle2, Heart, Zap } from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useTranslation } from "@/hooks/useTranslation";
import BrandText from "@/components/BrandText";
import Link from "next/link";
import Image from "next/image";
import ConnectSection from "@/components/ConnectSection";

export default function AboutPage() {
    const { t, isRTL } = useTranslation();

    const stats = [
        { label: t("aboutPage.stats.activeUsers"), value: "1k+" },
        { label: t("aboutPage.stats.verifiedPros"), value: "500+" },
        { label: t("aboutPage.stats.jobsCompleted"), value: "2k+" },
        { label: t("aboutPage.stats.customerRating"), value: "4.9/5" },
    ];

    const values = [
        {
            icon: Shield,
            title: t("aboutPage.values.trustTitle"),
            description: t("aboutPage.values.trustDesc"),
        },
        {
            icon: Target,
            title: t("aboutPage.values.precisionTitle"),
            description: t("aboutPage.values.precisionDesc"),
        },
        {
            icon: Heart,
            title: t("aboutPage.values.communityTitle"),
            description: t("aboutPage.values.communityDesc"),
        },
        {
            icon: Zap,
            title: t("aboutPage.values.efficiencyTitle"),
            description: t("aboutPage.values.efficiencyDesc"),
        },
    ];

    const team = [
        {
            name: "Danyal Khan",
            role: "Founder & CEO",
            image: "/images/team/ceo.jpg",
        },
        {
            name: "Muhammad Haroon",
            role: "Operations Director",
            image: "/images/team/haroon.jpg",
        },
        {
            name: "Mohibullah",
            role: "Community Manager",
            image: "/images/team/mohibullah.png",
        },
    ];

    return (
        <div className="bg-card selection:bg-primary selection:text-white">
            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden bg-muted/50">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-accent/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/4" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className={isRTL ? "text-right" : "text-left"}
                        >
                            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest rounded-full mb-6">
                                {t("aboutPage.ourStory")}
                            </span>
                            <h1
                                className={`${unbounded.className} text-4xl md:text-6xl font-black text-foreground mb-8 leading-tight`}
                                dangerouslySetInnerHTML={{
                                    __html: t("aboutPage.title").replace("{service}", `<span class="text-primary">${t("aboutPage.service")}</span>`)
                                }}
                            />
                            <p className="text-lg text-text-secondary font-medium leading-relaxed mb-10">
                                <BrandText text={t("aboutPage.desc1")} />
                            </p>
                            <div className={`flex flex-wrap gap-4 ${isRTL ? "justify-end" : "justify-start"}`}>
                                <Link href="/register" className="btn-primary h-14 px-10">
                                    {t("aboutPage.joinCommunity")}
                                </Link>
                                <Link href="/contact" className="btn-secondary h-14 px-10 bg-card">
                                    {t("aboutPage.contactUs")}
                                </Link>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="relative group"
                        >
                            {/* Decorative Background Glow */}
                            <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-[60px] opacity-50 group-hover:opacity-70 transition-opacity" />
                            
                            <div className="relative aspect-[4/5] md:aspect-square lg:aspect-[4/5] rounded-[40px] md:rounded-[60px] overflow-hidden shadow-2xl border border-white/20 ring-1 ring-black/5">
                                <Image
                                    src="/images/team-hero.jpg"
                                    alt="Ambi Tasker Team"
                                    fill
                                    priority
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                {/* Subtle Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60" />
                            </div>

                            {/* Floating Stat Card with Glassmorphism */}
                            <div className="absolute -bottom-8 -left-8 bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/40 hidden md:block hover:-translate-y-1 transition-transform duration-300">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-foreground">99.9%</div>
                                        <div className="text-[10px] font-black text-primary uppercase tracking-widest">{t("aboutPage.successRate")}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-24 bg-card">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:p-8">
                        {stats.map((stat, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="text-center"
                            >
                                <div className={`${unbounded.className} text-4xl md:text-5xl font-black text-primary mb-2`}>
                                    {stat.value}
                                </div>
                                <div className="text-sm font-bold text-text-hint uppercase tracking-[0.2em]">
                                    {stat.label}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-24 bg-muted/50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className={`${unbounded.className} text-3xl md:text-4xl font-black text-foreground mb-6`}>
                            {t("aboutPage.coreValues")}
                        </h2>
                        <p className="text-text-secondary font-medium leading-relaxed">
                            {t("aboutPage.coreValuesDesc")}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm hover:shadow-sm border border-border hover:shadow-md transition-all duration-300 group"
                            >
                                <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <value.icon className="w-7 h-7" />
                                </div>
                                <h3 className={`${unbounded.className} text-lg font-bold text-foreground mb-4`}>{value.title}</h3>
                                <p className="text-text-secondary text-sm font-medium leading-relaxed">{value.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20">
                        <h2 className={`${unbounded.className} text-3xl md:text-4xl font-black text-foreground mb-6`}>
                            {t("aboutPage.meetVisionaries")}
                        </h2>
                        <p className="text-text-secondary font-medium leading-relaxed">
                            {t("aboutPage.meetVisionariesDesc")}
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-12 max-w-5xl mx-auto">
                        {team.map((member, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="group text-center"
                            >
                                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-6 shadow-lg group-hover:-translate-y-2 transition-transform duration-500">
                                    <Image
                                        src={member.image}
                                        alt={member.name}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <h3 className={`${unbounded.className} text-xl font-black text-foreground tracking-tighter`}>{member.name}</h3>
                                <p className="text-primary text-[10px] font-black uppercase tracking-[0.2em] mt-2">{member.role}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Connect Section */}
            <section className="py-24 bg-card">
                <div className="max-w-7xl mx-auto px-6">
                    <ConnectSection />
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="bg-gray-900 rounded-[60px] p-6 md:p-8 md:p-24 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 -translate-x-1/2" />
                        <div className="relative z-10">
                            <h2
                                className={`${unbounded.className} text-3xl md:text-5xl font-black text-white mb-8 leading-tight`}
                                dangerouslySetInnerHTML={{
                                    __html: t("aboutPage.startJourney").replace("{brand}", `<span class="text-primary">Ambi Tasker</span>`)
                                }}
                            />
                            <div className="flex flex-wrap items-center justify-center gap-6">
                                <Link href="/register" className="btn-primary h-14 px-12 group">
                                    {t("aboutPage.joinNow")}
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                </Link>
                                <Link href="/search" className="btn-secondary h-14 px-12 bg-white/10 text-white border-white/20 hover:bg-white/20">
                                    {t("aboutPage.browseServices")}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
