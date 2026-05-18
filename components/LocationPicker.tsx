"use client";

import React, { useState, useCallback, useEffect } from "react";
import { MapPin, Search, AlertCircle, Loader2, X, LocateFixed, Map, ChevronLeft, Pencil } from "lucide-react";
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
  
  // High-performance 3-step state machine
  const [step, setStep] = useState<"method-select" | "search" | "confirm">(
    initialLocation ? "confirm" : "method-select"
  );
  
  const [center, setCenter] = useState<[number, number]>(initialLocation ? [initialLocation.lat, initialLocation.lng] : defaultCenter);
  const [selectedAddress, setSelectedAddress] = useState(initialLocation?.address || "");
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState("");
  const [pendingLocation, setPendingLocation] = useState<LocationData | null>(initialLocation || null);

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
      setPendingLocation({
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
      setPendingLocation({ address: fallbackAddress, lat, lng });
    }
  };

  const handleSelect = (suggestion: any) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    setCenter([lat, lng]);
    setSuggestions([]);
    
    reverseGeocode(lat, lng);
    setStep("confirm");
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
        setStep("confirm");
      },
      (err) => {
        setError("Failed to fetch current location. Please check permissions.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleFinalConfirm = () => {
    if (pendingLocation) {
      onLocationSelect(pendingLocation);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full relative">
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

      {/* Map and Sheet Frame */}
      <div className={`w-full ${compact ? 'h-[360px]' : 'h-[480px]'} rounded-[32px] overflow-hidden border border-border relative bg-muted/20 z-0 shadow-lg`}>
        {/* Persistent Leaflet Map View */}
        <MapView 
          center={center} 
          onLocationSelect={handleMapClick}
          userLocation={selectedAddress ? center : null}
        />

        {/* Center overlay pin in Confirm step */}
        {step === "confirm" && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[500] -mt-10">
            <div className="relative flex flex-col items-center">
              {/* Pulse effect */}
              <div className="absolute w-12 h-12 bg-primary/20 rounded-full animate-ping border border-primary/40 -bottom-3" />
              {/* Map pin */}
              <MapPin className="w-12 h-12 text-primary drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)] relative z-10 fill-primary/10" />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: Set Your Location */}
          {step === "method-select" && (
            <motion.div
              key="method-select"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[32px] p-6 shadow-[0_-15px_40px_rgba(0,0,0,0.15)] border-t border-border z-[1000] bg-white/95 backdrop-blur-md"
            >
              <div className="flex flex-col items-center text-center">
                {/* Map fold icon */}
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                  <Map className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-foreground mb-1">
                  Set Your Location
                </h3>
                <p className="text-xs font-bold text-text-hint max-w-[280px] mb-6 leading-relaxed">
                  To connect with professionals in your area, set your location
                </p>

                <button
                  type="button"
                  onClick={handleCurrentLocation}
                  disabled={isLocating}
                  className="w-full py-4 bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-primary transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95 mb-3 flex items-center justify-center gap-2"
                >
                  {isLocating ? <Loader2 className="w-5 h-5 animate-spin" /> : <LocateFixed className="w-5 h-5" />}
                  Use Current Location
                </button>

                <button
                  type="button"
                  onClick={() => setStep("search")}
                  className="w-full py-4 border border-border text-foreground font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-muted transition-all duration-300 active:scale-95 bg-white shadow-sm"
                >
                  Set Location Manually
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Choose a Location (Search) */}
          {step === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="absolute inset-0 bg-card rounded-[32px] p-6 shadow-2xl border border-border z-[1001] flex flex-col bg-white"
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4 relative border-b border-border pb-3">
                <button
                  type="button"
                  onClick={() => setStep("method-select")}
                  className="p-2 hover:bg-muted text-foreground rounded-full transition-colors active:scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-black text-foreground">
                  Choose a Location
                </h3>
              </div>

              {/* Search input bar */}
              <div className="relative mb-3">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-hint pointer-events-none" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Search location..."
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 bg-muted font-bold placeholder:font-medium transition-all shadow-sm"
                  autoFocus
                />
                {searchValue ? (
                  <button
                    type="button"
                    onClick={() => { setSearchValue(""); setSuggestions([]); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-text-hint hover:text-foreground rounded-full hover:bg-black/5 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                ) : (
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-hint pointer-events-none" />
                )}
              </div>

              {/* Set Location from Map link */}
              <div className="text-center mb-4">
                <button
                  type="button"
                  onClick={() => setStep("confirm")}
                  className="text-xs font-black text-primary hover:text-primary/80 uppercase tracking-wider transition-colors inline-flex items-center gap-1 active:scale-95"
                >
                  Set Location from Map
                </button>
              </div>

              {/* Suggestion list */}
              <div className="flex-1 overflow-y-auto -mx-6 px-6 scrollbar-thin">
                {suggestions.length > 0 ? (
                  <ul className="space-y-1">
                    {suggestions.map((sugg) => {
                      const parts = sugg.display_name.split(",");
                      const title = parts[0]?.trim();
                      const subtitle = parts.slice(1).join(",").trim();
                      return (
                        <li
                          key={sugg.place_id}
                          onClick={() => handleSelect(sugg)}
                          className="px-3 py-2.5 hover:bg-primary/5 cursor-pointer rounded-xl flex items-center gap-3 transition-all border border-transparent hover:border-border/30 group"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/5 group-hover:bg-primary/10 text-primary flex items-center justify-center shrink-0 transition-colors">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-foreground truncate group-hover:text-primary transition-colors">
                              {title}
                            </p>
                            <p className="text-[10px] font-bold text-text-hint truncate leading-relaxed">
                              {subtitle}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : searchValue.length >= 3 ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="text-center py-12 text-text-hint font-bold text-[10px] uppercase tracking-widest leading-relaxed">
                    Type 3 or more characters to search
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Confirm your Location */}
          {step === "confirm" && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 bg-card rounded-t-[32px] p-6 shadow-[0_-15px_40px_rgba(0,0,0,0.15)] border-t border-border z-[1000] bg-white/95 backdrop-blur-md"
            >
              <div className="flex flex-col">
                {/* Header with back button */}
                <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                  <h3 className="text-lg font-black text-foreground">
                    Confirm your Location
                  </h3>
                  <button
                    type="button"
                    onClick={() => setStep("search")}
                    className="p-1.5 hover:bg-muted text-foreground rounded-full transition-colors active:scale-90 shrink-0"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                {/* Confirm details card */}
                <div className="flex items-center gap-3 p-4 bg-muted rounded-2xl border border-border mb-5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-text-hint uppercase tracking-widest mb-0.5">
                      Selected Location
                    </p>
                    <p className="text-xs font-bold text-foreground line-clamp-2 leading-relaxed">
                      {selectedAddress || "Tap on map to select location"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("search")}
                    className="p-2 bg-card hover:bg-muted border border-border rounded-xl text-text-hint hover:text-foreground transition-all shrink-0 active:scale-90"
                    title="Edit address"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleFinalConfirm}
                  disabled={!selectedAddress}
                  className="w-full py-4 bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-primary transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                >
                  Set Location
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
