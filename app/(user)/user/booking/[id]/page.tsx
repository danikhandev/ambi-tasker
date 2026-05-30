"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Star,
  Clock,
  MapPin,
  CreditCard,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Zap,
  MessageSquare,
  Send
} from "lucide-react";
import Link from "next/link";
import CircularFrame from "@/components/CircularFrame";
import { supabase } from "@/services/supabase";
import { useUI } from "@/contexts/UIContext";
import { unbounded } from "@/app/fonts";
import { QRCodeCanvas } from "qrcode.react";
import MapView from "@/components/map/MapView";

interface TimelineItem {
  status: string;
  date: string;
  note: string;
}

interface Review {
  id?: string;
  rating: number;
  comment: string;
  created_at?: string;
  status?: string;
}

interface ServiceRequest {
  id: string;
  service_title: string;
  provider_name: string;
  provider_avatar: string;
  provider_id: string;
  user_id: string; // Added user_id
  status: string;
  payment_status: string;
  payment_method: string;
  date: string;
  price: number;
  description: string;
  location: string;
  timeline: TimelineItem[];
  qr_token: string | null;
  latitude: number | null;
  longitude: number | null;
  provider_latitude: number | null;
  provider_longitude: number | null;
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useUI();
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Review state
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchRequestDetails();
      fetchReview();
    }
  }, [params.id]);

  const fetchRequestDetails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bookings/${params.id}`);
      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to fetch booking details");
      }

      const booking = json.data;

      // Build timeline from booking history or status
      const timeline: TimelineItem[] = [
        { status: 'PENDING', date: booking.createdAt, note: 'Service request initiated.' }
      ];

      if (['Accepted', 'Arrived', 'InProgress', 'Completed'].includes(booking.status)) {
        timeline.push({ status: 'ACCEPTED', date: booking.updatedAt, note: 'Provider accepted the request.' });
      }
      if (['InProgress', 'Completed'].includes(booking.status)) {
        timeline.push({ status: 'IN_PROGRESS', date: booking.updatedAt, note: 'Provider is currently working on the task.' });
      }
      if (booking.status === 'Completed') {
        timeline.push({ status: 'COMPLETED', date: booking.updatedAt, note: 'Task finalized by provider.' });
      }

      setRequest({
        id: booking.id,
        service_title: booking.service?.name || "Specialized Service",
        provider_name: booking.provider?.user?.name || "Provider",
        provider_avatar: booking.provider?.user?.profileImage || "",
        provider_id: booking.provider?.id,
        user_id: booking.userId,
        status: booking.status.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase(),
        payment_status: booking.payment?.status || "PENDING",
        payment_method: booking.payment?.method || "CASH",
        date: booking.scheduledAt || booking.createdAt,
        price: Number(booking.totalPrice),
        description: booking.notes || booking.service?.description || "No specific details provided.",
        location: booking.location,
        timeline: timeline.reverse(),
        qr_token: booking.qrToken,
        latitude: booking.latitude,
        longitude: booking.longitude,
        provider_latitude: booking.provider?.latitude,
        provider_longitude: booking.provider?.longitude,
      });

      if (booking.review) {
        setExistingReview(booking.review);
        setRating(booking.review.rating);
        setComment(booking.review.comment || "");
      }
    } catch (error: any) {
      showToast("Sync Interruption: " + error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!request) return;
    if (!window.confirm("Are you sure you want to dismiss this request?")) return;

    setIsProcessing(true);
    try {
      const res = await fetch("/api/bookings/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: request.id, status: "Cancelled" }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to cancel request");

      showToast("Request Dismissed successfully", "success");
      fetchRequestDetails();
    } catch (error: any) {
      showToast("Cancellation Failed: " + error.message, "error");
    } finally {
      setIsProcessing(true); // Wait, should be false
      setIsProcessing(false);
    }
  };

  const fetchReview = async () => {
    // Already included in fetchRequestDetails data
    if (request?.id) {
       // Refresh might be needed if review was just added
       fetchRequestDetails();
    }
  };

  const handlePayment = async () => {
    if (!request) return;
    setIsProcessing(true);
    try {
      if (request.payment_method === "ONLINE" || request.payment_method === "STRIPE") {
        const res = await fetch("/api/checkout", {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({ bookingId: request.id }),
        });
        const json = await res.json();
        if (json.url) {
           window.location.href = json.url;
           return;
        }
        throw new Error(json.error || "Failed to initiate payment");
      } else {
        // Handle User confirmation of completion
        const res = await fetch(`/api/bookings/${request.id}/confirm`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
        });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to confirm completion");
        
        showToast("Service Completion Confirmed! Earnings released to provider.", "success");
        fetchRequestDetails();
      }
    } catch (error: any) {
      showToast("Confirmation Failed: " + error.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const submitReview = async () => {
    if (rating === 0) {
      showToast("Please provide a rating.", "error");
      return;
    }
    if (!request) return;

    setIsSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            bookingId: request.id,
            rating,
            comment
         }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Failed to submit review");
      
      showToast("Review Posted: Thank you for your feedback!", "success");
      fetchRequestDetails(); // Refresh to show the new review
    } catch (error: any) {
      showToast("Post Failed: " + error.message, "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING": return { label: "Pending Review", color: "text-amber-500 bg-amber-50 border-amber-100", icon: Clock };
      case "ACCEPTED": return { label: "Confirmed", color: "text-blue-500 bg-blue-50 border-blue-100", icon: CheckCircle2 };
      case "ARRIVED": return { label: "Arrived", color: "text-indigo-500 bg-indigo-50 border-indigo-100", icon: MapPin };
      case "IN_PROGRESS": return { label: "In Progress", color: "text-purple-500 bg-purple-50 border-purple-100", icon: Zap };
      case "COMPLETED": return { label: "Finalized", color: "text-emerald-500 bg-emerald-50 border-emerald-100", icon: ShieldCheck };
      case "CANCELLED": return { label: "Dismissed", color: "text-red-500 bg-red-50 border-red-100", icon: AlertCircle };
      default: return { label: status, color: "text-text-secondary bg-muted border-border", icon: Clock };
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-muted/30 p-4 lg:p-10 space-y-8 animate-pulse">
        <div className="max-w-6xl mx-auto">
          <div className="h-6 w-48 bg-muted rounded-lg mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <div className="h-[400px] bg-card rounded-[40px] border border-border" />
              <div className="h-[300px] bg-card rounded-[40px] border border-border" />
            </div>
            <div className="space-y-8">
              <div className="h-[300px] bg-card rounded-[40px] border border-border" />
              <div className="h-[400px] bg-card rounded-[40px] border border-border" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex-1 p-6 text-center">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2">Request Not Found</h2>
        <p className="text-text-secondary mb-6">This node does not exist or has been fragmented.</p>
        <Link href="/user/bookings" className="text-primary font-bold hover:underline">Return to Hub</Link>
      </div>
    );
  }

  const statusConfig = getStatusConfig(request.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex-1 bg-muted/30 p-4 lg:p-10 space-y-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/user/bookings" className="inline-flex items-center gap-3 text-text-secondary hover:text-primary mb-8 group transition-all">
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-black uppercase tracking-widest">Return to All Bookings</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-8"
          >
            {/* Main Info Card */}
            <div className="bg-card rounded-[40px] shadow-2xl shadow-gray-200/50 border border-border overflow-hidden">
              <div className="p-8 lg:p-12 border-b border-border bg-gradient-to-br from-white to-muted/20">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                  <div>
                    <h1 className={`${unbounded.className} text-3xl lg:text-4xl font-black text-foreground mb-4 leading-tight`}>
                      {request.service_title}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className={`px-5 py-2 rounded-full border ${statusConfig.color} flex items-center gap-2 shadow-sm`}>
                        <StatusIcon size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{statusConfig.label}</span>
                      </div>
                      <div className="h-4 w-px bg-border mx-2 hidden md:block" />
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Clock size={14} />
                        <span className="text-xs font-bold">{new Date(request.date).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10 text-center min-w-[120px]">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Fee</p>
                    <p className={`${unbounded.className} text-2xl font-black text-foreground`}>Rs. {request.price}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-text-secondary bg-muted/50 p-4 rounded-2xl w-fit border border-border/50">
                  <MapPin size={16} className="text-primary" />
                  <span className="text-sm font-medium">{request.location}</span>
                </div>
              </div>

              <div className="p-8 lg:p-12 space-y-12">
                <section>
                  <h3 className={`${unbounded.className} text-xs font-black text-text-hint uppercase tracking-[0.3em] mb-6`}>Job Specification</h3>
                  <p className="text-text-secondary leading-relaxed text-lg font-medium bg-muted/20 p-8 rounded-3xl border border-dashed border-border">
                    {request.description}
                  </p>
                </section>

                {/* Live Location Map */}
                {(request.latitude || request.provider_latitude) && (
                  <section>
                    <h3 className={`${unbounded.className} text-xs font-black text-text-hint uppercase tracking-[0.3em] mb-6`}>Location Intelligence</h3>
                    <div className="h-[300px] w-full bg-muted/20 rounded-3xl overflow-hidden border border-border">
                      <MapView 
                        center={request.latitude ? [request.latitude, request.longitude!] : [request.provider_latitude!, request.provider_longitude!]}
                        zoom={14}
                        interactive={false}
                        markers={[
                          ...(request.latitude ? [{ id: 'user', lat: request.latitude, lng: request.longitude!, title: 'Service Location', type: 'user' as const }] : []),
                          ...(request.provider_latitude ? [{ id: 'provider', lat: request.provider_latitude, lng: request.provider_longitude!, title: 'Provider Location', type: 'provider' as const }] : [])
                        ]}
                      />
                    </div>
                  </section>
                )}

                <section>
                  <h3 className={`${unbounded.className} text-xs font-black text-text-hint uppercase tracking-[0.3em] mb-8`}>Deployment Timeline</h3>
                  <div className="space-y-10 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                    {request.timeline.map((item, index) => {
                      const itemConfig = getStatusConfig(item.status);
                      return (
                        <div key={index} className="flex gap-8 relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-md ${itemConfig.color.replace('text-', 'bg-')}`}>
                            <itemConfig.icon size={12} className="text-white" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <p className="font-black text-foreground text-sm uppercase tracking-widest">{itemConfig.label}</p>
                              <span className="text-[10px] font-black text-text-hint bg-muted px-2 py-0.5 rounded-lg">
                                {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm text-text-secondary font-medium">{item.note}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>

            {/* Review Section */}
            {request.payment_status === "COMPLETED" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-[40px] shadow-2xl border border-border overflow-hidden p-8 lg:p-12"
              >
                <div className="flex items-center gap-4 mb-8">
                   <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                      <MessageSquare size={24} />
                   </div>
                   <div>
                      <h3 className={`${unbounded.className} text-lg font-black text-foreground uppercase tracking-widest`}>
                        {existingReview ? "Your Feedback" : "Review Performance"}
                      </h3>
                      <p className="text-[10px] font-black text-text-hint uppercase tracking-widest">Share your experience with the community</p>
                   </div>
                </div>

                {existingReview ? (
                  <div className="bg-muted/30 rounded-[32px] p-8 border border-border">
                    <div className="flex items-center gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={24}
                          className={star <= existingReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                        />
                      ))}
                      <span className="ml-4 text-xs font-black text-text-hint uppercase tracking-widest">{existingReview.status} Node</span>
                    </div>
                    <p className="text-lg font-medium text-text-secondary leading-relaxed italic">
                    &quot;{existingReview.comment}&quot;
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-xs font-bold text-text-hint">
                      <Clock size={14} />
                      <span>Reviewed on {new Date(existingReview.created_at || "").toLocaleDateString()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    <div className="flex flex-col items-center justify-center py-6 bg-muted/20 rounded-3xl border border-dashed border-border gap-4">
                      <p className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em]">Select Intensity</p>
                      <div className="flex items-center gap-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-all hover:scale-125 focus:outline-none"
                          >
                            <Star
                              size={40}
                              className={`transition-colors ${
                                star <= (hoverRating || rating)
                                  ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Describe the engagement quality, technical proficiency, and professional conduct..."
                        className="w-full bg-muted/30 border border-border rounded-3xl p-6 min-h-[150px] focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium text-lg"
                      />
                    </div>

                    <button
                      disabled={isSubmittingReview || rating === 0}
                      onClick={submitReview}
                      className="w-full py-6 bg-gray-900 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-2xl hover:bg-primary transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isSubmittingReview ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                      Deploy Feedback Node
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>

          {/* Sidebar */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-[40px] shadow-xl border border-border p-8 text-center"
            >
              <h3 className={`${unbounded.className} text-[10px] font-black text-text-hint uppercase tracking-[0.3em] mb-8`}>Service Personnel</h3>
              <div className="flex flex-col items-center gap-4 mb-8">
                <CircularFrame
                  src={request.provider_avatar || "/default-avatar.svg"}
                  alt={request.provider_name}
                  size={100}
                  className="shadow-2xl border-4 border-white p-1 bg-gradient-to-br from-primary to-accent"
                />
                <div>
                  <p className="font-black text-xl text-foreground mb-1">{request.provider_name}</p>
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black text-text-hint">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>4.9 PROFESSIONAL</span>
                  </div>
                </div>
              </div>
              <Link
                href={`/messages?user=${request.provider_id}`}
                className="w-full py-5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary transition-all shadow-lg active:scale-95 flex items-center justify-center gap-3"
              >
                Secure Channel
              </Link>
            </motion.div>

            {/* Arrival Pass Card (New) */}
            {request.status === "ACCEPTED" && request.qr_token && (
               <motion.div
                 initial={{ opacity: 0, x: 30 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="bg-card rounded-[40px] shadow-xl border-2 border-primary/20 p-8 text-center relative overflow-hidden"
               >
                 <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2" />
                 <h3 className={`${unbounded.className} text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4`}>Incoming Specialist</h3>
                 <p className="text-text-secondary text-xs mb-6 font-medium">Show this pass to the provider upon arrival to verify entry.</p>
                 <button
                   onClick={() => setShowQR(true)}
                   className="w-full py-5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center gap-3"
                 >
                   <Zap size={18} /> Reveal Arrival Pass
                 </button>
               </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-[40px] shadow-xl border border-border p-8"
            >
              <h3 className={`${unbounded.className} text-[10px] font-black text-text-hint uppercase tracking-[0.3em] mb-8`}>Settlement</h3>
              <div className="flex justify-between items-center mb-10">
                <span className="text-[10px] font-black text-text-hint uppercase tracking-widest">Total Payable</span>
                <span className={`${unbounded.className} text-3xl font-black text-foreground`}>Rs. {request.price}</span>
              </div>

              {request.payment_status === "COMPLETED" ? (
                <div className="w-full py-6 bg-emerald-50 text-emerald-600 font-black rounded-3xl border border-emerald-100 flex flex-col items-center gap-2 shadow-inner">
                  <ShieldCheck size={32} />
                  <span className="text-[10px] uppercase tracking-[0.3em]">Completion Confirmed</span>
                </div>
              ) : request.status === "COMPLETED" ? (
                <div className="space-y-4">
                  <button
                    disabled={isProcessing}
                    onClick={handlePayment}
                    className="w-full py-6 bg-primary text-white font-black rounded-3xl hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                    <span className="text-[10px] uppercase tracking-[0.2em]">Confirm Completion</span>
                  </button>
                  <div className="p-4 bg-muted/50 rounded-2xl border border-border flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm"><CreditCard size={16} /></div>
                    <span className="text-[10px] font-black text-text-hint uppercase tracking-widest">{request.payment_method} GATEWAY SELECTED</span>
                  </div>
                </div>
              ) : request.status === "CANCELLED" ? (
                <div className="w-full py-6 bg-red-50 text-red-500 font-black rounded-3xl border border-red-100 flex flex-col items-center gap-2">
                   <AlertCircle size={32} />
                   <span className="text-[10px] uppercase tracking-[0.3em]">Request Dismissed</span>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="w-full py-6 bg-muted text-text-disabled font-black rounded-3xl border border-border flex flex-col items-center gap-2 opacity-60">
                    <Clock size={32} />
                    <span className="text-[10px] uppercase tracking-[0.3em]">Pending Completion</span>
                  </div>
                  {(request.status === "REQUESTED" || request.status === "ACCEPTED") && (
                    <button
                      onClick={handleCancel}
                      disabled={isProcessing}
                      className="w-full py-4 text-red-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 rounded-2xl transition-all border border-transparent hover:border-red-100"
                    >
                      {isProcessing ? "Processing..." : "Dismiss Request"}
                    </button>
                  )}
                  <p className="text-[10px] text-center font-black text-text-hint uppercase tracking-[0.2em] leading-relaxed">
                    Financial authorization will be enabled once the provider finalizes the deployment.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Arrival Pass Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQR(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-card rounded-[48px] border border-border p-10 text-center shadow-2xl"
            >
              <div className="absolute top-6 right-6">
                <button 
                  onClick={() => setShowQR(false)}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-text-hint hover:text-foreground transition-all"
                >
                  <AlertCircle size={20} className="rotate-45" />
                </button>
              </div>

              <h2 className={`${unbounded.className} text-xl font-black text-foreground mb-2`}>Entry <span className="text-primary italic">Authentication</span></h2>
              <p className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-8">Secure Pass for Booking ID: {request.id.slice(0, 8)}</p>

              <div className="bg-white p-8 rounded-[40px] shadow-inner mb-8 flex justify-center">
                <QRCodeCanvas 
                  value={request.qr_token || ""} 
                  size={200}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "/icon.svg",
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-2xl border border-border/50 text-left">
                  <ShieldCheck className="text-primary shrink-0" size={20} />
                  <p className="text-[10px] font-bold text-text-secondary leading-normal">
                    This pass verifies your identity and coordinates with the platform&apos;s security protocol.
                  </p>
                </div>
                <button
                  onClick={() => setShowQR(false)}
                  className="w-full py-5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary transition-all active:scale-95"
                >
                  Minimize Pass
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
