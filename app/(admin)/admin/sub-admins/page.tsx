"use client";

import React, { useState, useEffect } from "react";
import { 
  Shield, Plus, Edit3, Trash2, Search, KeyRound, 
  CheckCircle2, XCircle, AlertCircle, Loader2, ArrowRight,
  User as UserIcon, ShieldCheck, ShieldAlert, Activity, Lock, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import AdminTable from "@/components/AdminTable";
import CircularFrame from "@/components/CircularFrame";
import PageHeader from "@/components/PageHeader";

const ALL_PERMISSIONS = [
  { value: "overview.view", label: "View Dashboard Stats" },
  { value: "users.view", label: "View User Directory" },
  { value: "users.manage", label: "Edit/Ban Users" },
  { value: "providers.view", label: "View Professional Matrix" },
  { value: "providers.manage", label: "KYC Audit Control" },
  { value: "bookings.view", label: "View Platform Activity" },
  { value: "bookings.manage", label: "Override Booking States" },
  { value: "services.view", label: "View Service Taxonomy" },
  { value: "services.manage", label: "Architect Categories" },
  { value: "locations.view", label: "View Regional Nodes" },
  { value: "locations.manage", label: "Modulate Regions" },
  { value: "reports.view", label: "View System Disputes" },
  { value: "reports.manage", label: "Resolve Case Files" },
  { value: "notifications.manage", label: "Orchestrate Broadcasts" },
  { value: "settings.view", label: "View System Settings" },
  { value: "settings.manage", label: "Modify Base Config" },
];

export default function SubAdminManagementPage() {
  const { showToast, setPageTitle } = useUI();
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "SUB_ADMIN",
    permissions: [] as string[]
  });

  useEffect(() => {
    setPageTitle("Admin Control", "");
    fetchAdmins();
  }, [setPageTitle]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/manage-admins");
      const json = await res.json();
      if (json.success) setAdmins(json.admins);
      else throw new Error(json.error);
    } catch (error: any) {
      showToast("Error fetching admins: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const isNew = !selectedAdmin;
      const res = await fetch("/api/admin/manage-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isNew ? "create" : "update",
          targetId: selectedAdmin?.id,
          ...formData
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Admin ${isNew ? 'registered' : 'updated'} successfully`, "success");
        fetchAdmins();
        setIsEditing(false);
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!window.confirm(`Permanently revoke access for ${email}?`)) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/manage-admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", targetId: id })
      });
      const json = await res.json();
      if (json.success) {
        showToast("Access revoked and node purged", "success");
        fetchAdmins();
      } else throw new Error(json.error);
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const columns = [
    {
      header: "Nodal Authority",
      accessor: (a: any) => (
        <div className="flex items-center gap-4">
          <CircularFrame src={a.avatar} alt={a.name[0]} size={42} border={true} />
          <div className="flex flex-col">
            <span className="text-foreground font-black uppercase text-[11px] tracking-tight">{a.name}</span>
            <span className="text-text-hint text-[9px] font-bold lowercase">{a.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "RBAC Tier",
      accessor: (a: any) => (
        <div className={`px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border text-[9px] font-black uppercase tracking-widest ${
          a.role === 'SUPER_ADMIN' ? 'bg-gray-950 text-white border-gray-800' : 'bg-primary/5 text-primary border-primary/20'
        }`}>
          {a.role === 'SUPER_ADMIN' ? <ShieldCheck size={10} /> : <Shield size={10} />}
          {a.role.replace('_', ' ')}
        </div>
      ),
    },
    {
      header: "Permit Clearance",
      accessor: (a: any) => (
        <div className="flex items-center gap-1.5">
           <span className="text-[10px] font-black text-foreground">{a.role === 'SUPER_ADMIN' ? 'FULL' : (a.permissions?.length || 0)}</span>
           <span className="text-[9px] font-black text-text-hint uppercase tracking-widest">Modules</span>
        </div>
      ),
    },
    {
      header: "Auth State",
      accessor: (a: any) => (
        <div className={`flex items-center gap-2 ${a.isActive ? 'text-emerald-500' : 'text-red-500'}`}>
           {a.isActive ? <CheckCircle2 size={14} /> : <Lock size={14} />}
           <span className="text-[9px] font-black uppercase tracking-widest">{a.isActive ? 'Authorized' : 'Locked'}</span>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (a: any) => (
        <div className="flex items-center gap-2">
           <button 
            onClick={() => { setSelectedAdmin(a); setFormData({...a, password: ""}); setIsEditing(true); }}
            className="p-2 hover:bg-primary/10 text-text-hint hover:text-primary rounded-xl transition-all"
           >
              <Edit3 size={16} />
           </button>
           {a.role !== 'SUPER_ADMIN' && (
             <button 
              onClick={() => handleDelete(a.id, a.email)}
              className="p-2 hover:bg-red-50 text-text-hint hover:text-red-500 rounded-xl transition-all"
             >
                <Trash2 size={16} />
             </button>
           )}
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-end mb-8">
        <button 
          onClick={() => { setSelectedAdmin(null); setFormData({name: "", email: "", password: "", role: "SUB_ADMIN", permissions: []}); setIsEditing(true); }}
          className="px-8 py-4 bg-gray-950 text-white text-[10px] font-black uppercase tracking-widest rounded-[20px] shadow-lg shadow-gray-950/20 hover:bg-primary transition-all flex items-center gap-3"
        >
          <Plus size={16} /> Register New Authority
        </button>
      </div>

      {/* Main Table */}
      <AdminTable 
        data={admins}
        columns={columns}
        isLoading={loading}
        emptyTitle="No Secondary Authorities"
        emptyDescription="System only detects primary SuperAdmin nodes."
      />

      {/* Permissions Modal */}
      <AnimatePresence>
        {isEditing && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 m-auto w-full max-w-2xl h-[90vh] bg-card border border-border rounded-[48px] shadow-2xl z-[70] overflow-hidden flex flex-col"
            >
                <div className="p-10 border-b border-border flex justify-between items-center bg-muted/20">
                   <div className="space-y-1">
                      <h3 className={`${unbounded.className} text-xl font-black`}>{selectedAdmin ? 'Configure' : 'Initialize'} <span className="text-primary italic">Node</span></h3>
                      <p className="text-[10px] font-black text-text-hint uppercase tracking-widest">Authority Clearance Protocol</p>
                   </div>
                   <button type="button" onClick={() => setIsEditing(false)} className="p-4 hover:bg-muted rounded-3xl transition-all text-text-hint hover:text-foreground">
                      <XCircle size={24} />
                   </button>
                </div>

                <div className="p-12 space-y-10 flex-1 overflow-y-auto no-scrollbar">
                   <section className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-2">Display Identity</label>
                         <input 
                           required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                           className="w-full px-8 py-5 bg-muted/50 rounded-3xl border-none focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                           placeholder="e.g. Operation Chief"
                         />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-2">Uplink Email</label>
                         <input 
                           required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                           className="w-full px-8 py-5 bg-muted/50 rounded-3xl border-none focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                           placeholder="admin@ambitasker.com"
                         />
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-2">Access Key {selectedAdmin && '(Leave empty to keep current)'}</label>
                         <div className="relative">
                            <KeyRound className="absolute left-6 top-1/2 -translate-y-1/2 text-text-hint" size={18} />
                            <input 
                              type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                              className="w-full pl-16 pr-8 py-5 bg-muted/50 rounded-3xl border-none focus:ring-4 focus:ring-primary/10 transition-all font-bold"
                              placeholder="••••••••"
                              required={!selectedAdmin}
                            />
                         </div>
                      </div>
                      <div className="space-y-4">
                         <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-2">Nodal Clearance Level</label>
                         <select 
                           value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                           className="w-full px-8 py-5 bg-muted/50 rounded-3xl border-none focus:ring-4 focus:ring-primary/10 outline-none font-bold text-xs"
                           disabled={selectedAdmin?.role === 'SUPER_ADMIN'}
                         >
                            <option value="SUB_ADMIN">Sub-Authority (Granular)</option>
                            <option value="SUPER_ADMIN">Primary Override (Full Core)</option>
                         </select>
                      </div>
                   </section>

                   {formData.role === 'SUB_ADMIN' && (
                     <section className="space-y-6">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-hint ml-2">Module Clearances</h4>
                           <button 
                            type="button" 
                            onClick={() => setFormData({...formData, permissions: ALL_PERMISSIONS.map(p => p.value)})}
                            className="text-[9px] font-black text-primary uppercase hover:underline"
                           >
                             Grant All
                           </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           {ALL_PERMISSIONS.map((perm) => (
                             <label 
                               key={perm.value}
                               className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${
                                 formData.permissions.includes(perm.value) 
                                 ? 'bg-primary/5 border-primary/20 text-primary' 
                                 : 'bg-card border-border hover:border-primary/20 hover:bg-muted/10'
                               }`}
                             >
                               <span className="text-[10px] font-black uppercase tracking-tight">{perm.label}</span>
                               <input 
                                 type="checkbox" 
                                 className="hidden"
                                 checked={formData.permissions.includes(perm.value)}
                                 onChange={() => togglePermission(perm.value)}
                               />
                               <div className={`w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center ${
                                 formData.permissions.includes(perm.value) ? 'bg-primary border-primary' : 'border-border group-hover:border-primary/30'
                               }`}>
                                  {formData.permissions.includes(perm.value) && <CheckCircle2 size={12} className="text-white" />}
                               </div>
                             </label>
                           ))}
                        </div>
                     </section>
                   )}
                </div>

                <div className="p-10 bg-muted/30 border-t border-border flex gap-4">
                   <button 
                    type="button" onClick={() => setIsEditing(false)}
                    className="flex-1 py-5 bg-white text-text-secondary border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                   >
                     Cancel Link
                   </button>
                   <button 
                    type="submit" disabled={isProcessing}
                    className="flex-[2] py-5 bg-gray-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-primary transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                   >
                     {isProcessing ? <Loader2 className="animate-spin" size={18} /> : (
                       <>{selectedAdmin ? 'Sync Authority Data' : 'Establish authority Node'} <ShieldCheck size={18} /></>
                     )}
                   </button>
                </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
