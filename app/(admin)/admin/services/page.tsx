"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, Edit3, Trash2, Search, Briefcase, 
  CheckCircle2, XCircle, Loader2, ArrowRight,
  ChevronRight, Activity, DollarSign, Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import AdminTable from "@/components/AdminTable";

export default function ServiceManagementPage() {
  const { showToast, setPageTitle } = useUI();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: 0,
    description: "",
    isActive: true
  });

  useEffect(() => {
    setPageTitle("Service Manager", "");
    fetchServices();
  }, [setPageTitle]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      const json = await res.json();
      if (json.success) {
        setServices(json.data);
      } else {
        throw new Error(json.error || "Failed to load services");
      }
    } catch (error: any) {
      showToast("Error fetching services: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const method = selectedService ? "PATCH" : "POST";
      const payload = selectedService ? { ...formData, id: selectedService.id } : formData;
      
      const res = await fetch("/api/admin/services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Service ${selectedService ? 'updated' : 'created'} successfully`, "success");
        fetchServices();
        setIsEditing(false);
        setSelectedService(null);
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure? This action cannot be undone.")) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Service deleted successfully", "success");
        fetchServices();
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Service Details",
      accessor: (srv: any) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
             <Briefcase size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground font-black uppercase text-[11px] tracking-tight">{srv.name}</span>
            <span className="text-text-hint text-[9px] font-bold truncate max-w-[200px]">{srv.description || "No description provided"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      accessor: (srv: any) => (
        <div className="flex items-center gap-2">
           <Tag size={12} className="text-text-disabled" />
           <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary bg-muted px-2 py-1 rounded-lg border border-border">
              {srv.category}
           </span>
        </div>
      ),
    },
    {
      header: "Pricing",
      accessor: (srv: any) => (
        <div className="flex items-center gap-1.5 font-black text-xs text-foreground">
           <span className="text-text-disabled font-medium">Rs.</span>
           {srv.price?.toLocaleString()}
        </div>
      ),
    },
    {
      header: "Usage",
      accessor: (srv: any) => (
        <div className="flex items-center gap-2 text-[10px] font-black text-text-hint">
           <Activity size={12} />
           {srv._count?.bookings || 0} Bookings
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (srv: any) => (
        <div className={`flex items-center gap-2 ${srv.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
           {srv.isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
           <span className="text-[9px] font-black uppercase tracking-widest">{srv.isActive ? 'Active' : 'Disabled'}</span>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (srv: any) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
           <button 
            onClick={() => { setSelectedService(srv); setFormData({
              name: srv.name,
              category: srv.category,
              price: srv.price,
              description: srv.description || "",
              isActive: srv.isActive
            }); setIsEditing(true); }}
            className="p-2 hover:bg-primary/10 text-text-hint hover:text-primary rounded-xl transition-all"
           >
              <Edit3 size={16} />
           </button>
           <button 
            onClick={() => handleDelete(srv.id)}
            className="p-2 hover:bg-rose-50 text-text-hint hover:text-rose-500 rounded-xl transition-all"
           >
              <Trash2 size={16} />
           </button>
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
        <div className="relative group flex-1 max-w-md">
           <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-hint/50 group-focus-within:text-primary transition-colors" />
           <input 
             type="text" 
             placeholder="Search services..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full pl-14 pr-6 py-4 bg-card border border-border rounded-[20px] focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-bold text-sm outline-none"
           />
        </div>
        
        <button 
          onClick={() => { setSelectedService(null); setFormData({name: "", category: "", price: 0, description: "", isActive: true}); setIsEditing(true); }}
          className="px-8 py-4 bg-gray-950 text-white text-[10px] font-black uppercase tracking-widest rounded-[20px] shadow-lg shadow-gray-950/20 hover:bg-primary transition-all flex items-center gap-3"
        >
          <Plus size={16} /> Add Service
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="p-8 bg-card border border-border rounded-[40px] shadow-sm group">
            <h4 className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-4">Total Services</h4>
            <div className="flex items-end justify-between">
               <span className={`${unbounded.className} text-4xl font-black`}>{services.length}</span>
               <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                  <Activity size={20} />
               </div>
            </div>
         </div>
         <div className="p-8 bg-gray-950 rounded-[40px] text-white shadow-xl">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Average Pricing</h4>
            <div className="flex items-end justify-between">
               <span className={`${unbounded.className} text-3xl font-black`}>
                  Rs. {services.length ? Math.round(services.reduce((acc, s) => acc + (s.price || 0), 0) / services.length).toLocaleString() : 0}
               </span>
               <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary">
                  <DollarSign size={20} />
               </div>
            </div>
         </div>
         <div className="p-8 bg-card border border-border rounded-[40px] shadow-sm">
            <h4 className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-4">Active Status</h4>
            <div className="flex items-center gap-3 text-emerald-500">
               <CheckCircle2 size={24} />
               <span className="text-sm font-black uppercase tracking-widest">
                  {services.filter(s => s.isActive).length} Services Online
               </span>
            </div>
         </div>
      </div>

      <AdminTable 
        data={filteredServices}
        columns={columns}
        isLoading={loading}
        onRowClick={(srv) => { setSelectedService(srv); setFormData({
          name: srv.name,
          category: srv.category,
          price: srv.price,
          description: srv.description || "",
          isActive: srv.isActive
        }); setIsEditing(true); }}
        emptyTitle="No Services Found"
        emptyDescription="System catalog is currently empty or does not match search criteria."
      />

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {isEditing && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditing(false)} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[60]" />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-xl h-fit bg-card border border-border rounded-[48px] shadow-2xl z-[70] overflow-hidden"
            >
              <form onSubmit={handleSave}>
                <div className="p-10 border-b border-border flex justify-between items-center bg-muted/20">
                   <div className="space-y-1">
                      <h3 className={`${unbounded.className} text-xl font-black`}>{selectedService ? 'Update' : 'Register'} <span className="text-primary italic">Service</span></h3>
                      <p className="text-[10px] font-black text-text-hint uppercase tracking-widest">Service Specification Terminal</p>
                   </div>
                   <button type="button" onClick={() => setIsEditing(false)} className="p-4 hover:bg-muted rounded-3xl transition-all text-text-hint hover:text-foreground">
                      <XCircle size={24} />
                   </button>
                </div>

                <div className="p-12 space-y-6">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Service Name</label>
                         <input 
                           required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                           className="w-full px-6 py-4 bg-muted/40 rounded-2xl border border-border/50 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-bold text-sm outline-none"
                           placeholder="e.g. Ceiling Fan Repair"
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Category</label>
                         <input 
                           required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                           className="w-full px-6 py-4 bg-muted/40 rounded-2xl border border-border/50 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-bold text-sm outline-none"
                           placeholder="e.g. Electrician"
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Base Price (Rs.)</label>
                         <input 
                           type="number" required value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                           className="w-full px-6 py-4 bg-muted/40 rounded-2xl border border-border/50 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-bold text-sm outline-none"
                           placeholder="500"
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Availability</label>
                         <button 
                           type="button"
                           onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                           className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${
                             formData.isActive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                           }`}
                         >
                            {formData.isActive ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                            {formData.isActive ? 'Enabled' : 'Disabled'}
                         </button>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Service Description</label>
                      <textarea 
                        value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                        className="w-full px-6 py-4 bg-muted/40 rounded-2xl border border-border/50 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-bold text-sm h-32 no-scrollbar outline-none"
                        placeholder="Define the scope of this service..."
                      />
                   </div>
                </div>

                <div className="p-10 bg-muted/20 border-t border-border flex gap-4">
                   <button 
                    type="button" onClick={() => setIsEditing(false)}
                    className="flex-1 py-5 bg-white text-text-secondary border border-border rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all active:scale-95"
                   >
                     Cancel
                   </button>
                   <button 
                    type="submit" disabled={isProcessing}
                    className="flex-[2] py-5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                   >
                     {isProcessing ? <Loader2 className="animate-spin" size={18} /> : (
                       <>{selectedService ? 'Save Changes' : 'Create Service'} <ArrowRight size={18} /></>
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
