"use client";

import React, { useState, useEffect } from "react";
import { 
  CreditCard, Search, DollarSign, ArrowUpRight, ArrowDownRight, 
  CheckCircle2, Clock, XCircle, Loader2, Download, Filter, Activity, History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import AdminTable from "@/components/AdminTable";

export default function AdminPaymentsPage() {
  const { showToast, setPageTitle } = useUI();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  useEffect(() => {
    setPageTitle("Payments", "");
    fetchPayments();
  }, [page, statusFilter, setPageTitle]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (page === 1) fetchPayments();
      else setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search,
        status: statusFilter === "ALL" ? "" : statusFilter
      });
      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setPayments(json.data);
        setTotalPages(Math.ceil(json.total / 10));
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast("Error fetching payments: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      header: "Transaction",
      accessor: (p: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-text-hint">
             <CreditCard size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-hint">{p.transactionId}</span>
            <span className="text-xs font-black text-foreground">ID: {p.id.slice(0, 12)}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Participants",
      accessor: (p: any) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
             <span className="text-[10px] font-bold text-text-hint uppercase">From:</span>
             <span className="text-[10px] font-black text-foreground uppercase">{p.consumerName}</span>
          </div>
          <div className="flex items-center gap-1.5">
             <span className="text-[10px] font-bold text-text-hint uppercase">To:</span>
             <span className="text-[10px] font-black text-primary uppercase">{p.providerName}</span>
          </div>
        </div>
      ),
    },
    {
       header: "Service",
       accessor: (p: any) => (
         <span className="text-[10px] font-black uppercase tracking-tight text-foreground">{p.serviceTitle}</span>
       )
    },
    {
      header: "Amount",
      accessor: (p: any) => (
        <div className="flex flex-col">
          <span className={`${unbounded.className} text-xs font-black text-foreground tracking-tighter`}>Rs. {p.amount?.toLocaleString()}</span>
          <span className="text-[8px] font-black uppercase text-text-hint tracking-[0.2em]">{p.paymentMethod}</span>
        </div>
      ),
    },
    {
      header: "Date",
      accessor: (p: any) => (
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
          <span className="text-[9px] font-bold text-text-hint">{new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (p: any) => (
        <div className={`px-4 py-1.5 rounded-full inline-flex items-center gap-2 border text-[9px] font-black uppercase tracking-widest ${
          p.status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
          p.status === 'failed' ? 'bg-red-50 text-red-600 border-red-100' :
          'bg-amber-50 text-amber-600 border-amber-100'
        }`}>
          {p.status === 'success' ? <CheckCircle2 size={12} /> : p.status === 'failed' ? <XCircle size={12} /> : <Clock size={12} />}
          {p.status === 'success' ? 'Settled' : p.status === 'failed' ? 'Declined' : 'Processing'}
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-end mb-8">
        <div className="flex items-center gap-4">
           <button className="p-4 bg-card border border-border rounded-2xl hover:bg-muted transition-all text-text-hint hover:text-foreground shadow-sm">
              <Download size={20} />
           </button>
           <div className="flex bg-card p-1.5 rounded-2xl border border-border shadow-sm">
              {["ALL", "success", "pending"].map((f) => (
                <button 
                  key={f} 
                  onClick={() => setStatusFilter(f)}
                  className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === f ? "bg-gray-950 text-white shadow-xl" : "text-text-hint hover:text-foreground"}`}
                >
                  {f === "success" ? "Completed" : f === "pending" ? "Active" : "All"}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Total Revenue", value: `Rs. ${payments.reduce((acc, p) => acc + (p.status === 'success' ? p.amount : 0), 0).toLocaleString()}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Active Escrows", value: payments.filter(p => p.status === "pending").length, icon: Activity, color: "text-amber-500", bg: "bg-amber-50" },
            { label: "Success Rate", value: "98.4%", icon: History, color: "text-blue-500", bg: "bg-blue-50" }
          ].map((stat, i) => (
           <div key={i} className="p-8 bg-card border border-border rounded-[40px] shadow-sm flex items-center gap-6 group hover:border-primary/20 transition-all">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                 <stat.icon size={28} />
              </div>
              <div className="min-w-0">
                 <p className="text-[10px] font-black uppercase tracking-widest text-text-hint mb-1">{stat.label}</p>
                 <h4 className={`${unbounded.className} text-xl font-black text-foreground truncate`}>{stat.value}</h4>
              </div>
           </div>
         ))}
      </div>

      <div className="relative group">
         <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-hint/40 group-focus-within:text-primary transition-colors" />
         <input 
           type="text" 
           placeholder="Search by transaction ID, amount..."
           value={search}
           onChange={(e) => setSearch(e.target.value)}
           className="w-full pl-16 pr-8 py-5 bg-card border border-border rounded-[24px] focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-bold text-sm shadow-sm"
         />
      </div>

      <AdminTable 
        data={payments}
        columns={columns}
        isLoading={loading}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={setSelectedPayment}
        selectedId={selectedPayment?.id}
        emptyTitle="No Payments"
        emptyDescription="No transaction records found for the selected criteria."
      />

      <AnimatePresence>
        {selectedPayment && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={() => setSelectedPayment(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" 
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-screen w-full max-w-lg bg-card border-l border-border z-[70] shadow-2xl p-10 flex flex-col"
            >
               <div className="flex justify-between items-start mb-12">
                  <div className="flex items-center gap-3 px-5 py-2.5 bg-muted rounded-full">
                     <History className="w-4 h-4 text-primary" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Transaction Details</span>
                  </div>
                  <button onClick={() => setSelectedPayment(null)} className="p-3 hover:bg-muted rounded-2xl transition-all">
                     <XCircle size={24} className="text-text-hint" />
                  </button>
               </div>

               <div className="space-y-10 overflow-y-auto no-scrollbar flex-1 pr-2">
                  <div className="p-8 bg-gray-900 rounded-[40px] text-white relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl opacity-50" />
                     <p className="text-[10px] font-black text-text-disabled uppercase tracking-widest mb-4">Total Amount</p>
                     <h2 className={`${unbounded.className} text-4xl font-black text-primary`}>Rs. {selectedPayment.amount?.toLocaleString()}</h2>
                     <div className="mt-8 flex items-center gap-4">
                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          selectedPayment.status === 'success' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/20 text-amber-400 border-amber-500/20'
                        }`}>
                           {selectedPayment.status}
                        </div>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{selectedPayment.paymentMethod}</span>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-hint">Participants</h4>
                     <div className="grid grid-cols-1 gap-4">
                        <div className="p-6 bg-muted/30 border border-border/50 rounded-3xl">
                           <p className="text-[9px] font-black text-text-hint uppercase tracking-widest mb-3">Consumer</p>
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center font-black text-xs">C</div>
                              <p className="text-sm font-black text-foreground">{selectedPayment.consumerName}</p>
                           </div>
                        </div>
                        <div className="p-6 bg-muted/30 border border-border/50 rounded-3xl">
                           <p className="text-[9px] font-black text-text-hint uppercase tracking-widest mb-3">Provider</p>
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-black text-xs text-primary">P</div>
                              <p className="text-sm font-black text-foreground">{selectedPayment.providerName}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 bg-card border border-border rounded-[40px] space-y-6">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-hint mb-4">Details</h4>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center py-4 border-b border-border/40">
                           <span className="text-xs font-bold text-text-hint">Service Link</span>
                           <span className="text-xs font-black text-foreground uppercase">{selectedPayment.serviceTitle}</span>
                        </div>
                        <div className="flex justify-between items-center py-4 border-b border-border/40">
                           <span className="text-xs font-bold text-text-hint">Transaction ID</span>
                           <span className="text-xs font-black text-foreground uppercase">{selectedPayment.transactionId}</span>
                        </div>
                        <div className="flex justify-between items-center py-4">
                           <span className="text-xs font-bold text-text-hint">Timestamp</span>
                           <span className="text-xs font-black text-foreground">{new Date(selectedPayment.createdAt).toLocaleString()}</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="mt-10 pt-8 border-t border-border">
                  <button className="w-full py-5 bg-gray-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-lg shadow-gray-950/20">
                     Generate Receipt (PDF)
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
