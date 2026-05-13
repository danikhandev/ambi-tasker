"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamic import with SSR disabled — Leaflet requires `window`
const NearbyProvidersMap = dynamic(
  () => import("./NearbyProvidersMap"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-bold text-foreground/50 uppercase tracking-widest">
            Loading Map…
          </span>
        </div>
      </div>
    ),
  }
);

export default function NearbyProvidersMapView() {
  return <NearbyProvidersMap />;
}
