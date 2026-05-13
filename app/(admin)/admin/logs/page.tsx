"use client";

import React, { useState, useEffect } from "react";
import { History, Shield, Search, Filter, Loader2, User, Activity, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import AdminTable from "@/components/AdminTable";
import CircularFrame from "@/components/CircularFrame";

export default function AdminLogsPage() {
  const { showToast, setPageTitle } = useUI();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setPageTitle("Audit Logs", "");
  }, [setPageTitle]);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?page=${page}&limit=20`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data);
        setTotalPages(json.pagination.totalPages);
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast("Error fetching audit logs: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-[48px] border border-border">
             <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
             <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Synchronizing Ledger...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-[48px] border border-border">
             <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                <History className="text-text-disabled" size={24} />
             </div>
             <h3 className={`${unbounded.className} text-xl font-black text-foreground`}>Clear Signal</h3>
             <p className="text-text-hint text-sm mt-2 font-medium">No administrative activity has been recorded on this cluster yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log, idx) => {
              const isDanger = log.action.includes('DELETE') || log.action.includes('REJECT');
              const isSuccess = log.action.includes('APPROVE') || log.action.includes('ACTIVATE') || log.action.includes('CREATE');
              
              return (
                <motion.div 
                  key={log.id} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card dark:bg-gray-900 border border-border dark:border-white/5 p-6 rounded-[32px] shadow-sm hover:shadow-xl transition-all group flex flex-col md:flex-row md:items-center gap-6"
                >
                  {/* Action Icon */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform ${
                    isDanger ? 'bg-red-50 text-red-500' : 
                    isSuccess ? 'bg-emerald-50 text-emerald-500' : 
                    'bg-indigo-50 text-indigo-500'
                  }`}>
                    {log.action.includes('ADMIN') ? <Shield size={24} /> : 
                     log.action.includes('STATUS') ? <Activity size={24} /> : 
                     <History size={24} />}
                  </div>

                  {/* Body */}
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                       <span className="text-[11px] font-black uppercase tracking-widest text-foreground bg-muted/40 px-3 py-1 rounded-lg border border-border/40">
                          {log.action.replace('_', ' ')}
                       </span>
                       <span className="text-text-hint text-[10px] font-bold uppercase tracking-tighter">
                          On {log.targetType} • {log.targetId?.slice(0, 8) || "System"}
                       </span>
                    </div>
                    <p className="text-sm font-medium text-text-secondary leading-relaxed break-all">
                       {log.details || "Administrative override performed without supplementary metadata."}
                    </p>
                  </div>

                  {/* Metadata Sidebar */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 pt-4 md:pt-0 border-t md:border-t-0 md:border-s border-border md:ps-8">
                     <div className="flex items-center gap-3">
                        <div className="text-right">
                           <p className="text-[10px] font-black uppercase tracking-tight text-foreground">{log.admin.name}</p>
                           <p className="text-[8px] font-bold text-text-hint uppercase tracking-widest">{log.admin.role}</p>
                        </div>
                        <CircularFrame src={log.admin.avatar} alt={log.admin.name[0]} size={32} border={true} />
                     </div>
                     <div className="flex items-center gap-2 text-text-hint">
                        <Clock size={12} />
                        <span className="text-[10px] font-bold tabular-nums">{new Date(log.createdAt).toLocaleString()}</span>
                     </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Simple Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-8">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-8 py-4 bg-card border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted disabled:opacity-30 transition-all shadow-sm active:scale-95"
                >
                  Earlier Signals
                </button>
                <div className="text-[10px] font-black uppercase tracking-widest text-text-hint">
                   Cluster {page} <span className="opacity-30">/</span> {totalPages}
                </div>
                <button 
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-8 py-4 bg-card border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted disabled:opacity-30 transition-all shadow-sm active:scale-95"
                >
                  Later Signals
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
