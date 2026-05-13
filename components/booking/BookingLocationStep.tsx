"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Search, 
  LocateFixed, 
  Navigation, 
  Home, 
  Briefcase, 
  Plus, 
  Loader2, 
  CheckCircle2, 
  X,
  ChevronRight,
  MousePointer2
} from "lucide-react";
import MapView from "../map/MapView";
import { LocationData } from "../LocationPicker";
import { useTranslation } from "@/hooks/useTranslation";
import { useUser } from "@/contexts/UserContext";

interface BookingLocationStepProps {
  onConfirm: (location: LocationData) => void;
  initialLocation?: LocationData | null;
}

type SelectionMode = "auto" | "search" | "manual" | "saved";

export default function BookingLocationStep({ onConfirm, initialLocation }: BookingLocationStepProps) {
  const { t, isRTL } = useTranslation();
  const { user } = useUser();
  const [mode, setMode] = useState<SelectionMode>("auto");
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(initialLocation || null);
  const [center, setCenter] = useState<[number, number]>(initialLocation ? [initialLocation.lat, initialLocation.lng] : [33.6844, 73.0479]);
  
  // Manual form fields
  const [manualAddress, setManualAddress] = useState({
    street: "",
    city: "",
    area: ""
  });

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSavedAddresses();
    }
  }, [user]);

  const fetchSavedAddresses = async () => {
    setIsLoadingSaved(true);
    try {
      const res = await fetch("/api/user/addresses");
      const data = await res.json();
      if (data.success) {
        setSavedAddresses(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch saved addresses:", err);
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      const address = data.display_name;
      const addressParts = data.address || {};
      const city = addressParts.city || addressParts.town || addressParts.village;
      const area = addressParts.suburb || addressParts.neighbourhood;

      const location: LocationData = {
        address,
        lat,
        lng,
        city: city || "",
        area: area || city || ""
      };
      
      setSelectedLocation(location);
      if (mode === "auto") setSearchValue(address);
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCenter([latitude, longitude]);
        reverseGeocode(latitude, longitude);
        setIsLocating(false);
        setMode("auto");
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

  const handleSearch = async (query: string) => {
    setSearchValue(query);
    if (query.length < 3) {
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

  const handleSuggestionSelect = (suggestion: any) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    setCenter([lat, lng]);
    reverseGeocode(lat, lng);
    setSuggestions([]);
    setSearchValue(suggestion.display_name);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addressStr = `${manualAddress.street}, ${manualAddress.area}, ${manualAddress.city}`;
    setSelectedLocation({
      address: addressStr,
      lat: center[0],
      lng: center[1],
      city: manualAddress.city,
      area: manualAddress.area
    });
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onConfirm(selectedLocation);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header Tabs */}
      <div className="flex p-1 bg-muted rounded-2xl mb-6">
        {(["auto", "search", "manual", "saved"] as SelectionMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              mode === m ? "bg-white text-primary shadow-sm" : "text-text-hint hover:text-foreground"
            }`}
          >
            {m === "auto" && "GPS"}
            {m === "search" && "Search"}
            {m === "manual" && "Manual"}
            {m === "saved" && "Saved"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {mode === "auto" && (
            <motion.div
              key="auto"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="p-6 bg-primary/5 border border-primary/20 rounded-[32px] text-center space-y-4">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
                  <Navigation className="text-white w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-foreground">Auto-Detection</h4>
                  <p className="text-xs font-medium text-text-secondary">We'll find your exact coordinates using GPS.</p>
                </div>
                <button
                  onClick={handleLocateMe}
                  disabled={isLocating}
                  className="btn-primary w-full h-14 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  {isLocating ? <Loader2 className="animate-spin" /> : <LocateFixed size={20} />}
                  Locate Me Now
                </button>
              </div>
            </motion.div>
          )}

          {mode === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-hint" size={20} />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search for your building, street or city..."
                  className="w-full pl-14 pr-6 py-5 rounded-2xl bg-muted border-none focus:ring-4 focus:ring-primary/10 font-bold"
                />
              </div>
              
              {suggestions.length > 0 && (
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xl">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionSelect(s)}
                      className="w-full p-4 flex items-center gap-4 hover:bg-muted border-b border-border last:border-none text-left transition-all"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <MapPin size={16} className="text-primary" />
                      </div>
                      <span className="text-xs font-bold text-foreground line-clamp-1">{s.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {mode === "manual" && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <form onSubmit={handleManualSubmit} className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  placeholder="Street / House Number"
                  value={manualAddress.street}
                  onChange={(e) => setManualAddress({ ...manualAddress, street: e.target.value })}
                  className="w-full px-6 py-4 rounded-2xl bg-muted border-none font-bold"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={manualAddress.city}
                    onChange={(e) => setManualAddress({ ...manualAddress, city: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-muted border-none font-bold"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Area"
                    value={manualAddress.area}
                    onChange={(e) => setManualAddress({ ...manualAddress, area: e.target.value })}
                    className="w-full px-6 py-4 rounded-2xl bg-muted border-none font-bold"
                    required
                  />
                </div>
                <button type="submit" className="hidden" id="manual-submit-btn" />
              </form>
            </motion.div>
          )}

          {mode === "saved" && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              {isLoadingSaved ? (
                <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>
              ) : savedAddresses.length > 0 ? (
                savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => {
                      setCenter([addr.latitude, addr.longitude]);
                      setSelectedLocation({
                        address: addr.address,
                        lat: addr.latitude,
                        lng: addr.longitude,
                        city: addr.city?.name || "",
                        area: addr.area?.name || ""
                      });
                    }}
                    className={`w-full p-5 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                      selectedLocation?.address === addr.address ? "border-primary bg-primary/5" : "border-muted hover:border-border"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                      {addr.label === "Home" ? <Home className="text-primary" /> : <Briefcase className="text-primary" />}
                    </div>
                    <div className="text-left flex-1">
                      <span className="text-xs font-black uppercase tracking-widest text-text-hint">{addr.label}</span>
                      <p className="text-sm font-bold text-foreground line-clamp-1">{addr.address}</p>
                    </div>
                    {selectedLocation?.address === addr.address && <CheckCircle2 className="text-primary w-5 h-5" />}
                  </button>
                ))
              ) : (
                <div className="p-10 text-center border-2 border-dashed border-border rounded-3xl">
                  <p className="text-xs font-black text-text-hint uppercase tracking-widest">No saved locations found.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map Preview */}
        <div className="mt-8 space-y-4">
          <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] block">Precise Map Pin</label>
          <div className="h-60 w-full rounded-[32px] overflow-hidden border border-border relative">
            <MapView 
              center={center} 
              onLocationSelect={(lat, lng) => {
                setCenter([lat, lng]);
                reverseGeocode(lat, lng);
              }}
              userLocation={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : null}
            />
            <div className="absolute top-4 right-4 z-[1000]">
              <div className="p-3 bg-white/90 backdrop-blur shadow-xl rounded-2xl border border-border flex items-center gap-2">
                <MousePointer2 className="text-primary w-4 h-4 animate-bounce" />
                <span className="text-[9px] font-black uppercase tracking-widest text-foreground">Drag to refine</span>
              </div>
            </div>
          </div>

          {selectedLocation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 bg-card rounded-[32px] border border-primary/20 shadow-xl"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="text-primary w-5 h-5" />
                </div>
                <div className="flex-1">
                  <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] block mb-1">Confirmed Destination</span>
                  <p className="text-sm font-bold text-foreground leading-relaxed line-clamp-2">{selectedLocation.address}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer Confirm */}
      <div className="pt-6 mt-auto border-t border-border">
        <button
          onClick={handleConfirm}
          disabled={!selectedLocation}
          className="w-full h-16 bg-gray-900 text-white font-black rounded-2xl text-[11px] uppercase tracking-[0.3em] hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl active:scale-95 flex items-center justify-center gap-3"
        >
          {selectedLocation ? "Confirm & Proceed" : "Select Your Location"}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
