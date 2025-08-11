import React, { useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { DivIcon } from 'leaflet';

export type MapVenue = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  price?: number;
  rush?: 'hot' | 'chill' | undefined;
};

export type MapViewProps = {
  venues: MapVenue[];
  user?: { lat: number; lng: number } | null;
  height?: number | string;
  onNavigate?: (venueId: string) => void;
  zoom?: number;
};

// Use DivIcon to avoid needing leaflet default image assets
function markerIcon(rush?: 'hot' | 'chill') {
  const color = rush === 'hot' ? '#ef4444' : rush === 'chill' ? '#22c55e' : '#3b82f6';
  return new DivIcon({
    className: 'qc-div-icon',
    html: `<div style="transform: translate(-50%,-50%); display:flex; align-items:center; justify-content:center; width:22px; height:22px; border-radius:50%; background:${color}; color:white; font-size:11px; font-weight:600; box-shadow:0 1px 4px rgba(0,0,0,.3)">•</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

function userIcon() {
  return new DivIcon({
    className: 'qc-div-icon',
    html: `<div style="transform: translate(-50%,-50%); width:18px; height:18px; border-radius:50%; background:#2563eb; box-shadow:0 0 0 4px rgba(37,99,235,.25)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

export default function MapView({ venues, user, height = 320, onNavigate, zoom = 12 }: MapViewProps) {
  const center = useMemo(() => {
    if (user) return [user.lat, user.lng] as [number, number];
    if (venues.length) return [venues[0].lat, venues[0].lng] as [number, number];
    return [20.5937, 78.9629] as [number, number]; // India centroid fallback
  }, [user, venues]);

  return (
    <div className="rounded-md border border-border overflow-hidden" style={{ height }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {user && (
          <Marker position={[user.lat, user.lng]} icon={userIcon()}>
            <Popup>You are here</Popup>
          </Marker>
        )}
        {venues.map(v => (
          <Marker key={v.id} position={[v.lat, v.lng]} icon={markerIcon(v.rush)}>
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{v.name}</div>
                {typeof v.price === 'number' && (
                  <div className="text-muted-foreground">From ₹{v.price}</div>
                )}
                {v.rush && (
                  <div className={`mt-1 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] ${v.rush === 'hot' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {v.rush === 'hot' ? 'Hot Now' : 'Chill Now'}
                  </div>
                )}
                {onNavigate && (
                  <div className="mt-2">
                    <button
                      onClick={() => onNavigate(v.id)}
                      className="inline-flex items-center rounded bg-primary px-2 py-1 text-xs text-primary-foreground hover:opacity-90"
                    >
                      Book Now
                    </button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
