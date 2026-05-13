"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Banknote,
  Briefcase,
  Star,
  TrendingUp,
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Zap,
  MapPin,
  ShieldCheck,
  X,
  Plus,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { unbounded } from '@/app/fonts';
import ConnectSection from '@/components/ConnectSection';
import { useTranslation } from '@/hooks/useTranslation';
import { useAdmin } from '@/contexts/AdminContext';
import { useRouter } from 'next/navigation';
import { useUI } from '@/contexts/UIContext';
import CircularFrame from '@/components/CircularFrame';
import { supabase } from '@/services/supabase';
import { Skeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';

function ProviderJobSkeleton() {
  return (
    <div className="bg-card p-8 rounded-2xl border border-border space-y-6">
      <div className="flex gap-6 items-start">
         <Skeleton className="w-16 h-16 rounded-full shrink-0" />
         <div className="flex-1 space-y-4">
            <div className="flex justify-between items-center"><Skeleton className="h-6 w-40" /><Skeleton className="h-4 w-20 rounded-full" /></div>
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-4"><Skeleton className="h-8 w-full rounded-xl" /><Skeleton className="h-8 w-full rounded-xl" /></div>
         </div>
      </div>
    </div>
  );
}

export default function ProviderDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const { admin } = useAdmin();
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const { showToast } = useUI();

  // Dashboard Header display name
  const displayName = userLoading 
    ? "Loading..." 
    : user 
      ? (user.firstName + (user.lastName ? ` ${user.lastName}` : "")) 
      : t("dashboard.partner");

  React.useEffect(() => {
    // Admin override
    if (admin) {
      router.replace('/admin/dashboard');
      return;
    }

    // Provider Verification Guard
    if (!userLoading && user) {
      if (user.role === "PROVIDER") {
        if (user.idVerificationStatus === "NOT_STARTED") {
          router.replace('/provider/onboarding');
        } else if (user.idVerificationStatus === "REJECTED") {
          router.replace('/provider/verify');
        }
      }
    } else if (!userLoading && !user) {
      router.replace('/login');
    }
  }, [admin, user, userLoading, router]);

  const [isLoading, setIsLoading] = useState(true);
  const [dbJobs, setDbJobs] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'requests' | 'active'>('requests');
  const [serviceNotifications, setServiceNotifications] = useState<any[]>([]);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);

  React.useEffect(() => {
    if (user?.id) {
      fetchDashboardData();
      
      const channel = supabase
        .channel(`provider-bookings-${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'bookings',
          filter: `provider_id=eq.${user.id}` 
        }, () => {
          fetchDashboardData(true);
        })
        .subscribe();

      // Fallback Polling Mechanism (Every 30 seconds)
      const pollInterval = setInterval(() => {
        fetchDashboardData(true);
      }, 30000);

      return () => {
        clearInterval(pollInterval);
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchDashboardData = async (silent: boolean = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await fetch("/api/bookings?role=provider");
      const json = await res.json();

      if (!json.success) throw new Error(json.error || "Failed to fetch bookings");

      const bookings = json.data || [];

      const pending = bookings.filter((b: any) => b.status === 'Requested').map(transformBookingData);
      const active = bookings.filter((b: any) => ['Accepted', 'InProgress'].includes(b.status)).map(transformBookingData);
      
      setDbJobs(pending);
      setActiveJobs(active);

      // Fetch Provider Stats
      const statsRes = await fetch("/api/provider/profile");
      const statsJson = await statsRes.json();
      
      const providerProfile = statsJson.data || {};
      const completed = bookings.filter((b: any) => b.status === 'Completed');
      const earnings = providerProfile.totalEarnings || 0;
      const rating = providerProfile.rating || 5.0;
      const reviewsCount = providerProfile.ratingCount || 0;
      
      const successRate = 100; // Simplified for now

      setStats([
        { label: t("dashboard.totalEarnings"), value: `${t("common.currency")} ${earnings.toLocaleString()}`, subValue: t("dashboard.jobsTotal", { count: completed.length }), icon: Banknote, color: "text-green-600", bg: "bg-green-50" },
        { label: t("dashboard.activeJobs"), value: String(active.length).padStart(2, '0'), subValue: t("dashboard.requestedCount", { count: pending.length }), icon: Briefcase, color: "text-primary", bg: "bg-primary/5" },
        { label: t("dashboard.avgRating"), value: Number(rating).toFixed(1), subValue: t("dashboard.reviewsDesc", { count: reviewsCount }), icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
        { label: t("dashboard.successRate"), value: `${successRate}%`, subValue: t("dashboard.highReliability"), icon: Zap, color: "text-accent", bg: "bg-accent-soft" },
      ]);

    } catch (error: any) {
      showToast("Sync Error: " + error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const transformBookingData = (b: any) => ({
    id: b.id,
    consumerId: b.userId,
    service: b.service?.name || "Specialized Task",
    consumer: b.customer?.name || "Client",
    date: b.scheduledAt ? (new Date(b.scheduledAt).toLocaleDateString() + ' ' + new Date(b.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})) : "TBD",
    location: b.location || "Client Location",
    price: `${t("common.currency")} ${Number(b.totalPrice).toLocaleString()}`,
    status: b.status.toUpperCase(),
    avatar: b.customer?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.id}`,
    startedAt: b.updatedAt ? new Date(b.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "---"
  });

  const handleJobAction = async (bookingId: string, action: 'accept' | 'decline') => {
    setProcessingJobId(bookingId);
    try {
      const newStatus = action === 'accept' ? 'Accepted' : 'Cancelled';
      const res = await fetch("/api/bookings/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus })
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Action failed");

      showToast(action === 'accept' ? "Job Accepted" : "Request Declined", action === 'accept' ? "success" : "error");
      await fetchDashboardData();
    } catch (error: any) {
      showToast("Action Failed: " + error.message, "error");
    } finally {
      setProcessingJobId(null);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/bookings/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus })
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Update failed");

      showToast(`Status Updated: ${newStatus}`, "success");
      fetchDashboardData();
    } catch (error: any) {
      showToast("Status Update Failed: " + error.message, "error");
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto w-full px-4 md:px-8 pb-20">
        <PageHeader 
          title={t("dashboard.welcome")}
          highlightedText={displayName}
          subtitle={userLoading 
            ? "Accessing provider grid..." 
            : dbJobs.length > 0 
              ? t("dashboard.newAppointments", { count: dbJobs.length }) 
              : ""}
          actions={
            <div className="flex flex-wrap gap-4 mt-4 lg:mt-0">
              <Link href="/provider/services/add" className="btn-secondary">
                <Plus size={18} />
                Add Service
              </Link>
              <Link href="/provider/bookings" className="btn-primary group">
                Jobs Feed 
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          }
        />

        {/* KYC Status Banners */}
        {(user?.idVerificationStatus === "PENDING" || user?.idVerificationStatus === "UNDER_REVIEW") && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl mb-8 flex items-start gap-4 shadow-sm">
             <AlertCircle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
             <div>
               <h4 className="font-black text-sm uppercase tracking-widest mb-1">Account Pending Approval</h4>
               <p className="text-xs font-medium">Your KYC is under review. You cannot receive bookings yet.</p>
             </div>
          </div>
        )}

        {user?.idVerificationStatus === "REJECTED" && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl mb-8 flex items-start gap-4 shadow-sm">
             <X className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
             <div>
               <h4 className="font-black text-sm uppercase tracking-widest mb-1">Account Rejected</h4>
               <p className="text-xs font-medium">Your KYC was rejected. {user.rejectionReason && <span className="font-black">Reason: {user.rejectionReason}</span>}</p>
               <Link href="/provider/verify" className="text-xs font-black uppercase text-red-600 hover:underline mt-2 inline-block">Re-submit Documents</Link>
             </div>
          </div>
        )}

        {user?.idVerificationStatus === "VERIFIED" && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl mb-8 flex items-start gap-4 shadow-sm">
             <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
             <div>
               <h4 className="font-black text-sm uppercase tracking-widest mb-1">Account Verified</h4>
               <p className="text-xs font-medium">You are verified. You can now receive bookings.</p>
             </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          <AnimatePresence mode="wait">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <motion.div 
                  key={`skeleton-${i}`} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="bg-card p-6 md:p-8 rounded-3xl border border-border/50 space-y-4 shadow-sm"
                >
                   <Skeleton className="h-4 w-24" />
                   <Skeleton className="h-8 w-32" />
                   <Skeleton className="h-3 w-20" />
                </motion.div>
              ))
            ) : stats.map((stat, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }} 
              className="card-minimal !p-6 md:!p-8 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`w-12 h-12 md:w-14 md:h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 group-hover:scale-110 transition-all duration-300 shadow-sm shadow-black/[0.02]`}>
                <stat.icon size={24} className="md:size-[28px]" />
              </div>
              <p className="text-text-hint text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <h3 className={`${unbounded.className} text-xl md:text-2xl font-black text-foreground mb-2`}>{stat.value}</h3>
              <p className={`text-[10px] md:text-[11px] font-bold ${stat.color} uppercase tracking-tighter opacity-80`}>{stat.subValue}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-card border border-border/50 rounded-[40px] p-6 md:p-10 shadow-sm">
              <div className="flex items-center gap-8 border-b border-border/40 mb-8 overflow-x-auto no-scrollbar">
                {['requests', 'active'].map((tab) => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab as any)}
                    className={`pb-4 text-xs font-black uppercase tracking-[0.15em] transition-all relative whitespace-nowrap ${activeTab === tab ? 'text-primary' : 'text-text-hint/60 hover:text-text-hint'}`}
                  >
                    {tab === 'requests' ? t("dashboard.jobRequests") : t("dashboard.activeJobs")}
                    {activeTab === tab && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary),0.3)]" />}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                       <ProviderJobSkeleton />
                       <ProviderJobSkeleton />
                    </motion.div>
                  ) : (activeTab === 'requests' ? dbJobs : activeJobs).length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {(activeTab === 'requests' ? dbJobs : activeJobs).map((job: any, i: number) => (
                        <motion.div 
                          key={job.id} 
                          initial={{ opacity: 0, x: -10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          transition={{ delay: i * 0.05 }}
                          className="p-6 md:p-8 bg-muted/20 dark:bg-white/5 rounded-3xl border border-transparent hover:border-primary/20 hover:bg-white dark:hover:bg-primary/5 transition-all duration-300 flex flex-col md:flex-row gap-6 md:gap-8 items-center group shadow-sm hover:shadow-xl hover:shadow-primary/5"
                        >
                          <div className="relative shrink-0">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-primary/20 to-accent/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CircularFrame src={job.avatar} alt={job.consumer} size={64} className="relative z-10 border-2 border-white shadow-md" />
                          </div>

                          <div className="flex-1 text-center md:text-left min-w-0">
                             <h4 className={`${unbounded.className} text-lg md:text-xl font-bold mb-1 truncate`}>{job.service}</h4>
                             <p className="text-[11px] font-black text-text-hint uppercase tracking-widest mb-4">
                               {job.consumer} <span className="mx-2 opacity-30">•</span> <span className="text-primary">{job.price}</span>
                             </p>
                             <div className="flex flex-wrap justify-center md:justify-start gap-4 text-[10px] font-black text-text-hint/80 uppercase tracking-tighter">
                               <span className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-xl border border-border/40 shadow-sm hover:border-primary/30 transition-colors"><Calendar size={12} className="text-primary" /> {job.date}</span>
                               <span className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-xl border border-border/40 shadow-sm hover:border-primary/30 transition-colors"><MapPin size={12} className="text-primary" /> {job.location}</span>
                             </div>
                          </div>

                          <div className="flex flex-row md:flex-col lg:flex-row gap-3 w-full md:w-auto">
                             {activeTab === 'requests' ? (
                               <>
                                 <button 
                                   onClick={() => handleJobAction(job.id, 'accept')} 
                                   disabled={!!processingJobId || user?.idVerificationStatus === "PENDING"}
                                   className={`flex-1 lg:flex-none h-12 px-6 ${user?.idVerificationStatus === "PENDING" ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary hover:shadow-xl hover:shadow-primary/20 active:scale-95'} text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2`}
                                 >
                                   {processingJobId === job.id ? <Loader2 size={14} className="animate-spin" /> : null}
                                   {processingJobId === job.id ? "Syncing..." : "Accept"}
                                 </button>
                                 <button 
                                   onClick={() => handleJobAction(job.id, 'decline')} 
                                   disabled={!!processingJobId}
                                   className="flex-1 lg:flex-none h-12 px-6 bg-white border border-border text-text-hint text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all flex items-center justify-center gap-2"
                                 >
                                   Decline
                                 </button>
                               </>
                             ) : (
                               <Link 
                                 href={`/messages`} 
                                 className="w-full lg:w-32 h-12 flex items-center justify-center bg-foreground text-background text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary transition-all active:scale-95 shadow-lg shadow-black/5"
                               >
                                 Open Chat
                               </Link>
                             )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div key="empty" className="py-12">
                      <EmptyState 
                        icon={Briefcase}
                        title="Quiet at the moment"
                        description="You don't have any active jobs or requests right now. Ensure your services are active to get discovered."
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>

          <aside className="space-y-8">
             <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-gray-950 rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl shadow-primary/10"
             >
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[100px] pointer-events-none" />
                <div className="relative z-10">
                   <p className="text-[10px] md:text-[11px] font-black text-white/40 uppercase tracking-[0.15em] mb-4">{t("dashboard.totalBalance")}</p>
                   <h2 className={`${unbounded.className} text-4xl md:text-5xl font-black mb-10 tracking-tight`}>
                     <span className="text-primary text-2xl mr-2">{t("common.currency")}</span>
                     {stats.find(s => s.label === t("dashboard.totalEarnings"))?.value.split(' ')[1] || '0'}
                   </h2>
                   
                   <div className="space-y-4 mb-12">
                      <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-bold opacity-40 uppercase tracking-tight">{t("dashboard.jobsCompleted")}</span>
                        <span className="text-sm font-black text-white group-hover:text-primary transition-colors">{stats.find(s => s.label === t("dashboard.totalEarnings"))?.subValue.split(' ')[0] || '0'}</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                        <span className="text-[10px] font-bold opacity-40 uppercase tracking-tight">Performance Score</span>
                        <span className="text-[11px] font-black text-emerald-400">100% EXCELLENT</span>
                      </div>
                   </div>

                   <Link href="/provider/earnings" className="block">
                    <button className="w-full py-5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-white hover:text-gray-950 hover:shadow-2xl transition-all duration-300 active:scale-[0.98]">
                      {t("dashboard.withdrawEarnings")}
                    </button>
                   </Link>
                </div>
             </motion.div>

             <div className="p-8 bg-accent/5 border border-accent/20 rounded-[40px] relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/10 blur-3xl rounded-full" />
                <ShieldCheck className="w-8 h-8 text-accent mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="text-sm font-black text-foreground mb-2">Verification Active</h4>
                <p className="text-xs font-bold text-text-hint leading-relaxed uppercase tracking-tighter">Your professional profile is verified for standard operations.</p>
             </div>
          </aside>
        </div>
      </div>
  );
}
