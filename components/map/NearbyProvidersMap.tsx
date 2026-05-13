"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ─── Haversine Distance (km) ────────────────────────────────────────────────
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ─── Custom Icons ───────────────────────────────────────────────────────────
const userIcon = L.divIcon({
  className: "",
  html: `<div style="
    width:20px;height:20px;border-radius:50%;
    background:#3b82f6;border:3px solid #fff;
    box-shadow:0 0 0 3px rgba(59,130,246,0.35), 0 2px 8px rgba(0,0,0,0.25);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const serviceColors: Record<string, string> = {
  Electrician: "#f59e0b",
  Plumber: "#06b6d4",
  Mechanic: "#ef4444",
  Carpenter: "#8b5cf6",
  Cleaner: "#10b981",
  Painter: "#ec4899",
};

function providerIcon(service: string) {
  const color = serviceColors[service] || "#10b981";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:36px;height:36px;border-radius:50%;
      background:${color};border:3px solid #fff;
      box-shadow:0 2px 10px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:16px;color:#fff;
    ">${serviceEmoji(service)}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function serviceEmoji(service: string): string {
  const map: Record<string, string> = {
    Electrician: "⚡",
    Plumber: "🔧",
    Mechanic: "🔩",
    Carpenter: "🪚",
    Cleaner: "🧹",
    Painter: "🎨",
  };
  return map[service] || "🛠️";
}

// ─── Types ──────────────────────────────────────────────────────────────────
export interface NearbyProvider {
  id: string;
  name: string;
  service: string;
  lat: number;
  lng: number;
  rating: number;
  price: string;
  avatar?: string;
}

// ─── Static Sample Data (offset from user location) ────────────────────────
function generateSampleProviders(
  userLat: number,
  userLng: number
): NearbyProvider[] {
  return [
    {
      id: "p1",
      name: "Ali Hassan",
      service: "Electrician",
      lat: userLat + 0.008,
      lng: userLng + 0.012,
      rating: 4.8,
      price: "Rs. 800/hr",
    },
    {
      id: "p2",
      name: "Usman Khan",
      service: "Plumber",
      lat: userLat - 0.005,
      lng: userLng + 0.009,
      rating: 4.5,
      price: "Rs. 1,000/hr",
    },
    {
      id: "p3",
      name: "Ahmed Raza",
      service: "Mechanic",
      lat: userLat + 0.003,
      lng: userLng - 0.014,
      rating: 4.9,
      price: "Rs. 1,200/hr",
    },
    {
      id: "p4",
      name: "Bilal Shahid",
      service: "Carpenter",
      lat: userLat - 0.010,
      lng: userLng - 0.006,
      rating: 4.3,
      price: "Rs. 900/hr",
    },
    {
      id: "p5",
      name: "Farhan Akram",
      service: "Cleaner",
      lat: userLat + 0.012,
      lng: userLng - 0.003,
      rating: 4.7,
      price: "Rs. 600/hr",
    },
    {
      id: "p6",
      name: "Kamran Iqbal",
      service: "Painter",
      lat: userLat - 0.007,
      lng: userLng + 0.015,
      rating: 4.6,
      price: "Rs. 700/hr",
    },
  ];
}

// ─── Map Recenter Helper ────────────────────────────────────────────────────
function FlyToUser({ position }: { position: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(position, 14, { duration: 1.5 });
  }, [position, map]);
  return null;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function NearbyProvidersMap() {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("All");

  // Default: Haripur, Pakistan
  const defaultPos: [number, number] = [33.9946, 72.9340];

  const requestLocation = useCallback(() => {
    setLoading(true);
    setLocError(null);
    if (!navigator.geolocation) {
      setLocError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      (err) => {
        setLocError(
          err.code === 1
            ? "Location access denied. Using default location."
            : "Unable to get location. Using default."
        );
        setUserPos(defaultPos);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const center = userPos || defaultPos;

  const providers = useMemo(
    () => generateSampleProviders(center[0], center[1]),
    [center]
  );

  const filteredProviders = useMemo(
    () =>
      selectedFilter === "All"
        ? providers
        : providers.filter((p) => p.service === selectedFilter),
    [providers, selectedFilter]
  );

  const serviceTypes = useMemo(
    () => ["All", ...new Set(providers.map((p) => p.service))],
    [providers]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          </div>
          <p className="text-sm font-semibold text-foreground/60 tracking-wide uppercase">
            Getting your location…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* ── Map ────────────────────────────────────────────────────── */}
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FlyToUser position={center} />

        {/* User radius circle */}
        <Circle
          center={center}
          radius={1500}
          pathOptions={{
            color: "rgba(59,130,246,0.25)",
            fillColor: "rgba(59,130,246,0.06)",
            fillOpacity: 0.4,
            weight: 1.5,
          }}
        />

        {/* User marker */}
        <Marker position={center} icon={userIcon}>
          <Popup>
            <div style={{ textAlign: "center", fontFamily: "inherit" }}>
              <p style={{ fontWeight: 700, margin: "0 0 2px", fontSize: 14 }}>
                📍 You are here
              </p>
              <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>
                {center[0].toFixed(4)}, {center[1].toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Provider markers */}
        {filteredProviders.map((p) => {
          const dist = haversineDistance(center[0], center[1], p.lat, p.lng);
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={providerIcon(p.service)}
            >
              <Popup>
                <div style={{ minWidth: 180, fontFamily: "inherit" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background:
                          serviceColors[p.service] || "#10b981",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {serviceEmoji(p.service)}
                    </div>
                    <div>
                      <p
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          margin: 0,
                          lineHeight: 1.2,
                        }}
                      >
                        {p.name}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          margin: 0,
                        }}
                      >
                        {p.service}
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      color: "#374151",
                      borderTop: "1px solid #e5e7eb",
                      paddingTop: 6,
                      marginTop: 4,
                    }}
                  >
                    <span>⭐ {p.rating}</span>
                    <span>{p.price}</span>
                    <span style={{ fontWeight: 600, color: "#3b82f6" }}>
                      {dist.toFixed(1)} km
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* ── Overlay: Location Error Banner ──────────────────────── */}
      {locError && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]
          bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2
          rounded-xl text-xs font-semibold shadow-lg max-w-sm text-center"
        >
          {locError}
        </div>
      )}

      {/* ── Overlay: Filter Pills ───────────────────────────────── */}
      <div
        className="absolute top-4 left-4 right-4 z-[1000] flex gap-2
        overflow-x-auto no-scrollbar px-1 py-1"
      >
        {serviceTypes.map((type) => (
          <button
            key={type}
            onClick={() => setSelectedFilter(type)}
            className={`
              px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap
              transition-all duration-200 shadow-md backdrop-blur-sm
              ${
                selectedFilter === type
                  ? "bg-primary text-white shadow-primary/30"
                  : "bg-white/90 text-foreground/70 hover:bg-white border border-gray-200"
              }
            `}
          >
            {type !== "All" && (
              <span className="mr-1">{serviceEmoji(type)}</span>
            )}
            {type}
          </button>
        ))}
      </div>

      {/* ── Overlay: Provider Count Badge ───────────────────────── */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]
        bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl
        px-5 py-3 shadow-xl flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm">📍</span>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">
            {filteredProviders.length} Provider
            {filteredProviders.length !== 1 ? "s" : ""} Nearby
          </p>
          <p className="text-[10px] text-foreground/50 font-medium">
            Within 2 km radius • OpenStreetMap
          </p>
        </div>
        <button
          onClick={requestLocation}
          className="ml-2 w-8 h-8 rounded-full bg-primary/10
            hover:bg-primary/20 flex items-center justify-center
            transition-colors"
          title="Re-center"
        >
          <span className="text-sm">🎯</span>
        </button>
      </div>
    </div>
  );
}
