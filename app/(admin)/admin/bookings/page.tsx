"use client";

import React, { useState, useEffect } from "react";
import { 
  BookOpen, Search, Filter, Calendar, Clock, MapPin, 
  CheckCircle2, XCircle, AlertCircle, Loader2, ArrowRight,
  User as UserIcon, Briefcase, CreditCard, DollarSign, Activity, Zap, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import AdminTable from "@/components/AdminTable";
import CircularFrame from "@/components/CircularFrame";
import PageHeader from "@/components/PageHeader";

const statusConfig: any = {
  PENDING: { icon: Clock, color: "text-amber-500 bg-amber-50 border-amber-100", label: "Requested" },
  ACCEPTED: { icon: CheckCircle2, color: "text-blue-500 bg-blue-50 border-blue-100", label: "Confirmed" },
  IN_PROGRESS: { icon: Zap, color: "text-purple-500 bg-purple-50 border-purple-100", label: "In Progress" },
  COMPLETED: { icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50 border-emerald-100", label: "Finalized" },
  CANCELLED: { icon: XCircle, color: "text-red-500 bg-red-50 border-red-100", label: "Dismissed" },
};

export default function AdminBookingsPage() {
  const { showToast, setPageTitle } = useUI();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allProviders, setAllProviders] = useState<any[]>([]);
  const [isReassigning, setIsReassigning] = useState(false);

  useEffect(() => {
    setPageTitle("Booking Intelligence", "");
    fetchBookings();
    if (selectedBooking) fetchProviders();
  }, [page, statusFilter, selectedBooking, setPageTitle]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (page === 1) fetchBookings();
      else setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search,
        status: statusFilter === "ALL" ? "" : statusFilter
      });
      const res = await fetch(`/api/admin/manage-bookings?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setBookings(json.data);
        setTotalPages(json.pagination.totalPages);
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast("Error fetching bookings: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/admin/manage-users?role=PROVIDER&limit=100");
      const json = await res.json();
      if (json.success) setAllProviders(json.data);
    } catch (e) {
      console.error("Failed to fetch providers", e);
    }
  };

  const handleReassignProvider = async (providerId: string) => {
    if (!selectedBooking) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/manage-bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: selectedBooking.id, providerId })
      });
      const json = await res.json();
      if (json.success) {
        showToast("Provider reassigned successfully", "success");
        fetchBookings();
        setIsReassigning(false);
        setSelectedBooking(null);
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    if (!window.confirm(`Force update booking status to ${status}?`)) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/manage-bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Booking status forced to ${status}`, "success");
        fetchBookings();
        if (selectedBooking?.id === bookingId) setSelectedBooking(null);
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
      header: "Service Node",
      accessor: (booking: any) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Zap size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground font-black uppercase text-[11px] tracking-tight">{booking.service?.name || "Specialized Task"}</span>
            <span className="text-text-hint text-[9px] font-black uppercase tracking-widest">{booking.id.slice(0, 8)}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Parties",
      accessor: (booking: any) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <UserIcon size={10} className="text-primary" />
            <span className="text-[10px] font-bold text-foreground">Customer: {booking.customer?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase size={10} className="text-text-hint" />
            <span className="text-[10px] font-bold text-text-hint">Provider: {booking.provider?.user?.name || "Unassigned"}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Schedule",
      accessor: (booking: any) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-foreground">{new Date(booking.scheduledAt).toLocaleDateString()}</span>
          <span className="text-[10px] font-bold text-text-hint uppercase tracking-widest">{new Date(booking.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ),
    },
    {
      header: "Settlement",
      accessor: (booking: any) => (
        <div className="flex flex-col">
          <span className={`${unbounded.className} text-xs font-black text-foreground`}>Rs. {booking.totalPrice?.toLocaleString()}</span>
          <div className={`flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest ${
            booking.payment?.status === 'success' ? 'text-emerald-500' : 'text-amber-500'
          }`}>
            <CreditCard size={10} />
            {booking.payment?.status === 'success' ? 'Settled' : 'Pending'}
          </div>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (booking: any) => {
        const config = statusConfig[booking.status.toUpperCase()] || statusConfig.PENDING;
        const Icon = config.icon;
        return (
          <div className={`px-4 py-1.5 rounded-full inline-flex items-center gap-2 border text-[9px] font-black uppercase tracking-widest ${config.color}`}>
            <Icon size={12} />
            {config.label}
          </div>
        );
      },
    }
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="relative group min-w-[300px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-hint/50 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search by customer, provider, or node ID..."
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
          <option value="ALL">All Nodes</option>
          <option value="PENDING">Pending Approval</option>
          <option value="ACCEPTED">Active/Confirmed</option>
          <option value="IN_PROGRESS">Execution Phase</option>
          <option value="COMPLETED">Finalized Nodes</option>
          <option value="CANCELLED">Terminated Nodes</option>
        </select>
      </div>

      {/* Stats Quick HUD */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         {[
           { label: "Active Nodes", value: bookings.filter(b => b.status === "ACCEPTED").length, icon: Zap, color: "text-blue-500", bg: "bg-blue-50" },
           { label: "Execution Phase", value: bookings.filter(b => b.status === "IN_PROGRESS").length, icon: Activity, color: "text-purple-500", bg: "bg-purple-50" },
           { label: "Pending Resolve", value: bookings.filter(b => b.status === "PENDING").length, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
           { label: "Revenue Node", value: `Rs. ${bookings.reduce((acc, b) => acc + (b.payment?.status === 'success' ? b.totalPrice : 0), 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50" }
         ].map((stat, i) => (
           <div key={i} className="p-6 bg-card border border-border rounded-[32px] shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                 <stat.icon size={24} />
              </div>
              <div className="min-w-0">
                 <p className="text-[9px] font-black uppercase tracking-widest text-text-hint">{stat.label}</p>
                 <h4 className="text-lg font-black text-foreground truncate">{stat.value}</h4>
              </div>
           </div>
         ))}
      </div>

      {/* Main Table */}
      <AdminTable 
        data={bookings}
        columns={columns}
        isLoading={loading}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={setSelectedBooking}
        selectedId={selectedBooking?.id}
        emptyTitle="No Signal Detected"
        emptyDescription="System scan revealed no active or historical booking nodes."
      />

      {/* Booking Detail Overlayer */}
      <AnimatePresence>
        {selectedBooking && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setSelectedBooking(null)}
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
                      <Layers className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest">NODE INSPECTOR: {selectedBooking.id.slice(0,12)}</span>
                   </div>
                   <button onClick={() => setSelectedBooking(null)} className="p-3 hover:bg-muted rounded-2xl transition-all">
                      <XCircle size={24} className="text-text-hint" />
                   </button>
                </div>

                <div className="space-y-10">
                   <section className="bg-primary/5 border border-primary/10 p-8 rounded-[40px]">
                      <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-6">Service Overview</h4>
                      <h2 className={`${unbounded.className} text-2xl font-black mb-2`}>{selectedBooking.service?.name}</h2>
                      <div className="flex items-center gap-4 text-text-hint">
                         <div className="flex items-center gap-2 text-xs font-bold uppercase">
                            <MapPin size={14} /> {selectedBooking.location}
                         </div>
                      </div>
                   </section>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                         <h5 className="text-[9px] font-black uppercase tracking-widest text-text-hint ml-2">Customer Profile</h5>
                         <div className="p-5 bg-muted/40 rounded-3xl border border-border/50 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-text-disabled">
                               <UserIcon size={20} />
                            </div>
                            <div className="min-w-0">
                               <p className="text-xs font-black truncate">{selectedBooking.customer?.name}</p>
                               <p className="text-[9px] font-bold text-text-hint truncate">{selectedBooking.customer?.email}</p>
                            </div>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center px-2">
                            <h5 className="text-[9px] font-black uppercase tracking-widest text-text-hint">Assigned Professional</h5>
                            <button 
                                onClick={() => setIsReassigning(!isReassigning)}
                                className="text-[9px] font-black uppercase text-primary hover:underline"
                            >
                                {isReassigning ? "Cancel" : "Change"}
                            </button>
                         </div>
                         
                         {isReassigning ? (
                            <div className="space-y-3 max-h-[200px] overflow-y-auto no-scrollbar p-1 bg-muted/20 rounded-3xl">
                                {allProviders.map(p => (
                                    <button 
                                        key={p.id}
                                        onClick={() => handleReassignProvider(p.providerProfile?.id)}
                                        className="w-full p-4 bg-card hover:bg-primary/5 border border-border rounded-2xl flex items-center gap-3 transition-all text-left"
                                    >
                                        <CircularFrame src={p.profileImage} alt={p.name[0]} size={32} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black truncate">{p.name}</p>
                                            <p className="text-[8px] font-bold text-text-hint truncate">{p.providerProfile?.professionalTitle}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                         ) : (
                            <div className="p-5 bg-muted/40 rounded-3xl border border-border/50 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-primary">
                                    <Briefcase size={20} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black truncate">{selectedBooking.provider?.user?.name || "Pending Selection"}</p>
                                    <p className="text-[9px] font-bold text-text-hint truncate">{selectedBooking.provider?.professionalTitle || "No Context"}</p>
                                </div>
                            </div>
                         )}
                      </div>
                   </div>

                   <section className="p-8 bg-card border border-border rounded-[32px] space-y-6">
                      <div className="flex justify-between items-center pb-6 border-b border-border/50">
                         <div className="flex items-center gap-3">
                            <Calendar className="text-primary" size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Scheduled Deployment</span>
                         </div>
                         <p className="text-sm font-black">{new Date(selectedBooking.scheduledAt).toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                            <DollarSign className="text-emerald-500" size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Settlement Amount</span>
                         </div>
                         <p className={`${unbounded.className} text-xl font-black text-foreground`}>Rs. {selectedBooking.totalPrice?.toLocaleString()}</p>
                      </div>
                   </section>

                   <section className="p-8 bg-gray-900 rounded-[40px] text-white">
                      <h4 className={`${unbounded.className} text-[10px] font-black uppercase text-text-disabled mb-8`}>Node State Override</h4>
                      <div className="grid grid-cols-2 gap-4 auto-rows-fr">
                         {["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((status) => (
                           <button 
                             key={status}
                             onClick={() => handleUpdateStatus(selectedBooking.id, status)}
                             disabled={isProcessing || selectedBooking.status === status}
                             className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all active:scale-95 border ${
                               selectedBooking.status === status 
                               ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                               : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/60'
                             }`}
                           >
                             <span className="text-[8px] font-black uppercase tracking-wider">{status.replace('_', ' ')}</span>
                           </button>
                         ))}
                      </div>
                   </section>
                </div>
              </div>

              <div className="p-8 border-t border-border bg-card">
                 <button 
                  onClick={() => window.location.href = `/admin/messaging?bookingId=${selectedBooking.id}`}
                  className="w-full py-5 bg-muted hover:bg-muted/80 text-text-secondary rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
                 >
                   Open Node Support Channel <ArrowRight size={16} />
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
