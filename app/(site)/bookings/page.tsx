"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { unbounded } from "@/app/fonts";
import { Calendar, MapPin, Search, ChevronRight, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw, Navigation, Banknote } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";
import { motion, AnimatePresence } from "framer-motion";
import { useUI } from "@/contexts/UIContext";

export default function BookingsPage() {
  const { user } = useUser();
  const { showToast } = useUI();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED" | "CANCELLED">("ACTIVE");

  useEffect(() => {
    if (user) {
      fetchBookings();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings?role=customer");
      const json = await res.json();
      if (json.success && json.data) {
        setBookings(json.data);
      }
    } catch (err) {
      console.error("Fetch bookings failed:", err);
      showToast("Failed to load bookings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      const res = await fetch("/api/bookings/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: "Cancelled" })
      });
      const json = await res.json();
      if (json.success) {
        showToast("Booking cancelled successfully", "success");
        fetchBookings();
      } else {
        showToast(json.error || "Failed to cancel", "error");
      }
    } catch (err) {
      showToast("Network error", "error");
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === "ACTIVE") return ["Requested", "Accepted", "Arrived", "InProgress"].includes(b.status);
    if (activeTab === "COMPLETED") return b.status === "Completed";
    if (activeTab === "CANCELLED") return b.status === "Cancelled";
    return true;
  });

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "Requested": return { label: "Pending Provider", color: "bg-yellow-50 text-yellow-600 border-yellow-200", icon: Clock };
      case "Accepted": return { label: "Provider Accepted", color: "bg-blue-50 text-blue-600 border-blue-200", icon: CheckCircle2 };
      case "Arrived": return { label: "Provider Arrived", color: "bg-purple-50 text-purple-600 border-purple-200", icon: MapPin };
      case "InProgress": return { label: "Job in Progress", color: "bg-indigo-50 text-indigo-600 border-indigo-200", icon: RefreshCw };
      case "Completed": return { label: "Completed", color: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: CheckCircle2 };
      case "Cancelled": return { label: "Cancelled", color: "bg-red-50 text-red-600 border-red-200", icon: XCircle };
      default: return { label: status, color: "bg-gray-50 text-gray-600 border-gray-200", icon: AlertCircle };
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className={`${unbounded.className} text-2xl font-black mb-4`}>Login Required</h2>
          <p className="text-text-secondary mb-8">Please log in to view your bookings.</p>
          <Link href="/login" className="btn-primary px-8">Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card selection:bg-primary selection:text-white pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        
        <div className="mb-10">
          <h1 className={`${unbounded.className} text-3xl md:text-5xl font-black text-foreground mb-4`}>
            My <span className="text-primary">Bookings</span>
          </h1>
          <p className="text-text-secondary font-medium">Manage and track your service requests.</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-border mb-8 overflow-x-auto no-scrollbar">
          {(["ACTIVE", "COMPLETED", "CANCELLED"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 px-2 text-[11px] font-black uppercase tracking-[0.1em] transition-all relative whitespace-nowrap ${
                activeTab === tab ? "text-primary" : "text-text-hint hover:text-foreground"
              }`}
            >
              {tab} Bookings
              {activeTab === tab && (
                <motion.div layoutId="bookingsTab" className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-10">
            <EmptyState 
              icon={Search}
              title={`No ${activeTab.toLowerCase()} bookings`}
              description="You haven't requested any services in this category yet."
            />
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence>
              {filteredBookings.map((b) => {
                const Status = getStatusDisplay(b.status);
                const isTrackable = ["Accepted", "Arrived", "InProgress"].includes(b.status);
                const isCancellable = ["Requested", "Accepted"].includes(b.status);

                return (
                  <motion.div
                    key={b.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card border border-border rounded-[32px] p-6 md:p-8 hover:shadow-xl transition-all shadow-sm"
                  >
                    <div className="flex flex-col md:flex-row gap-6 justify-between">
                      
                      {/* Left: Provider & Service info */}
                      <div className="flex gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-muted shrink-0 overflow-hidden shadow-inner border border-border">
                          <img 
                            src={b.provider?.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.providerId}`} 
                            alt="Provider" 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border flex items-center gap-1 ${Status.color}`}>
                              <Status.icon className="w-3 h-3" /> {Status.label}
                            </span>
                            <span className="text-[10px] font-black text-text-hint uppercase tracking-widest">ID: {b.id.substring(0, 8)}</span>
                          </div>
                          <h3 className="text-xl font-black text-foreground mb-1">{b.service?.name}</h3>
                          <p className="text-sm font-bold text-text-secondary">with {b.provider?.user?.name || "Provider"}</p>
                        </div>
                      </div>

                      {/* Right: Price & Details */}
                      <div className="md:text-right flex flex-col justify-between">
                        <div>
                          <p className={`${unbounded.className} text-2xl font-black text-foreground`}>Rs. {b.totalPrice}</p>
                          <div className="flex items-center gap-1 md:justify-end text-[10px] font-black text-text-hint uppercase tracking-widest mt-1">
                            <Banknote className="w-3 h-3" /> {b.payment?.method || "CASH"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 text-sm font-medium text-text-secondary">
                        <Calendar className="w-4 h-4 text-primary" />
                        {b.scheduledAt ? new Date(b.scheduledAt).toLocaleString() : "Date not set"}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-medium text-text-secondary truncate">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">{b.location}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex flex-wrap gap-3">
                      {isTrackable && (
                        <Link 
                          href={`/track/${b.id}`} 
                          className="px-6 py-3 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all flex items-center gap-2"
                        >
                          <Navigation className="w-4 h-4" /> Track Provider
                        </Link>
                      )}
                      {b.status === "Completed" && !b.review && (
                        <Link 
                          href={`/provider/${b.providerId}?review=${b.id}`} 
                          className="px-6 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center gap-2"
                        >
                          Write a Review
                        </Link>
                      )}
                      <Link 
                        href={`/messages/${b.provider?.userId}`} 
                        className="px-6 py-3 bg-muted text-foreground border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-2"
                      >
                        Message
                      </Link>
                      {isCancellable && (
                        <button 
                          onClick={() => handleCancelBooking(b.id)}
                          className="px-6 py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all ml-auto"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
