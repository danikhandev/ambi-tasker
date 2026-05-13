"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, CheckCircle2, XCircle, MapPin, ChevronRight, Loader2, Save, X } from "lucide-react";
import { useUI } from "@/contexts/UIContext";
import AdminTable from "@/components/AdminTable";
import PageHeader from "@/components/PageHeader";
import { unbounded } from "@/app/fonts";
import { motion, AnimatePresence } from "framer-motion";

type LocationLevel = "country" | "province" | "district" | "city" | "area";

interface LocationItem {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
}

interface Breadcrumb {
  id: string;
  name: string;
  level: LocationLevel;
}

const LEVEL_ORDER: LocationLevel[] = ["country", "province", "district", "city", "area"];

export default function LocationsManagementPage() {
  const { showToast, setPageTitle } = useUI();
  
  const [currentLevel, setCurrentLevel] = useState<LocationLevel>("country");
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [data, setData] = useState<LocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LocationItem | null>(null);
  const [formData, setFormData] = useState({ name: "", code: "" });

  useEffect(() => {
    setPageTitle("Location Matrix", "");
    fetchData();
  }, [currentLevel, breadcrumbs, setPageTitle]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const parentId = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].id : null;
      let url = `/api/admin/locations?type=${currentLevel === 'country' ? 'countries' : currentLevel + 's'}`;
      if (parentId) {
        url += `&parentId=${parentId}`;
      }
      
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast("Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (item: LocationItem) => {
    const nextIndex = LEVEL_ORDER.indexOf(currentLevel) + 1;
    if (nextIndex < LEVEL_ORDER.length) {
      setBreadcrumbs([...breadcrumbs, { id: item.id, name: item.name, level: currentLevel }]);
      setCurrentLevel(LEVEL_ORDER[nextIndex]);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setBreadcrumbs([]);
      setCurrentLevel("country");
    } else {
      const targetBreadcrumb = breadcrumbs[index];
      setBreadcrumbs(breadcrumbs.slice(0, index + 1));
      setCurrentLevel(LEVEL_ORDER[LEVEL_ORDER.indexOf(targetBreadcrumb.level) + 1]);
    }
  };

  const handleToggleStatus = async (item: LocationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch("/api/admin/locations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: currentLevel, id: item.id, isActive: !item.isActive })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Status updated for ${item.name}`, "success");
        fetchData();
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast(error.message, "error");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this location? Note: You cannot delete locations that have sub-locations or are in use.")) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/locations?type=${currentLevel}&id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("Location deleted successfully", "success");
        fetchData();
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const openModal = (item: LocationItem | null = null, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItem(item);
    setFormData({ name: item?.name || "", code: item?.code || "" });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const method = editingItem ? "PATCH" : "POST";
      const payload: any = { type: currentLevel, name: formData.name };
      
      if (editingItem) {
        payload.id = editingItem.id;
      } else {
        if (currentLevel === "country") {
          payload.code = formData.code;
        } else {
          payload.parentId = breadcrumbs[breadcrumbs.length - 1].id;
        }
      }

      const res = await fetch("/api/admin/locations", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (json.success) {
        showToast(`${currentLevel} ${editingItem ? "updated" : "added"} successfully`, "success");
        fetchData();
        closeModal();
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
      header: "Name",
      accessor: (item: LocationItem) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <MapPin size={18} />
          </div>
          <div>
            <div className="font-bold text-foreground">{item.name}</div>
            {item.code && <div className="text-[10px] uppercase tracking-widest text-text-hint">{item.code}</div>}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (item: LocationItem) => (
        <button 
          onClick={(e) => handleToggleStatus(item, e)}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
            item.isActive 
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100" 
              : "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100"
          }`}
        >
          {item.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {item.isActive ? "Active" : "Disabled"}
        </button>
      ),
    },
    {
      header: "Actions",
      accessor: (item: LocationItem) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={(e) => openModal(item, e)} className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all"><Edit3 size={16} /></button>
          <button onClick={(e) => handleDelete(item.id, e)} className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-all"><Trash2 size={16} /></button>
          {currentLevel !== "area" && (
            <button onClick={() => handleRowClick(item)} className="p-2 hover:bg-muted text-text-secondary rounded-lg transition-all">
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-end mb-8">
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-3 px-6 h-12 bg-gray-950 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary transition-all shadow-lg shadow-gray-950/20 active:scale-95"
        >
          <Plus size={18} /> Add {currentLevel}
        </button>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar px-2">
        <button 
          onClick={() => handleBreadcrumbClick(-1)}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${breadcrumbs.length === 0 ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-muted text-text-secondary hover:bg-muted-foreground/10"}`}
        >
          All Countries
        </button>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight size={14} className="text-text-hint shrink-0" />
            <button 
              onClick={() => handleBreadcrumbClick(index)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${index === breadcrumbs.length - 1 ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-muted text-text-secondary hover:bg-muted-foreground/10"}`}
            >
              {crumb.name}
            </button>
          </React.Fragment>
        ))}
      </div>

      <div className="bg-card rounded-[40px] border border-border overflow-hidden shadow-xl">
        <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
          <h3 className="text-sm font-bold text-foreground capitalize">
            {currentLevel}s 
            <span className="text-text-hint font-medium ml-2">({data.length})</span>
          </h3>
          {currentLevel !== "area" && (
             <span className="text-xs font-medium text-text-hint">Click a row to view its sub-locations</span>
          )}
        </div>
        <AdminTable 
          columns={columns} 
          data={data} 
          isLoading={loading} 
          emptyDescription={`No ${currentLevel}s found. Add one to get started.`}
          onRowClick={currentLevel !== "area" ? handleRowClick : undefined}
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
              className="relative w-full max-w-lg bg-card rounded-[40px] border border-border p-10 shadow-2xl overflow-hidden"
            >
              <h2 className={`${unbounded.className} text-2xl font-black text-foreground mb-8 capitalize`}>
                {editingItem ? "Edit" : "Add"} <span className="text-primary italic">{currentLevel}</span>
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">{currentLevel} Name</label>
                  <input 
                    required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full h-14 bg-muted/30 border border-border rounded-2xl px-6 text-sm font-bold focus:border-primary/30 focus:outline-none transition-all"
                    placeholder={`e.g. ${currentLevel === 'country' ? 'Pakistan' : currentLevel === 'city' ? 'Haripur' : currentLevel === 'area' ? 'Shah Maqsood' : 'Name'}`}
                    autoFocus
                  />
                </div>
                
                {currentLevel === 'country' && !editingItem && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Country Code</label>
                    <input 
                      required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})}
                      className="w-full h-14 bg-muted/30 border border-border rounded-2xl px-6 text-sm font-bold focus:border-primary/30 focus:outline-none transition-all"
                      placeholder="e.g. PK"
                      maxLength={5}
                    />
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 h-14 bg-muted text-foreground text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-muted-foreground/10 transition-all">
                    Cancel
                  </button>
                  <button 
                    disabled={isProcessing}
                    type="submit" 
                    className="flex-1 h-14 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {editingItem ? "Save Changes" : "Add Node"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
