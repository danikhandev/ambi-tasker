"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, XCircle, Search, Filter, 
  User, Briefcase, Calendar, MapPin, MoreVertical, MessageSquare, Loader2, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import AdminTable from "@/components/AdminTable";
import CircularFrame from "@/components/CircularFrame";

export default function ReportManagementPage() {
  const { setPageTitle, showToast } = useUI();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setPageTitle("Reports", "");
    fetchReports();
  }, [page, statusFilter, setPageTitle]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        status: statusFilter === "ALL" ? "" : statusFilter
      });
      const res = await fetch(`/api/admin/manage-reports?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setReports(json.data);
        setTotalPages(json.pagination.totalPages);
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast("Error fetching reports: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/manage-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Report marked as ${newStatus.toLowerCase()}`, "success");
        fetchReports();
        if (selectedReport?.id === reportId) setSelectedReport(null);
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
      header: "Reporter",
      accessor: (report: any) => (
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm ${
            report.status === 'PENDING' ? 'bg-amber-50 text-amber-500 border-amber-100' :
            report.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' :
            'bg-indigo-50 text-indigo-500 border-indigo-100'
          }`}>
            <AlertTriangle size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground font-black uppercase text-[11px] tracking-tight">{report.reporter.name}</span>
            <span className="text-text-hint text-[9px] font-bold uppercase tracking-widest">{report.category.replace('_', ' ')}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Booking",
      accessor: (report: any) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-foreground">{report.booking?.service?.name || "Global Conflict"}</span>
          <span className="text-[10px] font-bold text-text-hint uppercase tracking-widest">ID: {report.booking?.id?.slice(0, 8) || "N/A"}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (report: any) => (
        <div className={`px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border text-[9px] font-black uppercase tracking-widest ${
          report.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
          report.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
          report.status === 'REVIEWING' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
          'bg-gray-100 text-gray-500 border-gray-200'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            report.status === 'PENDING' ? 'bg-amber-500' :
            report.status === 'RESOLVED' ? 'bg-emerald-500' :
            'bg-indigo-500'
          }`} />
          {report.status}
        </div>
      ),
    },
    {
      header: "Timestamp",
      accessor: (report: any) => (
        <span className="text-xs font-bold text-text-hint tabular-nums">{new Date(report.createdAt).toLocaleDateString()}</span>
      ),
    }
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-end mb-8">
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-6 py-4 bg-card border border-border rounded-[20px] text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-primary/5 transition-all outline-none"
        >
          <option value="ALL">All Reports</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEWING">In Review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      <AdminTable 
        data={reports}
        columns={columns}
        isLoading={loading}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={setSelectedReport}
        selectedId={selectedReport?.id}
        emptyTitle="No Reports"
        emptyDescription="No reports found for the selected criteria."
      />

      {/* Report View Sidebar */}
      <AnimatePresence>
        {selectedReport && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedReport(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" 
            />
            <motion.div 
              initial={{ x: "100%" }} 
              animate={{ x: 0 }} 
              exit={{ x: "100%" }} 
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-screen w-full max-w-md bg-card border-l border-border z-[70] shadow-2xl p-0 flex flex-col"
            >
              <div className="p-10 flex-1 overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-start mb-12">
                   <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-full">
                      <AlertTriangle className="w-4 h-4 text-primary" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Report Details</span>
                   </div>
                   <button onClick={() => setSelectedReport(null)} className="p-3 hover:bg-muted rounded-2xl transition-all">
                      <XCircle size={24} className="text-text-hint" />
                   </button>
                </div>

                <div className="space-y-10">
                   <div className="p-8 bg-muted/40 rounded-[32px] border border-border">
                       <p className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-4">Description</p>
                      <p className="text-sm font-bold text-foreground leading-relaxed italic">
                        "{selectedReport.description}"
                      </p>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-card border border-border rounded-3xl">
                         <User className="text-primary mb-3" size={20} />
                         <p className="text-[8px] font-black text-text-hint uppercase tracking-widest mb-1">Reporter</p>
                         <p className="text-xs font-black truncate">{selectedReport.reporter.name}</p>
                      </div>
                      <div className="p-6 bg-card border border-border rounded-3xl">
                         <Briefcase className="text-primary mb-3" size={20} />
                          <p className="text-[8px] font-black text-text-hint uppercase tracking-widest mb-1">Category</p>
                         <p className="text-xs font-black">{selectedReport.category.replace('_', ' ')}</p>
                      </div>
                   </div>

                   {selectedReport.booking && (
                     <div className="p-8 bg-gray-900 rounded-[40px] text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl opacity-50" />
                        <div className="flex items-center justify-between mb-8">
                            <h4 className={`${unbounded.className} text-[10px] font-black uppercase tracking-widest text-primary`}>Booking Details</h4>
                           <span className="text-[9px] font-black bg-white/10 px-3 py-1 rounded-full uppercase">ID: {selectedReport.bookingId.slice(0,8)}</span>
                        </div>
                        <div className="space-y-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                 <Calendar size={18} className="text-primary" />
                              </div>
                              <div>
                                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Service</p>
                                 <p className="text-xs font-black">{selectedReport.booking.service?.name}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                                 <Briefcase size={18} className="text-primary" />
                              </div>
                              <div>
                                  <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Provider</p>
                                 <p className="text-xs font-black">{selectedReport.booking.provider?.user?.name}</p>
                              </div>
                           </div>
                        </div>
                     </div>
                   )}
                </div>
              </div>

              <div className="p-8 border-t border-border bg-card">
                  <p className="text-[10px] font-black uppercase tracking-widest center text-center text-text-hint mb-6">Actions</p>
                 <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => handleUpdateStatus(selectedReport.id, "RESOLVED")}
                      disabled={isProcessing}
                      className="w-full py-4 px-6 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Mark as Resolved
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedReport.id, "REVIEWING")}
                      disabled={isProcessing}
                      className="w-full py-4 px-6 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />} Move to Reviewing
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedReport.id, "DISMISSED")}
                      disabled={isProcessing}
                      className="w-full py-4 px-6 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                    >
                      {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />} Dismiss Report
                    </button>
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
