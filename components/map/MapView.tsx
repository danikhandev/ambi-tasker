"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { MapComponentProps } from './MapComponent';

// Dynamically import the map component with SSR disabled
// This is required because leaflet relies on the window object
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-xl border border-border">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-xs font-semibold text-text-hint uppercase tracking-widest">Loading Map...</span>
      </div>
    </div>
  ),
});

export default function MapView(props: MapComponentProps) {
  return (
    <div className="w-full h-full min-h-[300px] relative rounded-xl overflow-hidden shadow-sm border border-border">
      <MapComponent {...props} />
    </div>
  );
}
