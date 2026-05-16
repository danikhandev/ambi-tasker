"use client";

import { useState, Suspense, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Star, MapPin, ShieldCheck, ArrowRight, Loader2, Mic, X, Filter, Grid, Eye, AlertCircle, TrendingUp, Navigation, Clock, CheckCircle2, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { unbounded } from "@/app/fonts";
import Link from "next/link";
import Image from "next/image";
import { SERVICE_CATEGORIES, SERVICES_LIST } from "@/constants/services";
import { useTranslation } from "@/hooks/useTranslation";
import { Skeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";
import { useUI } from "@/contexts/UIContext";
import { useUser } from "@/contexts/UserContext";
import LocationSelector from "@/components/LocationSelector";
import OnlineDot from "@/components/OnlineDot";
import { supabase } from "@/lib/supabaseClient";

const ITEMS_PER_PAGE = 6;

// Helper for highlighting text matching the query
function HighlightText({ text, highlight }: { text: string; highlight: string }) {
  if (!highlight.trim()) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${highlight})`, "gi"));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-primary/10 text-primary px-0.5 rounded font-black">
            {part}
          </span>
        ) : (
          <span key={part + i}>{part}</span>
        )
      )}
    </span>
  );
}

function ProfessionalSkeletonCard() {
  return (
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 -mt-10 mb-4 h-16 relative z-10">
          <Skeleton className="w-16 h-16 rounded-xl border-4 border-card bg-muted shrink-0" />
          <div className="flex-1 pt-4 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-12" />
          </div>
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-2 pt-4">
           <Skeleton className="h-10 w-10 rounded-xl" />
           <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function SearchContent() {
  const { t, isRTL } = useTranslation();
  const { showToast } = useUI();
  const { user } = useUser();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "All";

  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [location, setLocation] = useState<any>({
    provinceId: "",
    districtId: searchParams.get("districtId") || user?.districtId || "",
    cityId: user?.cityId || "",
    areaId: searchParams.get("areaId") || user?.areaId || ""
  });
  
  const [rating, setRating] = useState(0);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [sortBy, setSortBy] = useState("featured");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredWorkers, setFilteredWorkers] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Precompute all searchable terms for autocomplete
  const allSuggestions = useMemo(() => {
    const categories = SERVICE_CATEGORIES.map(c => ({ text: c.name, type: 'category', icon: c.icon }));
    const services = SERVICES_LIST.map(s => ({ text: s.title, type: 'service', icon: s.icon }));
    return [...categories, ...services];
  }, []);

  const suggestions = useMemo(() => {
    if (query.length < 2) return [];
    return allSuggestions
      .filter(s => s.text.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 6);
  }, [query, allSuggestions]);

  // Sync location with user profile when loaded
  useEffect(() => {
    if (user && !location.districtId && !location.areaId) {
      setLocation({
        provinceId: "",
        districtId: user.districtId || "",
        cityId: user.cityId || "",
        areaId: user.areaId || ""
      });
    }
  }, [user]);

  // Debounce the query
  useEffect(() => {
    const handler = setTimeout(() => {
      setActiveQuery(query);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [query]);

  // Real-time Status Subscriptions
  useEffect(() => {
    const statusChannel = supabase
      .channel("search-user-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          const updated = payload.new as any;
          setFilteredWorkers(prev => prev.map(w => w.id === updated.id ? { ...w, isOnline: updated.is_online } : w));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, []);

  // Fetch providers from backend via our new API
  useEffect(() => {
    const fetchFromInternalAPI = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          search: activeQuery,
          category: category === "All" ? "" : category,
          districtId: location.districtId || "",
          areaId: location.areaId || "",
          limit: "50",
        });

        const res = await fetch(`/api/providers?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
          let sortedWorkers = data.data;
          
          if (sortBy === "rating-desc") {
            sortedWorkers.sort((a: any, b: any) => parseFloat(b.rating || "0") - parseFloat(a.rating || "0"));
          } else if (sortBy === "price-asc") {
            sortedWorkers.sort((a: any, b: any) => parseFloat(a.hourlyRate || "0") - parseFloat(b.hourlyRate || "0"));
          }

          setFilteredWorkers(sortedWorkers);
        } else {
          throw new Error(data.error);
        }
      } catch (err: any) {
        console.error("Search fetch error:", err);
        setFilteredWorkers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFromInternalAPI();
  }, [activeQuery, category, location, rating, priceRange, sortBy]);


  const totalPages = Math.ceil(filteredWorkers.length / ITEMS_PER_PAGE);
  const paginatedWorkers = filteredWorkers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      showToast(t("search.voiceSearchError"), "error");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = isRTL ? 'ur-PK' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setQuery(transcript);
    };
    recognition.start();
  };

  const renderCard = (worker: any, i: number) => {
    const isApproved = worker.verificationStatus === "VERIFIED";
    const isPending = worker.verificationStatus === "PENDING" || worker.verificationStatus === "UNDER_REVIEW";
    const isRejected = worker.verificationStatus === "REJECTED";

    return (
      <motion.div
        key={worker.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.05 }}
        className="group bg-card rounded-[32px] border border-border/60 overflow-hidden shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500 flex flex-col h-full relative"
      >
        <Link href={`/provider/${worker.id}`} className="aspect-[16/10] relative overflow-hidden block bg-muted/30">
          <Image 
            src={worker.coverImage || `https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800`} 
            alt="" 
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-110 transition-all duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <Star size={12} className="text-yellow-500 fill-yellow-500" />
            <span className="text-[10px] font-black text-slate-900">{worker.rating}</span>
          </div>
          
          {/* KYC Status Badge on Image */}
          <div className="absolute top-4 left-4">
            {isApproved ? (
              <div className="bg-success/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-success/20">
                <ShieldCheck size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">{t("search.verified") || "Verified"}</span>
              </div>
            ) : isPending ? (
              <div className="bg-warning/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-warning/20">
                <Clock size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">{t("search.verificationInProgress") || "Verification in progress"}</span>
              </div>
            ) : (
              <div className="bg-danger/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-danger/20">
                <AlertCircle size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">{t("search.notVerified") || "Not verified"}</span>
              </div>
            )}
          </div>
        </Link>

        <div className="p-6 relative flex-1 flex flex-col">
          <div className="flex items-end gap-3 -mt-14 mb-4 relative z-10">
            <div className="w-20 h-20 rounded-3xl border-4 border-card bg-muted overflow-hidden shadow-xl group-hover:scale-105 transition-transform relative">
              <Image src={worker.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${worker.id}`} fill sizes="80px" className="object-cover" alt={worker.name} />
              <div className="absolute bottom-1 right-1 z-10">
                <OnlineDot isOnline={worker.isOnline} size={14} />
              </div>
            </div>
            <div className="pb-1">
              <h4 className="text-xs font-black text-foreground uppercase tracking-tight flex items-center gap-1.5">
                {worker.name}
                {isApproved && <ShieldCheck size={14} className="text-primary" />}
              </h4>
              <div className="flex items-center gap-1 text-text-hint">
                <MapPin size={10} />
                <span className="text-[9px] font-bold">{worker.location}</span>
              </div>
            </div>
          </div>

          <h3 className="text-sm font-black text-foreground mb-2 group-hover:text-primary transition-colors">{worker.title}</h3>
          <p className="text-[10px] text-text-hint line-clamp-2 mb-6 italic opacity-70 group-hover:opacity-100 transition-opacity">"{worker.bio}"</p>
          
          <div className="mt-auto flex items-center justify-between pt-5 border-t border-border/40">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-text-hint tracking-widest">{t("search.startingAt")}</span>
              <span className={`${unbounded.className} text-sm font-black text-primary`}>Rs. {worker.hourlyRate}</span>
            </div>
            {isApproved ? (
              <Link 
                href={`/provider/${worker.id}?book=true`} 
                className="px-6 py-2.5 bg-primary text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 shadow-lg shadow-primary/10"
              >
                {t("search.bookNow")}
              </Link>
            ) : (
              <button 
                onClick={() => showToast(t("search.verificationToast") || "This provider is not verified yet", "error")}
                className="px-6 py-2.5 bg-gray-200 text-gray-500 cursor-not-allowed rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
              >
                {t("search.bookNow")}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="pb-20" dir={isRTL ? "rtl" : "ltr"}>
      {/* Dynamic Search Header */}
      <section className="relative pt-44 pb-24 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full -z-10" />
        <div className="max-w-7xl mx-auto px-6 text-center relative z-20">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${unbounded.className} text-4xl md:text-6xl font-black mb-6 tracking-tighter leading-tight`}
            >
              {t("search.title")} <span className="text-primary italic">⚡</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-text-secondary font-medium mb-12"
            >
              {t("search.subtitle")}
            </motion.p>
            
            <motion.div 
              ref={searchRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-4xl mx-auto relative z-20"
            >
              <div className="flex bg-white/70 backdrop-blur-2xl p-2.5 rounded-[40px] border border-white/50 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] items-center focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/40 transition-all duration-500">
                <div className="mx-6 p-3 bg-primary/5 rounded-2xl text-primary">
                  <Search size={22} strokeWidth={2.5} />
                </div>
                <input 
                  type="text" 
                  value={query}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder={t("search.placeholder")}
                  className="flex-1 px-2 py-6 bg-transparent outline-none font-bold text-xl placeholder:text-text-hint/40 tracking-tight"
                />
                
                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {showSuggestions && suggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-4 bg-white/90 backdrop-blur-3xl rounded-[32px] border border-white/50 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] overflow-hidden z-50 p-2"
                    >
                      {suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setQuery(s.text);
                            setActiveQuery(s.text);
                            setShowSuggestions(false);
                          }}
                          className="w-full flex items-center gap-4 px-6 py-4 hover:bg-primary/10 rounded-2xl transition-all group text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-text-hint group-hover:bg-primary group-hover:text-white transition-all">
                            <s.icon size={20} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                              <HighlightText text={s.text} highlight={query} />
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-hint opacity-60">
                              {s.type === 'category' ? t("search.category") : t("nav.services")}
                            </p>
                          </div>
                          <ArrowRight size={16} className="text-text-hint opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center gap-3 pr-2">
                  <button 
                    onClick={startVoiceSearch}
                    className={`p-4 rounded-[20px] transition-all duration-300 ${isListening ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-200" : "bg-muted/50 text-text-hint hover:bg-primary/10 hover:text-primary"}`}
                  >
                    <Mic size={20} />
                  </button>
                  <button className="px-12 py-6 bg-gradient-to-br from-primary to-indigo-600 text-white font-black rounded-[28px] shadow-[0_20px_40px_-12px_rgba(var(--primary-rgb),0.4)] hover:shadow-[0_25px_50px_-12px_rgba(var(--primary-rgb),0.5)] hover:-translate-y-1 transition-all duration-300 uppercase text-xs tracking-widest active:scale-95 group overflow-hidden relative">
                    <span className="relative z-10 flex items-center gap-2">
                      {t("search.button")}
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </button>
                </div>
              </div>

              {isListening && (
                <div className="mt-4 text-xs font-black text-primary animate-pulse tracking-widest uppercase">
                  {t("search.voiceSearch")}
                </div>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 relative z-10"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-text-hint mr-2 opacity-60">
                {t("search.popularNow") || "Popular Searches"}:
              </span>
              {['Electrician', 'Plumber', 'Cleaning', 'Mechanic'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => { setQuery(tag); setActiveQuery(tag); }}
                  className="px-5 py-2.5 bg-white/50 backdrop-blur-md border border-white/50 rounded-full text-[10px] font-black uppercase tracking-widest text-text-hint hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all active:scale-95 shadow-sm"
                >
                  {tag}
                </button>
              ))}
            </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Advanced Filters */}
          <aside className="lg:col-span-3 space-y-10">
            <div className="flex items-center justify-between mb-8">
              <h3 className={`${unbounded.className} text-sm font-black uppercase tracking-widest`}>
                {t("search.filters")}
              </h3>
              <Filter size={18} className="text-primary" />
            </div>

            <div className="space-y-8">
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-text-hint uppercase tracking-widest">{t("search.category")}</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    className="w-full p-4 bg-muted/30 border border-border rounded-[20px] text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  >
                     <option value="All">{t("search.allCategories")}</option>
                      {SERVICE_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-black text-text-hint uppercase tracking-widest">{t("search.location") || "Region"}</label>
                  <LocationSelector 
                    value={location}
                    onChange={setLocation}
                    fields={["province", "district", "city", "area"]}
                    className="space-y-3"
                  />
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-black text-text-hint uppercase tracking-widest flex justify-between">
                    {t("search.priceRange")} <span className="text-primary font-black">Rs. {priceRange[1]}</span>
                  </label>
                  <input 
                    type="range" 
                    min="0" 
                    max="50000" 
                    step="1000" 
                    value={priceRange[1]} 
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])} 
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary" 
                  />
                  <div className="flex justify-between text-[10px] font-bold text-text-hint">
                    <span>Rs. 0</span>
                    <span>Rs. 50,000+</span>
                  </div>
               </div>
            </div>

            {/* Quality Badge */}
            <div className="p-6 bg-primary/5 rounded-[32px] border border-primary/10">
              <ShieldCheck className="text-primary mb-3" size={32} />
              <h4 className="text-xs font-black uppercase mb-1">{t("dashboard.verifiedPartner")}</h4>
              <p className="text-[10px] text-text-hint font-medium leading-relaxed">
                Every professional on Ambi Tasker undergoes a rigorous 5-step background verification.
              </p>
            </div>
          </aside>

          {/* Dynamic Grid Results */}
          <main className="lg:col-span-9">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="flex flex-col gap-1">
                <h2 className={`${unbounded.className} text-3xl font-black text-foreground tracking-tight`}>
                  {filteredWorkers.length} {t("search.results")}
                </h2>
                {(location.districtId || location.areaId) && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-hint">
                      Filtered by local region
                    </span>
                    <button 
                      onClick={() => setLocation({ provinceId: "", districtId: "", cityId: "", areaId: "" })}
                      className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                    >
                      Clear to search globally
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-2xl">
                  <LayoutGrid size={14} className="text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-hint">Grid View</span>
                </div>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-text-hint hover:text-primary transition-colors"
                >
                  <option value="featured">{t("search.featuredFirst") || "Featured First"}</option>
                  <option value="rating">{t("search.topRated") || "Top Rated"}</option>
                  <option value="price_low">{t("search.priceLow") || "Price: Low to High"}</option>
                  <option value="price_high">{t("search.priceHigh") || "Price: High to Low"}</option>
                </select>
              </div>
            </div>

            <div className="min-h-[600px]">
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div 
                    key="loading" 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                  >
                    {Array.from({ length: 6 }).map((_, i) => <ProfessionalSkeletonCard key={i} />)}
                  </motion.div>
                ) : paginatedWorkers.length > 0 ? (
                  <motion.div 
                    key="results" 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                  >
                    {paginatedWorkers.map((w, i) => renderCard(w, i))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <EmptyState 
                      icon={AlertCircle}
                      title={filteredWorkers.length === 0 && (location.districtId || location.areaId) ? "No Results in this Region" : t("search.noMatch")}
                      description={filteredWorkers.length === 0 && (location.districtId || location.areaId) 
                        ? "We couldn't find any professionals in your specific area. Try searching across all regions." 
                        : t("search.noMatchDesc")}
                      actionText={filteredWorkers.length === 0 && (location.districtId || location.areaId) ? "Search All Regions" : t("search.resetFilters")}
                      onAction={() => { 
                        setCategory("All"); 
                        setLocation({ provinceId: "", districtId: "", cityId: "", areaId: "" });
                        setQuery(""); 
                        setActiveQuery(""); 
                        setRating(0); 
                        setPriceRange([0, 50000]);
                      }} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Floating Pagination */}
            {totalPages > 1 && !isLoading && (

              <div className="mt-20 flex items-center justify-center gap-6">
                 <button 
                  disabled={currentPage === 1} 
                  onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 300, behavior: 'smooth' }); }} 
                  className="w-14 h-14 flex items-center justify-center bg-card border border-border rounded-2xl disabled:opacity-30 hover:border-primary hover:text-primary transition-all shadow-sm"
                 >
                   <ChevronLeft size={24} />
                 </button>
                 
                 <div className="flex items-center gap-2">
                   {Array.from({ length: totalPages }).map((_, i) => (
                     <button
                       key={i}
                       onClick={() => setCurrentPage(i + 1)}
                       className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === i + 1 ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-muted text-text-hint hover:bg-card hover:border-border border border-transparent"}`}
                     >
                       {i + 1}
                     </button>
                   ))}
                 </div>

                 <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 300, behavior: 'smooth' }); }} 
                  className="w-14 h-14 flex items-center justify-center bg-card border border-border rounded-2xl disabled:opacity-30 hover:border-primary hover:text-primary transition-all shadow-sm"
                 >
                   <ChevronRight size={24} />
                 </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>}>
      <SearchContent />
    </Suspense>
  );
}
