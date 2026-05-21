"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Phone, MessageSquare, Clock, Shield, Star, ChevronLeft, Info, AlertTriangle, Loader2 } from "lucide-react";
import { unbounded } from "@/app/fonts";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { useUI } from "@/contexts/UIContext";
import { supabase } from "@/services/supabase";

export default function TrackingPage() {
    const params = useParams();
    const bookingId = params.id as string;
    const { user } = useUser();
    const { showToast } = useUI();
    const router = useRouter();

    const [booking, setBooking] = useState<any>(null);
    const [provider, setProvider] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [providerPos, setProviderPos] = useState<{lat: number, lng: number} | null>(null);
    const [status, setStatus] = useState<string>("PENDING");
    const [eta, setEta] = useState<number | null>(null);

    useEffect(() => {
        if (!bookingId) return;
        fetchBookingData();

        // Subscribe to booking status changes
        const bookingChannel = supabase
            .channel(`track-booking-${bookingId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'Booking',
                filter: `id=eq.${bookingId}`,
            }, (payload: any) => {
                setStatus(payload.new.status.toUpperCase());
                setBooking((prev: any) => ({ ...prev, status: payload.new.status }));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(bookingChannel);
        };
    }, [bookingId]);

    const fetchBookingData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/bookings/${bookingId}`);
            const json = await res.json();

            if (json.success && json.data) {
                setBooking(json.data);
                setStatus(json.data.status.toUpperCase());
                if (json.data.provider) {
                    const p = json.data.provider;
                    setProvider({
                        id: p.id,
                        userId: p.userId,
                        name: p.user?.name || 'Expert Provider',
                        title: p.professionalTitle || 'Service specialist',
                        rating: p.rating || 5.0,
                        avatar: p.user?.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
                        contact: p.user?.phone || '+923000000000',
                        lat: p.latitude,
                        lng: p.longitude
                    });
                    if (p.latitude && p.longitude) {
                        setProviderPos({ lat: p.latitude, lng: p.longitude });
                    }
                }
            } else {
                showToast("Booking not found", "error");
                router.push("/bookings");
            }
        } catch (err) {
            console.error("Fetch booking failed:", err);
            showToast("Failed to load tracking data", "error");
        } finally {
            setLoading(false);
        }
    };

    // Subscribe to provider location changes if status is ACCEPTED or ARRIVED
    useEffect(() => {
        if (!provider?.userId || !["ACCEPTED", "ARRIVED", "INPROGRESS"].includes(status)) return;

        const locationChannel = supabase
            .channel(`provider-location-${provider.userId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'providers',
                filter: `user_id=eq.${provider.userId}`,
            }, (payload: any) => {
                if (payload.new.latitude && payload.new.longitude) {
                    setProviderPos({ 
                        lat: payload.new.latitude, 
                        lng: payload.new.longitude 
                    });
                    // Recalculate ETA if we have user's location (omitted for brevity, can be simulated)
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(locationChannel);
        };
    }, [provider?.userId, status]);

    // Simulated ETA and Progress for UI polish
    useEffect(() => {
        if (status === "ACCEPTED") setEta(15);
        else if (status === "ARRIVED") setEta(0);
        else if (status === "INPROGRESS") setEta(null);
        else setEta(null);
    }, [status]);

    if (!user) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center p-6">
                <div className="text-center">
                    <h2 className={`${unbounded.className} text-2xl font-black mb-4`}>Login Required</h2>
                    <p className="text-text-secondary mb-8">Please log in to track your service provider.</p>
                    <Link href="/login" className="btn-primary px-8">Go to Login</Link>
                </div>
            </div>
        );
    }

    if (loading || !booking || !provider) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className={`${unbounded.className} text-sm font-black text-foreground uppercase tracking-widest`}>Connecting to Live Stream...</p>
            </div>
        );
    }

    const getStatusText = () => {
        switch (status) {
            case "REQUESTED": return "Waiting for provider...";
            case "ACCEPTED": return "Provider is en route";
            case "ARRIVED": return "Provider has arrived!";
            case "INPROGRESS": return "Service in progress";
            case "COMPLETED": return "Service completed";
            case "CANCELLED": return "Booking cancelled";
            default: return status;
        }
    };

    return (
        <div className="min-h-screen bg-muted flex flex-col">
            {/* Header */}
            <header className="bg-card/80 backdrop-blur-xl sticky top-0 z-30 border-b border-border px-6 py-4 flex items-center justify-between">
                <Link href="/bookings" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <ChevronLeft className="w-6 h-6 text-foreground" />
                </Link>
                <div className="text-center">
                    <h1 className={`${unbounded.className} text-sm font-black text-foreground uppercase tracking-widest`}>Live Tracking</h1>
                    <p className="text-[10px] font-bold text-primary uppercase mt-1">Booking #{bookingId.substring(0, 8).toUpperCase()}</p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Info className="w-6 h-6 text-text-hint" />
                </button>
            </header>

            {/* Map Area */}
            <div className="flex-1 relative overflow-hidden bg-[#f3f4f6]">
                {/* Visual Placeholder for Map */}
                <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }} />

                {/* User Location */}
                <div className="absolute top-1/4 right-1/4 flex flex-col items-center">
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center shadow-lg border-4 border-white mb-2">
                        <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div className="px-3 py-1 bg-gray-900 text-white text-[8px] font-black rounded-full uppercase">Your Location</div>
                </div>

                {/* Provider Location */}
                <AnimatePresence>
                    {providerPos && (
                        <motion.div
                            key="provider-marker"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute"
                            style={{
                                left: '40%', // In a real app, calculate based on lat/lng and map bounds
                                top: '60%'
                            }}
                        >
                            <div className="relative">
                                <motion.div
                                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.1, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute -inset-8 bg-primary rounded-full"
                                />
                                <div className="w-14 h-14 bg-card rounded-2xl shadow-xl border-4 border-primary flex items-center justify-center overflow-hidden z-10 relative">
                                    <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-card rounded-xl shadow-lg border border-border whitespace-nowrap flex items-center gap-2">
                                    <Navigation className="w-3 h-3 text-primary animate-pulse" />
                                    <span className="text-[10px] font-black text-foreground uppercase">{getStatusText()}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Status Panel */}
            <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                className="bg-card rounded-t-[40px] shadow-2xl p-8 z-40 border-t border-border"
            >
                <div className="max-w-xl mx-auto">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <span className="text-[10px] font-black text-text-hint uppercase tracking-widest block mb-2">
                                {status === "ARRIVED" ? "Provider is here" : status === "INPROGRESS" ? "Working on it" : "Estimated Arrival"}
                            </span>
                            <div className="flex items-baseline gap-2">
                                {eta !== null ? (
                                    <>
                                        <span className={`${unbounded.className} text-4xl font-black text-foreground`}>{eta}</span>
                                        <span className="text-xl font-black text-text-hint">mins</span>
                                    </>
                                ) : (
                                    <span className={`${unbounded.className} text-2xl font-black text-primary`}>{getStatusText()}</span>
                                )}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                                status === 'ARRIVED' || status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'
                            }`}>
                                <div className={`w-2 h-2 rounded-full ${status === 'ARRIVED' ? 'bg-green-500' : 'bg-primary animate-pulse'}`} />
                                {status}
                            </div>
                        </div>
                    </div>

                    <div className="bg-muted rounded-[32px] p-6 mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border border-border bg-white">
                                <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-foreground tracking-tight">{provider.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1 bg-yellow-400 text-white px-2 py-0.5 rounded-xl text-[10px] font-black">
                                        <Star className="w-3 h-3 fill-white" /> {provider.rating}
                                    </div>
                                    <span className="text-[10px] font-bold text-text-hint uppercase tracking-widest">{provider.title}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <a href={`tel:${provider.contact}`} className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-primary shadow-sm border border-border hover:scale-105 transition-all">
                                <Phone className="w-5 h-5" />
                            </a>
                            <Link href={`/messages/${provider.userId}`} className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-text-hint shadow-sm border border-border hover:scale-105 transition-all">
                                <MessageSquare className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 p-4 bg-muted rounded-2xl border border-border">
                            <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center text-primary shadow-sm border border-border">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-[8px] font-black text-text-hint uppercase block">Safety</span>
                                <span className="text-[10px] font-black text-foreground uppercase">Verified Pro</span>
                            </div>
                        </div>
                        {["REQUESTED", "ACCEPTED"].includes(status) && (
                            <button 
                                onClick={() => router.push('/bookings')}
                                className="bg-red-50 text-red-600 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all"
                            >
                                <AlertTriangle className="w-4 h-4" /> Cancel Job
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
