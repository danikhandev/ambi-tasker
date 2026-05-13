"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, Edit3, Trash2, CheckCircle2, XCircle, 
  Loader2, Image as ImageIcon, Link as LinkIcon, 
  MoveUp, MoveDown, Palette, Type, ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import AdminTable from "@/components/AdminTable";
import PageHeader from "@/components/PageHeader";

export default function PosterManagementPage() {
  const { showToast, setPageTitle } = useUI();
  const [posters, setPosters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoster, setEditingPoster] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    link: "",
    buttonText: "Book Now",
    color: "from-primary/80 to-primary/90",
    order: 0,
    isActive: true
  });

  useEffect(() => {
    setPageTitle("Poster Matrix", "");
    fetchPosters();
  }, [setPageTitle]);

  const fetchPosters = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/posters");
      const json = await res.json();
      if (json.success) setPosters(json.data);
      else throw new Error(json.error);
    } catch (error: any) {
      showToast("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const method = editingPoster ? "PATCH" : "POST";
      const payload = editingPoster ? { id: editingPoster.id, ...formData } : formData;
      
      const res = await fetch("/api/admin/posters", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (json.success) {
        showToast(`Poster ${editingPoster ? "updated" : "created"} successfully`, "success");
        fetchPosters();
        closeModal();
      } else throw new Error(json.error);
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this poster?")) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/posters?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Poster deleted", "success");
        fetchPosters();
      } else throw new Error(json.error);
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleStatus = async (poster: any) => {
    try {
      const res = await fetch("/api/admin/posters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: poster.id, isActive: !poster.isActive })
      });
      const json = await res.json();
      if (json.success) {
        showToast("Status updated", "success");
        fetchPosters();
      }
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const openModal = (poster: any = null) => {
    if (poster) {
      setEditingPoster(poster);
      setFormData({
        title: poster.title,
        subtitle: poster.subtitle || "",
        imageUrl: poster.imageUrl,
        link: poster.link || "",
        buttonText: poster.buttonText || "Book Now",
        color: poster.color || "from-primary/80 to-primary/90",
        order: poster.order || 0,
        isActive: poster.isActive
      });
    } else {
      setEditingPoster(null);
      setFormData({
        title: "",
        subtitle: "",
        imageUrl: "",
        link: "",
        buttonText: "Book Now",
        color: "from-primary/80 to-primary/90",
        order: posters.length,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPoster(null);
  };

  const columns = [
    {
      header: "Preview",
      accessor: (p: any) => (
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-12 rounded-lg overflow-hidden border border-border">
            <img src={p.imageUrl} alt={p.title} className="object-cover w-full h-full" />
            <div className={`absolute inset-0 bg-gradient-to-r ${p.color} opacity-40`} />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black uppercase tracking-tight text-foreground">{p.title}</span>
            <span className="text-[9px] text-text-hint uppercase tracking-widest">{p.subtitle?.substring(0, 30)}...</span>
          </div>
        </div>
      ),
    },
    {
      header: "Config",
      accessor: (p: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary">
            <LinkIcon size={12} className="text-primary" /> {p.link || "No Link"}
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-text-hint">
            <Palette size={12} /> {p.color.split(' ')[0]}
          </div>
        </div>
      )
    },
    {
      header: "Order",
      accessor: (p: any) => (
        <div className="flex items-center gap-2">
           <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-xs font-black">{p.order}</span>
        </div>
      )
    },
    {
      header: "Status",
      accessor: (p: any) => (
        <button 
          onClick={() => handleToggleStatus(p)}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
            p.isActive 
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
              : "bg-red-50 text-red-600 border border-red-100"
          }`}
        >
          {p.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {p.isActive ? "Live" : "Disabled"}
        </button>
      ),
    },
    {
      header: "Actions",
      accessor: (p: any) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openModal(p)} className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all"><Edit3 size={16} /></button>
          <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-end mb-8">
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-3 px-6 h-12 bg-gray-950 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary transition-all shadow-lg shadow-gray-950/20 active:scale-95"
        >
          <Plus size={18} /> Deploy New Poster
        </button>
      </div>

      <div className="bg-card rounded-[40px] border border-border overflow-hidden shadow-xl">
        <AdminTable 
          columns={columns} 
          data={posters} 
          isLoading={loading} 
          emptyDescription="No posters found in the system."
        />
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-card rounded-[40px] border border-border p-10 shadow-2xl overflow-hidden"
            >
              <h2 className={`${unbounded.className} text-2xl font-black text-foreground mb-8`}>
                {editingPoster ? "Refactor" : "Initialize"} <span className="text-primary italic">Poster</span>
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Title</label>
                    <div className="relative">
                      <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={16} />
                      <input 
                        required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                        className="w-full h-14 bg-muted/30 border border-border rounded-2xl pl-12 pr-4 text-sm font-bold focus:border-primary/30 focus:outline-none transition-all"
                        placeholder="e.g. Master Plumbers"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Button Text</label>
                    <input 
                      required value={formData.buttonText} onChange={e => setFormData({...formData, buttonText: e.target.value})}
                      className="w-full h-14 bg-muted/30 border border-border rounded-2xl px-6 text-sm font-bold focus:border-primary/30 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Subtitle</label>
                  <textarea 
                    value={formData.subtitle} onChange={e => setFormData({...formData, subtitle: e.target.value})}
                    className="w-full p-6 bg-muted/30 border border-border rounded-2xl text-sm font-bold focus:border-primary/30 focus:outline-none transition-all min-h-[80px]"
                    placeholder="Brief description for the banner..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Image URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={16} />
                    <input 
                      required value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                      className="w-full h-14 bg-muted/30 border border-border rounded-2xl pl-12 pr-4 text-sm font-bold focus:border-primary/30 focus:outline-none transition-all"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Link URL</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={16} />
                      <input 
                        value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})}
                        className="w-full h-14 bg-muted/30 border border-border rounded-2xl pl-12 pr-4 text-sm font-bold focus:border-primary/30 focus:outline-none transition-all"
                        placeholder="/search?..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Color (Tailwind Gradients)</label>
                    <div className="relative">
                      <Palette className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={16} />
                      <input 
                        value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})}
                        className="w-full h-14 bg-muted/30 border border-border rounded-2xl pl-12 pr-4 text-sm font-bold focus:border-primary/30 focus:outline-none transition-all"
                        placeholder="from-blue-600/80 to-blue-900/80"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-text-hint uppercase tracking-widest">Order</span>
                       <input 
                         type="number" value={formData.order} onChange={e => setFormData({...formData, order: parseInt(e.target.value)})}
                         className="w-20 h-12 bg-muted/30 border border-border rounded-xl px-4 text-sm font-black"
                       />
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer group mt-4">
                      <div 
                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                        className={`w-12 h-6 rounded-full transition-all relative ${formData.isActive ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isActive ? "left-7" : "left-1"}`} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-hint group-hover:text-foreground">Live Status</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-4">
                    <button type="button" onClick={closeModal} className="px-8 h-14 text-[10px] font-black uppercase tracking-widest text-text-hint hover:text-foreground">Cancel</button>
                    <button 
                      disabled={isProcessing}
                      type="submit" 
                      className="px-10 h-14 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="animate-spin" size={18} /> : (editingPoster ? <CheckCircle2 size={18} /> : <Plus size={18} />)}
                      {editingPoster ? "Update Config" : "Deploy Node"}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
