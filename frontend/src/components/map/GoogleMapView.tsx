import React, { useCallback, useEffect, useMemo, useRef, type ComponentType } from 'react';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';

export type LatLng = { lat: number; lng: number };
export type MapVenue = {
  id: string | number;
  name: string;
  lat: number;
  lng: number;
  price?: number;
  rush?: string;
};

export type MapPOI = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind?: string;
};

type Props = {
  venues: MapVenue[];
  user?: LatLng | null;
  center?: LatLng;
  height?: number;
  pois?: MapPOI[];
  radiusKm?: number;
  poiFilter?: 'all' | 'stadium' | 'sports_centre' | 'pitch' | 'fitness_centre' | 'sport';
  onNavigate?: (id: string | number) => void;
  onPoisUpdate?: (pois: MapPOI[]) => void;
  extraMarkers?: { lat: number; lng: number; title?: string }[];
};

const containerStyle = (h?: number) => ({ width: '100%', height: `${h ?? 360}px`, borderRadius: 8, overflow: 'hidden' });

function computeCenter(venues: MapVenue[], user?: LatLng | null, explicit?: LatLng): LatLng {
  if (explicit) return explicit;
  if (user) return user;
  if (venues?.length) return { lat: venues[0].lat, lng: venues[0].lng };
  return { lat: 28.6139, lng: 77.209 }; // fallback: New Delhi
}

function mapPOIFilterToRequest(filter: Props['poiFilter']): { type?: string; keyword?: string } {
  switch (filter) {
    case 'stadium':
      return { type: 'stadium' };
    case 'fitness_centre':
      return { type: 'gym' };
    case 'sports_centre':
      return { keyword: 'sports centre' };
    case 'pitch':
      return { keyword: 'sports pitch' };
    case 'sport':
      return { keyword: 'sport' };
    case 'all':
    default:
      return { keyword: 'sport' };
  }
}

const GoogleMapView: React.FC<Props> = ({
  venues,
  user,
  center,
  height,
  pois,
  poiFilter = 'all',
  radiusKm = 8,
  onNavigate,
  onPoisUpdate,
  extraMarkers,
}) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: ['places'],
  });

  const mapRef = useRef<google.maps.Map | null>(null);

  const mapCenter = useMemo(() => computeCenter(venues, user ?? undefined, center), [venues, user, center]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // Fit bounds to venues if available
    if (venues && venues.length > 0) {
      const b = new google.maps.LatLngBounds();
      venues.forEach(v => b.extend({ lat: v.lat, lng: v.lng }));
      // Include user/explicit center lightly to avoid over-zooming
      if (user) b.extend(user);
      try { map.fitBounds(b, 64); } catch (e) { /* ignore fitBounds errors */ }
    } else {
      map.setCenter(mapCenter);
      map.setZoom(12);
    }
  }, [venues, user, mapCenter]);

  const handleIdle = useCallback(() => {
    if (!onPoisUpdate) return;
    const map = mapRef.current;
    if (!map || !('places' in google.maps)) return;
    const svc = new google.maps.places.PlacesService(map);
    const c = map.getCenter();
    if (!c) return;

    const { type, keyword } = mapPOIFilterToRequest(poiFilter);
    const request: google.maps.places.PlaceSearchRequest = {
      location: c,
      radius: Math.max(500, Math.min(50000, Math.round((radiusKm ?? 8) * 1000))),
      // Only one of type/keyword may be used to refine; include both when sensible
      ...(type ? { type: type as any } : {}),
      ...(keyword ? { keyword } : {}),
      openNow: false,
    };

    svc.nearbySearch(request, (results, status) => {
      if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
        onPoisUpdate?.([]);
        return;
      }
      const mapped: MapPOI[] = results.map((r) => ({
        id: r.place_id ?? `${r.geometry?.location?.lat?.()}_${r.geometry?.location?.lng?.()}`,
        name: r.name ?? 'Unknown',
        lat: r.geometry?.location?.lat?.() ?? 0,
        lng: r.geometry?.location?.lng?.() ?? 0,
        kind: r.types?.[0],
      })).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
      onPoisUpdate?.(mapped);
    });
  }, [onPoisUpdate, poiFilter, radiusKm]);

  // Refresh POIs when filters/radius/center change
  useEffect(() => {
    const t = setTimeout(() => handleIdle(), 0);
    return () => clearTimeout(t);
  }, [handleIdle, poiFilter, radiusKm, center]);

  if (!isLoaded) return <div style={containerStyle(height)} />;

  // Work around TS JSX type issues by loosening the component type (no hooks after this point)
  const GMap = GoogleMap as unknown as ComponentType<any>;

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <GMap
        key={`${poiFilter}-${radiusKm}`}
        onLoad={onLoad}
        onIdle={handleIdle}
        center={mapCenter}
        zoom={12}
        mapContainerStyle={containerStyle(height)}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
      >
        {/* User marker */}
        {user && <MarkerF position={user} title="You" />}

        {/* Venue markers */}
        {venues?.map(v => (
          <MarkerF
            key={`venue_${v.id}`}
            position={{ lat: v.lat, lng: v.lng }}
            title={v.name}
            onClick={() => onNavigate?.(v.id)}
          />
        ))}

        {/* Extra custom markers */}
        {extraMarkers?.map((m, idx) => (
          <MarkerF
            key={`extra_${idx}_${m.lat}_${m.lng}`}
            position={{ lat: m.lat, lng: m.lng }}
            title={m.title || 'Location'}
          />
        ))}

        {/* POI markers */}
        {pois?.map(p => (
          <MarkerF
            key={`poi_${p.id}`}
            position={{ lat: p.lat, lng: p.lng }}
            title={p.name}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 5,
              fillOpacity: 1,
              fillColor: '#6b7280',
              strokeColor: '#374151',
              strokeWeight: 1,
            }}
          />
        ))}
      </GMap>
    </div>
  );
};

export default GoogleMapView;
