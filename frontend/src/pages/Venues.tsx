import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Star, Search, Filter, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { listVenues, predictRush } from '@/lib/api';
import { toast } from 'sonner';
import OSMMap, { MapVenue } from '@/components/map/OSMMap';
import { getUserLocation, geocodeNominatim, haversineKm, LatLng, fetchSportsPOIsOverpass, SportsPOI } from '@/lib/geo';

export const Venues = () => {
  type AvailableSlotRaw = { start?: string; end?: string; dateTime?: string };
  type CourtRaw = { _id: string; pricePerHour?: number; outdoor?: boolean; availableSlots?: AvailableSlotRaw[] };
  type VenueRaw = {
    _id: string;
    name: string;
    address: string;
    lat?: number; // optional coordinates if available from backend
    lng?: number;
    photos?: string[];
    amenities?: string[];
    sports?: string[];
    courts?: CourtRaw[];
    reviews?: { rating?: number }[];
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [venues, setVenues] = useState<VenueRaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [rushMap, setRushMap] = useState<Record<string, 'hot' | 'chill' | undefined>>({});
  const [nearMe, setNearMe] = useState(false);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [radiusKm, setRadiusKm] = useState(8);
  const [pois, setPois] = useState<SportsPOI[]>([]);
  const [poiFilter, setPoiFilter] = useState<'all' | 'stadium' | 'sports_centre' | 'pitch' | 'fitness_centre' | 'sport'>('all');
  const [customCenter, setCustomCenter] = useState<LatLng | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await listVenues();
        const data = ((res as { data?: VenueRaw[] } | null)?.data) ?? (Array.isArray(res) ? (res as VenueRaw[]) : []);
        if (!mounted) return;
        setVenues(data);
      } catch (e: unknown) {
        const msg = (e && typeof e === 'object' && 'message' in e && typeof (e as { message?: unknown }).message === 'string')
          ? String((e as { message?: unknown }).message)
          : 'Failed to load venues';
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Compute Hot Now / Chill Now using first court as proxy
  useEffect(() => {
    (async () => {
      if (!venues?.length) return;
      try {
        const now = new Date();
        const tasks = venues.map(async (v: VenueRaw) => {
          const first: CourtRaw | undefined = Array.isArray(v.courts) ? v.courts[0] : undefined;
          if (!first) return { id: v._id, status: undefined as undefined | 'hot' | 'chill' };
          try {
            const res = await predictRush({
              venueId: v._id,
              courtId: first._id,
              dateTime: now.toISOString(),
              durationHours: 1,
              outdoor: Boolean(first.outdoor)
            });
            const status: 'hot' | 'chill' | undefined = res.rushScore >= 0.7 ? 'hot' : res.rushScore <= 0.35 ? 'chill' : undefined;
            return { id: v._id, status };
          } catch {
            return { id: v._id, status: undefined };
          }
        });
        const results = await Promise.all(tasks);
        const m: Record<string, 'hot' | 'chill' | undefined> = {};
        results.forEach(r => { if (r) m[r.id] = r.status; });
        setRushMap(m);
      } catch (e) {
        console.error('rush badges compute failed', e);
      }
    })();
  }, [venues]);

  // Acquire user location when Near Me toggled on
  useEffect(() => {
    (async () => {
      if (!nearMe) return;
      const loc = await getUserLocation();
      if (!loc) toast('Location unavailable');
      setUserLoc(loc);
    })();
  }, [nearMe]);

  // Fetch public sports POIs from OSM Overpass when Near Me is active
  useEffect(() => {
    (async () => {
      if (!nearMe || !userLoc) { setPois([]); return; }
      try {
        const data = await fetchSportsPOIsOverpass(userLoc, radiusKm);
        setPois(data);
      } catch {
        setPois([]);
      }
    })();
  }, [nearMe, userLoc, radiusKm]);

  // Ensure venues have coordinates: use existing lat/lng, else geocode address
  useEffect(() => {
    (async () => {
      const updates: { idx: number; lat: number; lng: number }[] = [];
      const tasks = venues.map(async (v, idx) => {
        if (typeof v.lat === 'number' && typeof v.lng === 'number') return;
        if (!v.address) return;
        const ll = await geocodeNominatim(v.address);
        if (ll) updates.push({ idx, lat: ll.lat, lng: ll.lng });
      });
      await Promise.all(tasks);
      if (updates.length) {
        setVenues(prev => {
          const copy = [...prev];
          updates.forEach(u => { copy[u.idx] = { ...copy[u.idx], lat: u.lat, lng: u.lng }; });
          return copy;
        });
      }
    })();
  }, [venues]);

  const sports = ['all', 'badminton', 'tennis', 'basketball', 'squash', 'football', 'table tennis'];

  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: '0-1500', label: '₹0 - ₹1,500' },
    { value: '1500-2000', label: '₹1,500 - ₹2,000' },
    { value: '2000+', label: '₹2,000+' },
  ];

  const mapped = useMemo(() => {
    return venues.map((v: VenueRaw) => {
      const courts: CourtRaw[] = Array.isArray(v.courts) ? v.courts : [];
      const price = courts.length ? Math.min(...courts.map((c: CourtRaw) => c.pricePerHour || 0)) : 0;
      const reviews = Array.isArray(v.reviews) ? v.reviews : [] as { rating?: number }[];
      const rating = reviews.length
        ? Number((reviews.reduce((a: number, r: { rating?: number }) => a + (r.rating || 0), 0) / reviews.length).toFixed(1))
        : 4.5;
      const available = courts.some((c: CourtRaw) => Array.isArray(c.availableSlots) && c.availableSlots.length > 0);
      const coord: LatLng | null = (typeof v.lat === 'number' && typeof v.lng === 'number') ? { lat: v.lat, lng: v.lng } : null;
      const distanceKm = (nearMe && userLoc && coord) ? Number(haversineKm(userLoc, coord).toFixed(2)) : undefined;
      return {
        id: v._id,
        name: v.name,
        sports: v.sports || [],
        sport: (v.sports && v.sports[0]) || 'Multi-sport',
        price,
        rating,
        location: v.address,
        amenities: v.amenities || [],
        courts: courts.length,
        available,
        photo: (Array.isArray(v.photos) && v.photos[0]) || undefined,
        rushStatus: rushMap[v._id],
        lat: coord?.lat,
        lng: coord?.lng,
        distanceKm,
      };
    });
  }, [venues, rushMap, nearMe, userLoc]);

  const filteredVenues = mapped.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = selectedSport === 'all' || venue.sports.map((s: string) => s.toLowerCase()).includes(selectedSport);
    let matchesPrice = true;
    if (priceRange === '0-1500') matchesPrice = venue.price <= 1500;
    else if (priceRange === '1500-2000') matchesPrice = venue.price > 1500 && venue.price <= 2000;
    else if (priceRange === '2000+') matchesPrice = venue.price > 2000;
    const matchesRadius = !nearMe || (typeof venue.distanceKm === 'number' && venue.distanceKm <= radiusKm);
    return matchesSearch && matchesSport && matchesPrice && matchesRadius;
  });
  const sortedVenues = useMemo(() => {
    if (nearMe) {
      return [...filteredVenues].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }
    return filteredVenues;
  }, [filteredVenues, nearMe]);

  // Derived POIs based on filter
  const filteredPois = useMemo(() => {
    if (poiFilter === 'all') return pois;
    const normalize = (k?: string): string => {
      const s = (k || '').toLowerCase();
      if (s.includes('stadium')) return 'stadium';
      if (s.includes('sports_centre') || s.includes('sports centre')) return 'sports_centre';
      if (s.includes('pitch')) return 'pitch';
      if (s.includes('fitness')) return 'fitness_centre';
      if (s.includes('sport')) return 'sport';
      return 'other';
    };
    return pois.filter(p => normalize(p.kind) === poiFilter);
  }, [pois, poiFilter]);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Find Your Perfect <span className="text-gradient-primary">Sports Venue</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover top-rated sports facilities in your area and book instantly
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card/50 rounded-lg p-6 mb-8 border border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search venues or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>

            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Sport Type" />
              </SelectTrigger>
              <SelectContent>
                {sports.map(sport => (
                  <SelectItem key={sport} value={sport}>
                    {sport === 'all' ? 'All Sports' : sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                {priceRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="border-border">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Near Me + Results Count */}
        <div className="mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-muted-foreground">
              Found {sortedVenues.length} venue{sortedVenues.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Venues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading && (
            <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground">Loading venues...</div>
          )}
          {!loading && sortedVenues.map((venue) => (
            <Card key={venue.id} className="card-gradient hover-lift border-border/50 overflow-hidden">
              <div className="relative h-44 overflow-hidden">
                {venue.photo ? (
                  <img
                    src={venue.photo}
                    alt={venue.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-muted" />
                )}
                <div className="absolute inset-0 bg-black/20" />
                {/* Hot/Chill badges */}
                {venue.rushStatus === 'hot' && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="destructive">Hot Now</Badge>
                  </div>
                )}
                {venue.rushStatus === 'chill' && (
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary">Chill Now</Badge>
                  </div>
                )}
                {!venue.available && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive">Fully Booked</Badge>
                  </div>
                )}
              </div>
              
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-foreground line-clamp-1">
                    {venue.name}
                  </h3>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-warning fill-current" />
                    <span className="text-sm font-medium">{venue.rating}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{venue.sport}</Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      {typeof venue.distanceKm === 'number' && (
                        <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-[10px]">{venue.distanceKm} km</span>
                      )}
                      {venue.courts} court{venue.courts !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm line-clamp-1">{venue.location}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {venue.amenities.slice(0, 3).map((amenity, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {amenity}
                      </Badge>
                    ))}
                    {venue.amenities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{venue.amenities.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-border/50">
                    <div>
                      <span className="text-2xl font-bold text-secondary">
                        ₹{venue.price}
                      </span>
                      <span className="text-sm text-muted-foreground">/hour</span>
                    </div>
                    <Link to={`/venues/${venue.id}`}>
                      <Button 
                        className="btn-bounce bg-primary hover:bg-primary/90"
                        disabled={!venue.available}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {venue.available ? 'Book Now' : 'Unavailable'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

            {!loading && sortedVenues.length > 0 && (
              <div className="mt-8">
                <OSMMap
                  venues={sortedVenues.filter(v=> typeof v.lat==='number' && typeof v.lng==='number').map(v=> ({
                    id: v.id,
                    name: v.name,
                    lat: v.lat as number,
                    lng: v.lng as number,
                    price: v.price,
                    rush: v.rushStatus,
                  })) as MapVenue[]}
                  user={userLoc}
                  center={customCenter || undefined}
                  height={360}
                  onNavigate={(id)=>navigate(`/venues/${id}`)}
                  pois={filteredPois.map(p => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, kind: p.kind }))}
                />

                {/* Controls moved below map */}
                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={nearMe} onChange={(e)=>setNearMe(e.target.checked)} />
                      Near Me
                    </label>
                    <div className="flex items-center gap-2 text-sm">
                      <span>{radiusKm} km</span>
                      <input
                        type="range"
                        min={2}
                        max={25}
                        step={1}
                        value={radiusKm}
                        onChange={(e)=>setRadiusKm(Number(e.target.value))}
                        className="w-40 cursor-pointer"
                      />
                    </div>
                    <select
                      value={poiFilter}
                      onChange={(e)=>{
                        const v = e.target.value as 'all' | 'stadium' | 'sports_centre' | 'pitch' | 'fitness_centre' | 'sport';
                        setPoiFilter(v);
                      }}
                      className="text-sm bg-background/50 border rounded px-2 py-1"
                      title="Filter public sports places"
                    >
                      <option value="all">All POIs</option>
                      <option value="stadium">Stadiums</option>
                      <option value="sports_centre">Sports centres</option>
                      <option value="pitch">Pitches</option>
                      <option value="fitness_centre">Fitness centres</option>
                      <option value="sport">Other sport-tag</option>
                    </select>
                  </div>

                  {/* Map search / recenter */}
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
                    <input
                      value={locationQuery}
                      onChange={(e)=>setLocationQuery(e.target.value)}
                      placeholder="Search place or paste lat,lng"
                      className="text-sm bg-background/50 border rounded px-2 py-1 w-full md:w-64"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={async ()=>{
                        const q = locationQuery.trim();
                        if (!q) return;
                        const m = q.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
                        if (m) {
                          const lat = Number(m[1]);
                          const lng = Number(m[2]);
                          if (isFinite(lat) && isFinite(lng)) { setCustomCenter({ lat, lng }); return; }
                        }
                        const ll = await geocodeNominatim(q);
                        if (ll) setCustomCenter(ll);
                        else toast('Place not found');
                      }}>Search</Button>
                      <Button variant="secondary" onClick={async ()=>{
                        const loc = await getUserLocation();
                        if (loc) { setUserLoc(loc); setCustomCenter(loc); }
                        else toast('Location unavailable');
                      }}>Use My Location</Button>
                      <Button variant="ghost" onClick={()=>{ setCustomCenter(null); setLocationQuery(''); }}>Clear</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

        </div>

        {/* No Results */}
        {(!loading && filteredVenues.length === 0) && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted/50 rounded-full mx-auto mb-6 flex items-center justify-center">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No venues found
            </h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search criteria or browse all venues
            </p>
            <Button 
              onClick={() => {
                setSearchQuery('');
                setSelectedSport('all');
                setPriceRange('all');
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Venues;