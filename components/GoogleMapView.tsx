"use client";

import React, { useCallback, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: 'inherit'
};

const defaultOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: [
    {
      "featureType": "all",
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#7c93a3" }, { "lightness": "-10" }]
    },
    {
        "featureType": "administrative.country",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#c1ced7" }]
    },
    // Modern sleek style
    {
        "featureType": "landscape",
        "elementType": "geometry.fill",
        "stylers": [{ "color": "#f5f7f9" }]
    },
    {
        "featureType": "poi",
        "elementType": "geometry.fill",
        "stylers": [{ "color": "#eaeff2" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.fill",
        "stylers": [{ "color": "#ffffff" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [{ "color": "#d3e2f0" }]
    }
  ]
};

interface MarkerData {
    id: string;
    position: { lat: number, lng: number };
    title?: string;
    icon?: string;
}

interface GoogleMapViewProps {
  center: { lat: number, lng: number };
  zoom?: number;
  markers?: MarkerData[];
  onMapClick?: (e: google.maps.MapMouseEvent) => void;
  onMarkerClick?: (marker: MarkerData) => void;
  options?: google.maps.MapOptions;
  interactive?: boolean;
}

export default function GoogleMapView({
  center,
  zoom = 15,
  markers = [],
  onMapClick,
  onMarkerClick,
  options = {},
  interactive = true
}: GoogleMapViewProps) {
  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zoom}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onClick={(e) => interactive && onMapClick?.(e)}
      options={{ ...defaultOptions, ...options }}
    >
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={marker.position}
          title={marker.title}
          onClick={() => onMarkerClick?.(marker)}
          icon={marker.icon}
        />
      ))}
    </GoogleMap>
  );
}
