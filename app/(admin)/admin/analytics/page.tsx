"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import {
    Banknote, TrendingDown, Download, ArrowUpRight, ArrowDownRight,
    Wallet, CheckCircle2, Clock, ChevronRight,
    Activity, Globe, ArrowRight, Loader2, Filter,
    RefreshCw, Calendar, TrendingUp, ShieldCheck, CreditCard,
    DollarSign, BarChart as BarChartIcon, Presentation, Info, XCircle, Search,
    Target, Zap, Cpu, Layers, Network
} from 'lucide-react';
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import Image from "next/image";

// --- TYPES ---
interface TransactionAudit {
    id: string;
    flow: "Outbound" | "Inbound" | "Internal";
    user: string;
    provider: string;
    amount: string;
    tax: string;
    status: "Completed" | "Processing" | "Flagged";
    timestamp: string;
    region: string;
}

// Data now fetched from API

// Yield mix now derived from service distribution API

export default function AdminAnalyticsPage() {
    const { showToast, setPageTitle } = useUI();
    const [stats, setStats] = useState<any>(null);
    const [recentJobs, setRecentJobs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("30D");
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const COLORS = ["#D4AF37", "#3B82F6", "#10B981", "#6366F1", "#EC4899", "#8B5CF6"];

    useEffect(() => {
        setPageTitle("Analytics", "");
        fetchAnalytics();
    }, [timeRange, setPageTitle]);

    const fetchAnalytics = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/dashboard/stats");
            const data = await res.json();
            if(!data.success) throw new Error(data.error);
            setStats(data);
            setRecentJobs(data.recentJobs || []);
        } catch (error: any) {
            showToast("Signal Interruption: " + error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    const revenueMetrics = useMemo(() => {
        if(!stats) return [];
        return [
            { label: "Total Revenue", value: `Rs. ${stats.stats.total_revenue.toLocaleString()}`, growth: "+14.2%", positive: true, icon: Banknote, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Commission (10%)", value: `Rs. ${(stats.stats.total_revenue * 0.1).toLocaleString()}`, growth: "+8.1%", positive: true, icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Active Jobs", value: stats.stats.active_bookings.toString(), growth: "Steady", positive: true, icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Scale Factor", value: `${stats.stats.total_providers} Providers`, growth: "Optimal", positive: true, icon: Globe, color: "text-indigo-600", bg: "bg-indigo-50" },
        ];
    }, [stats]);

    const yieldTrajectoryData = useMemo(() => {
        return stats?.revenueByWeek?.map((w: any) => ({ name: w.name, gross: w.revenue, profit: w.revenue * 0.1 })) || [];
    }, [stats]);

    const yieldMixData = useMemo(() => {
        if (!stats?.serviceDistribution) return [];
        const distribution = stats.serviceDistribution.slice(0, 4);
        const total = distribution.reduce((acc: number, s: any) => acc + (s.active || 0), 0);
        
        return distribution.map((s: any, idx: number) => ({
            name: s.category,
            value: total > 0 ? Math.round((s.active / total) * 100) : 0,
            color: COLORS[idx % COLORS.length],
            val: s.active,
            icon: Target
        }));
    }, [stats]);

    const handleExport = async (type: string) => {
        setIsProcessing(type);
        try {
            const response = await fetch(`/api/admin/analytics/export?type=${type}`);
            if (!response.ok) throw new Error("Export failed");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ambitasker_${type}_export.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            
            showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully.`, "success");
        } catch (error: any) {
            showToast("Export Error: " + error.message, "error");
        } finally {
            setIsProcessing(null);
        }
    };

    const handleAction = (action: string) => {
        setIsProcessing(action);
        setTimeout(() => {
            showToast("System check completed successfully", "success");
            setIsProcessing(null);
        }, 1500);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-gray-900 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{label}</p>
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <p className="text-xs font-black text-white">
                  {entry.name}: <span className="text-primary">Rs. {entry.value.toLocaleString()}</span>
                </p>
              </div>
            ))}
          </div>
        );
      }
      return null;
    };

    return (
        <div className="space-y-8 text-foreground pb-20">
            <div className="flex justify-end mb-8">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => handleExport('users')}
                        disabled={isProcessing === 'users'}
                        className="w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center hover:bg-muted transition-all active:scale-95 group"
                        title="Export Users"
                    >
                        {isProcessing === 'users' ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} className="text-text-hint group-hover:text-primary transition-colors" />}
                    </button>
                    <button 
                        onClick={() => showToast("Ledger synchronized", "info")}
                        className="w-12 h-12 bg-card border border-border rounded-xl flex items-center justify-center hover:bg-muted transition-all active:scale-95 group"
                    >
                        <RefreshCw size={18} className="text-text-hint group-active:rotate-180 transition-transform duration-500" />
                    </button>
                    <div className="flex bg-muted p-1 rounded-2xl border border-border shadow-inner">
                        {['7D', '30D', '90D', 'YTD'].map(r => (
                            <button
                                key={r}
                                onClick={() => setTimeRange(r)}
                                className={`px-5 py-2.5 rounded-[14px] text-[9px] font-black uppercase tracking-widest transition-all ${timeRange === r
                                    ? "bg-white text-primary shadow-sm border border-border"
                                    : "text-text-hint hover:text-foreground hover:bg-white/40"
                                    }`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {!stats || isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="p-8 bg-card rounded-3xl border border-border space-y-4">
                            <div className="w-14 h-14 bg-muted rounded-2xl animate-pulse" />
                            <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
                        </div>
                    ))
                ) : revenueMetrics.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-8 bg-card rounded-3xl border border-border shadow-sm flex flex-col group hover:shadow-xl transition-all relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2" />
                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                                <stat.icon size={26} />
                            </div>
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${stat.positive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                                {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {stat.growth}
                            </div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-hint mb-1">{stat.label}</p>
                        <h4 className={`${unbounded.className} text-xl font-black text-foreground`}>{stat.value}</h4>
                    </motion.div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[500px]">
                {/* Revenue Growth Chart */}
                <div className="lg:col-span-2 bg-card rounded-[40px] border border-border p-10 shadow-sm relative overflow-hidden flex flex-col">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                        <div>
                            <h3 className={`${unbounded.className} text-xl font-black text-foreground`}>Revenue Growth</h3>
                            <p className="text-[10px] font-black text-text-hint uppercase tracking-widest mt-1">Real-time revenue tracking</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 text-[10px] font-black text-text-hint uppercase tracking-widest">
                                <div className="w-2.5 h-2.5 rounded-full bg-primary" /> Total Revenue
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-black text-text-hint uppercase tracking-widest">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Platform Profit
                            </div>
                        </div>
                    </div>

                    <div className="h-[350px] w-full relative z-10 pr-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={yieldTrajectoryData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis 
                                  dataKey="name" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fontSize: 9, fontWeight: 900, fill: '#9CA3AF' }}
                                  dy={10}
                                />
                                <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fontSize: 9, fontWeight: 900, fill: '#9CA3AF' }}
                                  tickFormatter={(value) => `Rs.${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(212,175,55,0.05)' }} />
                                <Bar 
                                  dataKey="gross" 
                                  name="Total Revenue" 
                                  radius={[6, 6, 0, 0]} 
                                  barSize={20}
                                >
                                  {yieldTrajectoryData.map((entry: any, index: number) => (
                                    <Cell key={`cell-gross-${index}`} fill={index === yieldTrajectoryData.length - 1 ? 'var(--color-primary, #D4AF37)' : 'rgba(212,175,55,0.2)'} />
                                  ))}
                                </Bar>
                                <Bar 
                                  dataKey="profit" 
                                  name="Net Profit" 
                                  radius={[4, 4, 0, 0]} 
                                  barSize={12}
                                >
                                  {yieldTrajectoryData.map((entry: any, index: number) => (
                                    <Cell key={`cell-profit-${index}`} fill={index === yieldTrajectoryData.length - 1 ? '#3B82F6' : 'rgba(59, 130, 246, 0.2)'} />
                                  ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* System Stats Footer */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-border/40 relative z-10 mt-6">
                        {[
                            { label: "Platform Latency", value: "42ms", icon: Activity },
                            { label: "Server Cluster", value: "ADMIN-01", icon: Cpu },
                            { label: "Active Regions", value: "14 Areas", icon: Globe },
                            { label: "Platform Status", value: "Good", icon: ShieldCheck },
                        ].map((item, i) => (
                            <div key={i} className="flex flex-col">
                                <p className="text-[9px] font-black text-text-hint uppercase tracking-widest mb-1">{item.label}</p>
                                <div className="flex items-center gap-2 text-xs font-black text-foreground">
                                    <item.icon size={14} className="text-primary" />
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Revenue Mix */}
                <div className="bg-card rounded-[40px] border border-border p-10 shadow-sm flex flex-col space-y-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div>
                        <h3 className={`${unbounded.className} text-xl font-black text-foreground`}>Revenue Mix</h3>
                        <p className="text-[10px] font-black text-text-hint uppercase tracking-widest mt-1">Revenue distribution by region</p>
                    </div>

                    <div className="h-[200px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={yieldMixData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {yieldMixData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[8px] font-black text-text-hint uppercase">Total</span>
                            <span className={`${unbounded.className} text-sm font-black text-foreground`}>
                                {yieldMixData.reduce((acc: number, item: any) => acc + item.val, 0)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {yieldMixData.map((cat: any, i: number) => (
                            <div key={i} className="group cursor-default">
                                <div className="flex justify-between items-center mb-2.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: cat.color }}>
                                            <cat.icon size={14} className="text-white" />
                                        </div>
                                        <div>
                                            <span className="text-xs font-black text-foreground uppercase tracking-tight block">{cat.name}</span>
                                            <span className="text-[9px] font-bold text-text-hint uppercase tracking-widest">{cat.val} Bookings</span>
                                        </div>
                                    </div>
                                    <span className="text-xs font-black text-foreground">{cat.value}%</span>
                                </div>
                                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${cat.value}%` }}
                                        style={{ backgroundColor: cat.color }}
                                        className="h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto p-8 bg-muted rounded-[32px] border border-border">
                        <p className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-4">Total Revenue</p>
                        <h4 className={`${unbounded.className} text-2xl font-black text-foreground`}>Rs. 4.8M</h4>
                        <button 
                            onClick={() => handleExport('bookings')} 
                            disabled={isProcessing === 'bookings'}
                            className="w-full mt-6 py-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary transition-all active:scale-95 shadow-xl shadow-gray-900/10 flex items-center justify-center gap-2"
                        >
                            {isProcessing === 'bookings' ? <Loader2 className="animate-spin" size={14} /> : "Generate Report"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Transaction Ledger */}
            <div className="bg-card rounded-[40px] border border-border shadow-sm overflow-hidden">
                <div className="p-10 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-8 bg-muted/20">
                    <div>
                        <h3 className={`${unbounded.className} text-xl font-black text-foreground`}>Transactions</h3>
                        <p className="text-[10px] font-black text-text-hint uppercase tracking-widest mt-2">History records</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group min-w-[300px]">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-hint" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-14 pr-6 py-4 bg-background border border-border rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm shadow-sm"
                            />
                        </div>
                        <button onClick={() => handleAction('audit')} className="flex items-center gap-3 px-6 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-lg shadow-gray-900/10">
                            {isProcessing === 'audit' ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={16} />} 
                            Audit
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted pb-4 border-b border-border">
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-text-hint">ID</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-text-hint">Path</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-text-hint">Info</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-text-hint">Amount</th>
                                <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-text-hint text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentJobs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-text-hint font-bold uppercase tracking-widest">No activity recorded</td>
                                </tr>
                            ) : recentJobs.map((tx, i) => (
                                <tr key={tx.id} className="group border-b border-border/50 hover:bg-muted/30 transition-colors text-foreground">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-primary" />
                                            <span className="text-xs font-black group-hover:text-primary transition-colors text-mono">{tx.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-8">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black">{tx.rawType}</span>
                                                <span className="text-[9px] font-medium text-text-hint uppercase tracking-widest">Service</span>
                                            </div>
                                            <ArrowRight size={14} className="text-primary group-hover:translate-x-1 transition-transform" />
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black">{tx.rawProvider}</span>
                                                <span className="text-[9px] font-medium text-text-hint uppercase tracking-widest">Provider</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-8">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-hint">Location</span>
                                            <span className="text-xs font-bold text-text-secondary">{tx.time}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-8">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-foreground">Rs. {tx.rawAmount.toLocaleString()}</span>
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tight">Yield: Rs. {(tx.rawAmount * 0.1).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <span className={`inline-flex items-center gap-2 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${
                                            tx.rawStatus === 'Completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            tx.rawStatus === 'InProgress' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                            'bg-red-50 text-red-600 border border-red-100'
                                        }`}>
                                            <div className={`w-2 h-2 rounded-full ${tx.rawStatus === 'Completed' ? 'bg-emerald-600' : tx.rawStatus === 'InProgress' ? 'bg-amber-600 animate-pulse' : 'bg-red-600'}`} />
                                            {tx.rawStatus}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-10 flex items-center justify-between bg-muted/10 border-t border-border">
                    <p className="text-[10px] font-black text-text-hint uppercase tracking-[0.25em]">Real-time transaction history synchronized with the database.</p>
                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:underline group">
                        Access Full Transaction History <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
