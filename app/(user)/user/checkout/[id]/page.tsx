"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, Wallet, CheckCircle2, AlertCircle, 
  Loader2, ArrowRight, ShieldCheck, Receipt, 
  ChevronLeft, Info, DollarSign, Smartphone
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { unbounded } from "@/app/fonts";
import { useUI } from "@/contexts/UIContext";
import BrandText from "@/components/BrandText";
import Link from "next/link";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useUI();
  
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<"CASH" | "ONLINE" | null>(null);
  const [error, setError] = useState("");

  const bookingId = params.id as string;

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      const json = await res.json();
      if (json.success) {
        setBooking(json.data);
      } else {
        setError("Booking could not be retrieved.");
      }
    } catch (err) {
      setError("Failed to connect to verification server.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      showToast("Please select a payment method", "error");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      if (selectedMethod === "ONLINE") {
        // Step 1: Initialize Online Gateway
        // We simulate a secure gateway flow here as requested
        // In production, this redirects to Stripe/etc.
        
        // Simulation delay for "Securing connection..."
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const transactionId = "TXN-" + Math.random().toString(36).substring(2, 10).toUpperCase();
        
        // Step 2: Verify on Backend
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            method: "ONLINE",
            transactionId
          })
        });

        const json = await res.json();
        if (json.success) {
          router.push(`/user/payment-success?id=${booking.id}&tid=${transactionId || 'COD'}&method=${selectedMethod}`);
        } else {
          throw new Error(json.error || "Payment verification failed");
        }
      } else {
        // CASH / COD Flow
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: booking.id,
            method: "CASH"
          })
        });

        const json = await res.json();
        if (json.success) {
          router.push(`/user/payment-success?id=${booking.id}&tid=COD&method=CASH`);
        } else {
          throw new Error(json.error || "Failed to confirm COD");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during processing.");
      showToast(err.message || "Payment Process Failed", "error");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
           <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-hint">Securing Checkout Node...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card rounded-[40px] p-12 text-center border border-border shadow-sm">
           <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-6" />
           <h2 className={`${unbounded.className} text-xl font-black mb-4`}>Protocol Failure</h2>
           <p className="text-text-secondary text-sm font-medium mb-8">{error}</p>
           <button onClick={() => window.location.reload()} className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px]">Retry Handshake</button>
        </div>
      </div>
    );
  }

  const finalAmount = booking?.totalPrice || booking?.service?.price || 0;

  return (
    <div className="min-h-screen bg-muted/20 pb-20 pt-24">
      <div className="max-w-5xl mx-auto px-6">
         {/* Navigation */}
         <div className="flex items-center gap-4 mb-10">
            <button onClick={() => router.back()} className="w-12 h-12 bg-card border border-border rounded-2xl flex items-center justify-center hover:bg-muted transition-all">
               <ChevronLeft size={20} />
            </button>
            <div className="space-y-0.5">
               <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Step 2/2: Settlement</p>
               <h1 className={`${unbounded.className} text-xl font-black`}>Secure <span className="text-primary italic">Checkout</span></h1>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left: Methods */}
            <div className="lg:col-span-7 space-y-8">
               <div className="bg-card rounded-[40px] border border-border p-8 md:p-12 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                  
                  <h3 className="text-[10px] font-black text-text-hint uppercase tracking-[0.4em] mb-10 text-center">Select Payment Modality</h3>

                  <div className="space-y-4">
                     {/* Online Card Option */}
                     <button 
                        onClick={() => setSelectedMethod("ONLINE")}
                        className={`w-full p-6 text-left rounded-3xl border-2 transition-all flex items-center gap-6 relative group ${
                          selectedMethod === "ONLINE" ? "bg-primary/5 border-primary shadow-lg shadow-primary/5" : "bg-muted/30 border-transparent hover:border-text-hint/20"
                        }`}
                     >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                          selectedMethod === "ONLINE" ? "bg-primary text-white" : "bg-card text-text-hint"
                        }`}>
                           <CreditCard size={28} />
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center justify-between mb-1">
                              <h4 className="font-black text-sm uppercase tracking-tight">Online Payment</h4>
                              <span className="text-[8px] font-black bg-blue-500/10 text-blue-500 px-2 py-1 rounded-md uppercase tracking-widest">Recommended</span>
                           </div>
                           <p className="text-xs text-text-hint font-medium">VISA, Mastercard, or Bank Transfer</p>
                        </div>
                        {selectedMethod === "ONLINE" && (
                           <motion.div layoutId="check-sel" className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center">
                              <CheckCircle2 size={14} />
                           </motion.div>
                        )}
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                     </button>

                     {/* Wallet Option Placeholder - for visual "Multiple Method" selection */}
                     <button 
                        disabled
                        className="w-full p-6 text-left rounded-3xl border-2 bg-muted/10 border-transparent flex items-center gap-6 opacity-40 cursor-not-allowed"
                     >
                        <div className="w-16 h-16 rounded-2xl bg-card text-text-disabled flex items-center justify-center">
                           <Smartphone size={28} />
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center justify-between mb-1">
                              <h4 className="font-black text-sm uppercase tracking-tight">Mobile Wallets</h4>
                           </div>
                           <p className="text-xs text-text-disabled font-medium">JazzCash, EasyPaisa (Under Maintenance)</p>
                        </div>
                     </button>

                     {/* Cash Option */}
                     <button 
                        onClick={() => setSelectedMethod("CASH")}
                        className={`w-full p-6 text-left rounded-3xl border-2 transition-all flex items-center gap-6 relative group ${
                          selectedMethod === "CASH" ? "bg-emerald-50/50 border-emerald-500 shadow-lg shadow-emerald-500/5" : "bg-muted/30 border-transparent hover:border-text-hint/20"
                        }`}
                     >
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                          selectedMethod === "CASH" ? "bg-emerald-500 text-white" : "bg-card text-text-hint"
                        }`}>
                           <Wallet size={28} />
                        </div>
                        <div className="flex-1">
                           <h4 className="font-black text-sm uppercase tracking-tight mb-1">Pay on Service (COD)</h4>
                           <p className="text-xs text-text-hint font-medium">Pay in cash after the work is finalized</p>
                        </div>
                        {selectedMethod === "CASH" && (
                           <motion.div layoutId="check-sel" className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                              <CheckCircle2 size={14} />
                           </motion.div>
                        )}
                     </button>
                  </div>

                  <div className="mt-12 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-start gap-4">
                     <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                     <p className="text-[10px] font-bold text-blue-800/70 uppercase leading-relaxed tracking-tight">
                        Payments are secured via End-to-End Encryption. Cash payments must be confirmed on-site via QR verification to complete the cycle.
                     </p>
                  </div>
               </div>

               {error && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-5 bg-rose-50 text-rose-600 rounded-3xl border border-rose-100 flex items-center gap-4 text-xs font-bold">
                     <AlertCircle size={20} />
                     {error}
                  </motion.div>
               )}
            </div>

            {/* Right: Summary */}
            <div className="lg:col-span-5 sticky top-32 space-y-6">
               <div className="bg-white rounded-[40px] border border-border p-8 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
                  
                  <h4 className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-8 border-b border-muted pb-4">Service Invoice Summary</h4>
                  
                  <div className="space-y-6 mb-10">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{booking.service.category}</p>
                           <h5 className="font-black text-foreground capitalize">{booking.service.name}</h5>
                        </div>
                        <span className="font-black text-foreground">Rs. {booking.service.price.toLocaleString()}</span>
                     </div>
                     
                     <div className="space-y-3 pt-4">
                        <div className="flex justify-between text-xs font-medium text-text-secondary">
                           <span>Base Labor Charge</span>
                           <span>Rs. {booking.service.price.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-text-secondary">
                           <span>Operational Tax (5%)</span>
                           <span>Rs. {(booking.service.price * 0.05).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-text-secondary">
                           <span>Visit Protection Fee</span>
                           <span>Rs. 200</span>
                        </div>
                     </div>

                     <div className="pt-6 border-t border-border mt-6 flex justify-between items-center">
                        <span className="font-black text-foreground uppercase tracking-widest text-[10px]">Settlement Amount</span>
                        <span className={`${unbounded.className} text-3xl font-black text-primary`}>Rs. {finalAmount.toLocaleString()}</span>
                     </div>
                  </div>

                  <button 
                     onClick={handlePayment}
                     disabled={processing || !selectedMethod}
                     className="w-full py-6 bg-primary text-white rounded-3xl font-black text-[12px] uppercase tracking-[0.25em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:grayscale flex items-center justify-center gap-3 group"
                  >
                     {processing ? (
                        <>
                           <Loader2 className="w-5 h-5 animate-spin" />
                           Processing Secure Connection...
                        </>
                     ) : (
                        <>
                           Finalize Settlement <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </>
                     )}
                  </button>

                  <div className="mt-8 flex items-center justify-center gap-3 text-emerald-500">
                     <ShieldCheck size={20} />
                     <span className="text-[9px] font-black uppercase tracking-widest">Secured via SSL/TLS 1.3 Encryption</span>
                  </div>
               </div>

               <Link href="/support" className="flex items-center justify-center gap-2 p-4 bg-muted/40 rounded-2xl text-[10px] font-black text-text-hint uppercase tracking-widest hover:text-primary transition-all">
                  <Receipt size={14} /> Request Technical Assistance
               </Link>
            </div>
         </div>
      </div>
    </div>
  );
}
