"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, ChevronDown, Search, CheckCircle2, Globe, Loader2, Info } from "lucide-react";
import { IS_BETA, AVAILABILITY_MESSAGE, PLATFORM_SUBTITLE } from "@/constants/locationConfig";

interface LocationItem {
  id: string;
  name: string;
}

interface LocationSelectorProps {
  /** Current location values */
  value?: {
    provinceId?: string;
    provinceName?: string;
    districtId?: string;
    districtName?: string;
    cityId?: string;
    cityName?: string;
    areaId?: string;
    areaName?: string;
  };
  /** Called whenever any location unit changes */
  onChange: (location: any) => void;
  /** Which fields to show: 'province' | 'district' | 'city' | 'area' */
  fields?: ("province" | "district" | "city" | "area")[];
  /** Whether the component is disabled */
  disabled?: boolean;
  /** CSS class for the wrapper */
  className?: string;
}

export default function LocationSelector({
  value,
  onChange,
  fields = ["province", "district", "city", "area"],
  disabled = false,
  className = "",
}: LocationSelectorProps) {
  const [provinces, setProvinces] = useState<LocationItem[]>([]);
  const [districts, setDistricts] = useState<LocationItem[]>([]);
  const [cities, setCities] = useState<LocationItem[]>([]);
  const [areas, setAreas] = useState<LocationItem[]>([]);

  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const wrapperRef = useRef<HTMLDivElement>(null);

  const showProvince = fields.includes("province");
  const showDistrict = fields.includes("district");
  const showCity = fields.includes("city");
  const showArea = fields.includes("area");

  // Fetch initial data
  useEffect(() => {
    if (showProvince) fetchLocations("provinces", null);
    else fetchLocations("districts", null);
  }, [showProvince]);

  // Fetch children when parent changes
  useEffect(() => {
    if (showProvince) {
      if (value?.provinceId) fetchLocations("districts", value.provinceId);
      else setDistricts([]);
    }
  }, [value?.provinceId, showProvince]);

  useEffect(() => {
    if (value?.districtId) {
      if (showCity) {
        fetchLocations("cities", value.districtId);
      } else if (showArea) {
        // Flattened mode: Fetch areas directly if city is skipped
        fetchLocations("areas", null, value.districtId);
      }
    } else {
      setCities([]);
      if (!showCity) setAreas([]);
    }
  }, [value?.districtId, showCity, showArea]);

  useEffect(() => {
    if (value?.cityId) fetchLocations("areas", value.cityId);
    else if (showCity) setAreas([]);
  }, [value?.cityId, showCity]);

  const fetchLocations = async (type: string, parentId: string | null, districtId?: string) => {
    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      let url = `/api/locations?type=${type}${parentId ? `&parentId=${parentId}` : ''}`;
      if (type === "areas" && districtId && !parentId) {
        url = `/api/locations?type=areas&districtId=${districtId}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        if (type === "provinces") setProvinces(data.data);
        if (type === "districts") setDistricts(data.data);
        if (type === "cities") setCities(data.data);
        if (type === "areas") setAreas(data.data);
      }
    } catch (err) {
      console.error(`Failed to fetch ${type}:`, err);
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSelect = (type: string, item: LocationItem) => {
    const updates: any = {};
    if (type === "province") {
      updates.provinceId = item.id;
      updates.provinceName = item.name;
      updates.districtId = "";
      updates.districtName = "";
      updates.cityId = "";
      updates.cityName = "";
      updates.areaId = "";
      updates.areaName = "";
    } else if (type === "district") {
      updates.districtId = item.id;
      updates.districtName = item.name;
      updates.cityId = "";
      updates.cityName = "";
      updates.areaId = "";
      updates.areaName = "";
    } else if (type === "city") {
      updates.cityId = item.id;
      updates.cityName = item.name;
      updates.areaId = "";
      updates.areaName = "";
    } else if (type === "area") {
      updates.areaId = item.id;
      updates.areaName = item.name;
    }
    
    onChange({ ...value, ...updates });
    setOpenDropdown(null);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filterOptions = (options: LocationItem[]) => {
    if (!searchQuery.trim()) return options;
    return options.filter((o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div ref={wrapperRef} className={`space-y-4 ${className}`}>
      {/* Beta availability banner */}
      {IS_BETA && (
        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">
              {PLATFORM_SUBTITLE}
            </p>
            <p className="text-xs text-text-secondary font-medium leading-relaxed">
              {AVAILABILITY_MESSAGE}
            </p>
          </div>
        </div>
      )}

      {/* Unified iOS-Settings Style Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border shadow-sm">
        {/* Province Selector */}
        {showProvince && (
          <TableRowField
            label="Province"
            icon={<Globe className="w-4 h-4" />}
            value={value?.provinceName || ""}
            options={provinces}
            loading={loading.provinces}
            open={openDropdown === "province"}
            onToggle={() => {
              setOpenDropdown(openDropdown === "province" ? null : "province");
              setSearchQuery("");
            }}
            onSelect={(item: any) => handleSelect("province", item)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterOptions={filterOptions}
            disabled={disabled}
          />
        )}

        {/* District Selector */}
        {showDistrict && (
          <TableRowField
            label="District"
            icon={<MapPin className="w-4 h-4" />}
            value={value?.districtName || ""}
            options={districts}
            loading={loading.districts}
            open={openDropdown === "district"}
            onToggle={() => {
              if (showProvince && !value?.provinceId) return;
              setOpenDropdown(openDropdown === "district" ? null : "district");
              setSearchQuery("");
            }}
            onSelect={(item: any) => handleSelect("district", item)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterOptions={filterOptions}
            disabled={disabled || (showProvince && !value?.provinceId)}
            placeholder={showProvince && !value?.provinceId ? "Select Province first" : "Search District"}
          />
        )}

        {/* City Selector */}
        {showCity && (
          <TableRowField
            label="City / Tehsil"
            icon={<MapPin className="w-4 h-4" />}
            value={value?.cityName || ""}
            options={cities}
            loading={loading.cities}
            open={openDropdown === "city"}
            onToggle={() => {
              if (!value?.districtId) return;
              setOpenDropdown(openDropdown === "city" ? null : "city");
              setSearchQuery("");
            }}
            onSelect={(item: any) => handleSelect("city", item)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterOptions={filterOptions}
            disabled={disabled || !value?.districtId}
            placeholder={!value?.districtId ? "Select District first" : "Search City"}
          />
        )}

        {/* Area Selector */}
        {showArea && (
          <TableRowField
            label="Area / Locality"
            icon={<MapPin className="w-4 h-4" />}
            value={value?.areaName || ""}
            options={areas}
            loading={loading.areas}
            open={openDropdown === "area"}
            onToggle={() => {
              const dependencyMet = showCity ? !!value?.cityId : !!value?.districtId;
              if (!dependencyMet) return;
              setOpenDropdown(openDropdown === "area" ? null : "area");
              setSearchQuery("");
            }}
            onSelect={(item: any) => handleSelect("area", item)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterOptions={filterOptions}
            disabled={disabled || (showCity ? !value?.cityId : !value?.districtId)}
            placeholder={showCity 
              ? (!value?.cityId ? "Select City first" : "Search Area")
              : (!value?.districtId ? "Select District first" : "Search Area")
            }
          />
        )}
      </div>
    </div>
  );
}

// ─── INTERNAL DROPDOWN TABLE ROW FIELD ──────────────────────────────────────────

function TableRowField({
  label, value, options, open, onToggle, onSelect,
  searchQuery, onSearchChange, filterOptions,
  disabled = false, loading = false, icon, placeholder = "Search..."
}: any) {
  const filteredOptions = filterOptions(options);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={`w-full px-5 py-3.5 flex items-center justify-between text-left transition-all duration-200
          ${open ? "bg-primary/5" : "hover:bg-muted/30"}
          ${disabled ? "opacity-40 cursor-not-allowed grayscale" : "cursor-pointer"}
        `}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
            ${value ? 'bg-primary/10 text-primary' : 'bg-muted text-text-hint'}
          `}>
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-hint block leading-none mb-1">
              {label}
            </span>
            <span className={`text-xs font-bold truncate block leading-none
              ${value ? "text-foreground" : "text-text-hint/70"}
            `}>
              {value || `Select ${label}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ChevronDown className="w-4 h-4 text-text-hint/80" />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="absolute left-0 right-0 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden mt-1 mx-2"
          >
            <div className="p-2 border-b border-border bg-muted/40">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-hint" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={placeholder}
                  className="w-full pl-8 pr-4 py-2 bg-muted rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 text-center text-text-hint text-[10px] font-black uppercase tracking-widest flex flex-col items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  Loading...
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="px-4 py-6 text-center text-text-hint text-xs font-bold">
                  No results found
                </div>
              ) : (
                filteredOptions.map((opt: LocationItem) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onSelect(opt)}
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-left text-xs font-bold transition-all
                      ${opt.name === value
                        ? "bg-primary text-white"
                        : "text-foreground hover:bg-muted"
                      }`}
                  >
                    {opt.name === value && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                    <span className="flex-1">{opt.name}</span>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
