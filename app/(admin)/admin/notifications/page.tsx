"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, Send, Search, Filter, Megaphone, Trash2, 
  CheckCircle2, XCircle, AlertCircle, Loader2, ArrowRight,
  Globe, Users, Shield, MessageSquare, Zap, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import AdminTable from "@/components/AdminTable";
import PageHeader from "@/components/PageHeader";

export default function AdminNotificationsPage() {
  const { showToast, setPageTitle } = useUI();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "GENERAL",
    targetType: "ALL_USERS",
    status: "sent"
  });

  useEffect(() => {
    setPageTitle("Nodal Distribution", "");
    fetchNotifications();
  }, [setPageTitle]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/notifications");
      const json = await res.json();
      if (json.success) setNotifications(json.data);
      else throw new Error(json.error);
    } catch (error: any) {
      showToast("Error fetching notifications: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        showToast("Broadcast success: System pulse distributed", "success");
        fetchNotifications();
        setIsCreating(false);
        setFormData({ title: "", message: "", type: "GENERAL", targetType: "ALL_USERS", status: "sent" });
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const columns = [
    {
      header: "Broadcast ID / Title",
      accessor: (n: any) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
             <Bell size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground font-black uppercase text-[11px] tracking-tight">{n.title}</span>
            <span className="text-text-hint text-[9px] font-black uppercase tracking-widest">{n.id.slice(0, 8)}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Target Sector",
      accessor: (n: any) => (
        <div className="flex items-center gap-2">
           <Users size={12} className="text-primary" />
           <span className="text-[10px] font-black uppercase tracking-widest text-text-hint">{n.target_role?.replace('_', ' ') || "All Nodes"}</span>
        </div>
      ),
    },
    {
      header: "Pulse Type",
      accessor: (n: any) => (
        <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
          n.type === 'ALERT' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-muted border-border/50 text-text-secondary'
        }`}>
           {n.type}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (n: any) => (
        <div className="flex items-center gap-2 text-emerald-500">
           <CheckCircle2 size={14} />
           <span className="text-[9px] font-black uppercase tracking-widest">Distributed</span>
        </div>
      ),
    },
    {
      header: "Timing",
      accessor: (n: any) => (
        <span className="text-xs font-bold text-text-hint">{new Date(n.created_at).toLocaleDateString()}</span>
      ),
    }
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-end mb-8">
        <button 
          onClick={() => setIsCreating(true)}
          className="px-8 py-4 bg-gray-950 text-white text-[10px] font-black uppercase tracking-widest rounded-[20px] shadow-lg shadow-gray-950/20 hover:bg-primary transition-all flex items-center gap-3"
        >
          <Send size={16} /> Initialize Broadcast
        </button>
      </div>

      {/* Stats HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="p-8 bg-card border border-border rounded-[40px] shadow-sm flex items-center justify-between group">
            <div className="space-y-1">
               <h4 className="text-[9px] font-black text-text-hint uppercase tracking-widest">Active Distributions</h4>
               <p className={`${unbounded.className} text-4xl font-black`}>{notifications.length}</p>
            </div>
            <div className="w-14 h-14 bg-primary/5 text-primary rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
               <Activity size={26} />
            </div>
         </div>
         <div className="lg:col-span-2 p-8 bg-gray-900 rounded-[48px] text-white shadow-xl flex items-center gap-10">
             <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-primary shrink-0">
                <Globe size={32} />
             </div>
             <div className="space-y-2 flex-1">
                <h3 className={`${unbounded.className} text-xl font-black`}>Global <span className="text-primary italic">Reach</span></h3>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-relaxed">Broadcast nodes distributed to 100% of the platform workforce and consumer matrix.</p>
             </div>
             <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[9px] font-black uppercase tracking-widest">Latency: 4ms</span>
             </div>
         </div>
      </div>

      {/* Main Table */}
      <AdminTable 
        data={notifications}
        columns={columns}
        isLoading={loading}
        emptyTitle="No Distribution History"
        emptyDescription="System communications logs are currently unpopulated."
      />

      {/* Create Modal */}
      <AnimatePresence>
        {isCreating && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreating(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 m-auto w-full max-w-xl h-fit bg-card border border-border rounded-[48px] shadow-2xl z-[70] overflow-hidden"
            >
              <form onSubmit={handleBroadcast}>
                <div className="p-10 border-b border-border flex justify-between items-center bg-muted/20">
                   <div className="space-y-1">
                      <h3 className={`${unbounded.className} text-xl font-black`}>New <span className="text-primary italic">Broadcast</span></h3>
                      <p className="text-[10px] font-black text-text-hint uppercase tracking-widest">System Signal Initialization</p>
                   </div>
                   <button type="button" onClick={() => setIsCreating(false)} className="p-4 hover:bg-muted rounded-3xl transition-all text-text-hint hover:text-foreground">
                      <XCircle size={24} />
                   </button>
                </div>

                <div className="p-12 space-y-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-2">Signal Subject</label>
                      <input 
                        required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full px-8 py-5 bg-muted/50 rounded-3xl border-none focus:ring-4 focus:ring-primary/10 transition-all font-bold placeholder:text-text-hint/40"
                        placeholder="e.g. Protocol Enhancement 4.2"
                      />
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-2">Broadcast Message</label>
                      <textarea 
                        required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}
                        className="w-full px-8 py-5 bg-muted/50 rounded-3xl border-none focus:ring-4 focus:ring-primary/10 transition-all font-bold h-32 no-scrollbar outline-none"
                        placeholder="Describe the system update or event..."
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-2">Target Sector</label>
                         <select 
                           value={formData.targetType} onChange={e => setFormData({...formData, targetType: e.target.value})}
                           className="w-full px-8 py-5 bg-muted/50 rounded-3xl border-none focus:ring-4 focus:ring-primary/10 outline-none font-bold text-xs"
                         >
                            <option value="ALL_USERS">Entire Matrix</option>
                            <option value="SPECIFIC_USER">Individual Customer</option>
                            <option value="ALL_PROVIDERS">All Professionals</option>
                         </select>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-2">Signal Type</label>
                         <select 
                           value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                           className="w-full px-8 py-5 bg-muted/50 rounded-3xl border-none focus:ring-4 focus:ring-primary/10 outline-none font-bold text-xs"
                         >
                            <option value="GENERAL">General Pulse</option>
                            <option value="SYSTEM">System Sync</option>
                            <option value="ALERT">High Priority Alert</option>
                            <option value="PROMOTION">Promotional Node</option>
                         </select>
                      </div>
                   </div>
                </div>

                <div className="p-10 bg-muted/30 border-t border-border flex gap-4">
                   <button 
                    type="button" onClick={() => setIsCreating(false)}
                    className="flex-1 py-5 bg-white text-text-secondary border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                   >
                     Abort Signal
                   </button>
                   <button 
                    type="submit" disabled={isProcessing}
                    className="flex-[2] py-5 bg-gray-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                     {isProcessing ? <Loader2 className="animate-spin" size={18} /> : (
                       <>Distribute Signal <Zap size={18} /></>
                     )}
                   </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>

  );
}
