"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Banknote, Paperclip, CheckCircle2, CreditCard, Wallet, Clock, ArrowRight, ShieldCheck, AlertCircle, MapPin } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import LocationPicker, { LocationData } from "@/components/LocationPicker";
import LocationSelector from "@/components/LocationSelector";
import BookingLocationStep from "@/components/booking/BookingLocationStep";
import { useUser } from "@/contexts/UserContext";
import { useUI } from "@/contexts/UIContext";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";

interface Service {
  id: string;
  title: string;
  price: number;
  type: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerName: string;
  providerId: string;
  services: Service[];
}

export default function BookingModal({ isOpen, onClose, providerName, providerId, services }: BookingModalProps) {
  const { addNotification } = useNotifications();
  const { user } = useUser();
  const { showToast } = useUI();
  const { t, isRTL } = useTranslation();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | "custom">("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [structuredLocation, setStructuredLocation] = useState<any>({
    districtId: "",
    cityId: "",
    areaId: ""
  });
  const [priceOffer, setPriceOffer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "pkr_gateway">("cash");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (step === 1 && !locationData) {
      setError("Please confirm your service location.");
      return;
    }
    if (step === 2 && !selectedService) return;
    if (step === 3) {
      if (!description.trim()) {
        setError("Please describe what you need done.");
        return;
      }
      if (!date) {
        setError("Please select a preferred date.");
        return;
      }
      setError("");
    }
    setStep(prev => prev + 1);
  };

  const handleFinalSubmit = async () => {
    if (!user?.id) {
      showToast("Please log in to book a service.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedSvc = services.find(s => s.id === selectedService);
      const totalPrice = selectedSvc?.price || Number(priceOffer) || 0;

      // Combine date + time into scheduled_date
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

      // Determine service_id — if "custom", use the first service or create a placeholder
      const serviceId = selectedService !== "custom" ? selectedService : services[0]?.id;

      if (!serviceId) {
        showToast("No service selected.", "error");
        setIsSubmitting(false);
        return;
      }

      // Call API
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          providerId,
          location: locationData?.address || "At selected region",
          latitude: locationData?.lat,
          longitude: locationData?.lng,
          districtId: structuredLocation.districtId,
          cityId: structuredLocation.cityId,
          areaId: structuredLocation.areaId,
          scheduledAt,
          notes: description || null,
          paymentMethod
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Booking failed");
      }

      setCreatedBookingId(data.data?.id || null);

      // If online payment selected, redirect to checkout
      if (paymentMethod === "card" && data.data?.id) {
        const checkoutResponse = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId: data.data.id })
        });
        const checkoutData = await checkoutResponse.json();
        if (checkoutData.url) {
          window.location.href = checkoutData.url;
          return;
        }
      }

      // Add local notification
      addNotification({
        title: t("booking.requestSent"),
        message: t("booking.requestSentDesc", { provider: providerName }),
        type: "booking"
      });

      setStep(5); // Success step
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="bg-card rounded-[32px] shadow-md border border-border/50 hover:shadow-lg w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-black/5"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-muted/50">
            <div>
              <h2 className="text-xl font-black text-foreground tracking-tight">
                {step === 5 ? t("booking.bookingSuccessful") : !user ? "Authentication Required" : t("booking.directBooking")}
              </h2>
              {step < 5 && user && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-primary" : i < step ? "w-4 bg-primary/30" : "w-4 bg-gray-200"}`} />
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-2.5 hover:bg-gray-100 rounded-full transition-all active:scale-90">
              <X className="w-5 h-5 text-text-hint" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8 overflow-y-auto custom-scrollbar bg-card">
            {!user ? (
              <div className="text-center py-10 space-y-8 animate-fadeIn">
                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                   <ShieldCheck className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-foreground">Login to Ambi Tasker</h3>
                  <p className="text-sm font-medium text-text-secondary max-w-xs mx-auto">You need to be logged in to book professional services and track your appointments.</p>
                </div>
                <div className="pt-6 space-y-4">
                  <Link 
                    href={`/login?redirect=/search/${providerId}?book=true`}
                    className="btn-primary w-full h-14 rounded-2xl flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-primary/20"
                  >
                    Enter My Account <ArrowRight size={18} />
                  </Link>
                  <p className="text-[10px] font-black text-text-hint uppercase tracking-widest">
                    Don&apos;t have an account? <Link href="/register" className="text-primary hover:underline">Join Now</Link>
                  </p>
                </div>
              </div>
            ) : step === 1 && (
              <BookingLocationStep 
                initialLocation={locationData}
                onConfirm={(loc) => {
                  setLocationData(loc);
                  setError("");
                  setStep(2);
                }}
              />
            )}

            {step === 2 && (
              <form onSubmit={handleNextStep} className="space-y-6 animate-fadeIn">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-text-hint uppercase tracking-widest block">{t("booking.availableServices")}</label>
                  <div className="grid gap-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service.id)}
                        className={`p-5 rounded-2xl border-2 transition-all group cursor-pointer ${selectedService === service.id
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                          : "border-gray-50 hover:border-border hover:bg-muted"
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${selectedService === service.id ? 'bg-primary text-white' : 'bg-muted text-text-hint group-hover:text-primary'}`}>
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-foreground">{service.title}</span>
                          </div>
                          <div className="text-right font-black text-foreground tracking-tight">
                            Rs. <span className="text-lg">{service.price}</span>
                            <span className="text-[10px] text-text-hint uppercase ml-1">{service.type === "HOURLY" ? "/hr" : "Fixed"}</span>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div
                      onClick={() => setSelectedService("custom")}
                      className={`p-5 rounded-2xl border-2 transition-all cursor-pointer ${selectedService === "custom"
                        ? "border-primary bg-primary/5"
                        : "border-gray-50 hover:border-border bg-muted/30"
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selectedService === 'custom' ? 'bg-primary text-white' : 'bg-card text-text-hint border border-border'}`}>
                          <Paperclip className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground block">{t("booking.customRequest")}</span>
                          <p className="text-[10px] text-text-hint font-bold uppercase tracking-tight">{t("booking.tailoredSession")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-5 bg-gray-100 text-text-secondary font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">{t("auth.goBack") || "Back"}</button>
                  <button
                    type="submit"
                    disabled={!selectedService}
                    className="flex-[2] py-5 bg-gray-900 text-white font-black rounded-2xl text-[11px] uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm border border-border hover:shadow-md shadow-black/10 active:scale-95 flex items-center justify-center gap-2"
                  >
                    {t("booking.configureDetails")} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleNextStep} className="space-y-6 animate-fadeIn">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-text-hint uppercase tracking-widest block mb-2">{t("booking.requirementDescription")}</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={4}
                      placeholder={t("booking.describeJobPlaceholder")}
                      className="w-full px-6 py-5 rounded-2xl bg-muted border-none focus:ring-4 focus:ring-primary/10 text-foreground font-medium transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-text-hint uppercase tracking-widest block mb-2">{t("booking.pickupDate")}</label>
                      <div className="relative">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <input
                          type="date"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="w-full pl-12 pr-6 py-5 rounded-2xl bg-muted border-none focus:ring-4 focus:ring-primary/10 text-sm font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-text-hint uppercase tracking-widest block mb-2">{t("booking.startTime")}</label>
                      <div className="relative">
                        <Clock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                        <input
                          type="time"
                          required
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full pl-12 pr-6 py-5 rounded-2xl bg-muted border-none focus:ring-4 focus:ring-primary/10 text-sm font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-primary/5 rounded-2xl border border-primary/20 space-y-3">
                     <span className="text-[8px] font-black text-primary uppercase tracking-widest block">Selected Destination</span>
                     <div className="flex items-start gap-3">
                       <MapPin className="text-primary w-4 h-4 mt-0.5" />
                       <p className="text-xs font-bold text-foreground leading-relaxed">{locationData?.address || "Location confirmed"}</p>
                     </div>
                     <button 
                       type="button"
                       onClick={() => setStep(1)}
                       className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                     >
                       Change Location
                     </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 py-5 bg-gray-100 text-text-secondary font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">{t("auth.goBack") || "Back"}</button>
                  <button type="submit" className="flex-[2] py-5 bg-gray-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-sm border border-border hover:shadow-md shadow-black/5 active:scale-95 transition-all duration-200">{t("booking.selectPaymentMethod")}</button>
                </div>
              </form>
            )}

            {step === 4 && (
              <div className="space-y-8 animate-fadeIn">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-text-hint uppercase tracking-widest block">{t("booking.selectPaymentMethod")}</label>
                  <div className="space-y-3">
                    <div
                      onClick={() => setPaymentMethod("cash")}
                      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${paymentMethod === 'cash' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-gray-50 hover:border-border'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === 'cash' ? 'bg-primary text-white' : 'bg-muted text-text-hint'}`}>
                          <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground block">{t("booking.cashAfterService")}</span>
                          <p className="text-[9px] text-text-hint font-black uppercase tracking-widest">{t("booking.cashOnDelivery")}</p>
                        </div>
                      </div>
                      {paymentMethod === 'cash' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>

                    <div
                      onClick={() => setPaymentMethod("card")}
                      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${paymentMethod === 'card' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-gray-50 hover:border-border'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === 'card' ? 'bg-primary text-white' : 'bg-muted text-text-hint'}`}>
                          <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground block">{t("booking.stripeCard")}</span>
                          <p className="text-[9px] text-text-hint font-black uppercase tracking-widest">{t("booking.onlinePayment")}</p>
                        </div>
                      </div>
                      {paymentMethod === 'card' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>

                    <div
                      onClick={() => setPaymentMethod("pkr_gateway")}
                      className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${paymentMethod === 'pkr_gateway' ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' : 'border-gray-50 hover:border-border'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === 'pkr_gateway' ? 'bg-primary text-white' : 'bg-muted text-text-hint'}`}>
                          <Banknote className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground block">{t("booking.localPkrGateway")}</span>
                          <p className="text-[9px] text-text-hint font-black uppercase tracking-widest">EasyPaisa / JazzCash / Local Bank</p>
                        </div>
                      </div>
                      {paymentMethod === 'pkr_gateway' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-muted rounded-2xl border border-border">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-text-hint uppercase tracking-widest">{t("booking.orderSummary")}</span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{t("booking.secureCheckout")}</span>
                  </div>
                  
                  <div className="space-y-3 mb-4 pb-4 border-b border-border border-dashed">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-text-secondary">{services.find(s => s.id === selectedService)?.title || "Custom Service"}</span>
                      <span className="text-sm font-black text-foreground">Rs. {services.find(s => s.id === selectedService)?.price || "0"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-text-secondary">Platform Fee</span>
                      <span className="text-sm font-black text-foreground">Rs. 50</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">Total Amount</span>
                    <span className="text-xl font-black text-primary">Rs. {(services.find(s => s.id === selectedService)?.price || 0) + 50}</span>
                  </div>
                </div>

                {paymentMethod === 'pkr_gateway' && (
                  <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 animate-fadeIn">
                    <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Transfer Instructions
                    </h4>
                    <p className="text-xs font-medium text-blue-900 mb-3 leading-relaxed">
                      Please transfer <strong className="font-black">Rs. {(services.find(s => s.id === selectedService)?.price || 0) + 50}</strong> to the following account to confirm your booking:
                    </p>
                    <div className="bg-white p-4 rounded-xl border border-blue-200 mb-3">
                      <div className="flex justify-between mb-2">
                        <span className="text-[10px] font-black text-text-hint uppercase">Easypaisa Account</span>
                        <span className="text-sm font-black text-foreground">0300-1234567</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-black text-text-hint uppercase">Account Title</span>
                        <span className="text-sm font-black text-foreground">AmbiTasker PVT LTD</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-blue-700 font-bold uppercase tracking-widest">
                      Your booking will remain pending until an Admin verifies the transfer.
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(3)} className="flex-1 py-5 bg-gray-100 text-text-secondary font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">Back</button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={isSubmitting}
                    className="flex-[2] py-5 bg-primary text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-primary-dark transition-all shadow-sm border border-border hover:shadow-md shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-all duration-200"
                  >
                    {isSubmitting ? "Processing..." : (paymentMethod === 'pkr_gateway' ? "I Have Paid & Confirm" : "Confirm & Book Now")}
                  </button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="text-center py-12 animate-insert-cursor">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                  <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-20" />
                  <CheckCircle2 className="w-12 h-12 text-green-500 relative z-10" />
                </div>
                <h3 className="text-3xl font-black text-foreground mb-4 tracking-tight">
                  {paymentMethod === 'pkr_gateway' ? "Verification Pending" : t("booking.bookingRequestSent")}
                </h3>
                <p className="text-text-secondary mb-10 max-w-sm mx-auto font-medium">
                  {paymentMethod === 'pkr_gateway' 
                    ? "We've received your booking request. An admin will verify your payment shortly before confirming." 
                    : t("booking.providerNotified", { provider: providerName })}
                </p>
                <div className="bg-muted p-6 rounded-2xl mb-10 grid grid-cols-1 gap-6">
                  <div className="text-left">
                    <span className="text-[8px] font-black text-text-hint uppercase tracking-widest block mb-1">Service Location</span>
                    <p className="text-sm font-black text-foreground uppercase tracking-tight line-clamp-2 leading-relaxed">
                      {locationData?.address || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="bg-muted p-6 rounded-2xl mb-10 grid grid-cols-2 gap-6">
                  <div className="text-left">
                    <span className="text-[8px] font-black text-text-hint uppercase tracking-widest block mb-1">Scheduled for</span>
                    <p className="text-sm font-black text-foreground uppercase tracking-tight">{new Date(date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-left">
                    <span className="text-[8px] font-black text-text-hint uppercase tracking-widest block mb-1">Payment Method</span>
                    <p className="text-sm font-black text-foreground uppercase tracking-tight capitalize">{paymentMethod.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => window.location.href = '/bookings'}
                    className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-sm border border-border hover:shadow-md shadow-black/10"
                  >
                    View My Booking History
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-4 text-text-hint font-black text-[10px] uppercase tracking-widest hover:text-text-secondary transition-colors active:scale-95 transition-all duration-200"
                  >
                    Dismiss Confirmation
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
