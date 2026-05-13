"use client";

import React, { useState, useEffect } from "react";
import { 
  Database, Activity, Search, Filter, RefreshCw, 
  ArrowUpRight, ArrowDownRight, Layers, Box, Cpu, HardDrive, 
  Terminal, ShieldCheck, Clock, CheckCircle2, AlertTriangle, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import { useTranslation } from "@/hooks/useTranslation";
import PageHeader from "@/components/PageHeader";
import AdminTable from "@/components/AdminTable";

export default function AdminActivityExplorerPage() {
    const { showToast, setPageTitle } = useUI();
    const { t } = useTranslation();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalWrites: 1240,
        syncRate: "99.9%",
        uptime: "14d 06h",
        activeConnections: 42
    });

    useEffect(() => {
        setPageTitle(t("admin.database.title") + " " + t("admin.database.highlight"), "");
        fetchActivity();
    }, [setPageTitle, t]);

    const fetchActivity = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/activity");
            const json = await res.json();
            if (json.success) {
                setEvents(json.data);
            }
        } catch (error: any) {
            showToast("Failed to connect to data cluster", "error");
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            header: t("admin.database.operationalProtocol"),
            accessor: (ev: any) => (
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        ev.action.includes('DELETE') ? 'bg-red-500/10 text-red-500' :
                        ev.action.includes('CREATE') ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-blue-500/10 text-blue-500'
                    }`}>
                        <Terminal size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-foreground mb-1">{ev.action.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] font-medium text-text-hint">{t("admin.database.operationalProtocol")} • {ev.id.slice(0, 8)}</p>
                    </div>
                </div>
            )
        },
        {
            header: t("admin.database.sourceNode"),
            accessor: (ev: any) => (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
                    <span className="text-xs font-bold text-foreground">{ev.admin.name}</span>
                </div>
            )
        },
        {
            header: t("admin.database.targetEntity"),
            accessor: (ev: any) => (
                <div className="flex items-center gap-2 px-3 py-1 bg-muted/40 border border-border/40 rounded-lg">
                    <Box size={12} className="text-text-hint" />
                    <span className="text-[10px] font-bold text-text-secondary">{ev.targetType}</span>
                </div>
            )
        },
        {
            header: t("admin.database.status"),
            accessor: () => (
                <div className="flex items-center gap-1.5 text-emerald-500">
                    <CheckCircle2 size={14} />
                    <span className="text-xs font-bold tracking-tight">{t("admin.database.success")}</span>
                </div>
            )
        },
        {
            header: t("admin.database.timestamp"),
            accessor: (ev: any) => (
                <div className="flex items-center gap-2 text-text-hint">
                    <Clock size={12} />
                    <span className="text-[10px] font-bold tabular-nums">{new Date(ev.createdAt).toLocaleString()}</span>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-10 pb-20">
            <div className="flex justify-end mb-8">
                <button 
                    onClick={fetchActivity}
                    className="flex items-center gap-3 px-6 py-4 bg-gray-950 text-white rounded-2xl shadow-xl shadow-gray-950/20 hover:bg-primary transition-all group"
                >
                    <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                    <span className="text-xs font-bold">{t("admin.database.resync")}</span>
                </button>
            </div>

            {/* Hardware/System Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total I/O Writes", value: stats.totalWrites, icon: HardDrive, color: "text-blue-500", bg: "bg-blue-50/50" },
                    { label: "Sync Consistency", value: stats.syncRate, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-50/50" },
                    { label: "Active Connections", value: stats.activeConnections, icon: Cpu, color: "text-purple-500", bg: "bg-purple-50/50" },
                    { label: "System Uptime", value: stats.uptime, icon: Activity, color: "text-amber-500", bg: "bg-amber-50/50" }
                ].map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-8 bg-card rounded-[40px] border border-border shadow-sm flex flex-col gap-6 group hover:border-primary/30 transition-all"
                    >
                        <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon size={26} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-text-hint tracking-tight mb-1">{stat.label}</p>
                            <h3 className={`${unbounded.className} text-2xl font-bold text-foreground`}>{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Data explorer table */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                            <Terminal size={20} className="text-primary" />
                            <h3 className={`${unbounded.className} text-sm font-bold tracking-tight`}>{t("admin.database.protocolStream")}</h3>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold border border-emerald-500/10 animate-pulse">
                            {t("admin.database.liveUplink")}
                        </div>
                    </div>
                    <AdminTable 
                        data={events}
                        columns={columns}
                        isLoading={loading}
                        emptyTitle="Cluster Silent"
                        emptyDescription="No low-level platform signals detected in the current buffer."
                    />
                </div>

                {/* Sidebar Alerts/Metadata */}
                <aside className="lg:col-span-4 space-y-8">
                    <div className="bg-gray-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl" />
                        <h4 className={`${unbounded.className} text-[11px] font-bold text-primary mb-8`}>{t("admin.database.nodeHealth")}</h4>
                        <div className="space-y-6">
                            {[
                                { label: "Main DB Cluster", status: "Operational", color: "text-emerald-500" },
                                { label: "Search Index", status: "Indexing", color: "text-amber-500" },
                                { label: "Object Storage", status: "Optimal", color: "text-emerald-500" },
                                { label: "Auth Provider", status: "Operational", color: "text-emerald-500" }
                            ].map((node, i) => (
                                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                                    <span className="text-[10px] font-medium text-white/60">{node.label}</span>
                                    <span className={`text-[10px] font-bold ${node.color}`}>{t(`admin.database.${node.status.toLowerCase()}`)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-card rounded-[40px] border border-border p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <AlertCircle size={20} className="text-amber-500" />
                            <h4 className={`${unbounded.className} text-[11px] font-bold`}>{t("admin.database.recentAnomalies")}</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-amber-900 uppercase tracking-tight mb-1">DDoS Mitigation</p>
                                    <p className="text-[11px] font-medium text-amber-700/90 leading-relaxed">Rate limit triggered on cluster: AUTH-3. Normal operations resumed.</p>
                                </div>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                                <Activity size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-blue-900 uppercase tracking-tight mb-1">Schema Migration</p>
                                    <p className="text-[11px] font-medium text-blue-700/90 leading-relaxed">Database schema updated to v2.4.1 successful on all nodes.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
