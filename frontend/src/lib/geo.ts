export type LatLng = { lat: number; lng: number };

// Simple in-memory cache for geocoding during a session
const geocodeCache = new Map<string, LatLng>();

export async function getUserLocation(timeoutMs = 8000): Promise<LatLng | null> {
  if (!('geolocation' in navigator)) return null;
  return new Promise((resolve) => {
    const id = setTimeout(() => resolve(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(id);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        clearTimeout(id);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 }
    );
  });
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

function toRad(deg: number) { return (deg * Math.PI) / 180; }

export async function geocodeNominatim(address: string): Promise<LatLng | null> {
  const key = address.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'QuickCourt/1.0' } });
    if (!res.ok) return null;
    const arr = await res.json();
    if (Array.isArray(arr) && arr.length) {
      const ll = { lat: Number(arr[0].lat), lng: Number(arr[0].lon) } as LatLng;
      geocodeCache.set(key, ll);
      return ll;
    }
    return null;
  } catch {
    return null;
  }
}

// Public sports POIs from OpenStreetMap Overpass API
export type SportsPOI = { id: string; name: string; lat: number; lng: number; kind: string };
export async function fetchSportsPOIsOverpass(center: LatLng, radiusKm: number): Promise<SportsPOI[]> {
  const radiusM = Math.max(200, Math.min(25000, Math.round(radiusKm * 1000)));
  const query = `[
    timeout:25;
    out:json
  ];
  (
    node["leisure"="stadium"](around:${radiusM},${center.lat},${center.lng});
    node["leisure"="sports_centre"](around:${radiusM},${center.lat},${center.lng});
    node["leisure"="pitch"](around:${radiusM},${center.lat},${center.lng});
    node["amenity"="fitness_centre"](around:${radiusM},${center.lat},${center.lng});
    node["sport"](around:${radiusM},${center.lat},${center.lng});
    way["leisure"="stadium"](around:${radiusM},${center.lat},${center.lng});
    way["leisure"="sports_centre"](around:${radiusM},${center.lat},${center.lng});
    way["leisure"="pitch"](around:${radiusM},${center.lat},${center.lng});
  );
  out center 50;`;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
  ];

  const headers = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };

  for (const url of endpoints) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: new URLSearchParams({ data: query }),
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!res.ok) continue;
      const data: { elements?: unknown[] } = await res.json();
      const out: SportsPOI[] = [];
      const elems = Array.isArray(data.elements) ? data.elements : [];
      for (const raw of elems) {
        const el = raw as { id: number; lat?: number; lon?: number; center?: { lat?: number; lon?: number }; tags?: Record<string, unknown> };
        const id = String(el.id);
        const tags = el.tags || {};
        const name = (typeof tags.name === 'string' && tags.name) || (typeof tags.brand === 'string' && tags.brand) || 'Sport place';
        const kind = typeof tags.leisure === 'string' ? tags.leisure : (typeof tags.amenity === 'string' ? tags.amenity : (typeof tags.sport === 'string' ? tags.sport : 'sports'));
        const lat = typeof el.lat === 'number' ? el.lat : (typeof el.center?.lat === 'number' ? el.center.lat : undefined);
        const lng = typeof el.lon === 'number' ? el.lon : (typeof el.center?.lon === 'number' ? el.center.lon : undefined);
        if (typeof lat === 'number' && typeof lng === 'number') out.push({ id, name, lat, lng, kind });
      }
      if (out.length) return out;
    } catch (e) {
      // try next endpoint
      // eslint-disable-next-line no-console
      console.warn('Overpass fetch failed for', url, e);
    }
  }
  return [];
}
