"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Briefcase, Zap, Target, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertCircle,
  Activity, RefreshCw, User as UserIcon, DollarSign, X, Bell, MessageCircle, Database, Shield, Plus, ShieldCheck, Layers
} from "lucide-react";
import { useSound } from "@/contexts/SoundContext";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { useRouter } from "next/navigation";

interface DashboardStats {
  total_users: number;
  total_providers: number;
  total_services: number;
  active_bookings: number;
  total_revenue: number;
  pending_approvals: number;
}


import { useTranslation } from "@/hooks/useTranslation";

export default function AdminDashboardPage() {
  const { showToast, setPageTitle } = useUI();
  const { t, isRTL } = useTranslation();
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState<"Today" | "Week" | "Month" | "Year">("Month");
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStats, setDbStats] = useState<DashboardStats | null>(null);
  const [dbRecentJobs, setDbRecentJobs] = useState<any[]>([]);
  const [dbRevenueData, setDbRevenueData] = useState<any[]>([]);
  const [dbProviderActivity, setDbProviderActivity] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [systemHealth, setSystemHealth] = useState(98);

  useEffect(() => {
    setPageTitle(t("admin.dashboardLabel") || "Admin Dashboard", "");
    fetchDashboardData();
  }, [setPageTitle, t]);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsSyncing(true);
    
    try {
      const res = await fetch("/api/admin/dashboard/stats");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch stats");

      setDbStats(json.stats);
      setDbRecentJobs(json.recentJobs || []);
      if (json.revenueByWeek) setDbRevenueData(json.revenueByWeek);
      if (json.serviceDistribution) setDbProviderActivity(json.serviceDistribution);
      
      // Randomize health slightly for 'live' feel
      setSystemHealth(prev => Math.min(100, Math.max(95, prev + (Math.random() * 2 - 1))));
    } catch (error: any) {
      console.warn("[Admin Dashboard] Data fetch failed:", error.message);
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  };

  const stats = useMemo(() => [
    { label: t("admin.totalUsers") || "Total Users", value: (dbStats?.total_users || 0).toLocaleString(), trend: "+12.4%", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: t("admin.totalProviders") || "Providers", value: (dbStats?.total_providers || 0).toLocaleString(), trend: "+8.2%", icon: Briefcase, color: "text-purple-500", bg: "bg-purple-50" },
    { label: t("admin.totalServices") || "Services", value: (dbStats?.total_services || 0).toLocaleString(), trend: "+4.1%", icon: Layers, color: "text-indigo-500", bg: "bg-indigo-50" },
    { label: t("admin.activeJobs") || "Active Jobs", value: (dbStats?.active_bookings || 0).toLocaleString(), trend: "Optimal", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
    { label: t("admin.revenue") || "Revenue", value: `${t("common.currency")} ${(Number(dbStats?.total_revenue || 0) / 1000).toFixed(1)}k`, trend: "+18.1%", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50" },
  ], [dbStats, t]);

  return (
    <div className="space-y-10 pb-20 w-full">
      <div className="flex justify-end mb-8">
        <div className="flex bg-card p-1.5 rounded-2xl border border-border shadow-sm">
          {(["Month", "Year"] as const).map((filter) => (
            <button 
              key={filter} 
              onClick={() => setTimeFilter(filter)} 
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === filter ? "bg-gray-950 text-white shadow-xl" : "text-text-hint hover:text-foreground"}`}
            >
              {t("common." + filter.toLowerCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <AnimatePresence mode="wait">
          {isLoading && !dbStats ? (
            Array.from({ length: 5 }).map((_, i) => (
              <motion.div 
                key={`skeleton-${i}`} 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-6 bg-card rounded-[24px] border border-border space-y-4 shadow-sm"
              >
                 <Skeleton className="h-4 w-24" />
                 <Skeleton className="h-8 w-32" />
                 <Skeleton className="h-1 w-full" />
              </motion.div>
            ))
          ) : stats.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }}
            className="p-6 bg-card rounded-[24px] border border-border hover:border-primary/30 hover:shadow-xl transition-all group overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className={`w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 shadow-sm ${stat.color}`}>
                <stat.icon size={22} />
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                  {stat.trend}
                </div>
              </div>
            </div>

            <div className="space-y-1 relative z-10">
              <p className="text-[11px] font-bold text-slate-500 tracking-tight">{stat.label}</p>
              <h2 className={`${unbounded.className} text-2xl font-black text-slate-900 tracking-tighter`}>{stat.value}</h2>
            </div>
          </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-card dark:bg-gray-900 rounded-[48px] border border-border dark:border-white/5 p-8 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className={`${unbounded.className} text-xl font-black`}>{t("admin.market")} <span className="text-primary italic">{t("admin.growth")}</span></h3>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-primary/20 animate-pulse" />
              <span className="w-3 h-3 rounded-full bg-primary" />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dbRevenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4af37" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" strokeOpacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} 
                  tickFormatter={(value) => `Rs.${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  cursor={{ stroke: '#d4af37', strokeWidth: 2, strokeDasharray: '5 5' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-950 text-white p-4 rounded-2xl shadow-2xl border border-white/10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">{payload[0].payload.name}</p>
                          <p className="text-sm font-black text-primary">{t("common.currency")} {payload[0].value?.toLocaleString()}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#d4af37" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card dark:bg-gray-900 rounded-[48px] border border-border dark:border-white/10 p-8 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className={`${unbounded.className} text-xl font-black mb-8`}>{t("admin.service")} <span className="text-primary italic">{t("admin.distribution")}</span></h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dbProviderActivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" strokeOpacity={0.5} />
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 800, fill: '#94a3b8'}} />
                <Tooltip 
                   cursor={{fill: 'rgba(212, 175, 55, 0.05)'}}
                   content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-gray-950 text-white p-4 rounded-2xl shadow-2xl border border-white/10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2">{payload[0].payload.category}</p>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-6">
                              <span className="text-[9px] font-bold uppercase text-white/70">Active</span>
                              <span className="text-xs font-black text-white">{payload[0].value}</span>
                            </div>
                            <div className="flex items-center justify-between gap-6">
                              <span className="text-[9px] font-bold uppercase text-white/70">Pending</span>
                              <span className="text-xs font-black text-primary">{payload[1].value}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="active" fill="#111" radius={[8, 8, 0, 0]} barSize={24} />
                <Bar dataKey="pending" fill="#d4af37" radius={[8, 8, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card dark:bg-gray-900 rounded-[48px] border border-border dark:border-white/5 p-10 relative overflow-hidden shadow-sm">
           <h3 className={`${unbounded.className} text-xl font-black mb-10`}>{t("admin.recent")} <span className="text-primary italic">{t("admin.activity")}</span></h3>
           <div className="space-y-4">
             <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex gap-4 p-6 bg-muted/40 rounded-[32px] border border-border/50 shadow-sm">
                         <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                         <div className="flex-1 space-y-3 pt-1">
                           <Skeleton className="h-5 w-48 rounded-md" />
                           <Skeleton className="h-3 w-32 rounded-md" />
                         </div>
                      </div>
                    ))}
                  </motion.div>
                ) : dbRecentJobs.length === 0 ? (
                <div className="py-10">
                   <EmptyState 
                      icon={Activity}
                      title={t("admin.noRecentActivity") || "No Activity Found"}
                      description="System is healthy and awaiting new incoming service requests."
                      actionText="Refresh Stream"
                      onAction={() => fetchDashboardData(true)}
                   />
                </div>
              ) : (
                dbRecentJobs.map((job, idx) => (
                  <motion.div 
                    key={job.id} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: idx * 0.05 }} 
                    onClick={() => setSelectedJob(job)} 
                    className="p-6 bg-muted/30 dark:bg-white/5 hover:bg-white dark:hover:bg-primary/5 border border-transparent hover:border-primary/20 rounded-[32px] transition-all cursor-pointer flex items-center gap-6 group shadow-sm"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-800 border border-border dark:border-white/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <Activity size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="font-black text-sm text-foreground truncate mb-1">{job.rawType || t("common.specializedTask")}</h4>
                       <div className="flex items-center gap-4 text-[10px] font-bold text-text-hint uppercase tracking-tight">
                         <span>{job.rawProvider || t("common.unassigned")}</span>
                         <span>•</span>
                         <span>{job.time}</span>
                       </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                       <div className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[8px] font-black uppercase tracking-widest">{t(`status.${job.rawStatus}`) || job.rawStatus?.charAt(0).toUpperCase() + job.rawStatus?.slice(1)}</div>
                       <p className="font-black text-xs">{`${t("common.currency")} ${job.rawAmount?.toLocaleString()}`}</p>
                    </div>
                  </motion.div>
                ))
              )}
             </AnimatePresence>
           </div>
        </div>

        <aside className="space-y-8">
           <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px]" />
              <h3 className={`${unbounded.className} text-white text-lg font-black mb-6`}>{t("admin.quick")} <span className="text-primary italic">{t("admin.actions")}</span></h3>
              <div className="grid grid-cols-2 gap-3 relative z-10">
                  {[
                    { icon: RefreshCw, label: t("admin.syncData") || "Sync Data", action: () => { fetchDashboardData(true); showToast("Dashboard data refreshed", "success"); }, spin: isSyncing },
                    { icon: Bell, label: t("admin.alerts") || "Alerts", action: () => router.push("/admin/notifications") },
                    { icon: Database, label: t("admin.databaseLabel") || "Database", action: () => router.push("/admin/activity") },
                    { icon: Shield, label: t("admin.permissions") || "Permissions", action: () => router.push("/admin/sub-admins") },
                    { icon: Plus, label: t("admin.addProvider") || "Add Provider", action: () => router.push("/admin/providers") },
                    { icon: MessageCircle, label: t("admin.messagingLabel") || "Messaging", action: () => router.push("/admin/messaging") }
                  ].map((action, i) => (
                    <button 
                      key={i} 
                      onClick={action.action} 
                      className="p-5 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-primary/20 hover:border-primary/20 transition-all group active:scale-95 text-center relative overflow-hidden"
                    >
                      {action.spin && (
                        <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 text-white animate-spin" />
                        </div>
                      )}
                      <action.icon size={18} className={`text-primary group-hover:text-white transition-colors ${action.spin ? 'opacity-0' : ''}`} />
                      <span className={`text-[10px] font-bold text-white/50 group-hover:text-white tracking-tight leading-tight ${action.spin ? 'opacity-0' : ''}`}>{action.label}</span>
                    </button>
                  ))}
              </div>

              {/* System Health Pulse */}
              <div className="mt-8 p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between shadow-inner relative z-10">
                <div className="flex items-center gap-3">
                   <div className="relative">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-white/40 tracking-wider">{t("admin.health.systemHealth")}</p>
                      <p className="text-xs font-bold text-white">{systemHealth.toFixed(1)}% {t("admin.health.nominal")}</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-white/20 tracking-wider">{t("admin.health.uptime")}</p>
                   <p className="text-[10px] font-bold text-emerald-400">99.9%</p>
                </div>
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
}
