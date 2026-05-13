"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Briefcase, Search, ShieldCheck, ShieldAlert, Star, MapPin, 
  CheckCircle2, XCircle, AlertCircle, Loader2, ArrowRight, Eye, Verified, Globe, Zap, Image as ImageIcon, ImageOff, Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import AdminTable from "@/components/AdminTable";
import CircularFrame from "@/components/CircularFrame";
import PageHeader from "@/components/PageHeader";
import ImageLightbox from "@/components/ImageLightbox";

interface ProviderImages {
  cnicFront: string | null;
  cnicBack: string | null;
  selfie: string | null;
  profileImage: string | null;
}

export default function ProviderManagementPage() {
  const { showToast, setPageTitle } = useUI();
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Image management state
  const [providerImages, setProviderImages] = useState<ProviderImages | null>(null);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    setPageTitle("Provider Matrix", "");
    fetchProviders();
  }, [page, statusFilter, setPageTitle]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (page === 1) fetchProviders();
      else setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch signed URLs when a provider is selected
  useEffect(() => {
    if (selectedProvider?.providerProfile?.id) {
      fetchProviderImages(selectedProvider.providerProfile.id);
    } else {
      setProviderImages(null);
    }
  }, [selectedProvider?.providerProfile?.id]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search,
        role: "PROVIDER" // Specifically filter for providers
      });
      const res = await fetch(`/api/admin/manage-users?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        // Filter by verification status client-side if needed, or update API to support it
        let data = json.data;
        if (statusFilter !== "ALL") {
          data = data.filter((p: any) => p.providerProfile?.verificationStatus === statusFilter);
        }
        setProviders(data);
        setTotalPages(json.pagination.totalPages);
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast("Error fetching providers: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderImages = async (providerProfileId: string) => {
    setImagesLoading(true);
    setProviderImages(null);
    try {
      const res = await fetch("/api/admin/provider-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerProfileId }),
      });
      const json = await res.json();
      if (json.success) {
        setProviderImages(json.data);
      } else {
        console.error("Failed to fetch provider images:", json.error);
      }
    } catch (error) {
      console.error("Error fetching provider images:", error);
    } finally {
      setImagesLoading(false);
    }
  };

  const handleUpdateKYC = async (providerId: string, status: string) => {
    let reason = "";
    if (status === "REJECTED") {
      reason = window.prompt("Enter rejection reason (e.g., blurred CNIC):") || "";
      if (!reason) {
        showToast("Rejection reason is required", "error");
        return;
      }
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/verifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, action: status, reason })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`KYC status updated to ${status}`, "success");
        fetchProviders();
        if (selectedProvider?.id === providerId) {
          setSelectedProvider({ 
            ...selectedProvider, 
            providerProfile: { ...selectedProvider.providerProfile, verificationStatus: status } 
          });
        }
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const getLightboxImages = useCallback(() => {
    if (!providerImages) return [];
    return [
      { url: providerImages.profileImage || "", label: "Profile Image" },
      { url: providerImages.selfie || "", label: "Live Selfie Verification" },
      { url: providerImages.cnicFront || "", label: "CNIC Front (Face Side)" },
      { url: providerImages.cnicBack || "", label: "CNIC Back (Address Side)" },
    ].filter(img => img.url); // Only include images that have URLs
  }, [providerImages]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const columns = [
    {
      header: "Professional / Identity",
      accessor: (provider: any) => (
        <div className="flex items-center gap-4">
          <CircularFrame src={provider.profileImage} alt={provider.name[0]} size={42} border={true} />
          <div className="flex flex-col">
            <span className="text-foreground font-black uppercase text-[11px] tracking-tight">{provider.name}</span>
            <span className="text-primary text-[9px] font-black uppercase tracking-widest">{provider.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Performance",
      accessor: (provider: any) => (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
            <Star size={10} className="fill-current" />
            <span className="text-[10px] font-black">{provider.providerProfile?.rating?.toFixed(1) || "0.0"}</span>
          </div>
          <span className="text-[10px] font-bold text-text-hint uppercase tracking-widest">{provider._count?.bookings || 0} Jobs</span>
        </div>
      ),
    },
    {
      header: "Images",
      accessor: (provider: any) => {
        const hasImages = provider.providerProfile?.cnicFrontUrl || provider.providerProfile?.selfieUrl || provider.profileImage;
        return (
          <button 
            onClick={(e) => { e.stopPropagation(); setSelectedProvider(provider); }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${
              hasImages ? "bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100" : "bg-gray-50 text-text-hint border-border"
            }`}
          >
            {hasImages ? <ImageIcon size={12} /> : <ImageOff size={12} />}
            View Images
          </button>
        );
      },
    },
    {
      header: "KYC Status",
      accessor: (provider: any) => {
        const status = provider.providerProfile?.verificationStatus || 'PENDING';
        return (
          <div className={`px-4 py-1.5 rounded-full inline-flex items-center gap-2 border text-[9px] font-black uppercase tracking-widest ${
            status === 'VERIFIED' ? 'bg-success/10 text-success border-success/20' :
            status === 'REJECTED' ? 'bg-danger/10 text-danger border-danger/20' :
            'bg-warning/10 text-warning border-warning/20'
          }`}>
            {status === 'VERIFIED' ? <ShieldCheck size={12} /> : status === 'REJECTED' ? <ShieldAlert size={12} /> : <AlertCircle size={12} />}
            {status}
          </div>
        );
      },
    },
    {
      header: "Joined",
      accessor: (provider: any) => (
        <span className="text-xs font-bold text-text-hint">{new Date(provider.createdAt).toLocaleDateString()}</span>
      ),
    }
  ];

  // Image card renderer for the sidebar
  const ImageCard = ({ label, url, loading: imgLoading, index }: { label: string; url: string | null | undefined; loading: boolean; index: number }) => {
    const [imgError, setImgError] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    return (
      <div className="p-6 bg-card border border-border rounded-3xl space-y-4">
        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
          <span className="text-text-secondary">{label}</span>
          {url && !imgError && (
            <button
              onClick={() => openLightbox(index)}
              className="flex items-center gap-1.5 px-3 py-1 bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-all"
            >
              <Eye size={10} /> Inspect
            </button>
          )}
        </div>
        <div className="aspect-video bg-muted rounded-2xl overflow-hidden relative border border-border flex items-center justify-center cursor-pointer group"
          onClick={() => url && !imgError ? openLightbox(index) : null}
        >
          {imgLoading ? (
            // Skeleton loader
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-full h-full bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse rounded-2xl" />
              <div className="absolute flex flex-col items-center gap-2">
                <Loader2 size={20} className="animate-spin text-text-hint/40" />
                <span className="text-[8px] font-black uppercase tracking-widest text-text-hint/40">Loading...</span>
              </div>
            </div>
          ) : url && !imgError ? (
            <>
              {!imgLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse rounded-2xl" />
              )}
              <img
                src={url}
                className={`w-full h-full object-cover transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-105`}
                alt={label}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest">
                  <Eye size={16} /> Full View
                </div>
              </div>
            </>
          ) : (
            <div className="text-center">
              <ImageOff size={32} className="mx-auto text-text-disabled mb-3" />
              <p className="text-[9px] font-black text-text-hint uppercase tracking-widest">
                {imgError ? "Failed to Load" : "Not Uploaded"}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="relative group min-w-[300px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-hint/50 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search specialists, services, or locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-card border border-border rounded-[20px] focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-bold text-sm"
          />
        </div>
        
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-6 py-4 bg-card border border-border rounded-[20px] text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-primary/5 transition-all outline-none"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending KYC</option>
          <option value="VERIFIED">Verified Only</option>
          <option value="REJECTED">Flagged Nodes</option>
        </select>
      </div>

      {/* Main Table */}
      <AdminTable 
        data={providers}
        columns={columns}
        isLoading={loading}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={setSelectedProvider}
        selectedId={selectedProvider?.id}
        emptyTitle="No Professionals Detected"
        emptyDescription="System analysis did not reveal any matching workforce modules."
      />

      {/* Provider Details Sidebar */}
      <AnimatePresence>
        {selectedProvider && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setSelectedProvider(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" 
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-screen w-full max-w-lg bg-card border-l border-border z-[70] shadow-2xl p-0 flex flex-col"
            >
              <div className="p-10 flex-1 overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-start mb-12">
                   <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-full">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest">KYC AUDIT TERMINAL</span>
                   </div>
                   <button onClick={() => setSelectedProvider(null)} className="p-3 hover:bg-muted rounded-2xl transition-all">
                      <XCircle size={24} className="text-text-hint" />
                   </button>
                </div>

                <div className="flex gap-8 items-center mb-12 bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[24px] border border-border">
                   <CircularFrame src={selectedProvider.profileImage} alt={selectedProvider.name[0]} size={100} border={true} />
                   <div className="flex-1 min-w-0">
                      <h2 className={`${unbounded.className} text-xl font-black text-slate-900 dark:text-white truncate`}>{selectedProvider.name}</h2>
                      <p className="text-xs font-black text-primary uppercase tracking-widest mt-1">{selectedProvider.providerProfile?.professionalTitle || "New Professional"}</p>
                      <div className="flex items-center gap-4 mt-4">
                         <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400">
                            <Star size={14} className="text-warning fill-current" />
                            {selectedProvider.providerProfile?.rating?.toFixed(1) || "0.0"}
                         </div>
                         <div className="w-1.5 h-1.5 rounded-full bg-border" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{selectedProvider._count?.bookings || 0} Successful Jobs</span>
                      </div>
                   </div>
                </div>

                <div className="space-y-10">
                   <section>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-hint mb-6 flex items-center gap-2">
                        <Zap size={14} className="text-primary" /> Professional Identity Verification
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Profile Image */}
                         <ImageCard
                           label="Profile Image"
                           url={providerImages?.profileImage}
                           loading={imagesLoading}
                           index={0}
                         />

                         {/* Selfie */}
                         <ImageCard
                           label="Selfie Verification"
                           url={providerImages?.selfie}
                           loading={imagesLoading}
                           index={1}
                         />

                         {/* CNIC Front */}
                         <ImageCard
                           label="ID Front"
                           url={providerImages?.cnicFront}
                           loading={imagesLoading}
                           index={2}
                         />

                         {/* CNIC Back */}
                         <ImageCard
                           label="ID Back"
                           url={providerImages?.cnicBack}
                           loading={imagesLoading}
                           index={3}
                         />
                      </div>
                   </section>

                   <section>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-hint mb-6">Regional Metrics</h4>
                      <div className="flex items-center gap-4 p-6 bg-primary/5 border border-primary/10 rounded-[32px]">
                         <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <Globe size={24} />
                         </div>
                         <div>
                            <p className="text-xs font-black text-foreground">{selectedProvider.area?.name || "Unmapped Area"}</p>
                            <p className="text-[10px] font-bold text-text-hint uppercase tracking-widest">{selectedProvider.district?.name || "System Base"}</p>
                         </div>
                      </div>
                   </section>

                   <div className="p-8 bg-gray-900 rounded-[40px] text-white">
                      <h4 className={`${unbounded.className} text-[10px] font-black uppercase text-text-disabled mb-6`}>KYC Status Modification</h4>
                      <div className="grid grid-cols-2 gap-4">
                         <button 
                          onClick={() => handleUpdateKYC(selectedProvider.providerProfile.id, 'VERIFIED')}
                          disabled={isProcessing || selectedProvider.providerProfile?.verificationStatus === 'VERIFIED'}
                          className="py-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                         >
                           <Verified size={16} /> Approve Access
                         </button>
                         <button 
                          onClick={() => handleUpdateKYC(selectedProvider.providerProfile.id, 'REJECTED')}
                          disabled={isProcessing || selectedProvider.providerProfile?.verificationStatus === 'REJECTED'}
                          className="py-4 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                         >
                           <ShieldAlert size={16} /> Flag/Reject
                         </button>
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-8 border-t border-border bg-card">
                 <button 
                  onClick={() => window.location.href = `/admin/messaging?to=${selectedProvider.id}`}
                  className="w-full py-5 bg-muted hover:bg-muted/80 text-text-secondary rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
                 >
                   Establish Secure Messaging Link <ArrowRight size={16} />
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Image Lightbox */}
      <ImageLightbox
        images={getLightboxImages()}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
