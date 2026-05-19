import React, { useEffect, useState, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Bike, User, MapPin, Clock, Navigation } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
}

interface TrackingMapProps {
  clientLocation: Location;
  driverLocation?: Location;
  showDriver?: boolean;
  onEtaUpdate?: (eta: string | null) => void;
  isDriverView?: boolean;
}

const RouteDisplay = ({ driverLocation, clientLocation, onEtaUpdate }: { 
  driverLocation: Location, 
  clientLocation: Location,
  onEtaUpdate?: (eta: string | null) => void
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !driverLocation || !clientLocation) return;

    // Fit bounds to show both markers
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(driverLocation);
    bounds.extend(clientLocation);
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

    // Clear previous route
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    routesLib.Route.computeRoutes({
      origin: driverLocation,
      destination: clientLocation,
      travelMode: 'DRIVING', // Livreur en moto/voiture
      fields: ['path', 'durationMillis', 'distanceMeters'],
    }).then(({ routes }) => {
      if (routes?.[0]) {
        const route = routes[0];
        const newPolylines = route.createPolylines();
        newPolylines.forEach(p => {
          p.setOptions({
            strokeColor: '#FF7A00',
            strokeOpacity: 0.8,
            strokeWeight: 5
          });
          p.setMap(map);
        });
        polylinesRef.current = newPolylines;

        // Calculate ETA
        if (route.durationMillis) {
          const minutes = Math.ceil(Number(route.durationMillis) / 60000);
          onEtaUpdate?.(`${minutes} min`);
        } else {
          onEtaUpdate?.(null);
        }
      }
    }).catch(err => {
      console.error('Error computing route:', err);
      onEtaUpdate?.(null);
    });

    return () => polylinesRef.current.forEach(p => p.setMap(null));
  }, [routesLib, map, driverLocation, clientLocation]);

  return null;
};

export const TrackingMap: React.FC<TrackingMapProps> = ({ clientLocation, driverLocation, showDriver, onEtaUpdate, isDriverView }) => {
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
    <div className="w-full h-80 rounded-2xl overflow-hidden shadow-inner border border-slate-200 relative">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={clientLocation}
          defaultZoom={15}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          mapId="ALGS_TRACKING_MAP"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          <AdvancedMarker position={clientLocation} title="Position du Client">
            <Pin background="#10B981" glyphColor="#fff" borderColor="#059669" />
          </AdvancedMarker>

          {showDriver && driverLocation && (
            <>
              <AdvancedMarker position={driverLocation} title="Livreur ALGS">
                <Pin background="#FF7A00" glyphColor="#fff" borderColor="#E66E00" />
              </AdvancedMarker>
              <RouteDisplay 
                driverLocation={driverLocation} 
                clientLocation={clientLocation} 
                onEtaUpdate={onEtaUpdate} 
              />
            </>
          )}
          <MapControls isDriverView={isDriverView} clientLocation={clientLocation} driverLocation={driverLocation} />
        </Map>
      </APIProvider>
    </div>
  );
};

const MapControls = ({ isDriverView, clientLocation, driverLocation }: { isDriverView?: boolean, clientLocation: Location, driverLocation?: Location }) => {
  const map = useMap();
  
  const handleRecenter = () => {
    if (!map) return;
    if (isDriverView && driverLocation) {
      map.panTo(driverLocation);
      map.setZoom(17);
    } else {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(clientLocation);
      if (driverLocation) bounds.extend(driverLocation);
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    }
  };

  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
      <button 
        onClick={handleRecenter}
        className="p-3 bg-white rounded-xl shadow-lg border border-slate-100 text-slate-600 hover:text-orange-500 active:scale-95 transition-all"
        title="Centrer la vue"
      >
        <Navigation size={20} className={isDriverView ? '' : 'rotate-45'} />
      </button>
    </div>
  );
};
