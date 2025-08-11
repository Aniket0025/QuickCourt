import React, { useEffect, useMemo, useRef } from 'react';
import L, { DivIcon, Map as LeafletMap, LayerGroup } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type MapVenue = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  price?: number;
  rush?: 'hot' | 'chill' | undefined;
};

export type POI = { id: string; name: string; lat: number; lng: number; kind?: string };
export type OSMMapProps = {
  venues: MapVenue[];
  user?: { lat: number; lng: number } | null;
  center?: { lat: number; lng: number } | null;
  height?: number | string;
  onNavigate?: (venueId: string) => void;
  zoom?: number;
  pois?: POI[];
};

function venueIcon(rush?: 'hot' | 'chill') {
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

export default function OSMMap({ venues, user, center: centerProp = null, height = 320, onNavigate, zoom = 12, pois = [] }: OSMMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LayerGroup | null>(null);
  const poiLayerRef = useRef<LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const center = useMemo(() => {
    if (centerProp) return [centerProp.lat, centerProp.lng] as [number, number];
    if (user) return [user.lat, user.lng] as [number, number];
    if (venues.length) return [venues[0].lat, venues[0].lng] as [number, number];
    return [20.5937, 78.9629] as [number, number];
  }, [centerProp, user, venues]);

  // Initialize map once (use a neutral initial view; real view is applied in the next effect)
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = L.map(containerRef.current).setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    markersRef.current = L.layerGroup().addTo(map);
    poiLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
  }, []);

  // Update view when center/zoom changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, zoom);
  }, [center, zoom]);

  // Update markers when data changes
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    // user marker
    if (user) {
      L.marker([user.lat, user.lng], { icon: userIcon() }).addTo(layer).bindPopup('You are here');
    }

    // venue markers
    venues.forEach(v => {
      const m = L.marker([v.lat, v.lng], { icon: venueIcon(v.rush) }).addTo(layer);
      const badge = v.rush ? (v.rush === 'hot' ? '<span style="background:#fee2e2;color:#b91c1c;padding:2px 6px;border-radius:6px;font-size:10px">Hot Now</span>' : '<span style="background:#dcfce7;color:#166534;padding:2px 6px;border-radius:6px;font-size:10px">Chill Now</span>') : '';
      const price = typeof v.price === 'number' ? `<div style="color:#6b7280">From ₹${v.price}</div>` : '';
      const btn = onNavigate ? `<button id="qc-goto-${v.id}" style="margin-top:6px;background:#3b82f6;color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer">Book Now</button>` : '';
      m.bindPopup(`<div style="font-size:13px"><div style="font-weight:600">${v.name}</div>${price}${badge ? `<div style="margin-top:4px">${badge}</div>` : ''}${btn}</div>`);
      if (onNavigate) {
        m.on('popupopen', () => {
          // defer to ensure popup content in DOM
          setTimeout(() => {
            const el = document.getElementById(`qc-goto-${v.id}`);
            if (el) el.onclick = () => onNavigate(v.id);
          }, 0);
        });
      }
    });
  }, [venues, user, onNavigate]);

  // POIs layer
  function poiIcon(kind?: string) {
    const color = '#f59e0b';
    const glyph = '⚽';
    return new DivIcon({
      className: 'qc-div-icon',
      html: `<div style="transform: translate(-50%,-50%); display:flex; align-items:center; justify-content:center; width:18px; height:18px; border-radius:50%; background:${color}; color:white; font-size:10px; font-weight:700; box-shadow:0 1px 4px rgba(0,0,0,.3)">${glyph}</div>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }

  useEffect(() => {
    const map = mapRef.current;
    const layer = poiLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    pois.forEach(p => {
      const m = L.marker([p.lat, p.lng], { icon: poiIcon(p.kind) }).addTo(layer);
      m.bindPopup(`<div style="font-size:12px"><div style="font-weight:600">${p.name}</div><div style="color:#6b7280">${p.kind || 'sports'}</div></div>`);
    });
  }, [pois]);

  return (
    <div ref={containerRef} className="rounded-md border border-border overflow-hidden" style={{ height }} />
  );
}
