"use client";

import { useParams, useRouter } from "next/navigation";
import { unbounded } from "@/app/fonts";
import { motion } from "framer-motion";
import { SERVICES_LIST } from "@/constants/services";
// All provider data is fetched from Supabase
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Star, Zap, Search, ArrowRight, UserCheck, Banknote, Calendar, MapPin, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { useTranslation } from "@/hooks/useTranslation";
import { useUI } from "@/contexts/UIContext";


export default function ServiceDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const { t } = useTranslation();
    const { showToast } = useUI();
    const [mounted, setMounted] = useState(false);
    const [service, setService] = useState<any>(null);
    const [realProviders, setRealProviders] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setMounted(true);
        fetchServiceAndProviders();
    }, [id]);

    const fetchServiceAndProviders = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch the service from DB via REST API
            const resService = await fetch(`/api/services/${id}`);
            const serviceJson = await resService.json();

            let serviceData: any = null;
            if (serviceJson.success && serviceJson.data) {
                serviceData = serviceJson.data;
                const existing = SERVICES_LIST.find(sl => sl.title.toLowerCase() === serviceData.name.toLowerCase());
                setService({
                    id: serviceData.id,
                    title: serviceData.name,
                    desc: serviceData.description || 'Professional service',
                    image: serviceData.icon || existing?.image || "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=400&h=300",
                    icon: existing?.icon || Zap,
                    color: existing?.color || "bg-yellow-50 text-yellow-600 border-yellow-100",
                    startingPrice: serviceData.price,
                    isEmergency: serviceData.name.toLowerCase().includes('emergency'),
                    category_name: serviceData.category
                });
            } else {
                // Fallback to constants
                const fallback = SERVICES_LIST.find(s => s.id === id);
                if (fallback) {
                    setService(fallback);
                    serviceData = fallback;
                } else {
                    console.error("Service not found");
                }
            }

            // 2. Fetch Providers mapped to this category via REST
            const currentCategory = serviceData?.category || serviceData?.category_name || serviceData?.title || "";
            const resProviders = await fetch(`/api/providers?category=${encodeURIComponent(currentCategory)}&limit=20`);
            const providersJson = await resProviders.json();

            if (providersJson.success && providersJson.data) {
                const transformed = providersJson.data.map((p: any) => ({
                    id: p.id,
                    name: p.name || 'System Provider',
                    title: p.professionalTitle || p.serviceDescription || 'Professional Service Provider',
                    rating: p.rating || 5.0,
                    avatar: p.profileImage || "/default-avatar.svg",
                    location: `${p.district || 'Haripur'}, ${p.area || 'City'}`,
                    area: p.area || 'City Area',
                    category: p.professionalTitle || 'General',
                    hourlyRate: p.hourlyRate || 1000,
                    bio: p.serviceDescription || 'Service provider dedicated to quality work.',
                    jobsCompleted: p.completedJobs || 0,
                    verificationStatus: p.verificationStatus
                }));

                setRealProviders(transformed);
            }
        } catch (e) {
            console.error("Fetch Data failed:", e);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && mounted) {
        return <div className="min-h-screen flex items-center justify-center bg-card"><Loader2 className="animate-spin text-primary" size={40} /></div>;
    }

    if (!service && mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-muted">
                <div className="text-center">
                    <h2 className={`${unbounded.className} text-3xl font-black mb-4`}>Service Not Found</h2>
                    <button onClick={() => router.push('/')} className="text-primary font-bold hover:underline">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    if (!mounted || !service) return <div className="min-h-screen bg-card" />;

    const providers = realProviders;



    return (
        <div className="min-h-screen bg-card font-sans selection:bg-primary selection:text-white pb-20">
            {/* Banner Section */}
            <section className="relative pt-32 pb-24 overflow-hidden bg-gray-900 border-b border-border">
                <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover opacity-30 grayscale-[0.2]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center gap-6 md:p-8">
                    <div className="flex-1">
                        {service.isEmergency && (
                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/20 rounded-full text-xs font-black uppercase tracking-widest mb-6 animate-pulse">
                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full" /> Available 24/7
                            </span>
                        )}
                        <h1 className={`${unbounded.className} text-4xl md:text-6xl font-black text-white mb-6 leading-tight`}>
                            {t(`services.${service.title}`)} <span className="text-primary text-5xl">.</span>
                        </h1>
                        <p className="text-text-disabled font-medium text-lg max-w-xl mb-8 leading-relaxed">
                            {service.desc} {t("service.connection_guarantee", { service: t(`services.${service.title}`) })}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 md:gap-6">
                            <div className="bg-card/10 border border-white/20 px-6 py-4 rounded-[24px] backdrop-blur-md">
                                <div className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-1">Starting Price</div>
                                <div className="text-2xl font-black text-primary">Rs. {service.startingPrice}</div>
                            </div>
                            <button 
                                onClick={() => document.getElementById('providers-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-5 bg-primary text-white font-black rounded-[24px] hover:bg-primary-dark shadow-sm border border-border hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all inline-flex items-center justify-center">
                                {service.isEmergency ? "Find Providers Now" : "Choose a Provider"}
                            </button>
                            {service.isEmergency && (
                                <a href={`tel:0800123456`} className="px-8 py-5 bg-red-600 text-white font-black rounded-[24px] hover:bg-red-700 shadow-sm border border-border hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center gap-3">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-card opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-card"></span>
                                    </span>
                                    Quick Call
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-1/3 flex justify-center">
                        <div className={`w-64 h-64 rounded-full p-12 ${service.color} border-4 flex items-center justify-center shadow-xl border-[#d4af37]/30 hover:shadow-2xl transition-all duration-500 hover:scale-105`}>
                            <service.icon className="w-1/2 h-1/2 opacity-80 mix-blend-multiply" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Included / Features Section */}
            <section className="py-20 bg-card">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className={`${unbounded.className} text-3xl font-black text-foreground mb-8`}>What's Included?</h2>
                            <div className="space-y-6">
                                {[
                                    { t: "Thorough Inspection & Diagnosis", d: "A complete walkthrough to identify issues accurately." },
                                    { t: "Transparent Pricing", d: "Get an upfront quote before work begins. No hidden fees." },
                                    { t: "Verified Quality Service", d: "Professionally trained providers using premium authentic tools." },
                                    { t: "Post-Service Cleanup", d: "We leave your space just as clean as we found it." },
                                ].map((feat, idx) => (
                                    <div key={idx} className="flex gap-4">
                                        <div className="w-12 h-12 bg-muted rounded-[18px] flex items-center justify-center text-primary flex-shrink-0">
                                            <ShieldCheck className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-foreground">{feat.t}</h4>
                                            <p className="text-sm font-medium text-text-secondary mt-1">{feat.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-muted rounded-2xl p-6 md:p-8 border border-border">
                            <h3 className={`${unbounded.className} text-xl font-bold mb-6`}>Why Use Ambi Tasker?</h3>
                            <ul className="space-y-4">
                                <li className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><UserCheck className="w-4 h-4" /></div>
                                    <span className="font-medium text-foreground">100% Background Checked Pros</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Calendar className="w-4 h-4" /></div>
                                    <span className="font-medium text-foreground">Flexible Scheduling</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center"><Banknote className="w-4 h-4" /></div>
                                    <span className="font-medium text-foreground">Standardized Fair Rates</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* Available Providers Section */}
            <section id="providers-section" className="py-20 bg-muted border-t border-border">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between mb-12">
                        <h2 className={`${unbounded.className} text-3xl md:text-4xl font-black text-foreground`}>
                            Available <span className="text-primary">Providers</span>
                        </h2>
                        <span className="text-sm font-bold text-text-secondary">{providers.length} matching providers</span>
                    </div>

                    {providers.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            {providers.map((worker, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    key={worker.id}
                                    className={`bg-card rounded-[32px] border ${worker.category === "Emergency Assistance" ? 'border-red-200 shadow-red-500/5' : 'border-border'} p-6 border border-border/50 hover:shadow-2xl hover:-translate-y-1 transition-all group`}
                                >
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="relative">
                                            <img src={worker.avatar} alt={worker.name} className="w-16 h-16 rounded-2xl object-cover bg-muted border border-border shadow-sm group-hover:scale-105 transition-transform" />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                               <h3 className="font-black text-foreground leading-tight truncate group-hover:text-primary transition-colors flex items-center gap-1.5">
                                                 {worker.name}
                                                 {worker.verificationStatus === "VERIFIED" && <ShieldCheck size={14} className="text-primary shrink-0" />}
                                               </h3>
                                               <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase shrink-0">
                                                  Available
                                               </div>
                                            </div>
                                            <p className="text-[10px] font-black text-text-hint tracking-widest uppercase mb-2 truncate opacity-70">{worker.title}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2.5 py-1 rounded-xl text-[10px] font-black border border-yellow-100">
                                                    <Star className="w-3 h-3 fill-current" /> {worker.rating}
                                                </div>
                                                <div className="flex items-center gap-1 bg-muted/50 text-text-secondary px-2.5 py-1 rounded-xl text-[9px] font-black border border-border/30">
                                                    <MapPin className="w-3 h-3 text-primary" />
                                                    {worker.area}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-text-secondary text-[11px] font-medium line-clamp-2 h-8 mb-6 leading-relaxed">
                                        {worker.bio}
                                    </p>

                                    <div className="flex items-center justify-between pt-6 border-t border-border/40">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black uppercase text-text-hint tracking-widest mb-0.5">Commission Rate</span>
                                            <div className="text-lg font-black text-foreground">
                                                Rs. {worker.hourlyRate} <span className="text-[10px] font-medium text-text-hint uppercase tracking-tighter">/Visit</span>
                                            </div>
                                        </div>
                                        {worker.verificationStatus === "VERIFIED" ? (
                                            <Link href={`/provider/${worker.id}?book=true`} className="px-5 py-3 bg-gray-900 text-white font-black uppercase tracking-widest text-[9px] rounded-xl hover:bg-primary hover:shadow-lg transition-all active:scale-95">
                                                Book Now
                                            </Link>
                                        ) : (
                                            <button 
                                                onClick={() => {
                                                    const msg = worker.verificationStatus === "PENDING" || worker.verificationStatus === "UNDER_REVIEW"
                                                        ? "Verification in progress"
                                                        : "This provider is not verified yet";
                                                    showToast(msg, "error");
                                                }}
                                                className="px-5 py-3 bg-gray-200 text-gray-500 cursor-not-allowed font-black uppercase tracking-widest text-[9px] rounded-xl transition-all"
                                            >
                                                Book Now
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="max-w-xl mx-auto">
                            <EmptyState 
                                icon={Search}
                                title="No Specialized Providers"
                                description={t("service.not_found_desc", { service: t(`services.${service.title}`) })}
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* Browse More Services Section */}
            <section className="py-24 bg-card">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                  <h2 className={`${unbounded.className} text-3xl font-black mb-4 capitalize`}>Related <span className="text-primary italic">Services</span> 🛠️</h2>
                  <p className="text-text-secondary max-w-xl mx-auto font-medium">Explore other professional maintenance and repair services available in {service.service_categories?.category_name || "this category"}.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {SERVICES_LIST.filter(s => s.categoryId === service.category_id && s.id !== service.id).slice(0, 4).map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="group bg-muted/30 p-6 rounded-[32px] border border-border/50 hover:bg-card hover:shadow-xl transition-all h-full flex flex-col"
                    >
                      <div className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center mb-6 border border-white/20 group-hover:scale-110 transition-transform`}>
                        <s.icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-black text-foreground mb-2 group-hover:text-primary transition-colors">{s.title}</h4>
                      <p className="text-[10px] text-text-secondary font-medium mb-6 line-clamp-2">{s.desc}</p>
                      <Link href={`/services/${s.id}`} className="mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary group-hover:gap-3 transition-all">
                        Explore <ArrowRight size={12} />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
        </div>
    );
}
