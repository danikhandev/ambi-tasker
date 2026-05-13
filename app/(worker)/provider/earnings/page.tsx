"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Banknote, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, Filter, Download, ChevronRight, Loader2 } from "lucide-react";
import { unbounded } from "@/app/fonts";
import { supabase } from "@/services/supabase";
import { useUser } from "@/contexts/UserContext";
import { useUI } from "@/contexts/UIContext";
import PageHeader from "@/components/PageHeader";

export default function ProviderEarningsPage() {
  const { user } = useUser();
  const { showToast } = useUI();
  
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  
  const [earnings, setEarnings] = useState({
    totalEarned: 0,
    thisMonth: 0,
    lastMonth: 0,
    pendingPayout: 0,
    transactions: [] as any[],
  });

  useEffect(() => {
    if (user?.id) {
      fetchEarningsData();
    }
  }, [user]);

  const fetchEarningsData = async () => {
    setIsLoading(true);
    try {
      // First fetch aggregate wallet details
      const { data: provData } = await supabase
        .from('providers')
        .select('wallet_balance')
        .eq('id', user!.id)
        .single();
        
      // Fetch verified wallet transactions
      const { data: txData, error } = await supabase
        .from('wallet_transactions')
        .select(`
          id, amount, type, status, created_at,
          booking:bookings(service:services(title))
        `)
        .eq('provider_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      let total = 0;
      let thisMonth = 0;
      let pending = 0;
      const txs: any[] = [];
      const now = new Date();

      txData?.forEach(tx => {
        const amount = Number(tx.amount);
        const date = new Date(tx.created_at);
        const paymentStatus = tx.status === 'COMPLETED' ? 'PAID' : tx.status;
        
        let desc = tx.type;
        if (tx.type === 'EARNING' && tx.booking) {
            const bookingRef = tx.booking as any;
            const serviceRef = Array.isArray(bookingRef) ? bookingRef[0]?.service : bookingRef.service;
            desc = `${Array.isArray(serviceRef) ? serviceRef[0]?.title : serviceRef?.title || 'Service'} Payout`;
        } else if (tx.type === 'WITHDRAWAL') {
            desc = "Wallet Withdrawal";
        }

        if (tx.type === 'EARNING' && tx.status === 'COMPLETED') {
            total += amount;
            if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
                thisMonth += amount;
            }
        }
        if (tx.status === 'PENDING' && tx.type === 'EARNING') {
            pending += amount;
        }

        txs.push({
            id: tx.id,
            date: tx.created_at,
            description: desc,
            amount: tx.type === 'WITHDRAWAL' || tx.type === 'PENALTY' ? -amount : amount,
            type: tx.type,
            paymentStatus: paymentStatus
        });
      });

      setEarnings({
        totalEarned: total,
        thisMonth: thisMonth,
        lastMonth: 0, 
        pendingPayout: pending,
        transactions: txs,
      });

    } catch (err: any) {
      showToast("Data Relay Failed: " + err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const withdrawable = earnings.totalEarned * 0.9 - earnings.pendingPayout;
    if (withdrawable < 1000) {
      showToast("Minimum withdrawal threshold is ₨ 1,000", "error");
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/provider/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            userId: user?.id,
            amount: Math.floor(withdrawable),
            method: "Bank Transfer",
            accountInfo: "Primary Saved Payout Method"
        })
      });
      
      const data = await res.json();
      if (data.success) {
        showToast(data.message, "success");
        fetchEarningsData();
      } else {
        showToast(data.error || "Withdrawal failed", "error");
      }
    } catch (error: any) {
      showToast("Server Relay Error: " + error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTransactions = earnings.transactions.filter(tx => {
    if (filter === "all") return true;
    if (filter === "payouts") return tx.type === "EARNING";
    if (filter === "commissions") return tx.type === "COMMISSION";
    return false;
  });

  return (
    <div className="flex-1 bg-background p-8 lg:p-6 md:p-8 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <PageHeader 
          title="Financial"
          highlightedText="Insights"
          subtitle="Real-time tracking of your revenue and payouts."
          actions={
            <button className="px-6 py-4 bg-card border border-border/60 rounded-2xl text-foreground text-xs font-black uppercase tracking-widest hover:bg-muted transition-all shadow-sm flex items-center gap-2 active:scale-95 transition-all duration-200">
              <Download className="w-4 h-4" /> Export Statement
            </button>
          }
        />

        {/* Financial Scoreboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group bg-card p-8 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md border border-border/50 hover:shadow-lg transition-all duration-500">
            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] mb-2">Lifetime Earnings</p>
            <h3 className={`${unbounded.className} text-2xl font-black text-foreground`}>₨ {earnings.totalEarned.toLocaleString()}</h3>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-green-500 uppercase">
              <ArrowUpRight className="w-3 h-3" /> +0% Growth
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="group bg-card p-8 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md border border-border/50 hover:shadow-lg transition-all duration-500">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] mb-2">This Month</p>
            <h3 className={`${unbounded.className} text-2xl font-black text-foreground`}>₨ {earnings.thisMonth.toLocaleString()}</h3>
            <p className="mt-4 text-[10px] font-bold text-text-disabled uppercase letter-spacing-1">Updated Just Now</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="group bg-card p-8 rounded-2xl border border-gray-50 shadow-sm hover:shadow-md border border-border/50 hover:shadow-lg transition-all duration-500">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 transition-transform">
              <Banknote className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] mb-2">Pending Payout</p>
            <h3 className={`${unbounded.className} text-2xl font-black text-foreground`}>₨ {earnings.pendingPayout.toLocaleString()}</h3>
            <p className="mt-4 text-[10px] font-bold text-text-disabled uppercase letter-spacing-1">Estimated: 24h</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gray-900 p-8 rounded-2xl text-white shadow-md border border-border/50 hover:shadow-lg shadow-black/20 flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10">
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2">Withdrawable</p>
              <h3 className={`${unbounded.className} text-2xl font-black text-white`}>₨ {(earnings.totalEarned * 0.9 - earnings.pendingPayout).toLocaleString()}</h3>
            </div>
            <button 
              onClick={handleWithdraw}
              disabled={isLoading}
              className="relative z-10 w-full py-4 bg-primary text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-card hover:text-primary transition-all flex items-center justify-center gap-2 mt-8 active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
              {isLoading ? "Validating..." : "Withdraw Now"}
            </button>
          </motion.div>
        </div>

        {/* Transaction History Section */}
        <div className="bg-card rounded-[56px] border border-gray-50 shadow-sm p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-10">
            <div>
              <h2 className={`${unbounded.className} text-xl font-black text-foreground mb-1`}>Transaction Flow</h2>
              <p className="text-xs text-text-hint font-bold uppercase tracking-widest">History of your financial shifts</p>
            </div>
            <div className="flex bg-muted p-1.5 rounded-2xl border border-border">
              {["all", "payouts", "commissions"].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filter === f
                    ? "bg-card text-foreground shadow-sm"
                    : "text-text-hint hover:text-text-secondary"
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                  <div className="py-20 flex items-center justify-center bg-muted rounded-2xl border-2 border-dashed border-border">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  </div>
              ) : filteredTransactions.length > 0 ? filteredTransactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex items-center justify-between p-6 bg-muted/50 rounded-2xl hover:bg-card hover:shadow-sm border border-border hover:shadow-md hover:shadow-gray-100/50 transition-all border border-transparent hover:border-gray-50"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${tx.amount > 0 ? 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white' : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'
                        }`}>
                        {tx.amount > 0 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-foreground text-sm">{tx.description}</p>
                          <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${tx.paymentStatus === 'PAID' || tx.paymentStatus === 'SUCCESS' ? 'bg-green-50 text-green-700 border-green-200' :
                              tx.paymentStatus === 'FAILED' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                            {tx.paymentStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] font-bold text-text-hint uppercase tracking-widest">{new Date(tx.date).toLocaleDateString('en-PK', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="w-1 h-1 bg-gray-200 rounded-full" />
                          <span className="text-[10px] font-bold text-text-disabled uppercase tracking-widest">{tx.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div className="hidden sm:block">
                        <p className={`text-lg font-black tracking-tighter ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {tx.amount > 0 ? '+' : '-'} ₨ {Math.abs(tx.amount).toLocaleString()}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-primary transition-colors cursor-pointer" />
                    </div>
                  </motion.div>
                )) : (
                  <div className="py-20 text-center bg-muted rounded-2xl border-2 border-dashed border-border">
                    <p className="text-text-hint font-bold uppercase tracking-widest text-xs">No activity found for this filter</p>
                  </div>
                )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
