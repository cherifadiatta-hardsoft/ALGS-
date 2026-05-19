import React, { useEffect, useState } from 'react';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import { Bike, User, MapPin } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
}

interface TrackingMapProps {
  clientLocation: Location;
  driverLocation?: Location;
  showDriver?: boolean;
}

const CustomMarker = ({ position, type }: { position: Location, type: 'client' | 'driver' }) => {
  return (
    <Marker 
      position={position}
    />
  );
};

export const TrackingMap: React.FC<TrackingMapProps> = ({ clientLocation, driverLocation, showDriver }) => {
  const apiKey = (window as any).GOOGLE_MAPS_PLATFORM_KEY || process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

  if (!apiKey) {
    return (
      <div className="w-full h-64 bg-slate-100 rounded-2xl flex flex-col items-center justify-center p-6 text-center">
        <MapPin className="text-slate-300 mb-2" size={32} />
        <p className="text-xs font-bold text-slate-500">Configuration de la carte en cours...</p>
        <p className="text-[10px] text-slate-400 mt-1">Veuillez configurer GOOGLE_MAPS_PLATFORM_KEY</p>
      </div>
    );
  }

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={clientLocation}
          defaultZoom={15}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          mapId="ALGS_TRACKING_MAP"
        >
          <Marker position={clientLocation} title="Position du Client" />
          {showDriver && driverLocation && (
            <Marker position={driverLocation} title="Livreur ALGS" />
          )}
        </Map>
      </APIProvider>
    </div>
  );
};
