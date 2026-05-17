"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import { useUI } from "@/contexts/UIContext";
import {
  Users,
  UserCheck,
  UserX,
  Mail,
  Send,
  Search,
  Filter,
  Download,
  Plus,
  Loader2,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";

export default function NewsletterDashboard() {
  const { t } = useTranslation();
  const { showToast, setPageTitle } = useUI();
  
  const [activeTab, setActiveTab] = useState<"subscribers" | "campaigns">("subscribers");
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, unsubscribed: 0 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Campaign States
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignContent, setCampaignContent] = useState("");
  const [sendingCampaign, setSendingCampaign] = useState(false);

  useEffect(() => {
    setPageTitle("Newsletter", "Management");
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (activeTab === "subscribers") fetchSubscribers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const fetchData = () => {
    if (activeTab === "subscribers") {
      fetchSubscribers();
    } else {
      fetchCampaigns();
    }
  };

  const fetchSubscribers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      
      const res = await fetch(`/api/admin/newsletter/subscribers?${params.toString()}`);
      const data = await res.json();
      
      if (data.success) {
        setSubscribers(data.subscribers);
        setMetrics(data.metrics);
      } else {
        showToast(data.error || "Failed to load subscribers", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/newsletter/campaigns");
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (err) {
      showToast("Failed to load campaigns", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscriber?")) return;
    try {
      const res = await fetch(`/api/admin/newsletter/subscribers?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Subscriber deleted", "success");
        fetchSubscribers();
      } else {
        showToast(data.error || "Failed to delete", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
  };

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignSubject || !campaignContent) {
      showToast("Subject and content are required", "error");
      return;
    }
    
    setSendingCampaign(true);
    try {
      const res = await fetch("/api/admin/newsletter/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: campaignSubject, content: campaignContent })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        setShowCampaignModal(false);
        setCampaignSubject("");
        setCampaignContent("");
        fetchCampaigns();
      } else {
        showToast(data.error || "Failed to send campaign", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setSendingCampaign(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Email", "Status", "Subscribed At", "Emails Sent"];
    const csvContent = [
      headers.join(","),
      ...subscribers.map(sub => [
        sub.email,
        sub.status,
        new Date(sub.subscribedAt).toLocaleString(),
        sub.emailsSent
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-6 rounded-[24px] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Total Subscribers</p>
            <h3 className="text-2xl font-black text-foreground">{metrics.total}</h3>
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-[24px] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Active</p>
            <h3 className="text-2xl font-black text-foreground">{metrics.active}</h3>
          </div>
        </div>
        <div className="bg-card border border-border p-6 rounded-[24px] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center text-red-500">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-text-secondary uppercase tracking-wider">Unsubscribed</p>
            <h3 className="text-2xl font-black text-foreground">{metrics.unsubscribed}</h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-8">
        <button
          onClick={() => setActiveTab("subscribers")}
          className={`pb-4 text-sm font-bold transition-colors relative ${
            activeTab === "subscribers" ? "text-primary" : "text-text-secondary hover:text-foreground"
          }`}
        >
          Subscribers
          {activeTab === "subscribers" && (
            <motion.div layoutId="newsletter-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={`pb-4 text-sm font-bold transition-colors relative ${
            activeTab === "campaigns" ? "text-primary" : "text-text-secondary hover:text-foreground"
          }`}
        >
          Email Campaigns
          {activeTab === "campaigns" && (
            <motion.div layoutId="newsletter-tab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-card rounded-[24px] border border-border shadow-sm overflow-hidden min-h-[400px]">
        {activeTab === "subscribers" ? (
          <div className="p-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-hint" />
                  <input
                    type="text"
                    placeholder="Search emails..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-muted/50 border border-border rounded-xl text-sm font-medium outline-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="UNSUBSCRIBED">Unsubscribed</option>
                </select>
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground text-sm font-bold rounded-xl hover:bg-secondary/80 transition-colors w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="py-4 px-4 text-[11px] font-black uppercase text-text-hint">Email</th>
                    <th className="py-4 px-4 text-[11px] font-black uppercase text-text-hint">Status</th>
                    <th className="py-4 px-4 text-[11px] font-black uppercase text-text-hint">Subscribed</th>
                    <th className="py-4 px-4 text-[11px] font-black uppercase text-text-hint">Emails Sent</th>
                    <th className="py-4 px-4 text-[11px] font-black uppercase text-text-hint text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-text-hint">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Loading subscribers...
                      </td>
                    </tr>
                  ) : subscribers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-text-hint">
                        No subscribers found.
                      </td>
                    </tr>
                  ) : (
                    subscribers.map((sub) => (
                      <tr key={sub.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-4 font-medium">{sub.email}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            sub.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                          }`}>
                            {sub.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-text-secondary">
                          {new Date(sub.subscribedAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 text-sm font-bold">
                          {sub.emailsSent}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => handleDeleteSubscriber(sub.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Subscriber"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Campaigns Toolbar */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-foreground">Campaign History</h2>
              <button
                onClick={() => setShowCampaignModal(true)}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" /> Create Campaign
              </button>
            </div>

            {/* Campaigns List */}
            <div className="space-y-4">
              {loading ? (
                <div className="py-12 text-center text-text-hint">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Loading campaigns...
                </div>
              ) : campaigns.length === 0 ? (
                <div className="py-12 text-center text-text-hint bg-muted/20 rounded-2xl border border-dashed border-border flex flex-col items-center">
                  <Mail className="w-12 h-12 text-border mb-4" />
                  <p className="font-bold text-foreground">No campaigns sent yet</p>
                  <p className="text-sm">Click "Create Campaign" to send your first newsletter.</p>
                </div>
              ) : (
                campaigns.map((camp) => (
                  <div key={camp.id} className="p-5 border border-border/50 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-border transition-colors">
                    <div>
                      <h3 className="font-bold text-foreground mb-1">{camp.subject}</h3>
                      <div className="flex items-center gap-4 text-xs font-medium text-text-secondary">
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(camp.createdAt).toLocaleString()}</span>
                        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {camp.recipientCount} Recipients</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-text-hint mb-0.5">Delivered</p>
                        <p className="font-bold text-green-600">{camp.successfulCount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-text-hint mb-0.5">Failed</p>
                        <p className="font-bold text-red-500">{camp.failedCount}</p>
                      </div>
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
                        camp.status === 'SENT' ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        {camp.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCampaignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-3xl rounded-[32px] shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                  <Send className="w-5 h-5 text-primary" /> New Campaign
                </h2>
                <button onClick={() => setShowCampaignModal(false)} className="p-2 bg-background rounded-full hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form id="campaign-form" onSubmit={handleSendCampaign} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2">Subject Line</label>
                    <input
                      type="text"
                      required
                      value={campaignSubject}
                      onChange={(e) => setCampaignSubject(e.target.value)}
                      placeholder="Exciting News from Ambi Tasker!"
                      className="w-full px-4 py-3 bg-background border border-border rounded-xl font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2">Email Content (HTML supported)</label>
                    <textarea
                      required
                      value={campaignContent}
                      onChange={(e) => setCampaignContent(e.target.value)}
                      placeholder="<h1>Hello!</h1><p>Write your newsletter here...</p>"
                      className="w-full h-64 px-4 py-3 bg-background border border-border rounded-xl font-medium focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm resize-none"
                    ></textarea>
                    <p className="text-xs text-text-hint mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Basic HTML is allowed. Unsubscribe link will be added automatically.
                    </p>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-border bg-muted/30 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-6 py-3 font-bold text-text-secondary hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="campaign-form"
                  disabled={sendingCampaign}
                  className="px-8 py-3 bg-primary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {sendingCampaign ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Sending to All Active...</>
                  ) : (
                    <><Send className="w-5 h-5" /> Send Campaign Now</>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
