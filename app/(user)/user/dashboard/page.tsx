"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  Star, 
  MapPin, 
  Calendar, 
  Zap, 
  Search, 
  ArrowRight, 
  TrendingUp, 
  AlertCircle,
  PackageOpen,
  UserCircle,
  Headphones
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { unbounded } from '@/app/fonts';
import { useTranslation } from '@/hooks/useTranslation';
import { useUser } from '@/contexts/UserContext';
import { useUI } from '@/contexts/UIContext';
import SocialMediaIcons from '@/components/SocialMediaIcons';
import CircularFrame from '@/components/CircularFrame';
import { supabase } from '@/services/supabase';
import { SERVICE_CATEGORIES } from "@/constants/services";
import PageHeader from '@/components/PageHeader';

export default function UserDashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: userLoading } = useUser();
  const { showToast } = useUI();

  const [isLoading, setIsLoading] = React.useState(true);
  const [activeRequests, setActiveRequests] = React.useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = React.useState({ totalBookings: 0, pendingReviews: 0, totalSpent: 0 });
  const [featuredData, setFeaturedData] = React.useState<any>(null);

  React.useEffect(() => {
    if (user?.id) {
      fetchDashboardData();

      const channel = supabase
        .channel(`user-bookings-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'Booking', filter: `user_id=eq.${user.id}` },
          () => fetchDashboardData(true)
        )
        .subscribe();

      // Fallback Polling Mechanism (Every 30 seconds)
      const pollInterval = setInterval(() => {
        fetchDashboardData(true);
      }, 30000);

      return () => { 
        clearInterval(pollInterval);
        supabase.removeChannel(channel); 
      };
    } else if (!userLoading) {
      setIsLoading(false);
    }
  }, [user, userLoading]);

  async function fetchDashboardData(silent: boolean = false) {
    if (!silent) setIsLoading(true);
    try {
      // 1. Fetch Bookings
      const res = await fetch("/api/bookings?role=customer");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch bookings");

      const active = (json.data || []).filter((b: any) => 
        ['Requested', 'Accepted', 'InProgress', 'Arrived'].includes(b.status)
      ).map((b: any) => ({
        id: b.id,
        provider: b.provider?.user?.name || "Assigned Pro",
        service: b.service?.name || "Specialized Task",
        status: b.status.toUpperCase(),
        date: b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString() : "TBD",
        price: `${t("common.currency")} ${b.totalPrice?.toLocaleString() || 0}`,
        avatar: b.provider?.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.id}`,
      }));
      setActiveRequests(active);

      // 2. Fetch Stats
      const statsRes = await fetch("/api/user/dashboard/stats");
      const statsJson = await statsRes.json();
      if (statsJson.success) setDashboardStats(statsJson.data);

      // 3. Fetch Featured
      const featRes = await fetch("/api/user/dashboard/featured");
      const featJson = await featRes.json();
      if (featJson.success) setFeaturedData(featJson.data);

    } catch (err: any) {
      // Intentionally silent for clean UI
    } finally {
      setIsLoading(false);
    }
  }

  // 1. Mobile-First Structure Setup
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-28 pt-4 md:pt-8 space-y-8 md:space-y-12">
      
      <div className="hidden md:block">
         <h1 className={`${unbounded.className} text-3xl font-black text-foreground`}>
           {t("dashboard.hello")}{" "}
           <span className="text-primary">{user?.firstName || "User"}</span>
         </h1>
      </div>

      {/* 3. Search / Action Area */}
      <div className="relative group cursor-pointer" onClick={() => router.push('/search')}>
         <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[28px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
         <div className="relative bg-white dark:bg-gray-900 border border-border/80 rounded-[24px] shadow-sm flex items-center p-2 group-hover:border-primary/30 transition-all duration-300">
            <div className="w-14 h-14 flex items-center justify-center shrink-0">
               <Search size={22} className="text-text-hint group-hover:text-primary transition-colors" />
            </div>
            <div className="flex-1 text-sm font-medium text-text-hint">
               What service do you need today?
            </div>
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-md">
               <ArrowRight size={20} />
            </div>
         </div>
      </div>

      {/* 4. Categories / Services Grid */}
      <section>
         <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-foreground">Categories</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-text-hint">{SERVICE_CATEGORIES.length} Services Available</span>
         </div>
         <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-4 md:gap-6">
            {SERVICE_CATEGORIES.map(cat => (
               <Link 
                 href={`/search?category=${cat.id}`} 
                 key={cat.id} 
                 className="flex flex-col items-center gap-3 group transition-all"
               >
                  <div className="w-full aspect-square rounded-[24px] sm:rounded-[32px] bg-card border border-border flex items-center justify-center text-2xl sm:text-3xl transition-all duration-300 group-hover:scale-105 group-hover:-rotate-6 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/20">
                     {cat.emoji}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.1em] text-center text-text-secondary group-hover:text-primary transition-colors line-clamp-2 px-1">
                    {t(cat.nameKey)}
                  </span>
               </Link>
            ))}
         </div>
      </section>

      {/* 5. Featured / Recommended Section */}
      <AnimatePresence mode="wait">
        {isLoading && !featuredData ? (
          <motion.section 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="bg-card rounded-[32px] p-6 md:p-8 relative overflow-hidden border border-border"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 w-full max-w-sm">
                 <Skeleton className="h-6 w-24 rounded-full" />
                 <Skeleton className="h-8 w-3/4 rounded-lg" />
                 <Skeleton className="h-4 w-full rounded-md" />
                 <Skeleton className="h-4 w-5/6 rounded-md" />
              </div>
              <Skeleton className="h-12 w-32 rounded-2xl shrink-0" />
            </div>
          </motion.section>
        ) : featuredData ? (
          <motion.section 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary to-accent rounded-[32px] p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-primary/10"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] pointer-events-none rounded-full" />
             <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                   <div className="px-3 py-1 bg-white/10 rounded-full w-fit text-[9px] font-black uppercase tracking-widest mb-3 backdrop-blur-sm border border-white/10">
                     {featuredData.type === 'PROVIDER' ? 'Top Rated Pro' : 'Recommended'}
                   </div>
                   <h3 className={`${unbounded.className} text-2xl font-black mb-2`}>{featuredData.title}</h3>
                   <p className="text-white/80 text-xs font-medium max-w-sm leading-relaxed">{featuredData.description}</p>
                </div>
                <button 
                  onClick={() => router.push(featuredData.actionUrl)} 
                  className="px-6 py-3.5 bg-white text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 shadow-xl shadow-black/10 shrink-0"
                >
                   Book Now
                </button>
             </div>
          </motion.section>
        ) : (
          <motion.section 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-primary to-accent rounded-[32px] p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-primary/10"
          >
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] pointer-events-none rounded-full" />
             <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                   <div className="px-3 py-1 bg-white/10 rounded-full w-fit text-[9px] font-black uppercase tracking-widest mb-3 backdrop-blur-sm border border-white/10">Featured</div>
                   <h3 className={`${unbounded.className} text-2xl font-black mb-2`}>Emergency Plumbing</h3>
                   <p className="text-white/80 text-xs font-medium max-w-sm leading-relaxed">Top-rated professionals available within 30 minutes in your locality.</p>
                </div>
                <button onClick={() => router.push('/search?category=plumbing')} className="px-6 py-3.5 bg-white text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 shadow-xl shadow-black/10 shrink-0">
                   Book Now
                </button>
             </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* 6. Recent Activity / Bookings */}
      <section>
         <div className="flex items-center gap-3 mb-6 px-1">
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-foreground">Recent Activity</h3>
            {activeRequests.length > 0 && <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">{activeRequests.length}</span>}
         </div>
         
         <div className="space-y-4">
            <AnimatePresence mode="wait">
               {isLoading ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="bg-card border border-border rounded-[28px] p-5 flex items-center gap-5 shadow-sm">
                         <Skeleton className="w-14 h-14 rounded-full shrink-0" />
                         <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-1/3 rounded-md" />
                            <Skeleton className="h-3 w-1/4 rounded-md" />
                            <Skeleton className="h-3 w-1/5 rounded-md" />
                         </div>
                       </div>
                     ))}
                  </motion.div>
                ) : activeRequests.length === 0 ? (
                   <div className="py-10">
                      <EmptyState 
                        icon={PackageOpen}
                        title="No Active Bookings"
                        description="Find a professional and get your tasks done efficiently."
                        actionText="Explore Services"
                        onAction={() => router.push('/search')}
                      />
                   </div>
                ) : (
                  activeRequests.map((req, i) => (
                     <motion.div 
                        key={req.id} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: i * 0.05 }} 
                        className="bg-card border border-border rounded-[28px] p-5 flex items-center gap-5 hover:border-primary/30 transition-all shadow-sm cursor-pointer"
                        onClick={() => router.push(`/user/booking/${req.id}`)}
                     >
                        <CircularFrame src={req.avatar} size={56} className="shrink-0" alt={req.provider || "Provider"} />
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center justify-between mb-1 gap-2">
                              <h4 className="font-bold text-sm text-foreground truncate">{req.service}</h4>
                              <span className={`shrink-0 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${req.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{req.status}</span>
                           </div>
                           <p className="text-[11px] font-medium text-text-hint truncate mb-2">{req.provider}</p>
                           <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                              <span className="flex items-center gap-1 text-primary"><Calendar size={12}/> {req.date}</span>
                              <span className="text-accent">{req.price}</span>
                           </div>
                        </div>
                     </motion.div>
                  ))
                )}
             </AnimatePresence>
          </div>
       </section>

    </div>
  );
}
