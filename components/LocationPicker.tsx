"use client";

import React, { useState, useCallback, useEffect } from "react";
import { MapPin, Search, AlertCircle, Loader2, X, LocateFixed } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { motion, AnimatePresence } from "framer-motion";
import MapView from "./map/MapView";

const defaultCenter: [number, number] = [33.6844, 73.0479]; // Islamabad

export interface LocationData {
  address: string;
  lat: number;
  lng: number;
  city?: string;
  area?: string;
}

interface LocationPickerProps {
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData | null;
  compact?: boolean;
}

export default function LocationPicker({ onLocationSelect, initialLocation, compact = false }: LocationPickerProps) {
  const { t, isRTL } = useTranslation();
  const [center, setCenter] = useState<[number, number]>(initialLocation ? [initialLocation.lat, initialLocation.lng] : defaultCenter);
  const [selectedAddress, setSelectedAddress] = useState(initialLocation?.address || "");
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState("");

  const searchNominatim = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=pk&limit=5`);
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Search failed:", err);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      searchNominatim(searchValue);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchValue]);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const address = data.display_name;
      const addressParts = data.address || {};
      const city = addressParts.city || addressParts.town || addressParts.village;
      const area = addressParts.suburb || addressParts.neighbourhood;

      setSelectedAddress(address);
      setSearchValue(address);
      onLocationSelect({
        address,
        lat,
        lng,
        city,
        area: area || city
      });
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
      const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setSelectedAddress(fallbackAddress);
      onLocationSelect({ address: fallbackAddress, lat, lng });
    }
  };

  const handleSelect = (suggestion: any) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    setCenter([lat, lng]);
    setSuggestions([]);
    
    // Perform reverse geocode to get consistent format and parts
    reverseGeocode(lat, lng);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setCenter([lat, lng]);
    reverseGeocode(lat, lng);
  };

  const handleCurrentLocation = () => {
    setIsLocating(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCenter([lat, lng]);
        reverseGeocode(lat, lng);
        setIsLocating(false);
      },
      (err) => {
        setError("Failed to fetch current location. Please check permissions.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="flex flex-col gap-5 w-full relative">
      <div className="relative z-30 flex flex-col gap-4">
        <div className="flex gap-3 relative">
          <div className="relative flex-1">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-text-hint pointer-events-none ${isRTL ? 'right-4' : 'left-4'}`} />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={t("location.searchPlaceholder") || "Search any location or landmark..."}
              className={`w-full py-4 rounded-2xl border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 bg-muted font-bold placeholder:font-medium transition-all shadow-sm ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-10 text-left'}`}
            />
            {searchValue && (
              <button
                onClick={() => { setSearchValue(""); setSuggestions([]); }}
                className={`absolute top-1/2 -translate-y-1/2 p-1.5 text-text-hint hover:text-foreground rounded-full hover:bg-black/5 transition-colors ${isRTL ? 'left-3' : 'right-3'}`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCurrentLocation}
            disabled={isLocating}
            className="px-5 shrink-0 rounded-2xl bg-gray-900 text-white flex items-center justify-center hover:bg-primary transition-all disabled:opacity-70 gap-2 font-bold text-xs uppercase tracking-widest shadow-lg overflow-hidden relative group"
          >
            {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5 group-hover:animate-pulse" />}
            <span className="hidden sm:inline">{t("location.locateMe") || "Locate Me"}</span>
          </motion.button>
        </div>

        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.ul
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden z-[100] max-h-72 overflow-y-auto"
            >
              {suggestions.map((sugg) => (
                <li
                  key={sugg.place_id}
                  onClick={() => handleSelect(sugg)}
                  className={`px-5 py-4 hover:bg-primary/10 cursor-pointer text-sm font-bold text-foreground border-b border-border/50 last:border-none flex items-center gap-3 transition-all ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <span className="flex-1 line-clamp-2 text-xs leading-relaxed">{sugg.display_name}</span>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {error && (
          <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`p-4 bg-red-50 text-red-600 text-sm font-bold rounded-2xl border border-red-100 flex items-center gap-3 overflow-hidden ${isRTL ? 'flex-row-reverse text-right' : 'text-left'}`}
          >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
          </motion.div>
      )}

      <div className={`w-full ${compact ? 'h-[280px]' : 'h-[400px]'} rounded-[32px] overflow-hidden border border-border relative bg-muted/20 z-0`}>
        <MapView 
          center={center} 
          onLocationSelect={handleMapClick}
          userLocation={selectedAddress ? center : null}
        />

        <motion.div
          animate={{ y: selectedAddress ? 0 : 20, opacity: selectedAddress ? 1 : 0 }}
          className="absolute bottom-5 left-5 right-5 bg-card/95 backdrop-blur-xl px-5 py-3.5 rounded-2xl shadow-lg border border-white/20 z-[1000]"
        >
          <p className="text-[10px] uppercase font-black tracking-widest text-primary mb-1 flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            {t("location.selectedDestination") || "Selected Destination"}
          </p>
          <p className="text-xs font-black text-foreground line-clamp-2 leading-relaxed">
            {selectedAddress || t("location.tapToSelect") || "Tap on map to select location"}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

