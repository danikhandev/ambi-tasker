"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Navigation,
  ChevronDown,
  Building2,
  Map,
  Globe,
  Milestone,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// ─── Types ─────────────────────────────────────────────────────────────────
export interface LocationStepData {
  latitude: number;
  longitude: number;
  address: string;
  province?: string;
  provinceId?: string;
  district?: string;
  districtId?: string;
  city?: string;
  cityId?: string;
  area: string;
  areaId: string;
  serviceRadius?: number;
}

interface LocationStepProps {
  /** 'user' or 'provider' — providers get service radius selection */
  role: "user" | "provider";
  /** Callback when location is confirmed */
  onConfirm: (data: LocationStepData) => void;
  /** Callback for going back */
  onBack: () => void;
  /** Optional initial location data */
  initialData?: Partial<LocationStepData> | null;
}

interface LocationItem {
  id: string;
  name: string;
}

const SERVICE_RADIUS_OPTIONS = [
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 15, label: "15 km" },
  { value: 20, label: "20 km" },
  { value: 30, label: "30 km" },
  { value: 50, label: "50 km" },
];

export default function LocationStep({
  role,
  onConfirm,
  onBack,
  initialData,
}: LocationStepProps) {
  const { t, isRTL } = useTranslation();

  // Location lists
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [areas, setAreas] = useState<LocationItem[]>([]);
  
  // Selected values
  const [selectedProvince, setSelectedProvince] = useState<LocationItem | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<LocationItem | null>(null);
  const [selectedCity, setSelectedCity] = useState<LocationItem | null>(null);
  const [selectedArea, setSelectedArea] = useState<LocationItem | null>(null);
  
  const [serviceRadius, setServiceRadius] = useState(initialData?.serviceRadius || 10);
  const [detailedAddress, setDetailedAddress] = useState(initialData?.address || "");

  // UI state
  const [loadingStates, setLoadingStates] = useState({
    provinces: true,
    districts: false,
    cities: false,
    areas: false,
  });
  const [error, setError] = useState("");
  
  // Dropdown visibility states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [areaSearch, setAreaSearch] = useState("");

  const refs = {
    province: useRef<HTMLDivElement>(null),
    district: useRef<HTMLDivElement>(null),
    city: useRef<HTMLDivElement>(null),
    area: useRef<HTMLDivElement>(null),
    radius: useRef<HTMLDivElement>(null),
  };

  // 1. Initial Load: Provinces
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const res = await fetch("/api/locations?type=provinces", { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          setProvinces(json.data);
          if (json.data.length === 1) setSelectedProvince(json.data[0]);
        } else {
          throw new Error("Empty data from API");
        }
      } catch (err) {
        console.warn("Location API failed, using fallback:", err);
        // Fallback to local data
        const localProvinces = [{ id: "kp", name: "Khyber Pakhtunkhwa" }];
        setProvinces(localProvinces);
        if (localProvinces.length === 1) setSelectedProvince(localProvinces[0]);
      } finally {
        setLoadingStates(prev => ({ ...prev, provinces: false }));
      }
    };
    fetchProvinces();
  }, []);

  // 2. Cascading Load: Districts
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setSelectedDistrict(null);
      return;
    }
    const fetchDistricts = async () => {
      setLoadingStates(prev => ({ ...prev, districts: true }));
      setError("");
      try {
        const res = await fetch(`/api/locations?type=districts&parentId=${selectedProvince.id}`);
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          setDistricts(json.data);
          if (json.data.length === 1) setSelectedDistrict(json.data[0]);
        } else {
          throw new Error("No districts found");
        }
      } catch (err) {
        console.warn("Districts API failed, using fallback");
        const fallbackDistricts = [{ id: "haripur", name: "Haripur" }];
        setDistricts(fallbackDistricts);
        if (fallbackDistricts.length === 1) setSelectedDistrict(fallbackDistricts[0]);
      } finally {
        setLoadingStates(prev => ({ ...prev, districts: false }));
      }
    };
    fetchDistricts();
  }, [selectedProvince]);

  // 3. Cascading Load: Cities
  useEffect(() => {
    if (!selectedDistrict) {
      setCities([]);
      setSelectedCity(null);
      return;
    }
    const fetchCities = async () => {
      setLoadingStates(prev => ({ ...prev, cities: true }));
      setError("");
      try {
        const res = await fetch(`/api/locations?type=cities&parentId=${selectedDistrict.id}`);
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          setCities(json.data);
          if (json.data.length === 1) setSelectedCity(json.data[0]);
        } else {
          throw new Error("No cities found");
        }
      } catch (err) {
        console.warn("Cities API failed, using fallback");
        const fallbackCities = [{ id: "haripur-city", name: "Haripur" }];
        setCities(fallbackCities);
        if (fallbackCities.length === 1) setSelectedCity(fallbackCities[0]);
      } finally {
        setLoadingStates(prev => ({ ...prev, cities: false }));
      }
    };
    fetchCities();
  }, [selectedDistrict]);

  // 4. Cascading Load: Areas
  useEffect(() => {
    if (!selectedCity) {
      setAreas([]);
      setSelectedArea(null);
      return;
    }
    const fetchAreas = async () => {
      setLoadingStates(prev => ({ ...prev, areas: true }));
      setError("");
      try {
        const res = await fetch(`/api/locations?type=areas&parentId=${selectedCity.id}`);
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          setAreas(json.data);
        } else {
          throw new Error("No areas found");
        }
      } catch (err) {
        console.warn("Areas API failed, using fallback");
        const fallbackAreas = [{ id: "main-bazar", name: "Main Bazar" }, { id: "civil-hospital", name: "Civil Hospital Road" }];
        setAreas(fallbackAreas);
      } finally {
        setLoadingStates(prev => ({ ...prev, areas: false }));
      }
    };
    fetchAreas();
  }, [selectedCity]);

  // Click outside listener
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      let isInside = false;
      Object.values(refs).forEach(ref => {
        if (ref.current?.contains(e.target as Node)) isInside = true;
      });
      if (!isInside) setActiveDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredAreas = areas.filter((area) =>
    area.name.toLowerCase().includes(areaSearch.toLowerCase())
  );

  const isLocationSelected = !!selectedProvince && !!selectedDistrict && !!selectedCity && !!selectedArea;

  const handleConfirm = () => {
    if (!isLocationSelected) return;

    const fullAddress = detailedAddress 
      ? `${detailedAddress}, ${selectedArea.name}, ${selectedCity.name}, ${selectedDistrict.name}, ${selectedProvince.name}`
      : `${selectedArea.name}, ${selectedCity.name}, ${selectedDistrict.name}, ${selectedProvince.name}`;

    onConfirm({
      latitude: 33.9946, // Default to Haripur center if no map
      longitude: 72.9335,
      address: fullAddress,
      province: selectedProvince.name,
      provinceId: selectedProvince.id,
      district: selectedDistrict.name,
      districtId: selectedDistrict.id,
      city: selectedCity.name,
      cityId: selectedCity.id,
      area: selectedArea.name,
      areaId: selectedArea.id,
      ...(role === "provider" ? { serviceRadius } : {}),
    });
  };

  const Dropdown = ({ 
    label, 
    value, 
    items, 
    onSelect, 
    isLoading, 
    disabled, 
    type,
    icon: Icon 
  }: { 
    label: string, 
    value: LocationItem | null, 
    items: LocationItem[], 
    onSelect: (item: LocationItem) => void, 
    isLoading: boolean, 
    disabled: boolean,
    type: string,
    icon: any
  }) => (
    <div className="space-y-2 relative" ref={(refs as any)[type]}>
      <label className="text-[11px] font-black uppercase tracking-widest text-text-hint block px-1">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setActiveDropdown(activeDropdown === type ? null : type)}
        disabled={disabled || isLoading}
        className={`w-full h-14 px-5 rounded-2xl border transition-all font-bold text-sm flex items-center justify-between shadow-sm
          ${disabled 
            ? "bg-muted/50 border-border/50 text-text-disabled cursor-not-allowed" 
            : "border-border bg-muted hover:bg-card hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/5 active:scale-[0.99]"}
        `}
      >
        <div className="flex items-center gap-3">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Icon className="w-4 h-4 text-text-hint" />}
          <span className={value ? "text-foreground" : "text-text-hint"}>
            {isLoading ? "Loading..." : value?.name || `Select ${label}`}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-text-hint transition-transform duration-300 ${activeDropdown === type ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {activeDropdown === type && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="absolute top-full mt-2 left-0 right-0 z-[100] bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 overflow-hidden"
          >
            {type === 'area' && (
               <div className="p-2 border-b border-border sticky top-0 bg-card z-10">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-hint" />
                  <input
                    type="text"
                    placeholder="Search area..."
                    value={areaSearch}
                    onChange={(e) => setAreaSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-muted rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}
            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
              {(type === 'area' ? filteredAreas : items).length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm font-bold text-text-hint">No items found.</p>
                </div>
              ) : (
                (type === 'area' ? filteredAreas : items).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      setActiveDropdown(null);
                      if (type === 'area') setAreaSearch("");
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all mb-0.5 flex items-center justify-between
                      ${value?.id === item.id ? "bg-primary text-white shadow-lg shadow-primary/20" : "hover:bg-muted text-foreground"}
                    `}
                  >
                    {item.name}
                    {value?.id === item.id && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Hierarchy Path Visualization */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap border ${selectedProvince ? "bg-primary/5 border-primary/20 text-primary" : "bg-muted border-border text-text-hint"}`}>
          <Globe className="w-3 h-3" /> Pakistan
        </div>
        {selectedProvince && (
          <>
            <ChevronDown className="-rotate-90 w-3 h-3 text-text-hint shrink-0" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              {selectedProvince.name}
            </div>
          </>
        )}
        {selectedDistrict && (
          <>
            <ChevronDown className="-rotate-90 w-3 h-3 text-text-hint shrink-0" />
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              {selectedDistrict.name}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-red-100 dark:border-red-500/20"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Province Selection */}
        <Dropdown 
          label="Province"
          type="province"
          icon={Globe}
          value={selectedProvince}
          items={provinces}
          isLoading={loadingStates.provinces}
          disabled={false}
          onSelect={(item) => {
            setSelectedProvince(item);
            setSelectedDistrict(null);
            setSelectedCity(null);
            setSelectedArea(null);
          }}
        />

        {/* District Selection */}
        <Dropdown 
          label="District"
          type="district"
          icon={Map}
          value={selectedDistrict}
          items={districts}
          isLoading={loadingStates.districts}
          disabled={!selectedProvince}
          onSelect={(item) => {
            setSelectedDistrict(item);
            setSelectedCity(null);
            setSelectedArea(null);
          }}
        />

        {/* City Selection */}
        <Dropdown 
          label="City"
          type="city"
          icon={Building2}
          value={selectedCity}
          items={cities}
          isLoading={loadingStates.cities}
          disabled={!selectedDistrict}
          onSelect={(item) => {
            setSelectedCity(item);
            setSelectedArea(null);
          }}
        />

        {/* Area Selection */}
        <Dropdown 
          label="Area / Sector"
          type="area"
          icon={MapPin}
          value={selectedArea}
          items={areas}
          isLoading={loadingStates.areas}
          disabled={!selectedCity}
          onSelect={(item) => {
            setSelectedArea(item);
          }}
        />
      </div>

      {/* Detailed Address */}
      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-widest text-text-hint block px-1">
          Detailed Address (House #, Street, Landmarks)
        </label>
        <div className="relative group">
          <Milestone className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-text-hint group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            value={detailedAddress}
            onChange={(e) => setDetailedAddress(e.target.value)}
            placeholder="e.g. House 45, Street 2, Near Civil Hospital"
            className="w-full pl-12 pr-5 h-14 rounded-2xl border border-border bg-muted focus:bg-card focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all font-bold text-sm shadow-sm"
          />
        </div>
      </div>

      {/* Service Radius (Provider Only) */}
      {role === "provider" && (
        <div className="space-y-2 relative" ref={refs.radius}>
          <label className="text-[11px] font-black uppercase tracking-widest text-text-hint block px-1 flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5" />
            Service Radius (How far will you travel?)
          </label>
          <button
            type="button"
            onClick={() => setActiveDropdown(activeDropdown === 'radius' ? null : 'radius')}
            className="w-full h-14 px-5 rounded-2xl border border-border bg-muted hover:bg-card flex items-center gap-3 transition-all duration-300 shadow-sm"
          >
            <span className="flex-1 text-sm font-bold text-foreground text-left">
              {serviceRadius} km
            </span>
            <ChevronDown className={`w-4 h-4 text-text-hint transition-transform duration-300 ${activeDropdown === 'radius' ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {activeDropdown === 'radius' && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                className="absolute bottom-full mb-2 left-0 right-0 z-[100] bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 overflow-hidden"
              >
                <div className="p-1">
                  {SERVICE_RADIUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setServiceRadius(opt.value);
                        setActiveDropdown(null);
                      }}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-left text-sm font-bold transition-all rounded-xl mb-0.5
                        ${opt.value === serviceRadius ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-foreground hover:bg-muted"}
                      `}
                    >
                      {opt.value === serviceRadius && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                      <span className="flex-1">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 pt-4 border-t border-border/50">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-8 h-14 rounded-2xl border border-border bg-card hover:bg-muted transition-all text-xs font-black uppercase tracking-widest text-text-secondary hover:text-foreground active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <motion.button
          type="button"
          whileHover={isLocationSelected ? { scale: 1.01, translateY: -2 } : {}}
          whileTap={isLocationSelected ? { scale: 0.98 } : {}}
          onClick={handleConfirm}
          disabled={!isLocationSelected}
          className={`flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest relative overflow-hidden group flex items-center justify-center gap-3 transition-all duration-500
            ${isLocationSelected
              ? "bg-primary text-white shadow-xl shadow-primary/25 hover:shadow-primary/40"
              : "bg-muted text-text-disabled cursor-not-allowed border border-border/50"}
          `}
        >
          <span>Complete Registration</span>
          <ArrowRight className={`w-4 h-4 transition-transform duration-500 ${isLocationSelected ? "group-hover:translate-x-2" : "opacity-30"}`} />
          
          {/* Shine effect */}
          {isLocationSelected && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
          )}
        </motion.button>
      </div>
    </div>
  );
}
