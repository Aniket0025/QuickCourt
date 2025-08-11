import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth';
import { Calendar, Filter, MapPin, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import GoogleMapView, { type MapPOI as GMapPOI, type MapVenue as GMapVenue } from '@/components/map/GoogleMapView';
import { listMyVenues, listVenues, predictRush } from '@/lib/api';
import { geocodeNominatim, getUserLocation, haversineKm, LatLng } from '@/lib/geo';
import { toast } from 'sonner';

export const Venues = () => {
  const location = useLocation();
  const { user } = useAuth();

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
  const [pois, setPois] = useState<GMapPOI[]>([]);
  const [poiFilter, setPoiFilter] = useState<'all' | 'stadium' | 'sports_centre' | 'pitch' | 'fitness_centre' | 'sport'>('all');
  const [customCenter, setCustomCenter] = useState<LatLng | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [minRating, setMinRating] = useState<'all' | '3' | '4'>('all');
  const [rushFilter, setRushFilter] = useState<'all' | 'hot' | 'chill'>('all');

  const navigate = useNavigate();

  // Default location: IIT Gandhinagar
  const IITGN = useMemo<LatLng>(() => ({ lat: 23.2156, lng: 72.6842 }), []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sportParam = params.get('sport');
    if (sportParam) {
      setSelectedSport(sportParam.toLowerCase());
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const sport = selectedSport !== 'all' ? selectedSport : undefined;
        // Facility owners should only see their own venues
        const res = user?.role === 'facility_owner'
          ? await listMyVenues()
          : await listVenues(sport ? { sport } : undefined);
        const data = (res as any)?.data || [];
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
  }, [selectedSport, user?.role]);

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

  useEffect(() => {
    (async () => {
      if (!nearMe) return;
      const loc = await getUserLocation();
      if (!loc) toast('Location unavailable');
      setUserLoc(loc);
      if (loc) setCustomCenter(loc);
    })();
  }, [nearMe]);

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
      const reviews = Array.isArray(v.reviews) ? v.reviews as { rating?: number }[] : [];
      const rating = reviews.length
        ? Number((reviews.reduce((a: number, r: { rating?: number }) => a + (r.rating || 0), 0) / reviews.length).toFixed(1))
        : undefined;
      const available = courts.some((c: CourtRaw) => Array.isArray(c.availableSlots) && c.availableSlots.length > 0);
      const coord: LatLng | null = (typeof v.lat === 'number' && typeof v.lng === 'number') ? { lat: v.lat, lng: v.lng } : null;
      const distanceKm = (nearMe && userLoc && coord) ? Number(haversineKm(userLoc, coord).toFixed(2)) : undefined;
      const allSportsLower = new Set([
        ...((v.sports || []) as string[]).map((s) => String(s).toLowerCase()),
        ...courts.map((c: any) => String((c as any).sport || '').toLowerCase()),
      ].filter(Boolean));
      const primarySport = (v.sports && v.sports[0]) || ((courts as any)[0]?.sport) || 'Multi-sport';
      return {
        id: v._id,
        name: v.name,
        sports: Array.from(allSportsLower),
        sport: primarySport,
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
    const matchesAvailability = !availableOnly || venue.available;
    const matchesRating = minRating === 'all' || (typeof venue.rating === 'number' && venue.rating >= Number(minRating));
    const matchesRush = rushFilter === 'all' || venue.rushStatus === rushFilter;
    return matchesSearch && matchesSport && matchesPrice && matchesRadius && matchesAvailability && matchesRating && matchesRush;
  });

  const sortedVenues = useMemo(() => {
    if (nearMe) {
      return [...filteredVenues].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }
    return filteredVenues;
  }, [filteredVenues, nearMe]);

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>

            <Select value={selectedSport} onValueChange={(val) => {
              setSelectedSport(val);
              const params = new URLSearchParams(location.search);
              if (val === 'all') params.delete('sport'); else params.set('sport', val);
              navigate({ search: params.toString() }, { replace: true });
            }}>
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

            <Button variant="outline" className="border-border" onClick={() => setShowMore(v => !v)}>
              <Filter className="h-4 w-4 mr-2" />
              {showMore ? 'Hide Filters' : 'More Filters'}
            </Button>
          </div>
          {showMore && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in-50">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={nearMe} onChange={(e) => setNearMe(e.target.checked)} />
                Near me
              </label>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Radius</span>
                <input
                  type="range"
                  min={2}
                  max={20}
                  step={1}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  disabled={!nearMe}
                  className="flex-1"
                />
                <span className="text-sm w-10 text-right">{radiusKm} km</span>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
                Available only
              </label>
              <Select value={minRating} onValueChange={(v) => setMinRating(v as 'all' | '3' | '4')}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Min rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ratings</SelectItem>
                  <SelectItem value="3">3.0+</SelectItem>
                  <SelectItem value="4">4.0+</SelectItem>
                </SelectContent>
              </Select>
              <div className="md:col-span-2 flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Rush</span>
                <div className="flex gap-2">
                  {(['all','hot','chill'] as const).map(k => (
                    <Button key={k} size="sm" variant={rushFilter === k ? 'default' : 'outline'} onClick={() => setRushFilter(k)}>
                      {k === 'all' ? 'Any' : k.charAt(0).toUpperCase() + k.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setAvailableOnly(false); setMinRating('all'); setRushFilter('all'); setNearMe(false); setRadiusKm(8); }}>Clear</Button>
                <Button onClick={() => setShowMore(false)}>Apply</Button>
              </div>
            </div>
          )}
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
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-border/50 overflow-hidden">
                  <div className="h-56 bg-muted/30 animate-pulse" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 w-2/3 bg-muted/30 rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-muted/30 rounded animate-pulse" />
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-muted/30 rounded-full animate-pulse" />
                      <div className="h-6 w-20 bg-muted/30 rounded-full animate-pulse" />
                    </div>
                    <div className="h-10 w-full bg-muted/30 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && sortedVenues.map((venue) => (
            <Card key={venue.id} className="hover-card group card-gradient border-border/50 overflow-hidden">
              <div className="relative h-56 md:h-60 overflow-hidden">
                {venue.photo ? (
                  <img
                    src={venue.photo}
                    alt={venue.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-muted" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent" />
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
                  <h3 className="text-xl font-semibold text-foreground line-clamp-1 tracking-tight">
                    {venue.name}
                  </h3>
                  {venue.rating !== undefined && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-warning fill-current" />
                      <span className="text-sm font-medium">{venue.rating}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {venue.sports.slice(0, 3).map((s: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="backdrop-blur bg-secondary/80">
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Badge>
                      ))}
                      {venue.sports.length > 3 && (
                        <Badge variant="secondary" className="backdrop-blur bg-secondary/80">+{venue.sports.length - 3} more</Badge>
                      )}
                    </div>
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
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Starting from</span>
                      <div className="backdrop-blur bg-background/70 border border-border/50 rounded-full px-3 py-1.5 shadow-sm flex items-center gap-1 text-sm">
                        <span className="font-semibold text-secondary">₹{venue.price}</span>
                        <span className="text-muted-foreground">/hr</span>
                      </div>
                    </div>
                    {user?.role !== 'facility_owner' && (
                      <Link to={`/venues/${venue.id}`}>
                        <Button
                          className="btn-bounce bg-primary hover:bg-primary/90 shadow-md"
                          disabled={!venue.available}
                          aria-disabled={!venue.available}
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          {venue.available ? 'Book Now' : 'Unavailable'}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Map and controls below the grid */}
        {!loading && sortedVenues.length > 0 && (
          <div className="mt-8 w-full">
            <GoogleMapView
              venues={sortedVenues
                .filter(v=> typeof v.lat==='number' && typeof v.lng==='number')
                .map(v=> ({ id: v.id, name: v.name, lat: v.lat as number, lng: v.lng as number, price: v.price, rush: v.rushStatus })) as GMapVenue[]}
              user={userLoc || undefined}
              center={customCenter || IITGN}
              height={360}
              onNavigate={user?.role === 'facility_owner' ? undefined : (id)=>navigate(`/venues/${id}`)}
              pois={pois}
              radiusKm={radiusKm}
              poiFilter={poiFilter}
              extraMarkers={[{ lat: IITGN.lat, lng: IITGN.lng, title: 'Indian Institute Of Technology Gandhinagar (IIT Gandhinagar), Palaj' }]}
              onPoisUpdate={setPois}
            />

            {/* Controls under map */}
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