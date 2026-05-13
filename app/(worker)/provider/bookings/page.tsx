"use client";

import { useState, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  MapPin,
  ChevronRight,
  Filter,
  Search,
  Briefcase,
  Layers,
  Zap,
  CheckCircle2,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { unbounded } from "@/app/fonts";
import { supabase } from "@/services/supabase";
import { useUser } from "@/contexts/UserContext";
import { useUI } from "@/contexts/UIContext";
import { useTranslation } from "@/hooks/useTranslation";
import PageHeader from "@/components/PageHeader";
import { Skeleton } from "@/components/Skeleton";

const statusConfig: any = {
  PENDING: { icon: Clock, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", labelKey: "provider.jobs.jobReceived" },
  ACCEPTED: { icon: CheckCircle2, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", labelKey: "provider.jobs.jobConfirmed" },
  IN_PROGRESS: { icon: Zap, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", labelKey: "provider.jobs.jobWorking" },
  COMPLETED: { icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", labelKey: "provider.jobs.jobFinished" },
  CANCELLED: { icon: XCircle, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", labelKey: "provider.jobs.jobDeclined" },
};

// --- DB Data Transformation ---
// Map DB enum values (Prisma) to frontend status keys
const dbStatusToFrontend: Record<string, string> = {
  'requested': 'PENDING',
  'accepted': 'ACCEPTED',
  'inprogress': 'IN_PROGRESS',
  'completed': 'COMPLETED',
  'cancelled': 'CANCELLED',
};

const transformJobData = (b: any) => {
  const rawStatus = (b.booking_status || b.status || '').toLowerCase().replace(/[_\s]/g, '');
  const frontendStatus = dbStatusToFrontend[rawStatus] || rawStatus.toUpperCase();
  return {
    id: b.id,
    service: b.service?.title || b.service?.name || "Specialized Task",
    consumer: b.consumer?.full_name || b.consumer?.name || "Assigned Client",
    status: frontendStatus,
    date: new Date(b.scheduled_date || b.scheduledAt || b.created_at).toLocaleDateString() + ", " + new Date(b.scheduled_date || b.scheduledAt || b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: Number(b.total_price || b.totalPrice || 0),
    address: b.location || "On-site Deployment",
    consumerAvatar: b.consumer?.profile_image || b.consumer?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.id}`
  };
};

function ProviderJobsPageContent() {
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter");
  const { user } = useUser();
  const { showToast } = useUI();
  const { t, isRTL } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [dbJobs, setDbJobs] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState([
    { label: "Active", value: "00", color: "text-blue-600", bg: "bg-blue-50", icon: Briefcase, key: "provider.jobs.activeJobs" },
    { label: "Pending", value: "00", color: "text-amber-600", bg: "bg-amber-50", icon: Clock, key: "provider.jobs.pendingJobs" },
    { label: "Finished", value: "00", color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2, key: "provider.jobs.finishedJobs" },
  ]);

  useEffect(() => {
    if (user?.id) {
      fetchJobs();

      // Real-time subscription for new/updated bookings
      const channel = supabase
        .channel('provider-jobs-realtime')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `provider_id=eq.${user.id}`,
        }, () => {
          fetchJobs(); // Re-fetch on any booking change
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  async function fetchJobs() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bookings?role=provider");
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to fetch bookings");
      }
      
      const data = json.data || [];
      const formatted = data.map((b: any) => ({
        ...transformJobData(b),
        consumer: b.customer?.name || "Client",
        address: b.location || "On-site Deployment",
        consumerAvatar: b.customer?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.id}`
      }));
      setDbJobs(formatted);

      // Update local stats
      const activeCount = formatted.filter((j: any) => ['ACCEPTED', 'IN_PROGRESS', 'ARRIVED'].includes(j.status)).length;
      const pendingCount = formatted.filter((j: any) => j.status === 'PENDING').length;
      const finishedCount = formatted.filter((j: any) => j.status === 'COMPLETED').length;

      setStats([
        { label: "Active", value: String(activeCount).padStart(2, '0'), color: "text-blue-600", bg: "bg-blue-50", icon: Briefcase, key: "provider.jobs.activeJobs" },
        { label: "Pending", value: String(pendingCount).padStart(2, '0'), color: "text-amber-600", bg: "bg-amber-50", icon: Clock, key: "provider.jobs.pendingJobs" },
        { label: "Finished", value: String(finishedCount), color: "text-emerald-600", bg: "bg-emerald-50", icon: CheckCircle2, key: "provider.jobs.finishedJobs" },
      ]);

    } catch (err: any) {
      showToast("Data Relay Interrupted: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (urlFilter) {
      setActiveFilter(urlFilter.toUpperCase());
    }
  }, [urlFilter]);

  const filteredJobs = dbJobs.filter(job => {
    const matchesFilter = activeFilter === "All" || job.status === activeFilter;
    const matchesSearch = job.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.consumer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background p-6 lg:p-6 md:p-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <PageHeader 
          title={t("provider.jobs.managerTitle").split(" ")[0]}
          highlightedText={t("provider.jobs.managerTitle").split(" ")[1] || "Manager"}
          subtitle={t("provider.jobs.managerDesc")}
          actions={
            <div className="relative group">
              <Search className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-hint group-focus-within:text-primary transition-colors duration-300`} />
              <input
                type="text"
                placeholder={t("provider.jobs.searchJobs")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isRTL ? "pr-12 pl-6" : "pl-12 pr-6"} py-4 bg-card border border-border/60 rounded-2xl text-sm font-bold w-64 md:w-80 focus:ring-4 focus:ring-primary/10 focus:border-primary/40 transition-all outline-none shadow-sm hover:shadow-md`}
              />
            </div>
          }
        />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-6 rounded-[32px] border border-border shadow-sm flex items-center justify-between group hover:shadow-sm border border-border hover:shadow-md hover:shadow-gray-200/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <stat.icon size={26} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-hint mb-1">{t(stat.key)}</p>
                  <h3 className={`${unbounded.className} text-2xl font-black text-foreground`}>{stat.value}</h3>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-text-disabled group-hover:text-primary transition-colors">
                <ChevronRight size={18} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-card p-2 rounded-2xl border border-border shadow-sm inline-flex flex-wrap gap-1 mb-10">
          {["All", "PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeFilter === filter
                ? "bg-gray-900 text-white shadow-lg"
                : "text-text-hint hover:text-text-secondary hover:bg-muted"
                }`}
            >
              {filter === "All" ? t("history.all") : t(`status.${filter.toLowerCase()}`)}
            </button>
          ))}
        </div>

        {/* Job Grid / List */}
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
               <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="col-span-full space-y-6">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="bg-card rounded-2xl border border-border p-8 flex flex-col lg:flex-row justify-between gap-8 shadow-sm">
                      <div className="flex-1 space-y-6">
                         <div className="flex items-center gap-3">
                           <Skeleton className="w-24 h-6 rounded-full" />
                           <Skeleton className="w-16 h-4 rounded-md" />
                         </div>
                         <Skeleton className="w-3/4 h-8 rounded-lg" />
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1,2,3].map(j => (
                              <div key={j} className="flex gap-3">
                                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton className="w-16 h-3 rounded-md" />
                                  <Skeleton className="w-24 h-4 rounded-md" />
                                </div>
                              </div>
                            ))}
                         </div>
                      </div>
                      <div className="lg:w-48 flex flex-row lg:flex-col justify-between items-center lg:items-end border-t lg:border-t-0 lg:border-l border-border/50 pt-8 lg:pt-0 lg:pl-8">
                         <div className="space-y-2 text-right">
                           <Skeleton className="w-20 h-3 rounded-md ml-auto" />
                           <Skeleton className="w-24 h-6 rounded-md ml-auto" />
                         </div>
                         <Skeleton className="w-32 h-10 rounded-xl" />
                      </div>
                   </div>
                 ))}
               </motion.div>
            ) : filteredJobs.length > 0 ? filteredJobs.map((job, index) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="group bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/20 hover:shadow-md border border-border/50 hover:shadow-lg hover:shadow-gray-200/50 transition-all"
              >
                <Link href={`/provider/bookings/${job.id}`} className="block p-8">
                  <div className="flex flex-col lg:flex-row justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${statusConfig[job.status as keyof typeof statusConfig].bg} ${statusConfig[job.status as keyof typeof statusConfig].color} ${statusConfig[job.status as keyof typeof statusConfig].border} flex items-center gap-2`}>
                          {(() => {
                            const Icon = statusConfig[job.status as keyof typeof statusConfig].icon;
                            return <Icon size={12} />;
                          })()}
                          {t(statusConfig[job.status as keyof typeof statusConfig].labelKey)}
                        </div>
                        <span className="text-[10px] font-black text-text-disabled uppercase tracking-widest">ID: #{job.id.split('-')[1]}</span>
                      </div>

                      <h3 className={`${unbounded.className} text-xl font-black text-foreground mb-6 group-hover:text-primary transition-colors`}>
                        {job.service}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-text-hint">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-text-disabled uppercase tracking-widest mb-0.5">{t("provider.jobs.customer")}</p>
                            <p className="text-xs font-bold text-foreground">{job.consumer}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-text-hint">
                            <Calendar size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-text-disabled uppercase tracking-widest mb-0.5">{t("provider.jobs.appointment")}</p>
                            <p className="text-xs font-bold text-foreground">{job.date}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-text-hint">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-text-disabled uppercase tracking-widest mb-0.5">{t("provider.jobs.location")}</p>
                            <p className="text-xs font-bold text-foreground truncate max-w-[150px]">{job.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:w-48 flex flex-row lg:flex-col justify-between items-center lg:items-end border-t lg:border-t-0 lg:border-l border-gray-50 pt-8 lg:pt-0 lg:pl-8">
                      <div className={`text-left lg:${isRTL ? "text-left" : "text-right"} mb-4`}>
                        <p className="text-[9px] font-black text-text-disabled uppercase tracking-widest mb-1">{t("provider.jobs.estimatedPayout")}</p>
                        <p className={`${unbounded.className} text-2xl font-black text-foreground group-hover:text-primary transition-colors`}>
                          Rs. {job.price.toLocaleString()}
                        </p>
                      </div>

                      <button className="flex items-center gap-2 group/btn px-6 py-3 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all active:scale-95 transition-all duration-200">
                        {t("history.details")}
                        <ChevronRight size={14} className={`group-hover/btn:${isRTL ? "-translate-x-1" : "translate-x-1"} transition-transform`} />
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-24 text-center bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                  <Layers size={40} />
                </div>
                <h3 className={`${unbounded.className} text-xl font-black text-foreground mb-2`}>{t("history.noBookings")}</h3>
                <p className="text-text-hint font-medium">{t("history.noBookingsDesc")}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function ProviderJobsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    }>
      <ProviderJobsPageContent />
    </Suspense>
  );
}
