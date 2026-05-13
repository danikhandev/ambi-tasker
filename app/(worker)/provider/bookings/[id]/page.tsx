"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Paperclip,
  MapPin,
  Navigation,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  Navigation2,
  MessageCircle,
  User,
  Calendar,
  Phone,
  AlertCircle,
  Loader2,
  Hash
} from 'lucide-react';
import Link from "next/link";
import dynamic from "next/dynamic";
import { unbounded } from "@/app/fonts";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/contexts/UserContext";
import { useUI } from "@/contexts/UIContext";
import CircularFrame from "@/components/CircularFrame";
import { supabase } from "@/services/supabase";

const ProviderJobMap = dynamic(() => import("@/components/ProviderJobMap"), { ssr: false });
import BookingSlip from "@/components/slips/BookingSlip";
import QRScanner from "@/components/QRScanner";

// Status labels mapping to DB booking_status values
const statusConfig: Record<string, { labelKey: string, color: string }> = {
  REQUESTED: { labelKey: "status.pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  PENDING: { labelKey: "status.pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  ACCEPTED: { labelKey: "status.accepted", color: "bg-blue-100 text-blue-700 border-blue-200" },
  ARRIVED: { labelKey: "status.arrived", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  IN_PROGRESS: { labelKey: "status.inProgress", color: "bg-purple-100 text-purple-700 border-purple-200" },
  COMPLETED: { labelKey: "status.completed", color: "bg-green-100 text-green-700 border-green-200" },
  CANCELLED: { labelKey: "status.cancelled", color: "bg-red-100 text-red-700 border-red-200" },
};

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

interface TimelineItem {
  status: string;
  date: string;
  note: string;
}

interface LocationData {
  address: string;
  lat: number;
  lng: number;
  city?: string;
  area?: string;
}

interface Job {
  id: string;
  service: string;
  consumer: string;
  consumerId: string;
  status: string;
  date: string;
  quotedPrice: number;
  description: string;
  attachments: Attachment[];
  location: string;
  locationData?: LocationData;
  timeline: TimelineItem[];
  paymentMethod: string;
}

function JobLocationMap({ locationData }: { locationData: LocationData }) {
  const { t, isRTL } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [distance, setDistance] = useState<string | null>(null);
  const [providerPos, setProviderPos] = useState<[number, number] | null>(null);

  // Calculate Haversine distance
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d < 1 ? `${(d * 1000).toFixed(0)} m` : `${d.toFixed(1)} km`;
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setProviderPos(pos);
        setDistance(calculateDistance(pos[0], pos[1], locationData.lat, locationData.lng));
      });
    }
  }, [locationData, calculateDistance]);

  const handleNavigate = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${locationData.lat},${locationData.lng}`,
      '_blank'
    );
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(locationData.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden"
    >
      <div className={`p-6 border-b border-border flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <div className={isRTL ? 'text-right' : ''}>
            <h3 className="font-bold text-foreground">{t("location.serviceLocationLabel") || "Service Location"}</h3>
            <p className="text-xs text-text-secondary truncate max-w-[180px]">{locationData.address}</p>
          </div>
        </div>
        {distance && (
          <div className="px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">{t("location.distance") || "Distance"}</p>
            <p className="text-xs font-black text-primary leading-none">{distance}</p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="w-full h-[250px] relative">
        <ProviderJobMap
          serviceLocation={[locationData.lat, locationData.lng]}
          providerLocation={providerPos}
        />
      </div>

      {/* Location Details */}
      <div className="p-5 space-y-4 text-left">
        <div className="grid grid-cols-2 gap-4">
          {locationData.city && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-text-hint mb-1">{t("location.city") || "City"}</p>
              <p className="text-sm font-bold text-foreground">{locationData.city}</p>
            </div>
          )}
          {locationData.area && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-text-hint mb-1">{t("location.area") || "Area"}</p>
              <p className="text-sm font-bold text-foreground">{locationData.area}</p>
            </div>
          )}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-text-hint mb-1">{t("location.latitude") || "Lat"}</p>
            <p className="text-xs font-mono font-bold text-text-secondary">{locationData.lat.toFixed(6)}</p>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-text-hint mb-1">{t("location.longitude") || "Lng"}</p>
            <p className="text-xs font-mono font-bold text-text-secondary">{locationData.lng.toFixed(6)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleNavigate}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold text-xs rounded-xl hover:bg-primary/90 transition-all active:scale-95"
          >
            <Navigation className="w-4 h-4" />
            {t("location.navigateToLocation") || "Navigate"}
          </button>
          <button
            onClick={handleCopyAddress}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-muted text-foreground font-bold text-xs rounded-xl hover:bg-muted/80 transition-all active:scale-95 border border-border"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
          <a
            href={`https://www.google.com/maps?q=${locationData.lat},${locationData.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 bg-muted text-foreground font-bold text-xs rounded-xl hover:bg-muted/80 transition-all active:scale-95 border border-border"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const { t, isRTL } = useTranslation();
  const { user } = useUser();
  const { showToast } = useUI();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showSlip, setShowSlip] = useState(false);
  const [slipData, setSlipData] = useState<any>(null);
  const [showScanner, setShowScanner] = useState(false);

  const isVerified = user?.idVerificationStatus === "VERIFIED";

  // Fetch job from Supabase
  useEffect(() => {
    async function fetchJob() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            consumer:profiles!user_id(*),
            service:services(*)
          `)
          .eq('id', params.id)
          .single();

        if (error) throw error;

        if (data) {
          // Parse enriched location: "Address ||| lat,lng"
          let locationStr = data.location || 'Unknown';
          let locData: LocationData | undefined = undefined;

          if (locationStr.includes(' ||| ')) {
            const [address, coords] = locationStr.split(' ||| ');
            const [lat, lng] = coords.split(',').map(Number);
            locationStr = address;
            locData = {
              address: address,
              lat,
              lng
            };
          }

          const transformedJob: Job = {
            id: data.id,
            service: data.service?.title || 'Specialized Task',
            consumer: data.consumer?.full_name || 'Client',
            consumerId: data.user_id,
            status: data.booking_status.toUpperCase(),
            date: data.scheduled_date,
            quotedPrice: Number(data.total_price),
            description: data.notes || 'No description provided.',
            attachments: [],
            location: locationStr,
            locationData: locData,
            timeline: [
              { status: data.booking_status.toUpperCase(), date: data.created_at, note: 'Booking created' },
            ],
            paymentMethod: data.payment_method || 'CASH',
          };
          setJob(transformedJob);
          setCurrentStatus(data.booking_status.toUpperCase());
        }
      } catch (err: any) {
        showToast('Error loading job: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) fetchJob();
  }, [params.id]);

  // Fetch slip if it exists
  useEffect(() => {
    async function fetchSlip() {
      if (!params.id) return;
      const { data, error } = await supabase
        .from('booking_slips')
        .select('*')
        .eq('booking_id', params.id)
        .single();
      
      if (data) {
        setSlipData({
          slipNumber: data.slip_number,
          generatedAt: data.generated_at,
          serviceTitle: data.service_title,
          providerName: data.provider_name,
          consumerName: data.consumer_name,
          totalAmount: data.total_amount,
          paymentMethod: data.payment_method,
          paymentStatus: data.payment_status,
          serviceDate: data.service_date,
          bookingId: data.booking_id
        });
      }
    }
    fetchSlip();
  }, [params.id, currentStatus]);

  // Real-time location updates when ACCEPTED (representing "On the way")
  useEffect(() => {
    let watchId: number;

    if (currentStatus === 'ACCEPTED' && user?.id) {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
              await fetch("/api/providers/location", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ latitude, longitude }),
              });
            } catch (err) {
              console.error("Error updating location via API:", err);
            }
          },
          (err) => console.error("Location watch error:", err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
        );
      }
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [currentStatus, user?.id]);

  // Real-time subscription for booking status changes
  useEffect(() => {
    if (!params.id) return;

    const channel = supabase
      .channel(`booking-${params.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${params.id}`,
      }, (payload) => {
        const newStatus = payload.new.booking_status?.toUpperCase();
        if (newStatus) {
          setCurrentStatus(newStatus);
          setJob(prev => prev ? { ...prev, status: newStatus } : null);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [params.id]);

  // Map DB booking_status values to what they should become
  const statusToDbValue: Record<string, string> = {
    ACCEPTED: 'accepted',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!job) return;
    setActionLoading(true);

    try {
      // Map frontend status to DB enum values
      const statusMap: Record<string, string> = {
        'PENDING': 'Requested',
        'ACCEPTED': 'Accepted',
        'ARRIVED': 'Arrived',
        'IN_PROGRESS': 'InProgress',
        'COMPLETED': 'Completed',
        'CANCELLED': 'Cancelled',
        'PAYMENT_RECEIVED': 'Completed',
      };

      const dbStatus = statusMap[newStatus] || newStatus;

      const response = await fetch("/api/bookings/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: job.id,
          status: dbStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update status");
      }

      // If completing (Payment Received), the API handles most things, but we might need extra for UI
      if (newStatus === 'PAYMENT_RECEIVED') {
        // Additional UI logic if needed
      }

      const statusInfo = statusConfig[newStatus as keyof typeof statusConfig];
      
      // Update local timeline
      const time = new Date().toISOString();
      const newTimelineItem = {
        status: newStatus,
        date: time,
        note: `Status updated to: ${t(statusInfo?.labelKey || newStatus)}`
      };

      setJob(prev => prev ? {
        ...prev,
        status: newStatus,
        timeline: [...prev.timeline, newTimelineItem]
      } : null);

      setCurrentStatus(newStatus);

      // --- GENERATE SLIP LOGIC (Frontend only visualization) ---
      if (newStatus === 'COMPLETED' || newStatus === 'PAYMENT_RECEIVED') {
        const slipNumber = `SU-REC-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${job.id.slice(0, 4).toUpperCase()}`;
        const providerName = user ? `${user.firstName} ${user.lastName}` : 'Expert Provider';
        
        // Update local slip data for instant preview
        setSlipData({
           slipNumber,
           generatedAt: new Date().toISOString(),
           serviceTitle: job.service,
           providerName: providerName,
           consumerName: job.consumer,
           totalAmount: job.quotedPrice,
           paymentMethod: job.paymentMethod || 'CASH',
           paymentStatus: newStatus === 'PAYMENT_RECEIVED' ? 'PAID' : 'PENDING',
           serviceDate: job.date,
           bookingId: job.id
        });
      }

      showToast(`Status Updated: ${t(statusInfo?.labelKey || newStatus)}`, "success");
    } catch (err: any) {
      showToast('Failed to update status: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQRScan = async (decodedText: string) => {
    if (!job) return;
    setShowScanner(false);
    setActionLoading(true);

    try {
      const response = await fetch(`/api/bookings/${job.id}/verify-arrival`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: decodedText }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Invalid arrival pass");
      }

      showToast("Arrival verified successfully!", "success");
      
      // Update local state to ARRIVED
      const time = new Date().toISOString();
      const newTimelineItem = {
        status: "ARRIVED",
        date: time,
        note: "Provider arrival verified via QR scan."
      };

      setJob(prev => prev ? {
        ...prev,
        status: "ARRIVED",
        timeline: [...prev.timeline, newTimelineItem]
      } : null);
      setCurrentStatus("ARRIVED");

    } catch (err: any) {
      showToast('Verification Failed: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-muted p-6 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex-1 bg-muted p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Job Not Found</h2>
          <Link href="/provider/bookings" className="text-primary hover:underline">Back to My Jobs</Link>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[currentStatus as keyof typeof statusConfig] || { labelKey: 'status.pending', color: 'bg-gray-100 text-gray-700' };
  const statusLabel = t(statusInfo.labelKey);
  const statusColor = statusInfo.color;

  return (
    <div className="flex-1 bg-muted p-6">
      <Link href="/provider/bookings" className={`inline-flex items-center gap-2 text-text-secondary hover:text-primary mb-6 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
        <ChevronLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
        {t("common.back") || "Back to My Bookings"}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-card rounded-2xl shadow-sm border border-border p-8"
        >
          <div className="border-b border-border pb-6 mb-6">
            <h1 className={`${unbounded.className} text-3xl font-bold text-foreground mb-2`}>{job.service}</h1>
            <div className="flex items-center gap-4 text-text-secondary">
              <span className={`font-semibold text-xs px-2 py-1 rounded-full border ${statusColor}`}>{statusLabel}</span>
              <span>•</span>
              <span>{new Date(job.date).toLocaleString()}</span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-foreground mb-4">Description</h3>
          <p className="text-text-secondary leading-relaxed mb-8">{job.description}</p>

          {job.attachments.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-bold text-foreground mb-4">Attachments</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {job.attachments.map((att: Attachment) => (
                  <a key={att.id} href={att.fileUrl} target="_blank" rel="noopener noreferrer" className="block relative group aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={att.fileUrl} alt={att.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Paperclip className="w-6 h-6 text-white" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <h3 className="text-lg font-bold text-foreground mb-4">Activity Timeline</h3>
          <div className="space-y-6">
            {job.timeline.map((item: TimelineItem, index: number) => (
              <div key={index} className="flex gap-4">
                <div className="relative">
                  <div className={`px-4 py-2 rounded-full border ${statusConfig[item.status as keyof typeof statusConfig]?.color || 'bg-gray-100'} font-black text-[10px] uppercase tracking-widest`}>
              {t(statusConfig[item.status as keyof typeof statusConfig]?.labelKey || "status.pending")}
            </div>
                  {index < job.timeline.length - 1 &&
                    <div className="absolute left-1/2 -translate-x-1/2 top-4 h-full w-0.5 bg-gray-200"></div>
                  }
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t(statusConfig[item.status as keyof typeof statusConfig]?.labelKey || item.status)}</p>
                  <p className="text-sm text-text-secondary">{item.note}</p>
                  <p className="text-xs text-text-hint mt-1">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card rounded-2xl shadow-sm border border-border p-6"
          >
            <h3 className="font-bold text-lg mb-4">{t("dashboard.jobActions") || "Job Actions"}</h3>
            <div className="flex justify-between items-center mb-4">
              <span className="text-text-secondary">Quoted Price:</span>
              <span className={`${unbounded.className} font-bold text-2xl text-foreground`}>Rs. {job.quotedPrice}</span>
            </div>

            {currentStatus === "PAYMENT_RECEIVED" ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full p-6 bg-emerald-50 border border-emerald-200 rounded-[32px] text-center"
              >
                <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-emerald-200">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h4 className={`${unbounded.className} text-lg font-black text-emerald-900 mb-1`}>Job Finalized!</h4>
                <p className="text-emerald-700 text-xs font-bold uppercase tracking-widest mb-4">Payment Confirmed</p>

                <div className="bg-white/60 rounded-2xl p-4 text-left border border-emerald-100 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">Job Payout</span>
                    <span className="font-black text-emerald-900">Rs. {job.quotedPrice}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-emerald-100">
                    <span className="text-[10px] font-black text-emerald-800/40 uppercase tracking-widest">Added to Wallet</span>
                    <span className="font-black text-primary">₨ {(job.quotedPrice * 0.9).toFixed(0)}</span>
                  </div>
                </div>

                <Link
                  href="/provider/earnings"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-white text-emerald-700 font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all border border-emerald-200"
                >
                  View Earnings <ExternalLink className="w-3 h-3" />
                </Link>
              </motion.div>
            ) : (
              <>
                {["PENDING", "REQUESTED"].includes(currentStatus) && (
                  <div className="space-y-4">
                    {/* Verification Warning for unverified providers */}
                    {!isVerified && (
                      <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3 shadow-sm">
                        <AlertTriangle className="text-amber-600 mt-0.5" size={18} />
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-normal">{t("settings.verificationRequired")}</p>
                          <p className="text-[10px] font-medium text-amber-700 leading-normal mt-1">
                            {t("settings.completeVerificationDesc")}
                          </p>
                          <Link href="/provider/verify" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline mt-2 inline-block">
                            {t("settings.verifyNow")}
                          </Link>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        disabled={!isVerified || actionLoading}
                        onClick={() => handleStatusUpdate("ACCEPTED")}
                        className={`flex-1 h-14 rounded-[20px] font-black text-xs uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 ${isVerified
                          ? "bg-gray-900 text-white hover:bg-primary hover:shadow-lg hover:shadow-primary/20 active:scale-95"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                      >
                        <CheckCircle size={18} />
                        {actionLoading ? '...' : (isVerified ? t("dashboard.acceptJob") : t("settings.verifiedAccountOnly"))}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate("CANCELLED")}
                         disabled={actionLoading}
                        className="flex-1 py-3.5 border border-red-200 text-red-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-red-50 transition-all disabled:opacity-50"
                      >
                        {t("dashboard.decline") || "Reject"}
                      </button>
                    </div>
                  </div>
                )}

                {currentStatus === "ACCEPTED" && (
                  <button onClick={() => setShowScanner(true)} disabled={actionLoading} className="w-full py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 mb-3 shadow-xl shadow-indigo-100">
                    {actionLoading ? 'Verifying...' : 'Verify Arrival (Scan QR)'}
                  </button>
                )}

                {currentStatus === "ARRIVED" && (
                  <button onClick={() => handleStatusUpdate("IN_PROGRESS")} disabled={actionLoading} className="w-full py-4 bg-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-purple-700 transition-all disabled:opacity-50 mb-3 shadow-xl shadow-purple-100">
                    {actionLoading ? 'Starting...' : 'Start Execution'}
                  </button>
                )}

                {currentStatus === "IN_PROGRESS" && (
                  <button onClick={() => handleStatusUpdate("COMPLETED")} disabled={actionLoading} className="w-full py-4 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary transition-all disabled:opacity-50 mb-3 shadow-xl shadow-black/10">
                    {actionLoading ? 'Completing...' : 'Finalize Deployment'}
                  </button>
                )}
              </>
            )}

            {currentStatus === "COMPLETED" && (
              <div className="space-y-3">
                <div className="p-4 bg-green-50 text-green-700 rounded-2xl border border-green-100 text-center font-bold text-sm">
                  Job Completed Successfully
                </div>
                {slipData && (
                  <button 
                    onClick={() => setShowSlip(true)}
                    className="w-full py-3 bg-gray-100 text-gray-900 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Hash size={16} /> View Booking Slip
                  </button>
                )}
                <button 
                  onClick={() => handleStatusUpdate("PAYMENT_RECEIVED")}
                  disabled={actionLoading}
                  className="w-full py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  {actionLoading ? 'Updating...' : 'Confirm Payment Received'}
                </button>
              </div>
            )}

            {currentStatus === "PAYMENT_RECEIVED" && slipData && (
               <button 
                 onClick={() => setShowSlip(true)}
                 className="w-full py-4 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 mb-6"
               >
                 View Final Receipt
               </button>
            )}

            <Link href={`/messages/${job.consumerId}`} className="block w-full py-3 border border-border text-text-secondary font-bold text-center rounded-xl hover:border-primary hover:text-primary transition-colors">
              {t("nav.messages") || "Message Consumer"}
            </Link>
          </motion.div>

          {/* Location Map for Provider */}
          {job.locationData && (
            <JobLocationMap locationData={job.locationData} />
          )}

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl shadow-sm border border-border p-6"
          >
            <h3 className="font-bold text-lg mb-4">{t("dashboard.customerInfo") || "Consumer Info"}</h3>
            <div className="flex items-center gap-4">
              <CircularFrame
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Asma"
                alt={job.consumer}
                size={48}
                border={true}
                className="shadow-sm"
              />
              <div>
                <p className="font-semibold text-foreground">{job.consumer}</p>
                <p className="text-sm text-text-secondary">ID: {job.consumerId}</p>
              </div>
            </div>
            <Link href={`/messages/${job.consumerId}`} className="block w-full py-2.5 mt-4 border border-border rounded-xl text-sm font-medium text-center hover:bg-muted hover:border-primary/30 hover:text-primary transition-colors active:scale-95 duration-200">
              Message Consumer
            </Link>
          </motion.div>
        </div>
      </div>
      
      {/* Booking Slip Modal */}
      {showSlip && slipData && (
        <BookingSlip 
          slip={slipData}
          onClose={() => setShowSlip(false)}
        />
      )}

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner 
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div >
  );
}
