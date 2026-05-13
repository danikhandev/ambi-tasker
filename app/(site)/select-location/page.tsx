"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Loader2, Info } from "lucide-react";
import { unbounded } from "@/app/fonts";
import { useUser } from "@/contexts/UserContext";
import LocationSelector from "@/components/LocationSelector";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

export default function SelectLocationPage() {
  const { user, refetch } = useUser();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [location, setLocation] = useState({
    districtId: "",
    districtName: "",
    areaId: "",
    areaName: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.districtId || !location.areaId) {
      setError("Please select both your district and area to continue.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/user/update-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          districtId: location.districtId,
          areaId: location.areaId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update location");

      await refetch();
      router.push(user?.role === "PROVIDER" ? "/provider" : "/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card rounded-[32px] border border-border p-8 shadow-2xl shadow-black/5"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
            <MapPin className="w-8 h-8" />
          </div>
          <h1 className={`${unbounded.className} text-2xl font-black text-foreground mb-3`}>
            Setup Your Location
          </h1>
          <p className="text-sm text-text-secondary font-medium">
            We need your location to show you local services and jobs in your area.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <LocationSelector 
            value={location}
            onChange={setLocation}
            fields={["district", "area"]}
          />

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-600 text-xs font-bold uppercase tracking-widest">
              <Info className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !location.districtId || !location.areaId}
            className={`w-full h-14 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95
              ${isLoading || !location.districtId || !location.areaId ? "opacity-50 grayscale cursor-not-allowed shadow-none" : "hover:bg-primary/90 shadow-primary/20"}
            `}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Save & Continue <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
