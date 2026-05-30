"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, XCircle, Loader2, FileText, ArrowRight,
  Clock, DollarSign, Eye
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import AdminTable from "@/components/AdminTable";

export default function ApplicationsManagementPage() {
  const { showToast, setPageTitle } = useUI();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("PENDING");

  useEffect(() => {
    setPageTitle("Service Applications", "");
    fetchApplications();
  }, [setPageTitle, statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/services/applications?status=${statusFilter}`);
      const json = await res.json();
      if (json.success) {
        setApplications(json.data);
      } else {
        throw new Error(json.error || "Failed to load applications");
      }
    } catch (error: any) {
      showToast("Error fetching applications: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this service application?`)) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/services/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Application ${status.toLowerCase()} successfully`, "success");
        fetchApplications();
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredApps = applications.filter(a => 
    a.name?.toLowerCase().includes(search.toLowerCase()) || 
    a.provider?.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    {
      header: "Service Details",
      accessor: (app: any) => (
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
             <FileText size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground font-black uppercase text-[11px] tracking-tight">{app.name}</span>
            <span className="text-text-hint text-[9px] font-bold truncate max-w-[200px]">{app.description}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Provider",
      accessor: (app: any) => (
        <div className="flex flex-col">
           <span className="text-xs font-black text-foreground">{app.provider?.user?.name || "Unknown Provider"}</span>
           <span className="text-[10px] font-medium text-text-hint">{app.provider?.user?.email}</span>
        </div>
      ),
    },
    {
      header: "Category & Price",
      accessor: (app: any) => (
        <div className="flex flex-col gap-1">
           <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary bg-muted px-2 py-1 rounded-lg border border-border w-fit">
              {app.category}
           </span>
           <span className="text-xs font-bold text-foreground">Rs. {app.price?.toLocaleString()}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (app: any) => (
        <div className={`flex items-center gap-2 ${app.status === 'APPROVED' ? 'text-emerald-500' : app.status === 'REJECTED' ? 'text-rose-500' : 'text-amber-500'}`}>
           {app.status === 'APPROVED' ? <CheckCircle2 size={14} /> : app.status === 'REJECTED' ? <XCircle size={14} /> : <Clock size={14} />}
           <span className="text-[9px] font-black uppercase tracking-widest">{app.status}</span>
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (app: any) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
           {app.status === 'PENDING' ? (
               <>
                   <button 
                    onClick={() => handleUpdateStatus(app.id, 'APPROVED')}
                    disabled={isProcessing}
                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all"
                    title="Approve"
                   >
                      <CheckCircle2 size={16} />
                   </button>
                   <button 
                    onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                    disabled={isProcessing}
                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                    title="Reject"
                   >
                      <XCircle size={16} />
                   </button>
               </>
           ) : (
               <span className="text-text-disabled text-xs font-medium">Processed</span>
           )}
        </div>
      ),
    }
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-wrap items-center justify-between gap-6 mb-8">
         <div className="flex gap-2">
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(s => (
                <button
                   key={s}
                   onClick={() => setStatusFilter(s)}
                   className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-primary text-white' : 'bg-muted text-text-hint hover:bg-border'}`}
                >
                   {s}
                </button>
            ))}
         </div>
      </div>

      <AdminTable 
        data={filteredApps}
        columns={columns}
        isLoading={loading}
        emptyTitle="No Applications Found"
        emptyDescription={`There are currently no ${statusFilter.toLowerCase()} service applications.`}
      />
    </div>
  );
}
