"use client";

import React from "react";
import MapView from "./map/MapView";

interface ProviderJobMapProps {
    serviceLocation: [number, number];
    providerLocation?: [number, number] | null;
}

export default function ProviderJobMap({ serviceLocation, providerLocation }: ProviderJobMapProps) {
    const markers = [];
    
    // User / Service Location
    markers.push({
        id: "user",
        lat: serviceLocation[0],
        lng: serviceLocation[1],
        title: "Service Location",
        type: "user" as const
    });

    // Provider Location
    if (providerLocation) {
        markers.push({
            id: "provider",
            lat: providerLocation[0],
            lng: providerLocation[1],
            title: "Your Location",
            type: "provider" as const
        });
    }

    return (
        <MapView 
            center={serviceLocation}
            zoom={14}
            interactive={true}
            markers={markers}
        />
    );
}
