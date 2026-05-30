"use client";

import { useState, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft, MapPin, Calendar, CreditCard,
    CheckCircle2, AlertCircle, ArrowRight, Star, ShieldCheck,
    Navigation, Wallet, FileText
} from "lucide-react";
import { unbounded } from "@/app/fonts";
import CircularFrame from "@/components/CircularFrame";
import PageHeader from "@/components/PageHeader";
import { useRouter, useSearchParams } from "next/navigation";
// All provider data is fetched dynamically from Supabase
import BrandText from "@/components/BrandText";
import { SERVICES_LIST } from "@/constants/services";
import Link from "next/link";
import { useTranslation } from "@/hooks/useTranslation";
import LocationPicker, { LocationData } from "@/components/LocationPicker";
import { supabase } from "@/services/supabase";
import { useUser } from "@/contexts/UserContext";
import { useUI } from "@/contexts/UIContext";

function BookingForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t, isRTL } = useTranslation();
    const { user } = useUser();
    const { showToast } = useUI();

    const urlProvider = searchParams.get("provider") || searchParams.get("worker");
    const urlService = searchParams.get("service");

    const [matchedWorker, setMatchedWorker] = useState<any>(null);
    const [isLoadingWorker, setIsLoadingWorker] = useState(true);

    useEffect(() => {
        async function fetchMatchedWorker() {
            if (!urlProvider) {
                setIsLoadingWorker(false);
                return;
            }
            
            try {
                // Try fetching from DB if it looks like a UUID
                if (urlProvider.length > 10) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*, providers(*)')
                        .eq('id', urlProvider)
                        .maybeSingle();

                    if (data) {
                        setMatchedWorker({
                            id: data.id,
                            name: data.full_name || 'Expert Provider',
                            title: data.providers?.[0]?.professional_title || data.providers?.[0]?.bio || 'Service specialist',
                            rating: data.providers?.[0]?.rating || 5.0,
                            avatar: data.profile_image || data.avatar_url || "/default-avatar.svg",
                            hourlyRate: data.providers?.[0]?.hourly_rate || 1000,
                            services: [] // Handled by service resolution
                        });
                        setIsLoadingWorker(false);
                        return;
                    }
                }
                setMatchedWorker(null);
            } catch (e) {
                console.error("Match worker failed:", e);
                setMatchedWorker(null);
            } finally {
                setIsLoadingWorker(false);
            }
        }
        fetchMatchedWorker();
    }, [urlProvider]);

    const genericService = SERVICES_LIST?.find((s: any) => s.id === urlService);
    const workerService = matchedWorker?.services?.find((s: any) => s.title.toLowerCase().includes(urlService?.toLowerCase() || ""));

    const defaultServiceName = genericService?.title || workerService?.title || "Custom Repair Service";
    const baseServicePrice = workerService?.price || genericService?.startingPrice || (matchedWorker?.hourlyRate || 1000) * 2;
    const visitCharge = 200; // Flat visit fee for PKR region
    const gstRate = 0.05; // 5% GST
    const serviceWithVisit = baseServicePrice + visitCharge;
    const taxAmount = Math.round(serviceWithVisit * gstRate);
    const totalPrice = serviceWithVisit + taxAmount;

    const [isConfirmed, setIsConfirmed] = useState(false);
    const [bookingId, setBookingId] = useState("");
    const [fullBookingId, setFullBookingId] = useState("");

    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [locationData, setLocationData] = useState<LocationData | null>(null);
    const [notes, setNotes] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "online" | "">("" );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const timeSlots = ["09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "06:00 PM", "Urgent - Now"];

    const handleConfirmBooking = async () => {
        setError("");
        if (!date) { setError(t("booking.pleaseSelectDate")); return; }
        if (!time) { setError(t("booking.pleaseSelectTime")); return; }
        if (!locationData) { setError(t("booking.pleaseEnterLocation")); return; }
        if (!paymentMethod) { setError(t("booking.pleaseSelectPayment")); return; }
        if (!user?.id) { setError("Please log in to book a service."); return; }

        setIsSubmitting(true);
        
        // Payment validation handled by the checkout page

        try {
            // 2. Resolve provider and service
            let providerId = matchedWorker?.id;
            
            if (!providerId && urlService) {
                // Determine category from the selected service
                const serviceInfo = SERVICES_LIST?.find((s: any) => s.id === urlService);
                const category = serviceInfo?.category || "Expert";
                
                // Fetch best match using system API
                const matchParams = new URLSearchParams({
                    category: category,
                    limit: "5"
                });
                
                if (user?.districtId) {
                    matchParams.append("districtId", user.districtId);
                }

                const matchRes = await fetch(`/api/providers?${matchParams.toString()}`);
                const matchData = await matchRes.json();
                
                if (matchData.success && matchData.data?.length > 0) {
                    // Pick the best available (highest rating / experience)
                    providerId = matchData.data[0].id;
                } else if (user?.districtId) {
                    // Fallback: Wider search if no one in local district
                    const fallbackRes = await fetch(`/api/providers?category=${category}&limit=5`);
                    const fallbackData = await fallbackRes.json();
                    if (fallbackData.success && fallbackData.data?.length > 0) {
                        providerId = fallbackData.data[0].id;
                    }
                }
            }

            if (!providerId) {
                setError("No available experts found for this service in your region. Please try again later or select a different category.");
                setIsSubmitting(false);
                return;
            }
            // Parse time slot into 24h time
            let scheduledTime = "09:00";
            if (time === "Urgent - Now") {
                scheduledTime = new Date().toTimeString().slice(0, 5);
            } else {
                const [h, rest] = time.split(':');
                const [m, period] = rest.split(' ');
                let hour = parseInt(h ?? "9");
                if (period === 'PM' && hour !== 12) hour += 12;
                if (period === 'AM' && hour === 12) hour = 0;
                scheduledTime = `${hour.toString().padStart(2, '0')}:${m}`;
            }

            const scheduledDate = new Date(`${date}T${scheduledTime}:00`).toISOString();

            // Resolve service_id — try to find a real service from the provider
            let serviceId = workerService?.id || genericService?.id;

            if (!serviceId || serviceId.length < 30) {
                const { data: providerServices } = await supabase
                    .from('services')
                    .select('id')
                    .eq('provider_id', providerId)
                    .limit(1);
                if (providerServices && providerServices.length > 0) {
                    serviceId = providerServices[0].id;
                }
            }

            if (!serviceId) {
                showToast("Cannot find a valid service for this provider.", "error");
                setIsSubmitting(false);
                return;
            }

            // Insert booking via API
            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    providerId,
                    serviceId,
                    scheduledAt: scheduledDate,
                    location: `${locationData?.address || 'Unknown'} ||| ${locationData?.lat},${locationData?.lng}`,
                    notes: notes || null,
                    paymentMethod: paymentMethod, // API should handle this if needed
                }),
            });

            const result = await res.json();
            if (!res.ok || !result.success) {
                throw new Error(result.error || "Failed to create booking");
            }

            const booking = result.data;
            showToast("Booking created. Proceeding to settlement...", "success");
            router.push(`/user/checkout/${booking.id}`);
        } catch (err: any) {
            showToast("Booking failed: " + err.message, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isConfirmed) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6 mt-16 pb-20">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="max-w-lg w-full bg-card rounded-2xl p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-border transition-all duration-300"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                        className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.4)]"
                    >
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3, type: "spring" }}
                        >
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </motion.div>
                    </motion.div>

                    <motion.h2 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`${unbounded.className} text-3xl font-black text-foreground mb-3`}>
                        {t("booking.bookingSuccessful")}
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-text-secondary font-medium mb-8">
                        {t("booking.bookingConfirmedDesc")}
                    </motion.p>

                    <div className="bg-muted rounded-[24px] p-6 text-left mb-8 space-y-4">
                        <div className="flex justify-between items-center border-b border-border pb-3">
                            <span className="text-xs font-black text-text-hint uppercase tracking-widest">{t("booking.bookingId")}</span>
                            <span className="font-black text-primary">{bookingId}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-text-secondary font-medium">{t("booking.service")}</span>
                            <span className="font-bold text-foreground">{defaultServiceName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-text-secondary font-medium">{t("booking.dateAndTime")}</span>
                            <span className="font-bold text-foreground">{date} • {time}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-border">
                            <span className="font-bold text-foreground">{t("booking.total")}</span>
                            <span className={`${unbounded.className} text-xl font-black text-primary`}>Rs. {totalPrice}</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Link href={`/user/booking/${fullBookingId}`} className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg hover:bg-primary-dark transition-all flex items-center justify-center gap-2">
                            <Navigation className="w-5 h-5" /> {t("booking.trackArrival")}
                        </Link>
                        <Link href="/user/bookings" className="w-full py-4 bg-gray-100 text-foreground font-bold rounded-2xl hover:bg-gray-200 transition-all block text-center">
                            {t("booking.viewBookings")}
                        </Link>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (isLoadingWorker) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-text-secondary font-medium text-sm">Matching your provider...</p>
                </div>
            </div>
        );
    }

    if (!matchedWorker) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-6">
                <div className="max-w-md text-center bg-card p-8 rounded-2xl border border-border shadow-sm">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h2 className={`${unbounded.className} text-xl font-black text-foreground mb-2`}>No Provider Found</h2>
                    <p className="text-text-secondary font-medium mb-6">We couldn&apos;t find the selected provider. Please browse our services and try again.</p>
                    <Link href="/dashboard" className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all">
                        Browse Services
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20 pt-8 mt-16">
            <div className="max-w-6xl mx-auto px-6">
                <PageHeader 
                    title={t("booking.directBooking")}
                    subtitle={t("booking.bookingSubtitle")}
                />

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:p-4 items-start">
                    {/* Form Section */}
                    <div className="md:col-span-7 space-y-5">
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 flex items-center gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Schedule Section */}
                        <div className="bg-card p-4 md:p-6 rounded-2xl border border-border shadow-sm">
                            <h3 className="flex items-center gap-3 text-base font-black text-foreground mb-4">
                                <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                {t("booking.whenDoYouNeed")}
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-1.5 block">
                                        {t("booking.date")}
                                    </label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        min={new Date().toISOString().split("T")[0]}
                                        dir="ltr"
                                        className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 bg-muted font-bold text-xs"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-1.5 block">
                                        {t("booking.time")}
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {timeSlots.map(slot => (
                                            <button
                                                key={slot}
                                                onClick={() => setTime(slot)}
                                                dir="ltr"
                                                className={`py-2 px-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border-2 ${time === slot
                                                    ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                                                    : "bg-card border-border text-text-secondary hover:border-border/60"
                                                    }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location Section */}
                        <div className="bg-card p-4 md:p-6 rounded-2xl border border-border shadow-sm">
                            <h3 className="flex items-center gap-3 text-base font-black text-foreground mb-4">
                                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                {t("booking.whereToGo")}
                            </h3>
                            <LocationPicker
                                onLocationSelect={(loc) => setLocationData(loc)}
                                initialLocation={locationData}
                                compact={true}
                            />
                        </div>

                        {/* Notes Section */}
                        <div className="bg-card p-4 md:p-6 rounded-2xl border border-border shadow-sm">
                            <h3 className="flex items-center gap-3 text-base font-black text-foreground mb-4">
                                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                                    <FileText className="w-4 h-4" />
                                </div>
                                {t("booking.additionalNotes")}
                            </h3>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={2}
                                placeholder={t("booking.notesPlaceholder")}
                                className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 bg-muted font-medium resize-none shadow-inner text-xs"
                            />
                        </div>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="md:col-span-5 relative">
                        <div className="sticky top-24 space-y-4">
                            {/* Provider Card */}
                            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                                <div className="mb-4 relative z-10 flex items-center gap-3 border-b border-gray-50 pb-4">
                                    <div className="relative group">
                                        <CircularFrame
                                            src={matchedWorker.avatar}
                                            alt="Provider"
                                            size={48}
                                            className="border-primary/20 shadow-md"
                                        />
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                                    </div>
                                    <div className={isRTL ? "text-right" : ""}>
                                        <h4 className={`${unbounded.className} text-base font-black text-foreground leading-tight`}>{matchedWorker.name}</h4>
                                        <span className="text-[9px] uppercase font-black tracking-widest text-text-hint block mt-0.5">{matchedWorker.title}</span>
                                        <div className="flex items-center gap-1 mt-1 border border-border bg-card w-fit px-1.5 py-0.5 rounded-full">
                                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                            <span className="text-[10px] font-bold text-foreground">{matchedWorker.rating}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                                        <span className="text-[9px] font-medium text-text-hint uppercase tracking-widest">{t("booking.service")}</span>
                                        <span className="font-black text-foreground text-xs max-w-[60%] truncate">{defaultServiceName}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-medium text-text-secondary">{t("booking.serviceFee")}</span>
                                        <span className="font-bold text-foreground">Rs. {baseServicePrice}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-medium text-text-secondary">Visit & Delivery</span>
                                        <span className="font-bold text-foreground">Rs. {visitCharge}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-medium text-text-secondary">GST (5%)</span>
                                        <span className="font-bold text-foreground">Rs. {taxAmount}</span>
                                    </div>
                                    <div className="pt-3 border-t border-border flex justify-between items-center">
                                        <span className="font-black text-foreground uppercase tracking-widest text-[10px]">{t("booking.total")}</span>
                                        <span className={`${unbounded.className} text-xl font-black text-primary`}>Rs. {totalPrice}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Options */}
                            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                                <h4 className="text-[9px] font-black text-text-hint uppercase tracking-widest mb-3">
                                    {t("booking.paymentMethod")}
                                </h4>
                                <div className="space-y-2">
                                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "cash" ? "border-primary bg-primary/5" : "border-border hover:border-border"}`}>
                                        <input type="radio" className="hidden" onChange={() => setPaymentMethod("cash")} checked={paymentMethod === "cash"} />
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cash" ? "border-primary" : "border-border/60"}`}>
                                            {paymentMethod === "cash" && <div className="w-2 h-2 bg-primary rounded-full" />}
                                        </div>
                                        <Wallet className={`w-5 h-5 ${paymentMethod === "cash" ? "text-primary" : "text-text-hint"}`} />
                                        <div>
                                            <p className="font-bold text-foreground text-xs">{t("booking.cashOnDelivery")}</p>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "online" ? "border-primary bg-primary/5" : "border-border hover:border-border"}`}>
                                        <input type="radio" className="hidden" onChange={() => setPaymentMethod("online")} checked={paymentMethod === "online"} />
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "online" ? "border-primary" : "border-border/60"}`}>
                                            {paymentMethod === "online" && <div className="w-2 h-2 bg-primary rounded-full" />}
                                        </div>
                                        <CreditCard className={`w-5 h-5 ${paymentMethod === "online" ? "text-primary" : "text-text-hint"}`} />
                                        <div>
                                            <p className="font-bold text-foreground text-xs">{t("booking.onlinePayment")}</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Confirm Button */}
                            <button
                                onClick={handleConfirmBooking}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-gray-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary hover:shadow-md border border-border/50 hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> {t("booking.confirming")}</>
                                ) : (
                                    <>{t("booking.confirmBooking")} <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>

                            <p className="text-center text-[9px] font-bold text-text-hint px-4 mt-3 flex items-center justify-center gap-1.5 uppercase tracking-widest">
                                <ShieldCheck className="w-3.5 h-3.5 text-primary" /> <BrandText text={t("booking.ambiGuarantee")} />
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>}>
            <BookingForm />
        </Suspense>
    );
}
