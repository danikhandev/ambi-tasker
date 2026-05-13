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
    <div ref={wrapperRef} className={`space-y-5 ${className}`}>
      {/* Beta availability banner */}
      {IS_BETA && (
        <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-2xl">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-primary mb-1">
              {PLATFORM_SUBTITLE}
            </p>
            <p className="text-sm text-text-secondary font-medium">
              {AVAILABILITY_MESSAGE}
            </p>
          </div>
        </div>
      )}

      {/* Province Selector */}
      {showProvince && (
        <DropdownField
          label="Province"
          icon={<Globe className="w-3.5 h-3.5" />}
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
        <DropdownField
          label="District"
          icon={<MapPin className="w-3.5 h-3.5" />}
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
        <DropdownField
          label="City / Tehsil"
          icon={<MapPin className="w-3.5 h-3.5" />}
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
        <DropdownField
          label="Area / Locality"
          icon={<MapPin className="w-3.5 h-3.5" />}
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
  );
}

// ─── INTERNAL DROPDOWN FIELD ──────────────────────────────────────────────────

function DropdownField({
  label, value, options, open, onToggle, onSelect,
  searchQuery, onSearchChange, filterOptions,
  disabled = false, loading = false, icon, placeholder = "Search..."
}: any) {
  const filteredOptions = filterOptions(options);

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-text-hint flex items-center gap-2 px-1">
        {icon} {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className={`w-full px-5 py-4 rounded-2xl border flex items-center gap-3 text-left transition-all duration-300
            ${open
              ? "border-primary/40 bg-primary/5 shadow-2xl shadow-primary/10"
              : "border-border bg-card hover:border-primary/20 hover:shadow-sm"
            }
            ${disabled ? "opacity-50 cursor-not-allowed grayscale" : "cursor-pointer"}
          `}
        >
          <div className={`p-2 rounded-xl ${value ? 'bg-primary/10 text-primary' : 'bg-muted text-text-hint'}`}>
             {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
          </div>
          <span className={`flex-1 text-sm font-bold truncate ${value ? "text-foreground" : "text-text-hint"}`}>
            {value || `Select ${label}`}
          </span>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-text-hint" />
          </motion.div>
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              className="absolute top-full mt-2 left-0 right-0 z-50 bg-card border border-border rounded-2xl shadow-2xl shadow-black/10 overflow-hidden"
            >
              <div className="p-3 border-b border-border bg-muted/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-hint" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-4 py-2.5 bg-muted rounded-xl text-sm font-bold placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 border border-transparent"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-52 overflow-y-auto">
                {loading ? (
                  <div className="px-5 py-8 text-center text-text-hint text-xs font-black uppercase tracking-widest flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    Fetching Data...
                  </div>
                ) : filteredOptions.length === 0 ? (
                  <div className="px-5 py-8 text-center text-text-hint text-xs font-bold">
                    No results found
                  </div>
                ) : (
                  filteredOptions.map((opt: LocationItem) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onSelect(opt)}
                      className={`w-full flex items-center gap-3 px-5 py-3.5 text-left text-sm font-bold transition-all
                        ${opt.name === value
                          ? "bg-primary text-white"
                          : "text-foreground hover:bg-muted"
                        }`}
                    >
                      {opt.name === value && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                      <span className="flex-1">{opt.name}</span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
