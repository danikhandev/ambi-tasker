"use client";

import React, { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon not loading in Next.js
const DefaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom animated marker icon for Live Tracking
const PulseIcon = L.divIcon({
    className: "custom-pulse-marker",
    html: `
        <div style="position:relative;width:44px;height:44px;">
            <div style="position:absolute;inset:0;background:rgba(22,163,74,0.3);border-radius:50%;animation:pulse-ring 2s infinite cubic-bezier(0.455, 0.03, 0.515, 0.955);"></div>
            <div style="position:absolute;inset:8px;background:rgba(22,163,74,0.5);border-radius:50%;animation:pulse-ring 2s infinite cubic-bezier(0.455, 0.03, 0.515, 0.955) 0.5s;"></div>
            <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:16px;height:16px;background:#16a34a;border-radius:50%;border:4px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4);z-index:10;"></div>
            <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#16a34a;color:white;padding:2px 8px;border-radius:10px;font-size:8px;font-weight:900;white-space:nowrap;letter-spacing:1px;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:20;">LIVE</div>
        </div>
        <style>
            @keyframes pulse-ring {
                0% { transform: scale(0.6); opacity: 1; }
                80%, 100% { transform: scale(3); opacity: 0; }
            }
        </style>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
});

interface MapClickHandlerProps {
    onClick: (lat: number, lng: number) => void;
}

function MapClickHandler({ onClick }: MapClickHandlerProps) {
    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

interface MapCenterUpdaterProps {
    center: [number, number];
    zoom?: number;
}

function MapCenterUpdater({ center, zoom }: MapCenterUpdaterProps) {
    const map = useMap();
    const prevCenter = useRef(center);

    useEffect(() => {
        if (
            prevCenter.current[0] !== center[0] ||
            prevCenter.current[1] !== center[1]
        ) {
            map.flyTo(center, zoom || map.getZoom(), { duration: 0.8 });
            prevCenter.current = center;
        }
    }, [center, zoom, map]);

    return null;
}

interface DraggableMarkerProps {
    position: [number, number];
    onDragEnd: (lat: number, lng: number) => void;
}

function DraggableMarker({ position, onDragEnd }: DraggableMarkerProps) {
    const markerRef = useRef<L.Marker>(null);

    const handleDragEnd = () => {
        const marker = markerRef.current;
        if (marker) {
            const pos = marker.getLatLng();
            onDragEnd(pos.lat, pos.lng);
        }
    };

    return (
        <Marker
            position={position}
            draggable={true}
            ref={markerRef}
            icon={PulseIcon}
            eventHandlers={{
                dragend: handleDragEnd,
            }}
        />
    );
}

interface LocationMapProps {
    center: [number, number];
    markerPosition: [number, number];
    onMapClick: (lat: number, lng: number) => void;
    onMarkerDrag: (lat: number, lng: number) => void;
    zoom?: number;
    interactive?: boolean;
}

export default function LocationMap({
    center,
    markerPosition,
    onMapClick,
    onMarkerDrag,
    zoom = 15,
    interactive = true,
}: LocationMapProps) {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            scrollWheelZoom={true}
            zoomControl={true}
            style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
            attributionControl={false}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenterUpdater center={center} zoom={zoom} />
            {interactive && <MapClickHandler onClick={onMapClick} />}
            <DraggableMarker position={markerPosition} onDragEnd={onMarkerDrag} />
        </MapContainer>
    );
}
