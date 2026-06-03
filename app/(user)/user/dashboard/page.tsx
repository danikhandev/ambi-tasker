"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  Star, 
  MapPin, 
  Calendar, 
  Zap, 
  Search, 
  ArrowRight, 
  TrendingUp, 
  AlertCircle,
  PackageOpen,
  UserCircle,
  Headphones,
  ChevronDown,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { unbounded } from '@/app/fonts';
import { useTranslation } from '@/hooks/useTranslation';
import { useUser } from '@/contexts/UserContext';
import { useUI } from '@/contexts/UIContext';
import SocialMediaIcons from '@/components/SocialMediaIcons';
import CircularFrame from '@/components/CircularFrame';
import { supabase } from '@/services/supabase';
import { SERVICE_CATEGORIES } from "@/constants/services";
import PageHeader from '@/components/PageHeader';

export default function UserDashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, loading: userLoading } = useUser();
  const { showToast } = useUI();

  const [isLoading, setIsLoading] = React.useState(true);
  const [activeRequests, setActiveRequests] = React.useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = React.useState({ totalBookings: 0, pendingReviews: 0, totalSpent: 0 });
  const [featuredData, setFeaturedData] = React.useState<any>(null);

  // ─── Location filter state (real-time from admin DB) ──────────────
  const [provinces, setProvinces] = React.useState<{id:string;name:string}[]>([]);
  const [districts, setDistricts] = React.useState<{id:string;name:string}[]>([]);
  const [tehsils, setTehsils] = React.useState<{id:string;name:string}[]>([]);
  const [areas, setAreas] = React.useState<{id:string;name:string}[]>([]);
  const [selProvince, setSelProvince] = React.useState('');
  const [selDistrict, setSelDistrict] = React.useState('');
  const [selTehsil, setSelTehsil] = React.useState('');
  const [selArea, setSelArea] = React.useState('');
  const [isFeaturedFirst, setIsFeaturedFirst] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [selCategory, setSelCategory] = React.useState('All');
  const [searchResults, setSearchResults] = React.useState<any[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Fetch provinces on mount
  React.useEffect(() => {
    fetch('/api/locations?type=provinces')
      .then(r => r.json())
      .then(j => { if (j.success) setProvinces(j.data || []); })
      .catch(() => {});
  }, []);

  // Fetch districts when province changes
  React.useEffect(() => {
    setDistricts([]); setTehsils([]); setAreas([]);
    setSelDistrict(''); setSelTehsil(''); setSelArea('');
    if (!selProvince) return;
    fetch(`/api/locations?type=districts&parentId=${selProvince}`)
      .then(r => r.json())
      .then(j => { if (j.success) setDistricts(j.data || []); })
      .catch(() => {});
  }, [selProvince]);

  // Fetch tehsils (cities) when district changes
  React.useEffect(() => {
    setTehsils([]); setAreas([]);
    setSelTehsil(''); setSelArea('');
    if (!selDistrict) return;
    fetch(`/api/locations?type=cities&parentId=${selDistrict}`)
      .then(r => r.json())
      .then(j => { if (j.success) setTehsils(j.data || []); })
      .catch(() => {});
  }, [selDistrict]);

  // Fetch areas when tehsil changes
  React.useEffect(() => {
    setAreas([]); setSelArea('');
    if (!selTehsil) return;
    fetch(`/api/locations?type=areas&parentId=${selTehsil}`)
      .then(r => r.json())
      .then(j => { if (j.success) setAreas(j.data || []); })
      .catch(() => {});
  }, [selTehsil]);

  React.useEffect(() => {
    if (user?.id) {
      fetchDashboardData();

      const channel = supabase
        .channel(`user-bookings-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'Booking', filter: `userId=eq.${user.id}` },
          () => fetchDashboardData(true)
        )
        .subscribe();

      // Fallback Polling Mechanism (Every 30 seconds)
      const pollInterval = setInterval(() => {
        fetchDashboardData(true);
      }, 30000);

      return () => { 
        clearInterval(pollInterval);
        supabase.removeChannel(channel); 
      };
    } else if (!userLoading) {
      setIsLoading(false);
    }
  }, [user, userLoading]);

  // Refetch featured data dynamically when selected location filters change
  React.useEffect(() => {
    if (!user?.id) return;
    const params = new URLSearchParams();
    if (selProvince) params.append("provinceId", selProvince);
    if (selDistrict) params.append("districtId", selDistrict);
    if (selTehsil) params.append("cityId", selTehsil);
    if (selArea) params.append("areaId", selArea);

    fetch(`/api/user/dashboard/featured?${params.toString()}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setFeaturedData(json.data);
      })
      .catch(() => {});
  }, [selProvince, selDistrict, selTehsil, selArea, user?.id]);

  const getSearchUrl = (categoryName?: string) => {
    const params = new URLSearchParams();
    if (categoryName) {
      params.append("category", categoryName);
    }
    if (selProvince) {
      params.append("provinceId", selProvince);
      params.append("provinceName", provinces.find(p => p.id === selProvince)?.name || '');
    }
    if (selDistrict) {
      params.append("districtId", selDistrict);
      params.append("districtName", districts.find(d => d.id === selDistrict)?.name || '');
    }
    if (selTehsil) {
      params.append("cityId", selTehsil);
      params.append("cityName", tehsils.find(t => t.id === selTehsil)?.name || '');
    }
    if (selArea) {
      params.append("areaId", selArea);
      params.append("areaName", areas.find(a => a.id === selArea)?.name || '');
    }
    if (isFeaturedFirst) {
      params.append("featured", "true");
      params.append("sortBy", "featured");
    }
    return `/search?${params.toString()}`;
  };

  // Debounce search query
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const hasSearched = !!debouncedQuery || selCategory !== 'All' || !!selProvince || !!selDistrict || !!selTehsil || !!selArea || isFeaturedFirst;

  React.useEffect(() => {
    if (!hasSearched) {
      setSearchResults([]);
      return;
    }

    const fetchSearchResults = async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({
          search: debouncedQuery,
          category: selCategory === "All" ? "" : selCategory,
          provinceId: selProvince || "",
          districtId: selDistrict || "",
          cityId: selTehsil || "",
          areaId: selArea || "",
          limit: "50",
        });

        const res = await fetch(`/api/providers?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          let sorted = [...json.data];
          if (isFeaturedFirst) {
            sorted.sort((a: any, b: any) => {
              const rDiff = parseFloat(b.rating || "0") - parseFloat(a.rating || "0");
              if (rDiff !== 0) return rDiff;
              const jDiff = (b.completedJobs || 0) - (a.completedJobs || 0);
              if (jDiff !== 0) return jDiff;
              return (b.experienceYears || 0) - (a.experienceYears || 0);
            });
          }
          setSearchResults(sorted);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    };

    fetchSearchResults();
  }, [debouncedQuery, selCategory, selProvince, selDistrict, selTehsil, selArea, isFeaturedFirst, hasSearched]);

  async function fetchDashboardData(silent: boolean = false) {
    if (!silent) setIsLoading(true);
    try {
      // 1. Fetch Bookings
      const res = await fetch("/api/bookings?role=customer");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to fetch bookings");

      const active = (json.data || []).filter((b: any) => 
        ['Requested', 'Accepted', 'InProgress', 'Arrived'].includes(b.status)
      ).map((b: any) => ({
        id: b.id,
        provider: b.provider?.user?.name || "Assigned Pro",
        service: b.service?.name || "Specialized Task",
        status: b.status.toUpperCase(),
        date: b.scheduledAt ? new Date(b.scheduledAt).toLocaleDateString() : "TBD",
        price: `${t("common.currency")} ${b.totalPrice?.toLocaleString() || 0}`,
        avatar: b.provider?.user?.profileImage || "/default-avatar.svg",
      }));
      setActiveRequests(active);

      // 2. Fetch Stats
      const statsRes = await fetch("/api/user/dashboard/stats");
      const statsJson = await statsRes.json();
      if (statsJson.success) setDashboardStats(statsJson.data);

      // 3. Fetch Featured
      const params = new URLSearchParams();
      if (selProvince) params.append("provinceId", selProvince);
      if (selDistrict) params.append("districtId", selDistrict);
      if (selTehsil) params.append("cityId", selTehsil);
      if (selArea) params.append("areaId", selArea);

      const featRes = await fetch(`/api/user/dashboard/featured?${params.toString()}`);
      const featJson = await featRes.json();
      if (featJson.success) setFeaturedData(featJson.data);

    } catch (err: any) {
      // Intentionally silent for clean UI
    } finally {
      setIsLoading(false);
    }
  }

  // 1. Mobile-First Structure Setup
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-28 pt-4 md:pt-8 space-y-8 md:space-y-12">
      
      <div className="hidden md:block">
         <h1 className={`${unbounded.className} text-3xl font-black text-foreground`}>
           {t("dashboard.hello")}{" "}
           <span className="text-primary">{user?.firstName || "User"}</span>
         </h1>
      </div>

      {/* 3. Search / Action Area */}
      <div className="relative group">
         <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[28px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
         <div className="relative bg-white dark:bg-gray-900 border border-border/80 rounded-[24px] shadow-sm flex items-center p-2 group-hover:border-primary/30 transition-all duration-300">
            <div className="w-14 h-14 flex items-center justify-center shrink-0">
               <Search size={22} className="text-text-hint group-hover:text-primary transition-colors" />
            </div>
            <input
               type="text"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
               placeholder="What service do you need today?"
               className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-foreground placeholder:text-text-hint/70 py-4"
            />
            {searchQuery && (
               <button 
                  onClick={() => setSearchQuery('')}
                  className="w-10 h-10 flex items-center justify-center text-text-hint hover:text-foreground mr-2"
               >
                  <X size={18} />
               </button>
            )}
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-md">
               <ArrowRight size={20} />
            </div>
         </div>
      </div>

      {/* Location & Featured Filters — Real-time from Admin DB */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 pt-2 md:pt-4">
        
        {/* Province */}
        <div className="relative shrink-0 min-w-[130px]">
          <select
            value={selProvince}
            onChange={e => setSelProvince(e.target.value)}
            className="bg-white dark:bg-gray-900 border border-border/80 rounded-[20px] pl-5 pr-10 h-11 text-xs font-bold text-text-secondary focus:outline-none focus:border-primary/50 hover:border-primary/30 transition-colors shadow-sm cursor-pointer appearance-none w-full"
          >
            <option value="">Province</option>
            {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-hint pointer-events-none" />
        </div>

        {/* District */}
        <div className="relative shrink-0 min-w-[130px]">
          <select
            value={selDistrict}
            onChange={e => setSelDistrict(e.target.value)}
            disabled={!selProvince}
            className={`bg-white dark:bg-gray-900 border border-border/80 rounded-[20px] pl-5 pr-10 h-11 text-xs font-bold focus:outline-none focus:border-primary/50 hover:border-primary/30 transition-colors shadow-sm cursor-pointer appearance-none w-full ${!selProvince ? 'text-text-hint opacity-60' : 'text-text-secondary'}`}
          >
            <option value="">District</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-hint pointer-events-none" />
        </div>

        {/* Tehsil */}
        <div className="relative shrink-0 min-w-[130px]">
          <select
            value={selTehsil}
            onChange={e => setSelTehsil(e.target.value)}
            disabled={!selDistrict}
            className={`bg-white dark:bg-gray-900 border border-border/80 rounded-[20px] pl-5 pr-10 h-11 text-xs font-bold focus:outline-none focus:border-primary/50 hover:border-primary/30 transition-colors shadow-sm cursor-pointer appearance-none w-full ${!selDistrict ? 'text-text-hint opacity-60' : 'text-text-secondary'}`}
          >
            <option value="">Tehsil</option>
            {tehsils.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-hint pointer-events-none" />
        </div>

        {/* Area */}
        <div className="relative shrink-0 min-w-[130px]">
          <select
            value={selArea}
            onChange={e => setSelArea(e.target.value)}
            disabled={!selTehsil}
            className={`bg-white dark:bg-gray-900 border border-border/80 rounded-[20px] pl-5 pr-10 h-11 text-xs font-bold focus:outline-none focus:border-primary/50 hover:border-primary/30 transition-colors shadow-sm cursor-pointer appearance-none w-full ${!selTehsil ? 'text-text-hint opacity-60' : 'text-text-secondary'}`}
          >
            <option value="">Area</option>
            {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-hint pointer-events-none" />
        </div>

        {/* Featured First toggle */}
        <label className="flex items-center gap-2.5 bg-white dark:bg-gray-900 border border-border/80 hover:border-primary/30 rounded-[20px] px-5 h-11 shadow-sm shrink-0 cursor-pointer transition-colors group">
           <div className="relative flex items-center justify-center w-4 h-4 shrink-0">
             <input 
               type="checkbox" 
               checked={isFeaturedFirst}
               onChange={e => setIsFeaturedFirst(e.target.checked)}
               className="peer appearance-none w-4 h-4 min-w-[16px] min-h-[16px] m-0 p-0 border-2 border-border/80 rounded-[4px] checked:bg-primary checked:border-primary transition-all cursor-pointer outline-none ring-0" 
             />
             <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
               <svg viewBox="0 0 14 14" fill="none" className="w-2.5 h-2.5"><path d="M3 7.5L5.5 10L11 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
             </div>
           </div>
           <span className="text-[11px] font-black uppercase text-text-secondary group-hover:text-primary transition-colors select-none tracking-widest mt-0.5">Featured First</span>
        </label>
        
      </div>

      {/* 4. Categories / Services Grid & dynamic Search Results */}
      {hasSearched ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-black uppercase tracking-[0.15em] text-foreground">
                Search Results ({searchResults.length})
              </h3>
              {selCategory !== 'All' && (
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  Category: {selCategory}
                  <button onClick={() => setSelCategory('All')} className="hover:text-accent font-bold">×</button>
                </span>
              )}
            </div>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelCategory('All');
                setSelProvince('');
                setSelDistrict('');
                setSelTehsil('');
                setSelArea('');
                setIsFeaturedFirst(false);
              }}
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
            >
              Clear All Filters
            </button>
          </div>

          {isSearching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm">
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
                  </div>
                </div>
              ))}
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-10">
              <EmptyState 
                icon={AlertCircle}
                title="No Professionals Found"
                description="Try adjusting your keywords, selecting a different location, or resetting the filters."
                actionText="Reset All Filters"
                onAction={() => {
                  setSearchQuery('');
                  setSelCategory('All');
                  setSelProvince('');
                  setSelDistrict('');
                  setSelTehsil('');
                  setSelArea('');
                  setIsFeaturedFirst(false);
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {searchResults.map((worker) => {
                const isApproved = worker.verificationStatus === "VERIFIED";
                return (
                  <div
                    key={worker.id}
                    className="group bg-card rounded-[32px] border border-border/60 overflow-hidden shadow-sm hover:shadow-2xl hover:border-primary/20 transition-all duration-500 flex flex-col h-full relative"
                  >
                    {/* Cover Image */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted/30">
                      <img 
                        src={worker.coverImage || `https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800`} 
                        alt="" 
                        className="object-cover w-full h-full group-hover:scale-110 transition-all duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <Star size={12} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] font-black text-slate-900">{worker.rating}</span>
                      </div>
                      
                      {/* KYC Status Badge */}
                      <div className="absolute top-4 left-4">
                        {isApproved ? (
                          <div className="bg-emerald-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-emerald-500/20">
                            <ShieldCheck size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                          </div>
                        ) : (
                          <div className="bg-rose-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-rose-500/20">
                            <AlertCircle size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Not Verified</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content Box */}
                    <div className="p-6 relative flex-1 flex flex-col justify-between">
                      <div>
                        {/* Avatar */}
                        <div className="relative shrink-0 -mt-14 mb-4 z-10">
                          <div className="w-20 h-20 rounded-3xl border-4 border-card bg-muted overflow-hidden shadow-xl group-hover:scale-105 transition-transform relative">
                            <CircularFrame src={worker.avatar || "/default-avatar.svg"} size={80} className="object-cover w-full h-full" alt={worker.name} />
                          </div>
                        </div>

                        {/* Details */}
                        <h4 className="text-sm font-black text-foreground uppercase tracking-tight flex items-center gap-1 truncate mb-1">
                          {worker.name}
                          {isApproved && <ShieldCheck size={12} className="text-primary shrink-0" />}
                        </h4>
                        
                        <div className="flex items-center gap-1.5 text-text-hint mb-3">
                          <MapPin size={12} />
                          <span className="text-[10px] font-bold">{worker.location || "Local Region"}</span>
                        </div>

                        <h3 className="text-sm font-black text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
                          {worker.title}
                        </h3>
                        <p className="text-[10px] text-text-hint line-clamp-2 italic opacity-70 group-hover:opacity-100 transition-opacity">
                          "{worker.bio}"
                        </p>
                      </div>

                      {/* Action Row */}
                      <div className="mt-6 flex items-center justify-between pt-5 border-t border-border/40">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase text-text-hint tracking-widest">Starting At</span>
                          <span className={`${unbounded.className} text-sm font-black text-primary`}>
                            Rs. {worker.hourlyRate}
                          </span>
                        </div>
                        {isApproved ? (
                          <Link 
                            href={`/provider/${worker.id}?book=true`} 
                            className="px-6 py-2.5 bg-primary text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 shadow-md shadow-primary/5"
                          >
                            Book Now
                          </Link>
                        ) : (
                          <button 
                            onClick={() => showToast("This provider is not verified yet", "error")}
                            className="px-6 py-2.5 bg-gray-200 text-gray-500 cursor-not-allowed rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            Book Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Categories Grid */}
          <section>
             <div className="flex items-center justify-between mb-6 px-1">
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-foreground">Categories</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-text-hint">{SERVICE_CATEGORIES.length} Services Available</span>
             </div>
             <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-4 md:gap-6">
                {SERVICE_CATEGORIES.map(cat => (
                   <button 
                     onClick={() => setSelCategory(cat.name)}
                     key={cat.id} 
                     className="flex flex-col items-center gap-3 group transition-all cursor-pointer outline-none"
                   >
                      <div className="w-full aspect-square rounded-[24px] sm:rounded-[32px] bg-card border border-border flex items-center justify-center text-2xl sm:text-3xl transition-all duration-300 group-hover:scale-105 group-hover:-rotate-6 group-hover:bg-primary group-hover:text-white group-hover:border-primary group-hover:shadow-xl group-hover:shadow-primary/20">
                         {cat.emoji}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-[0.1em] text-center text-text-secondary group-hover:text-primary transition-colors line-clamp-2 px-1">
                        {t(cat.nameKey)}
                      </span>
                   </button>
                ))}
             </div>
          </section>
        </>
      )}

      {/* 5. Featured / Recommended Section & 6. Recent Activity (Only shown when not searching) */}
      {!hasSearched && (
        <>
          {/* 5. Featured / Recommended Section */}
          <AnimatePresence mode="wait">
            {isLoading && !featuredData ? (
              <motion.section 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-card rounded-[32px] p-6 md:p-8 relative overflow-hidden border border-border"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-3 w-full max-w-sm">
                     <Skeleton className="h-6 w-24 rounded-full" />
                     <Skeleton className="h-8 w-3/4 rounded-lg" />
                     <Skeleton className="h-4 w-full rounded-md" />
                     <Skeleton className="h-4 w-5/6 rounded-md" />
                  </div>
                  <Skeleton className="h-12 w-32 rounded-2xl shrink-0" />
                </div>
              </motion.section>
            ) : featuredData ? (
              <motion.section 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-primary to-accent rounded-[32px] p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-primary/10"
              >
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] pointer-events-none rounded-full" />
                 <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                       <div className="px-3 py-1 bg-white/10 rounded-full w-fit text-[9px] font-black uppercase tracking-widest mb-3 backdrop-blur-sm border border-white/10">
                         {featuredData.type === 'PROVIDER' ? 'Top Rated Pro' : 'Recommended'}
                       </div>
                       <h3 className={`${unbounded.className} text-2xl font-black mb-2`}>{featuredData.title}</h3>
                       <p className="text-white/80 text-xs font-medium max-w-sm leading-relaxed">{featuredData.description}</p>
                    </div>
                    <button 
                      onClick={() => router.push(featuredData.actionUrl)} 
                      className="px-6 py-3.5 bg-white text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 shadow-xl shadow-black/10 shrink-0"
                    >
                       Book Now
                    </button>
                 </div>
              </motion.section>
            ) : (
              <motion.section 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-primary to-accent rounded-[32px] p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-primary/10"
              >
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] pointer-events-none rounded-full" />
                 <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                       <div className="px-3 py-1 bg-white/10 rounded-full w-fit text-[9px] font-black uppercase tracking-widest mb-3 backdrop-blur-sm border border-white/10">Featured</div>
                       <h3 className={`${unbounded.className} text-2xl font-black mb-2`}>Emergency Plumbing</h3>
                       <p className="text-white/80 text-xs font-medium max-w-sm leading-relaxed">Top-rated professionals available within 30 minutes in your locality.</p>
                    </div>
                    <button onClick={() => router.push('/search?category=plumbing')} className="px-6 py-3.5 bg-white text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all active:scale-95 shadow-xl shadow-black/10 shrink-0">
                       Book Now
                    </button>
                 </div>
              </motion.section>
            )}
          </AnimatePresence>
    
          {/* 6. Recent Activity / Bookings */}
          <section>
             <div className="flex items-center gap-3 mb-6 px-1">
                <h3 className="text-sm font-black uppercase tracking-[0.15em] text-foreground">Recent Activity</h3>
                {activeRequests.length > 0 && <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">{activeRequests.length}</span>}
             </div>
             
             <div className="space-y-4">
                <AnimatePresence mode="wait">
                   {isLoading ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                         {[1, 2, 3].map(i => (
                           <div key={i} className="bg-card border border-border rounded-[28px] p-5 flex items-center gap-5 shadow-sm">
                             <Skeleton className="w-14 h-14 rounded-full shrink-0" />
                             <div className="flex-1 space-y-2">
                                <Skeleton className="h-4 w-1/3 rounded-md" />
                                <Skeleton className="h-3 w-1/4 rounded-md" />
                                <Skeleton className="h-3 w-1/5 rounded-md" />
                             </div>
                           </div>
                         ))}
                      </motion.div>
                    ) : activeRequests.length === 0 ? (
                       <div className="py-10">
                          <EmptyState 
                            icon={PackageOpen}
                            title="No Active Bookings"
                            description="Find a professional and get your tasks done efficiently."
                            actionText="Explore Services"
                            onAction={() => router.push('/search')}
                          />
                       </div>
                    ) : (
                      activeRequests.map((req, i) => (
                         <motion.div 
                            key={req.id} 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: i * 0.05 }} 
                            className="bg-card border border-border rounded-[28px] p-5 flex items-center gap-5 hover:border-primary/30 transition-all shadow-sm cursor-pointer"
                            onClick={() => router.push(`/user/booking/${req.id}`)}
                         >
                            <CircularFrame src={req.avatar} size={56} className="shrink-0" alt={req.provider || "Provider"} />
                            <div className="flex-1 min-w-0">
                               <div className="flex items-center justify-between mb-1 gap-2">
                                  <h4 className="font-bold text-sm text-foreground truncate">{req.service}</h4>
                                  <span className={`shrink-0 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ${req.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{req.status}</span>
                               </div>
                               <p className="text-[11px] font-medium text-text-hint truncate mb-2">{req.provider}</p>
                               <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                  <span className="flex items-center gap-1 text-primary"><Calendar size={12}/> {req.date}</span>
                                  <span className="text-accent">{req.price}</span>
                               </div>
                            </div>
                         </motion.div>
                      ))
                    )}
                 </AnimatePresence>
              </div>
           </section>
        </>
      )}
    </div>
  );
}
