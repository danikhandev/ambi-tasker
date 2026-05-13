"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Home, Receipt, Calendar, User, Package, DollarSign, Loader2 } from "lucide-react";
import Link from "next/link";
import { unbounded } from "@/app/fonts";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const tid = searchParams.get("tid");
  const method = searchParams.get("method");
  
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (id) {
       fetch(`/api/bookings/${id}`).then(r => r.json()).then(data => {
         if (data.success) setBooking(data.data);
       });
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-muted/10 flex items-center justify-center p-6 pb-20">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="max-w-xl w-full bg-card rounded-[48px] shadow-2xl border border-border p-12 text-center relative overflow-hidden"
      >
        {/* Animated Success Header */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400" />
        
        <motion.div 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
          className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/10"
        >
          <CheckCircle2 size={48} strokeWidth={2.5} />
        </motion.div>

        <h1 className={`${unbounded.className} text-3xl font-black text-foreground mb-4`}>
          Success <span className="text-emerald-500 italic">Confirmed</span>
        </h1>
        <p className="text-text-secondary font-medium leading-relaxed mb-10 max-w-sm mx-auto">
          {method === 'CASH' 
            ? "Your booking is locked in. Our expert will collect payment on-site after service completion."
            : "Your transaction has been finalized on the network. The expert has been notified of the successful settlement."
          }
        </p>

        {/* Detailed Receipt Node */}
        {booking && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-muted/50 rounded-[32px] p-8 text-left mb-10 space-y-5 border border-border/50 relative group"
          >
            <div className="flex justify-between items-center pb-4 border-b border-border/60">
              <span className="text-[9px] font-black text-text-hint uppercase tracking-widest flex items-center gap-2">
                <Receipt size={12} /> Transaction Axis
              </span>
              <span className="font-black text-[10px] text-primary bg-primary/5 px-3 py-1 rounded-full uppercase tracking-tighter shadow-sm border border-primary/10">
                {tid || "COD-7729"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1">
                  <span className="text-[8px] font-bold text-text-disabled uppercase tracking-widest flex items-center gap-1.5"><Package size={10} /> Specification</span>
                  <p className="text-sm font-black text-foreground">{booking.service.name}</p>
               </div>
               <div className="space-y-1 text-right">
                  <span className="text-[8px] font-bold text-text-disabled uppercase tracking-widest flex items-center gap-1.5 justify-end">Settlement <DollarSign size={10} /></span>
                  <p className="text-sm font-black text-foreground">Rs. {booking.totalPrice?.toLocaleString()}</p>
               </div>
            </div>

            <div className="flex justify-between items-center pt-2">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-text-hint">
                     <User size={16} />
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-text-disabled uppercase tracking-widest">Expert Assigned</p>
                    <p className="text-xs font-black text-foreground">{booking.provider.user.name}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-[8px] font-bold text-text-disabled uppercase tracking-widest">Protocol Date</p>
                    <p className="text-xs font-black text-foreground">{booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleDateString() : 'TBD'}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-text-hint">
                     <Calendar size={16} />
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link 
            href="/user/dashboard" 
            className="py-5 bg-gray-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
          >
            <Home size={16} /> Master Hub
          </Link>
          <Link 
            href="/user/bookings" 
            className="py-5 bg-white text-text-secondary border border-border text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-muted transition-all flex items-center justify-center gap-3"
          >
            <Receipt size={16} /> Track Lifecycle
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex items-center justify-center gap-1 text-[8px] font-black text-text-disabled uppercase tracking-widest">
            AUTHENTICATED VIA AMBITASKER SECURE GATEWAY • {new Date().getFullYear()}
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
       <SuccessContent />
    </Suspense>
  );
}
