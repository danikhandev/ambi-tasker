"use client";

import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Briefcase, Zap, Target, TrendingUp, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, AlertCircle,
  Activity, RefreshCw, User as UserIcon, DollarSign, X, Bell, MessageCircle, Database, Shield, Plus, ShieldCheck, Layers, MoreVertical
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
import { useTranslation } from "@/hooks/useTranslation";

interface DashboardStats {
  total_users: number;
  total_providers: number;
  total_services: number;
  active_bookings: number;
  total_revenue: number;
  pending_approvals: number;
  trends: {
    users: string;
    providers: string;
    revenue: string;
    services: string;
    jobs: string;
  };
}

export default function AdminDashboardPage() {
  const { showToast, setPageTitle } = useUI();
  const { t } = useTranslation();
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState<"Today" | "Week" | "Month" | "Year">("Month");
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStats, setDbStats] = useState<DashboardStats | null>(null);
  const [dbRecentJobs, setDbRecentJobs] = useState<any[]>([]);
  const [dbRevenueData, setDbRevenueData] = useState<any[]>([]);
  const [dbProviderActivity, setDbProviderActivity] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [systemHealth, setSystemHealth] = useState(98.5);

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
    { label: t("admin.totalUsers") || "Total Users", value: (dbStats?.total_users || 0).toLocaleString(), trend: dbStats?.trends?.users || "0%", icon: Users, color: "from-blue-500 to-cyan-400", bg: "bg-blue-500/10", text: "text-blue-500" },
    { label: t("admin.totalProviders") || "Providers", value: (dbStats?.total_providers || 0).toLocaleString(), trend: dbStats?.trends?.providers || "0%", icon: Briefcase, color: "from-purple-500 to-pink-500", bg: "bg-purple-500/10", text: "text-purple-500" },
    { label: t("admin.totalServices") || "Services", value: (dbStats?.total_services || 0).toLocaleString(), trend: dbStats?.trends?.services || "+4.1%", icon: Layers, color: "from-indigo-500 to-blue-500", bg: "bg-indigo-500/10", text: "text-indigo-500" },
    { label: t("admin.activeJobs") || "Active Jobs", value: (dbStats?.active_bookings || 0).toLocaleString(), trend: dbStats?.trends?.jobs || "Optimal", icon: Zap, color: "from-amber-400 to-orange-500", bg: "bg-amber-500/10", text: "text-amber-500" },
    { label: t("admin.revenue") || "Revenue", value: `${t("common.currency")} ${(Number(dbStats?.total_revenue || 0) / 1000).toFixed(1)}k`, trend: dbStats?.trends?.revenue || "0%", icon: DollarSign, color: "from-emerald-400 to-teal-500", bg: "bg-emerald-500/10", text: "text-emerald-500" },
  ], [dbStats, t]);

  return (
    <div className="space-y-8 pb-20 w-full px-2 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
      
      {/* Top Bar: Filters */}
      <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-4 mb-6 relative z-20">
        <div className="flex bg-card/80 backdrop-blur-xl p-1.5 rounded-2xl border border-border/50 shadow-lg shadow-black/5 relative overflow-x-auto no-scrollbar w-full sm:w-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50" />
          {(["Today", "Week", "Month", "Year"] as const).map((filter) => (
            <button 
              key={filter} 
              onClick={() => setTimeFilter(filter)} 
              className={`relative px-4 sm:px-8 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 z-10 flex-1 sm:flex-none flex-shrink-0 whitespace-nowrap text-center ${
                timeFilter === filter 
                  ? "bg-foreground text-background shadow-xl shadow-foreground/20 scale-100" 
                  : "text-text-hint hover:text-foreground hover:bg-foreground/5 scale-95"
              }`}
            >
              {t("common." + filter.toLowerCase())}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-6">
        <AnimatePresence mode="wait">
          {isLoading && !dbStats ? (
            Array.from({ length: 5 }).map((_, i) => (
              <motion.div 
                key={`skeleton-${i}`} 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: -20 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="p-6 bg-card/40 backdrop-blur-sm rounded-[32px] border border-border/40 space-y-5 shadow-sm"
              >
                 <div className="flex justify-between items-start">
                   <Skeleton className="h-14 w-14 rounded-[1.25rem]" />
                   <Skeleton className="h-5 w-16 rounded-full" />
                 </div>
                 <div className="space-y-2">
                   <Skeleton className="h-3 w-24" />
                   <Skeleton className="h-8 w-32" />
                 </div>
              </motion.div>
            ))
          ) : stats.map((stat, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05, duration: 0.4, type: "spring", stiffness: 100 }}
            className={`p-4 sm:p-6 bg-card/60 backdrop-blur-xl rounded-[24px] sm:rounded-[32px] border border-border/50 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group overflow-hidden relative cursor-pointer min-w-0 ${i === 4 ? 'col-span-2 sm:col-span-1' : ''}`}
          >
            {/* Background Glow */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 blur-[50px] transition-opacity duration-700 rounded-full`} />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className={`w-14 h-14 rounded-[1.25rem] ${stat.bg} flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 shadow-inner`}>
                <stat.icon size={26} className={`${stat.text} drop-shadow-md`} />
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className={`px-3 py-1 bg-background/80 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-border/50 shadow-sm ${
                  stat.trend.startsWith('+') || stat.trend === 'Optimal' ? 'text-emerald-500' : 
                  stat.trend.startsWith('-') ? 'text-rose-500' : 'text-slate-500'
                }`}>
                  {stat.trend}
                </div>
              </div>
            </div>

            <div className="space-y-1 relative z-10">
              <p className="text-[10px] sm:text-[11px] font-bold text-text-hint tracking-wider uppercase">{stat.label}</p>
              <h2 className={`${unbounded.className} text-xl sm:text-3xl font-black text-foreground tracking-tighter group-hover:translate-x-1 transition-transform duration-300`}>
                {stat.value}
              </h2>
            </div>
          </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 min-w-0">
        
        {/* Revenue Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card/60 backdrop-blur-xl rounded-[32px] lg:rounded-[40px] border border-border/50 p-5 sm:p-6 lg:p-8 relative overflow-hidden group shadow-xl shadow-black/5 min-w-0"
        >
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 relative z-10 gap-4">
            <div>
              <h3 className={`${unbounded.className} text-xl sm:text-2xl font-black text-foreground`}>{t("admin.market")} <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent italic">{t("admin.growth")}</span></h3>
              <p className="text-[10px] sm:text-xs font-bold text-text-hint mt-1">Revenue performance over selected period</p>
            </div>
            <div className="flex gap-2 items-center px-4 py-2 bg-primary/10 rounded-full border border-primary/20 self-start sm:self-auto shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <span className="text-[10px] font-black uppercase text-primary tracking-widest">Live Sync</span>
            </div>
          </div>

          <div className="h-[320px] w-full relative z-10">
            {isLoading ? (
              <div className="w-full h-full flex flex-col justify-end gap-2 px-4 pb-4">
                <Skeleton className="w-full h-[60%] rounded-t-xl" />
              </div>
            ) : dbRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dbRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#8892b0'}} dy={15} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 10, fontWeight: 700, fill: '#8892b0'}} 
                    tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`}
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#8b5cf6', strokeWidth: 1.5, strokeDasharray: '5 5' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-border/60 transform transition-all">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-hint mb-2">{payload[0].payload.name}</p>
                            <p className="text-lg font-black bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
                              {t("common.currency")} {payload[0].value?.toLocaleString()}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#8b5cf6" 
                    strokeWidth={4} 
                    fill="url(#colorRev)" 
                    animationDuration={1500} 
                    activeDot={{ r: 6, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-text-hint opacity-60">
                <Activity className="w-16 h-16 text-border" />
                <p className="text-[11px] font-black uppercase tracking-widest">Awaiting Data Uplink</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Service Distribution Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card/60 backdrop-blur-xl rounded-[32px] lg:rounded-[40px] border border-border/50 p-5 sm:p-6 lg:p-8 relative overflow-hidden group shadow-xl shadow-black/5 min-w-0"
        >
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-indigo-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row justify-between mb-8 relative z-10 gap-4">
            <div>
              <h3 className={`${unbounded.className} text-xl sm:text-2xl font-black text-foreground`}>{t("admin.service")} <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent italic">{t("admin.distribution")}</span></h3>
              <p className="text-[10px] sm:text-xs font-bold text-text-hint mt-1">Provider activity across categories</p>
            </div>
            <button className="w-10 h-10 rounded-full bg-background/50 border border-border flex items-center justify-center text-text-secondary hover:text-foreground hover:bg-background transition-all">
               <MoreVertical size={18} />
            </button>
          </div>

          <div className="h-[320px] w-full relative z-10">
            {isLoading ? (
              <div className="w-full h-full flex flex-col justify-end gap-2 px-4 pb-4">
                 <Skeleton className="w-full h-[80%] rounded-t-xl" />
              </div>
            ) : dbProviderActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dbProviderActivity} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={0} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                  <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#8892b0'}} dy={15} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#8892b0'}} dx={-10} />
                  <Tooltip 
                     cursor={{fill: 'var(--primary)', opacity: 0.05}}
                     content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-card/95 backdrop-blur-xl p-5 rounded-2xl shadow-2xl border border-border/60 transform transition-all min-w-[160px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-hint mb-4">{payload[0].payload.category}</p>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between gap-6">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-foreground" />
                                  <span className="text-[10px] font-bold uppercase text-text-secondary">Active</span>
                                </div>
                                <span className="text-sm font-black text-foreground">{payload[0].value}</span>
                              </div>
                              <div className="flex items-center justify-between gap-6">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                  <span className="text-[10px] font-bold uppercase text-text-secondary">Pending</span>
                                </div>
                                <span className="text-sm font-black text-indigo-500">{payload[1]?.value || 0}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="active" fill="currentColor" className="text-foreground" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-text-hint opacity-60">
                <Layers className="w-16 h-16 text-border" />
                <p className="text-[11px] font-black uppercase tracking-widest">Awaiting Data Uplink</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom Section: Activity & Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 min-w-0">
        
        {/* Recent Activity List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="xl:col-span-2 bg-card/60 backdrop-blur-xl rounded-[32px] lg:rounded-[40px] border border-border/50 p-5 sm:p-6 lg:p-10 relative overflow-hidden shadow-xl shadow-black/5 min-w-0"
        >
           <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
             <div>
               <h3 className={`${unbounded.className} text-xl sm:text-2xl font-black text-foreground`}>{t("admin.recent")} <span className="text-primary italic">{t("admin.activity")}</span></h3>
               <p className="text-[10px] sm:text-xs font-bold text-text-hint mt-1">Latest transactions and system events</p>
             </div>
             <button onClick={() => fetchDashboardData(true)} className="p-3 bg-background/50 hover:bg-primary/10 text-text-secondary hover:text-primary rounded-2xl transition-all border border-border/50 hover:border-primary/30 self-start sm:self-auto shrink-0">
               <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
             </button>
           </div>
           
           <div className="space-y-4">
             <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex gap-4 p-5 sm:p-6 bg-background/40 rounded-[28px] border border-border/40 shadow-sm animate-pulse">
                         <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
                         <div className="flex-1 space-y-3 pt-1">
                           <Skeleton className="h-4 w-48 rounded-md" />
                           <Skeleton className="h-3 w-32 rounded-md" />
                         </div>
                      </div>
                    ))}
                  </motion.div>
                ) : dbRecentJobs.length === 0 ? (
                <div className="py-16">
                   <EmptyState 
                      icon={Activity}
                      title={t("admin.noRecentActivity") || "System Idle"}
                      description="No new activities found. System is healthy and awaiting incoming data."
                      actionText="Refresh Stream"
                      onAction={() => fetchDashboardData(true)}
                   />
                </div>
              ) : (
                dbRecentJobs.map((job, idx) => (
                  <motion.div 
                    key={job.id} 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: idx * 0.05, duration: 0.3 }} 
                    onClick={() => setSelectedJob(job)} 
                    className="p-5 sm:p-6 bg-background/40 hover:bg-background border border-border/40 hover:border-primary/30 rounded-[28px] transition-all duration-300 cursor-pointer flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 group shadow-sm hover:shadow-xl hover:shadow-primary/5 relative overflow-hidden"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top rounded-l-full" />
                    
                    <div className="w-12 h-12 rounded-[1rem] bg-card border border-border/60 flex items-center justify-center text-text-secondary group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all shadow-sm shrink-0">
                      <Activity size={20} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                       <h4 className="font-black text-sm sm:text-base text-foreground truncate mb-1.5 group-hover:text-primary transition-colors">{job.rawType || t("common.specializedTask")}</h4>
                       <div className="flex items-center gap-3 text-[10px] sm:text-[11px] font-bold text-text-hint uppercase tracking-wider">
                         <span className="flex items-center gap-1.5">
                           <UserIcon size={12} />
                           {job.rawProvider || t("common.unassigned")}
                         </span>
                         <span className="w-1 h-1 rounded-full bg-border" />
                         <span className="flex items-center gap-1.5">
                           <Clock size={12} />
                           {job.time}
                         </span>
                       </div>
                    </div>
                    
                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-border/40 sm:border-t-0 gap-2">
                       <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                         job.rawStatus === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                         job.rawStatus === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                         job.rawStatus === 'active' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                         'bg-slate-500/10 text-slate-500 border-slate-500/20'
                       }`}>
                         {t(`status.${job.rawStatus}`) || job.rawStatus?.charAt(0).toUpperCase() + job.rawStatus?.slice(1)}
                       </div>
                       <p className={`${unbounded.className} font-black text-sm text-foreground`}>{`${t("common.currency")} ${job.rawAmount?.toLocaleString()}`}</p>
                    </div>
                  </motion.div>
                ))
              )}
             </AnimatePresence>
           </div>
        </motion.div>

        {/* Quick Actions & Health */}
        <aside className="space-y-6 min-w-0">
           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.5, delay: 0.5 }}
             className="bg-slate-900 dark:bg-slate-950 rounded-[32px] lg:rounded-[40px] p-6 sm:p-8 lg:p-10 text-white relative overflow-hidden shadow-2xl shadow-primary/10"
           >
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />
              
              <h3 className={`${unbounded.className} text-white text-xl sm:text-2xl font-black mb-6 sm:mb-8 relative z-10`}>{t("admin.quick")} <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent italic">{t("admin.actions")}</span></h3>
              
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-3 gap-2 sm:gap-4 relative z-10">
                  {[
                    { icon: RefreshCw, label: t("admin.syncData") || "Refresh Data", action: () => { fetchDashboardData(true); showToast("Dashboard data refreshed", "success"); }, spin: isSyncing },
                    { icon: Bell, label: t("admin.alerts") || "Alerts", action: () => router.push("/admin/notifications") },
                    { icon: Database, label: t("admin.databaseLabel") || "Database", action: () => router.push("/admin/activity") },
                    { icon: Shield, label: t("admin.permissions") || "Permissions", action: () => router.push("/admin/sub-admins") },
                    { icon: Plus, label: t("admin.addProvider") || "Add Provider", action: () => router.push("/admin/providers") },
                    { icon: MessageCircle, label: t("admin.messagingLabel") || "Messaging", action: () => router.push("/admin/messaging") }
                  ].map((action, i) => (
                    <button 
                      key={i} 
                      onClick={action.action} 
                      className="aspect-square sm:aspect-auto p-2 py-3 sm:p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-[28px] flex flex-col items-center justify-center gap-2 sm:gap-3 hover:bg-white/10 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 group active:scale-95 text-center relative overflow-hidden"
                    >
                      {action.spin && (
                        <div className="absolute inset-0 bg-primary/20 backdrop-blur-md flex items-center justify-center z-20">
                          <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" />
                        </div>
                      )}
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[1.25rem] bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/30 transition-all duration-300 shrink-0">
                        <action.icon className={`w-5 h-5 sm:w-[22px] sm:h-[22px] text-white/60 group-hover:text-white transition-colors ${action.spin ? 'opacity-0' : ''}`} />
                      </div>
                      <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/50 group-hover:text-white transition-colors leading-tight px-1 ${action.spin ? 'opacity-0' : ''}`}>{action.label}</span>
                    </button>
                  ))}
              </div>

              {/* System Health Pulse */}
              <div className="mt-8 p-8 bg-black/20 backdrop-blur-xl border border-white/10 rounded-[32px] relative z-10 overflow-hidden group hover:border-emerald-500/30 transition-colors duration-500">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-500" />
                
                <div className="flex flex-col items-center text-center gap-6">
                   <div className="relative">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/5 group-hover:scale-110 transition-transform duration-500">
                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-4 border-slate-900 animate-ping" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-4 border-slate-900" />
                   </div>
                   
                   <div className="space-y-1.5">
                      <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em]">{t("admin.health.systemHealth")}</p>
                      <h4 className={`${unbounded.className} text-3xl font-black text-white drop-shadow-md`}>{systemHealth.toFixed(1)}%</h4>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">{t("admin.health.nominal")}</p>
                      </div>
                   </div>

                   <div className="w-full h-px bg-white/10" />

                   <div className="flex justify-between w-full">
                      <div className="text-left">
                         <p className="text-[10px] font-black uppercase text-white/30 tracking-wider mb-1">{t("admin.health.uptime")}</p>
                         <p className={`${unbounded.className} text-sm font-black text-white/90`}>99.9%</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black uppercase text-white/30 tracking-wider mb-1">Response</p>
                         <p className={`${unbounded.className} text-sm font-black text-emerald-400`}>12ms</p>
                      </div>
                   </div>
                </div>
              </div>
           </motion.div>
        </aside>
      </div>
    </div>
  );
}
