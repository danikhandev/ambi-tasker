"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Users, Search, Filter, MoreVertical, Shield, ShieldAlert, CheckCircle2, XCircle, 
  Trash2, Mail, Phone, Calendar, MapPin, Briefcase, Star, AlertCircle, Loader2, ArrowRight, Edit3, Save, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSound } from "@/contexts/SoundContext";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import AdminTable from "@/components/AdminTable";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import CircularFrame from "@/components/CircularFrame";
import OnlineDot from "@/components/OnlineDot";
import { supabase } from "@/lib/supabaseClient";

export default function UserManagementPage() {
  const { setPageTitle, showToast } = useUI();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", role: "" });

  useEffect(() => {
    setPageTitle("User Management", "");
    fetchUsers();
  }, [page, roleFilter, setPageTitle]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (page === 1) fetchUsers();
      else setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    // ─── Real-time Status Subscriptions ──────────────────────────────
    const statusChannel = supabase
      .channel("admin-user-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          const updated = payload.new as any;
          setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, isOnline: updated.is_online } : u));
          if (selectedUser?.id === updated.id) {
            setSelectedUser((prev: any) => ({ ...prev, isOnline: updated.is_online }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [selectedUser?.id]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: search,
        role: roleFilter === "ALL" ? "" : roleFilter
      });
      const res = await fetch(`/api/admin/manage-users?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
        setTotalPages(json.pagination.totalPages);
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast("Error fetching users: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/manage-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, isActive: !user.isActive })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`, "success");
        fetchUsers();
        if (selectedUser?.id === user.id) setSelectedUser(null);
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/manage-users?userId=${userId}`, {
        method: "DELETE"
      });
      const json = await res.json();
      if (json.success) {
        showToast("User deleted successfully", "success");
        fetchUsers();
        setSelectedUser(null);
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateUser = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/manage-users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: selectedUser.id, 
          name: editForm.name, 
          phone: editForm.phone,
          role: editForm.role 
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast("User updated successfully", "success");
        fetchUsers();
        setIsEditing(false);
        setSelectedUser({ ...selectedUser, ...json.data });
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      showToast(error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const startEditing = (user: any) => {
    setEditForm({ name: user.name, phone: user.phone || "", role: user.role });
    setIsEditing(true);
  };

  const columns = [
    {
      header: "User",
      accessor: (user: any) => (
        <div className="flex items-center gap-4">
          <div className="relative">
            <CircularFrame src={user.profileImage} alt={user.name[0]} size={42} border={true} />
            <div className="absolute -bottom-0.5 -right-0.5 z-10">
               <OnlineDot isOnline={user.isOnline} size={10} />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-foreground font-black uppercase text-[11px] tracking-tight">{user.name}</span>
            <span className="text-text-hint text-[10px] font-bold lowercase">{user.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Role",
      accessor: (user: any) => (
        <div className={`px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border text-[9px] font-black uppercase tracking-widest ${
          user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
          user.role === 'PROVIDER' ? 'bg-purple-50 text-purple-600 border-purple-100' :
          user.role === 'SUPER_ADMIN' ? 'bg-gray-900 text-white' :
          'bg-blue-50 text-blue-600 border-blue-100'
        }`}>
          {user.role === 'PROVIDER' && <Briefcase size={10} />}
          {user.role === 'USER' && <Users size={10} />}
          {user.role}
        </div>
      ),
    },
    {
      header: "Location",
      accessor: (user: any) => (
        <div className="flex flex-col">
          <span className="text-xs font-black text-foreground">{user.area?.name || "Global"}</span>
          <span className="text-[10px] font-bold text-text-hint uppercase tracking-tighter">{user.district?.name || "Platform"}</span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: (user: any) => (
        <div className={`flex items-center gap-2 ${user.isActive ? 'text-emerald-500' : 'text-red-500'}`}>
          {user.isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          <span className="text-[10px] font-black uppercase tracking-widest">{user.isActive ? 'Active' : 'Banned'}</span>
        </div>
      ),
    },
    {
      header: "Verified",
      accessor: (user: any) => (
        <div className={user.isEmailVerified ? 'text-emerald-500' : 'text-amber-500'}>
          {user.isEmailVerified ? <Shield size={16} /> : <ShieldAlert size={16} />}
        </div>
      ),
    },
    {
      header: "Joined",
      accessor: (user: any) => (
        <span className="text-xs font-bold text-text-hint">{new Date(user.createdAt).toLocaleDateString()}</span>
      ),
    }
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="relative group min-w-[300px]">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-hint/50 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search by name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-card border border-border rounded-[20px] focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-bold text-sm"
          />
        </div>
        
        <select 
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-6 py-4 bg-card border border-border rounded-[20px] text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-primary/5 transition-all outline-none"
        >
          <option value="ALL">All Roles</option>
          <option value="USER">Customers</option>
          <option value="PROVIDER">Professionals</option>
          <option value="ADMIN">Administrators</option>
        </select>
      </div>

      {/* Main Table */}
      <AdminTable 
        data={users}
        columns={columns}
        isLoading={loading}
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRowClick={setSelectedUser}
        selectedId={selectedUser?.id}
        emptyTitle="No Data Found"
        emptyDescription="Search query did not return any participants."
      />

      {/* User Quick View Sidebar/Modal */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedUser(null)}
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
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-widest">User Details</span>
                   </div>
                    <button onClick={() => { setSelectedUser(null); setIsEditing(false); }} className="p-3 hover:bg-muted rounded-2xl transition-all">
                      <XCircle size={24} className="text-text-hint" />
                    </button>
                </div>

                <div className="text-center space-y-6 mb-12">
                   <div className="relative inline-block">
                      <CircularFrame src={selectedUser.profileImage} alt={selectedUser.name[0]} size={120} border={true} className="mx-auto" />
                      <div className="absolute bottom-2 right-2">
                         <OnlineDot isOnline={selectedUser.isOnline} size={24} />
                      </div>
                   </div>
                   
                   {!isEditing ? (
                     <div>
                        <h2 className={`${unbounded.className} text-2xl font-black text-foreground`}>{selectedUser.name}</h2>
                        <p className="text-xs font-bold text-text-hint uppercase tracking-widest mt-1">{selectedUser.role} ID: {selectedUser.id.slice(0,8)}</p>
                     </div>
                   ) : (
                     <div className="space-y-4 text-left pt-6">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Full Name</label>
                           <input 
                             value={editForm.name} 
                             onChange={e => setEditForm({...editForm, name: e.target.value})}
                             className="w-full h-12 bg-muted/40 border border-border rounded-2xl px-6 text-sm font-bold focus:border-primary/30 outline-none"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Role</label>
                           <select 
                             value={editForm.role} 
                             onChange={e => setEditForm({...editForm, role: e.target.value})}
                             className="w-full h-12 bg-muted/40 border border-border rounded-2xl px-6 text-xs font-black uppercase tracking-widest focus:border-primary/30 outline-none"
                           >
                             <option value="USER">Customer</option>
                             <option value="PROVIDER">Professional</option>
                             <option value="ADMIN">Administrator</option>
                           </select>
                        </div>
                     </div>
                   )}
                </div>

                <div className="space-y-8">
                   {!isEditing ? (
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-muted/40 rounded-3xl border border-border/50">
                           <Mail className="text-primary mb-3" size={20} />
                           <p className="text-[8px] font-black text-text-hint uppercase tracking-widest mb-1">Email Address</p>
                           <p className="text-xs font-bold text-foreground truncate">{selectedUser.email}</p>
                        </div>
                        <div className="p-6 bg-muted/40 rounded-3xl border border-border/50">
                           <Phone className="text-primary mb-3" size={20} />
                           <p className="text-[8px] font-black text-text-hint uppercase tracking-widest mb-1">Phone Number</p>
                           <p className="text-xs font-bold text-foreground">{selectedUser.phone || "Not Registered"}</p>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Phone Number</label>
                        <input 
                          value={editForm.phone} 
                          onChange={e => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full h-12 bg-muted/40 border border-border rounded-2xl px-6 text-sm font-bold focus:border-primary/30 outline-none"
                          placeholder="+92 3XX XXXXXXX"
                        />
                     </div>
                   )}

                   <div className="p-8 bg-gray-900 rounded-[32px] text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl opacity-50" />
                      <h4 className={`${unbounded.className} text-[10px] font-black uppercase tracking-widest mb-6 text-primary`}>User Activity</h4>
                      <div className="grid grid-cols-2 gap-8">
                         <div>
                            <p className="text-2xl font-black mb-1">{selectedUser._count?.bookings || 0}</p>
                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Total Bookings</p>
                         </div>
                         {selectedUser.role === 'PROVIDER' && (
                           <div>
                              <p className="text-2xl font-black mb-1 flex items-center gap-2">
                                {selectedUser.providerProfile?.rating?.toFixed(1) || "0.0"}
                                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                              </p>
                              <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Global Rating</p>
                           </div>
                         )}
                      </div>
                   </div>

                   {selectedUser.role === 'PROVIDER' && (
                     <div className="p-8 bg-muted/30 rounded-[32px] border border-border">
                        <div className="flex items-center gap-3 mb-6">
                           <Briefcase size={20} className="text-primary" />
                           <h4 className="text-[10px] font-black uppercase tracking-widest">Professional Context</h4>
                        </div>
                        <div className="space-y-4">
                           <div>
                              <p className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-1">Title</p>
                              <p className="text-sm font-bold">{selectedUser.providerProfile?.professionalTitle || "No Title Set"}</p>
                           </div>
                           <div className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border">
                              <span className="text-[10px] font-black uppercase tracking-widest">KYC Verification</span>
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                selectedUser.providerProfile?.verificationStatus === 'VERIFIED' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                              }`}>
                                {selectedUser.providerProfile?.verificationStatus || 'PENDING'}
                              </span>
                           </div>
                        </div>
                     </div>
                   )}
                </div>
              </div>

              <div className="p-8 border-t border-border bg-card flex gap-4">
                 {!isEditing ? (
                   <>
                     <button 
                      onClick={() => handleToggleStatus(selectedUser)}
                      disabled={isProcessing}
                      className={`flex-1 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        selectedUser.isActive 
                          ? 'bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100' 
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                      }`}
                     >
                       {isProcessing ? <Loader2 size={16} className="animate-spin mx-auto" /> : selectedUser.isActive ? 'Deactivate' : 'Activate'}
                     </button>
                     <button 
                      onClick={() => startEditing(selectedUser)}
                      disabled={isProcessing}
                      className="flex-1 py-4 px-6 bg-muted text-foreground border border-border rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-muted-foreground/10 transition-all flex items-center justify-center gap-2"
                     >
                       <Edit3 size={16} /> Edit
                     </button>
                     <button 
                      onClick={() => handleDeleteUser(selectedUser.id)}
                      disabled={isProcessing}
                      className="flex-1 py-4 px-6 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                     >
                       <Trash2 size={16} />
                     </button>
                   </>
                 ) : (
                   <>
                     <button 
                      onClick={() => setIsEditing(false)}
                      disabled={isProcessing}
                      className="flex-1 py-4 px-6 bg-muted text-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-muted-foreground/10 transition-all"
                     >
                       Cancel
                     </button>
                     <button 
                      onClick={handleUpdateUser}
                      disabled={isProcessing}
                      className="flex-[2] py-4 px-6 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                     >
                       {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                       Save Changes
                     </button>
                   </>
                 )}
              </div>
              <div className="p-8 pt-0 bg-card">
                 <button 
                  onClick={() => window.location.href = `/messages/${selectedUser.id}`}
                  className="w-full py-5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95"
                 >
                   Open Support Chat <MessageSquare size={16} />
                 </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
