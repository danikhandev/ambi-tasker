"use client";

import BookingModal from "@/components/booking/BookingModal";
// All provider data is fetched from Supabase
import { useUser } from "@/contexts/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Star,
  CheckCircle2,
  Clock,
  Shield,
  Award,
  Briefcase,
  ChevronLeft,
  Share2,
  Heart,
  Calendar,
  Zap,
  MessageCircle,
  ShieldCheck,
  Globe,
  Verified,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { unbounded } from "@/app/fonts";
import Image from "next/image";
import BackButton from "@/components/BackButton";
import CircularFrame from "@/components/CircularFrame";
import { useTranslation } from "@/hooks/useTranslation";
import { useUI } from "@/contexts/UIContext";

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    full_name: string;
    profile_image: string;
  }
}

export default function ProviderDetailPage() {
  const params = useParams();
  const { user } = useUser();
  const { t } = useTranslation();
  const { showToast } = useUI();
  const [worker, setWorker] = useState<any>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "services" | "portfolio" | "reviews">("about");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("book") === "true") {
      setIsBookingModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (params.id) {
      fetchProviderDetails();
    }
  }, [params.id]);

  const fetchProviderDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/providers/${params.id}`);
      const json = await res.json();

      if (json.success && json.data) {
        setWorker(json.data);
        setReviews(json.data.reviews || []);
      } else {
        setWorker(null);
      }
    } catch (error) {
      console.error("Error fetching provider:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-card">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className={`${unbounded.className} text-sm font-bold text-text-hint animate-pulse uppercase tracking-[0.2em]`}>Loading Provider Details...</p>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted p-6 text-center">
        <div className="max-w-md">
          <Shield className="w-16 h-16 text-text-disabled mx-auto mb-6" />
          <h2 className={`${unbounded.className} text-2xl font-black mb-4`}>Provider Not Found</h2>
          <p className="text-text-secondary mb-8">This provider does not exist in our active network.</p>
          <Link href="/search" className="btn-primary px-8 flex items-center gap-2">
            <ChevronLeft size={18} /> Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card selection:bg-primary selection:text-white pb-20">
      {/* Header Image */}
      <div className="h-[300px] w-full bg-gray-900 relative overflow-hidden">
        <Image
          src={worker.portfolio?.[0]?.image || "https://images.unsplash.com/photo-1581578731548-c64695ce6958?auto=format&fit=crop&q=80&w=1600"}
          alt="Background"
          fill
          className="object-cover opacity-40 grayscale-[0.5]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-10">
        <div className="mb-6 hidden lg:block">
           <BackButton label="Back to Search" fallbackUrl="/search" className="bg-white/10 backdrop-blur-md text-white border-white/20 hover:bg-white hover:text-foreground" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            {/* Profile Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-[40px] p-8 md:p-12 shadow-2xl shadow-gray-200 border border-border"
            >
              <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
                <div className="relative group">
                  <CircularFrame
                    src={worker.avatar}
                    alt={worker.name}
                    size={150}
                    className="border-4 border-white shadow-xl bg-muted"
                  />
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary border-4 border-white rounded-full flex items-center justify-center text-white shadow-lg">
                    <ShieldCheck size={20} />
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h1 className={`${unbounded.className} text-3xl md:text-5xl font-black text-foreground`}>{worker.name}</h1>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">{worker.title}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-border" />
                        <span className="text-text-hint text-[10px] font-black uppercase tracking-[0.2em]">{worker.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="p-4 bg-muted/50 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all active:scale-95"><Heart size={20} /></button>
                      <button className="p-4 bg-muted/50 rounded-2xl hover:bg-primary/5 hover:text-primary transition-all active:scale-95"><Share2 size={20} /></button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-8 pt-6 border-t border-border mt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-yellow-400/10 text-yellow-600 rounded-2xl">
                         <Star size={20} className="fill-current" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">{worker.rating.toFixed(1)} <span className="text-text-hint font-medium">/ 5.0</span></p>
                        <p className="text-xs font-black text-text-hint uppercase tracking-widest mb-1">{reviews.length} Verified Reviews</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                         <MapPin size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground truncate w-40">{worker.area}, {worker.district}</p>
                        <p className="text-[10px] font-bold text-text-hint uppercase tracking-widest">{worker.jobsCompleted} Jobs Completed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                         <Briefcase size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">{worker.experience}</p>
                        <p className="text-[10px] font-bold text-text-hint uppercase tracking-widest">Experience</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-10 border-b border-border mb-10 overflow-x-auto no-scrollbar">
                {(["about", "services", "portfolio", "reviews"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === tab ? "text-primary" : "text-text-hint hover:text-foreground"}`}
                  >
                    {tab === "reviews" ? `Reviews (${reviews.length})` : tab}
                    {activeTab === tab && (
                      <motion.div layoutId="activeTabPro" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
                    )}
                  </button>
                ))}
              </div>

              <div className="min-h-[300px]">
                <AnimatePresence mode="wait">
                  {activeTab === "about" && (
                    <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
                       <p className="text-lg text-text-secondary leading-relaxed font-medium pb-8 border-b border-border border-dashed italic">
                         "{worker.bio}"
                       </p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="p-8 bg-muted/30 rounded-[32px] border border-border">
                           <h4 className="text-xs font-black text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                             <Zap className="text-primary" size={16} /> Technical Skills
                           </h4>
                           <div className="flex flex-wrap gap-2">
                             {(worker.skills || []).map((skill: string, i: number) => (
                               <span key={i} className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-text-secondary border border-border shadow-sm">{skill}</span>
                             ))}
                           </div>
                         </div>
                         <div className="p-8 bg-muted/30 rounded-[32px] border border-border">
                           <h4 className="text-xs font-black text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                             <Award className="text-primary" size={16} /> Verification
                           </h4>
                           <div className="space-y-4">
                             <p className="text-sm font-medium text-text-secondary">{worker.education}</p>
                             <div className="flex items-center gap-3 px-4 py-2 bg-green-50 text-green-600 rounded-xl border border-green-100 w-fit">
                               <ShieldCheck size={14} />
                               <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Verified Professional</span>
                             </div>
                           </div>
                         </div>
                       </div>
                    </motion.div>
                  )}

                  {activeTab === "services" && (
                     <motion.div key="services" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                       {worker.services.length > 0 ? worker.services.map((s: any) => (
                         <button 
                           key={s.id} 
                           onClick={() => {
                             if (worker.verificationStatus !== "VERIFIED") {
                               showToast(t("search.verificationToast") || "This provider is not verified yet", "error");
                               return;
                             }
                             setIsBookingModalOpen(true);
                           }}
                           className={`w-full flex items-center justify-between p-8 rounded-[32px] border border-border bg-card ${worker.verificationStatus === "VERIFIED" ? "hover:border-primary/30 hover:shadow-xl" : "opacity-75 cursor-not-allowed"} transition-all group`}
                         >
                           <div className="flex items-center gap-6">
                             <div className="w-14 h-14 bg-muted rounded-[20px] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-12">
                               <Zap size={24} />
                             </div>
                             <div className="text-left">
                               <h4 className="text-lg font-black text-foreground mb-1">{s.title}</h4>
                               <span className="text-[10px] font-black text-text-hint uppercase tracking-widest">{s.type} SERVICE</span>
                             </div>
                           </div>
                           <div className="text-right">
                             <p className={`${unbounded.className} text-2xl font-black text-foreground`}>Rs. {s.price}</p>
                             <span className="text-[10px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 mt-2">
                               Book Now <ChevronLeft className="rotate-180" size={12} />
                             </span>
                           </div>
                         </button>
                       )) : (
                         <div className="p-20 text-center bg-muted/20 border border-dashed border-border rounded-[40px]">
                            <Zap className="mx-auto text-text-disabled mb-4 opacity-30" size={48} />
                            <p className="text-[10px] font-black text-text-hint uppercase tracking-widest">No service modules active.</p>
                         </div>
                       )}
                     </motion.div>
                  )}

                  {activeTab === "portfolio" && (
                    <motion.div key="portfolio" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {worker.portfolio.length > 0 ? worker.portfolio.map((p: any) => (
                         <div key={p.id} className="group relative rounded-[40px] overflow-hidden aspect-[4/3] bg-muted shadow-lg">
                           <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 grayscale hover:grayscale-0" />
                           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-8">
                             <h4 className="text-white font-black text-lg mb-1">{p.title}</h4>
                             <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Completed Project</p>
                           </div>
                         </div>
                       )) : (
                        <div className="col-span-full p-20 text-center bg-muted/20 border border-dashed border-border rounded-[40px]">
                           <ImageIcon className="mx-auto text-text-disabled mb-4 opacity-30" size={48} />
                           <p className="text-[10px] font-black text-text-hint uppercase tracking-widest">No portfolio items available.</p>
                        </div>
                       )}
                    </motion.div>
                  )}

                  {activeTab === "reviews" && (
                    <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                       <div className="flex items-center justify-between mb-8 pb-8 border-b border-border">
                         <div>
                            <p className="text-4xl font-black text-foreground mb-2">{worker.rating.toFixed(1)} / 5.0</p>
                            <div className="flex text-yellow-500">
                               {[1, 2, 3, 4, 5].map(s => <Star key={s} size={16} className={s <= Math.round(worker.rating) ? "fill-current" : "text-gray-200"} />)}
                            </div>
                         </div>
                         <div className="text-right">
                           <p className="text-xs font-black text-text-hint uppercase tracking-widest mb-1">{reviews.length} Verified Reviews</p>
                           <p className="text-xs font-bold text-emerald-500">100% Satisfaction Rate</p>
                         </div>
                       </div>

                       <div className="space-y-6">
                         {reviews.length > 0 ? reviews.map(r => (
                           <div key={r.id} className="bg-muted/20 rounded-[32px] p-8 border border-border hover:bg-white hover:shadow-xl transition-all duration-300">
                             <div className="flex items-center justify-between mb-6">
                               <div className="flex items-center gap-4">
                                 <CircularFrame src={r.user.profile_image} alt={r.user.full_name} size={48} />
                                 <div>
                                   <p className="font-bold text-sm text-foreground">{r.user.full_name}</p>
                                   <div className="flex text-yellow-500 transform scale-75 -ml-4">
                                      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className={s <= r.rating ? "fill-current" : "text-gray-200"} />)}
                                   </div>
                                 </div>
                               </div>
                               <span className="text-[10px] font-black text-text-hint uppercase tracking-widest">
                                 {new Date(r.created_at).toLocaleDateString()}
                               </span>
                             </div>
                             <p className="text-text-secondary leading-relaxed font-medium italic">"{r.comment}"</p>
                           </div>
                         )) : (
                           <div className="p-20 text-center bg-muted/20 border border-dashed border-border rounded-[40px]">
                              <MessageCircle className="mx-auto text-text-disabled mb-4 opacity-30" size={48} />
                              <p className="text-[10px] font-black text-text-hint uppercase tracking-widest">No reviews yet.</p>
                           </div>
                         )}
                       </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               {[
                 { icon: ShieldCheck, label: "Identity Verified" },
                 { icon: Globe, label: "Location Validated" },
                 { icon: Shield, label: "Secure Payment" },
                 { icon: Award, label: "Expert Vetted" }
               ].map((b, i) => (
                 <div key={i} className="p-8 bg-card rounded-[32px] border border-border text-center shadow-sm hover:shadow-lg transition-all">
                    <b.icon className="mx-auto text-primary mb-4" size={24} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-text-hint">{b.label}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-10 space-y-10">
               <motion.div 
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="bg-gray-900 rounded-[48px] p-10 md:p-12 relative overflow-hidden shadow-2xl"
               >
                 <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 blur-[80px] -translate-y-1/2 translate-x-1/2" />
                 
                 <div className="relative z-10 text-center mb-12">
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Starting At</p>
                   <div className="flex items-baseline justify-center gap-2">
                     <span className={`${unbounded.className} text-4xl font-black text-white`}>Rs. {worker.hourlyRate}</span>
                      <span className="text-white/40 font-black text-xs uppercase">/ Visit</span>
                   </div>
                 </div>

                 <div className="space-y-4">
                    {worker.verificationStatus === "VERIFIED" ? (
                      <button 
                        onClick={() => setIsBookingModalOpen(true)}
                        className="w-full py-6 bg-primary text-white font-black rounded-3xl hover:bg-primary-dark transition-all transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                      >
                        <Calendar size={18} />
                          <span className="text-[10px] uppercase tracking-[0.2em]">Book Now</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          const statusText = worker.verificationStatus === "PENDING" || worker.verificationStatus === "UNDER_REVIEW" 
                            ? (t("search.verificationInProgress") || "Verification in progress")
                            : (t("search.notVerified") || "Not verified");
                          showToast(t("search.verificationToast") || `This provider is not verified yet (${statusText})`, "error");
                        }}
                        className="w-full py-6 bg-gray-200 text-gray-500 cursor-not-allowed font-black rounded-3xl transition-all flex items-center justify-center gap-3"
                      >
                        <Calendar size={18} />
                          <span className="text-[10px] uppercase tracking-[0.2em]">Book Now</span>
                      </button>
                    )}
                    <Link 
                      href={user ? `/messages/${worker.userId}` : "/login"}
                      className="w-full py-6 bg-white/5 text-white font-black rounded-3xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-3"
                    >
                      <MessageCircle size={18} />
                        <span className="text-[10px] uppercase tracking-[0.2em]">Message Provider</span>
                    </Link>
                 </div>

                 <div className="mt-12 pt-12 border-t border-white/10 space-y-6">
                    <div className="flex items-center gap-4 text-white/50">
                       <ShieldCheck className="text-emerald-500" size={18} />
                        <span className="text-xs font-bold">Secure Payment Guarantee</span>
                    </div>
                    <div className="flex items-center gap-4 text-white/50">
                       <CheckCircle2 className="text-emerald-500" size={18} />
                       <span className="text-xs font-bold">Satisfaction Guaranteed</span>
                    </div>
                    <div className="flex items-center gap-4 text-white/50">
                       <Clock className="text-emerald-500" size={18} />
                        <span className="text-xs font-bold">24/7 Priority Support</span>
                    </div>
                 </div>
               </motion.div>

               <div className="bg-card rounded-[40px] p-10 border border-border shadow-sm">
                  <h4 className={`${unbounded.className} text-[10px] font-black text-text-hint uppercase tracking-[0.2em] mb-8`}>Professional Performance</h4>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl border border-border">
                       <span className="text-[10px] font-black text-text-hint uppercase tracking-widest">Success Rate</span>
                       <span className="text-xs font-black text-emerald-500">98.4%</span>
                    </div>
                    <div className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl border border-border">
                       <span className="text-[10px] font-black text-text-hint uppercase tracking-widest">Return Rate</span>
                       <span className="text-xs font-black text-foreground">12.5%</span>
                    </div>
                    <div className="flex justify-between items-center bg-muted/30 p-4 rounded-2xl border border-border">
                       <span className="text-[10px] font-black text-text-hint uppercase tracking-widest">Avg. Response Time</span>
                       <span className="text-xs font-black text-foreground">&lt; 15 min</span>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

       <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        providerName={worker.name}
        providerId={worker.id}
        services={worker.services}
      />
    </div>
  );
}
