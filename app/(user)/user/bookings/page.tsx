"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, CheckCircle, XCircle, Calendar, Briefcase, 
  Search, ArrowRight, CreditCard,
  Zap, AlertCircle, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/services/supabase";
import { useUser } from "@/contexts/UserContext";
import { useUI } from "@/contexts/UIContext";
import { unbounded } from "@/app/fonts";
import { useTranslation } from "@/hooks/useTranslation";
import { Skeleton } from "@/components/Skeleton";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";

const statusConfig: any = {
  PENDING: { icon: Clock, color: "text-amber-500 bg-amber-50 border-amber-100", label: "Pending Review" },
  ACCEPTED: { icon: ShieldCheck, color: "text-blue-500 bg-blue-50 border-blue-100", label: "Confirmed" },
  IN_PROGRESS: { icon: Zap, color: "text-purple-500 bg-purple-50 border-purple-100", label: "In Progress" },
  COMPLETED: { icon: CheckCircle, color: "text-emerald-500 bg-emerald-50 border-emerald-100", label: "Finalized" },
  CANCELLED: { icon: XCircle, color: "text-red-500 bg-red-50 border-red-100", label: "Dismissed" },
};

function RequestCardSkeleton() {
  return (
    <div className="bg-card rounded-[32px] p-8 border border-border animate-pulse">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex-1 space-y-6">
          <div className="flex gap-3"><Skeleton className="h-6 w-24 rounded-full" /><Skeleton className="h-6 w-16 rounded-full" /></div>
          <div className="space-y-4">
             <Skeleton className="h-8 w-1/2" />
             <div className="flex gap-4"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" /></div>
          </div>
        </div>
        <div className="flex items-center gap-10 w-full md:w-auto pt-6 md:pt-0 border-t md:border-t-0 border-border">
          <div className="space-y-2 text-right flex-1 md:flex-none">
             <Skeleton className="h-3 w-20 ml-auto" />
             <Skeleton className="h-8 w-32 ml-auto" />
          </div>
          <Skeleton className="w-14 h-14 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export default function MyRequestsPage() {
  const { user } = useUser();
  const { showToast } = useUI();
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("All");
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?.id) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/bookings?role=customer");
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to sync bookings");
      }
      
      // Map API data to the fields expected by the UI if they differ significantly
      const formatted = (json.data || []).map((b: any) => ({
        ...b,
        booking_status: (b.status || b.booking_status || '').replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase(),
        scheduled_date: b.scheduledAt || b.scheduled_date,
        total_price: b.totalPrice || b.total_price,
        provider: b.provider?.user || { name: "Expert Provider" },
        service: b.service || { name: "Specialized Task" }
      }));

      setRequests(formatted);
    } catch (error: any) {
      showToast("Sync Error: " + error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesFilter = activeFilter === "All" || req.booking_status === activeFilter;
      const matchesSearch = 
        (req.service?.name || req.service?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (req.provider?.name || req.provider?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [requests, activeFilter, searchQuery]);

  return (
    <div className="flex-1 bg-muted/30 p-4 lg:p-10 space-y-10 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <PageHeader 
          title="Service"
          highlightedText="Bookings"
          subtitle="Track, monitor, and finalize all your service engagement nodes."
        />

        {/* HUD Navigation Sequence */}
        <div className="space-y-6 mb-12">
          <div className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-card/50 p-2 rounded-[32px] border border-border/50 shadow-sm relative overflow-hidden">
              {["All", "PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((filter, idx) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`relative px-2 py-3.5 rounded-[22px] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-300 z-10 ${activeFilter === filter
                    ? "text-white"
                    : "text-text-hint hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  <span className="relative z-20">
                    {filter === "All" ? "Full Matrix" : filter.replace('_', ' ')}
                  </span>
                  {activeFilter === filter && (
                    <motion.div
                      layoutId="active-pill-box"
                      className="absolute inset-0 bg-gray-950 rounded-[22px] shadow-lg shadow-black/30"
                      transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
          
        </div>

        {/* Node List */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                 {Array.from({ length: 3 }).map((_, i) => <RequestCardSkeleton key={i} />)}
              </motion.div>
            ) : filteredRequests.length > 0 ? (
              filteredRequests.map((req, index) => {
                const currentStatus = req.booking_status.toUpperCase();
                const config = statusConfig[currentStatus] || statusConfig.PENDING;
                const StatusIcon = config.icon;
                
                // Determine step index for timeline
                const steps = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
                const stepIndex = steps.indexOf(currentStatus);
                const isCancelled = currentStatus === 'CANCELLED';

                return (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/user/booking/${req.id}`} className="group block bg-card rounded-[40px] p-8 md:p-10 border border-border/50 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 relative overflow-hidden">
                      {/* Subtle Background Accent */}
                      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl opacity-0 group-hover:opacity-10 transition-opacity ${config.color.split(' ')[0]}`} />
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                        <div className="flex-1 space-y-6">
                          <div className="flex flex-wrap items-center gap-4">
                            <div className={`px-5 py-2 rounded-2xl border-2 ${config.color} flex items-center gap-2.5 shadow-sm`}>
                              <StatusIcon size={14} strokeWidth={2.5} />
                              <span className="text-[10px] font-black uppercase tracking-widest">{config.label}</span>
                            </div>
                            
                            {/* Service Journey Stepper */}
                            {!isCancelled && (
                              <div className="hidden sm:flex items-center gap-1 bg-muted/40 px-4 py-2 rounded-2xl border border-border/50">
                                {steps.map((s, i) => (
                                  <div key={s} className="flex items-center">
                                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${i <= stepIndex ? 'bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]' : 'bg-text-hint/20'}`} />
                                    {i < steps.length - 1 && (
                                      <div className={`w-4 h-0.5 mx-0.5 rounded-full transition-all duration-500 ${i < stepIndex ? 'bg-primary' : 'bg-text-hint/10'}`} />
                                    )}
                                  </div>
                                ))}
                                <span className="ml-3 text-[9px] font-black text-text-hint/60 uppercase tracking-tighter">Journey</span>
                              </div>
                            )}

                            {req.payment?.status === 'COMPLETED' ? (
                              <div className="px-5 py-2 rounded-2xl border-2 bg-emerald-500 border-emerald-400 text-white flex items-center gap-2.5 shadow-lg shadow-emerald-500/10">
                                <CreditCard size={14} strokeWidth={2.5} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Paid</span>
                              </div>
                            ) : !isCancelled && (
                              <Link 
                                href={`/user/checkout/${req.id}`}
                                onClick={(e) => e.stopPropagation()} 
                                className="px-5 py-2 rounded-2xl border-2 border-primary text-primary hover:bg-primary hover:text-white flex items-center gap-2.5 shadow-sm transition-all active:scale-95 group/pay"
                              >
                                <CreditCard size={14} strokeWidth={2.5} className="group-hover/pay:rotate-12 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Settle</span>
                              </Link>
                            )}
                          </div>
                          
                          <div>
                            <h3 className={`${unbounded.className} text-xl md:text-2xl font-black text-foreground group-hover:text-primary transition-all duration-300 mb-3 tracking-tight`}>
                              {req.service?.name || req.service?.title || "Specialized Task"}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-[11px] font-bold text-text-hint">
                              <span className="flex items-center gap-2.5 hover:text-foreground transition-colors"><Briefcase size={16} className="text-primary" /> {req.provider?.name || req.provider?.full_name}</span>
                              <span className="flex items-center gap-2.5 hover:text-foreground transition-colors"><Calendar size={16} /> {new Date(req.scheduled_date).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                              <span className="flex items-center gap-2.5 hover:text-foreground transition-colors"><Clock size={16} /> {new Date(req.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-10 w-full md:w-auto border-t md:border-t-0 border-border/50 pt-8 md:pt-0">
                          <div className="flex-1 md:text-right">
                             <p className="text-[11px] font-black text-text-hint uppercase tracking-widest mb-1 opacity-50">Contract Value</p>
                             <p className={`${unbounded.className} text-3xl font-black text-foreground tabular-nums tracking-tighter`}>
                               <span className="text-primary text-base mr-1">{t("common.currency")}</span>
                               {Number(req.total_price).toLocaleString()}
                             </p>
                          </div>
                          <div className="w-16 h-16 bg-muted/50 rounded-3xl flex items-center justify-center text-text-hint group-hover:bg-primary group-hover:text-white transition-all transform group-hover:scale-110 group-hover:rotate-6 shadow-sm duration-500">
                             <ArrowRight size={28} strokeWidth={2.5} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            ) : (
              <EmptyState 
                icon={AlertCircle}
                title="No Nodes Detected"
                description="Your service deployment matrix is currently clear. Initiate a booking to see nodes here."
                actionText="Browse Services"
                onAction={() => window.location.href = '/search'}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
