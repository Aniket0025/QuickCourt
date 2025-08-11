import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getVenue, predictRush, findBestDeals } from '@/lib/api';
import { toast } from 'sonner';
import { RushHeatmap } from '@/components/venue/RushHeatmap';
import { RevenueLab } from '@/components/venue/RevenueLab';
import { FairSurgeBanner } from '@/components/venue/FairSurgeBanner';
import OSMMap from '@/components/map/OSMMap';
import { geocodeNominatim, LatLng, fetchSportsPOIsOverpass, SportsPOI, getUserLocation } from '@/lib/geo';
import { useAuth } from '@/lib/auth';

const VenueDetails = () => {
  type Court = { _id: string; name?: string; sport?: string; operatingHours?: string; pricePerHour?: number; outdoor?: boolean };
  type Venue = {
    _id: string;
    name: string;
    address?: string;
    description?: string;
    about?: string;
    photos?: string[];
    reviews?: { user: string; date: string; rating: number; comment: string }[];
    amenities?: string[];
    courts?: Court[];
    sports?: string[];
    lat?: number;
    lng?: number;
  };

  const { id } = useParams();
  const { user } = useAuth();

  const navigate = useNavigate();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [computingDeals, setComputingDeals] = useState(false);
  const [coord, setCoord] = useState<LatLng | null>(null);
  const [pois, setPois] = useState<SportsPOI[]>([]);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const firstCourt = useMemo(() => (venue?.courts || [])[0] || null, [venue]);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);
  const currentCourt = useMemo(() => {
    if (!venue) return null;
    const list = venue.courts || [];
    if (selectedCourtId) return list.find(c => c._id === selectedCourtId) || list[0] || null;
    return list[0] || null;
  }, [venue, selectedCourtId]);
  const basePrice = useMemo(() => {
    const prices = (venue?.courts || []).map((c: Court) => Number(c.pricePerHour || 0)).filter((n: number) => n > 0);
    return prices.length ? Math.min(...prices) : 500;
  }, [venue]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await getVenue(id);
        const data = (res as { data?: Venue } | null)?.data;
        if (!mounted) return;
        setVenue(data || null);
      } catch (e: unknown) {
        const msg = (e && typeof e === 'object' && 'message' in e && typeof (e as Record<string, unknown>).message === 'string')
          ? String((e as Record<string, unknown>).message)
          : 'Failed to load venue';
        toast.error(msg);
        if (mounted) setVenue(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // Resolve coordinates for the venue (use provided lat/lng or geocode the address)
  useEffect(() => {
    (async () => {
      if (!venue) { setCoord(null); return; }
      if (typeof venue.lat === 'number' && typeof venue.lng === 'number') {
        setCoord({ lat: venue.lat, lng: venue.lng });
        return;
      }
      if (venue.address) {
        const ll = await geocodeNominatim(venue.address);
        if (ll) setCoord(ll);
      }
    })();
  }, [venue]);

  // Fetch public sports POIs near the venue coordinate
  useEffect(() => {
    (async () => {
      if (!coord) { setPois([]); return; }
      try {
        const data = await fetchSportsPOIsOverpass(coord, 5);
        setPois(data);
      } catch {
        setPois([]);
      }
    })();
  }, [coord]);

  // Try to show user's current location on the details map
  useEffect(() => {
    (async () => {
      const loc = await getUserLocation();
      setUserLoc(loc);
    })();
  }, []);

  // Surge alert for current hour using first court as proxy
  useEffect(() => {
    (async () => {
      if (!venue || !firstCourt) return;
      try {
        const now = new Date();
        const res = await predictRush({
          venueId: venue._id,
          courtId: firstCourt._id,
          dateTime: now.toISOString(),
          durationHours: 1,
          outdoor: Boolean(firstCourt.outdoor)
        });
        if (res.rushScore >= 0.8) {
          toast.warning('Surge alert: Demand is very high this hour');
        } else if (res.rushScore <= 0.25) {
          toast('Chill hour: Great time to book and save');
        }
      } catch (e) {
        console.error('predictRush failed', e);
      }
    })();
  }, [venue, firstCourt]);

  async function handleAutoBestPrice() {
    if (!venue || !firstCourt) return;
    try {
      setComputingDeals(true);
      const items = await findBestDeals({
        venueId: venue._id,
        courtId: firstCourt._id,
        basePrice: Number(firstCourt.pricePerHour || basePrice),
        startHour: 7,
        endHour: 22,
        days: 7,
        outdoor: Boolean(firstCourt.outdoor),
      });
      const top3 = items.slice(0, 3);
      if (!top3.length) {
        toast('No suitable deals found');
        return;
      }
      toast.success(`Found ${top3.length} smart deals`);
      // Navigate to booking with the cheapest slot prefilled via query params
      const pick = top3[0];
      const q = new URLSearchParams({ courtId: firstCourt._id, dateTime: pick.dateTime }).toString();
      navigate(`/venues/${venue._id}/book?${q}`);
    } catch (e: unknown) {
      const msg = (e && typeof e === 'object' && 'message' in e && typeof (e as Record<string, unknown>).message === 'string')
        ? String((e as Record<string, unknown>).message)
        : 'Failed to compute deals';
      toast.error(msg);
    } finally {
      setComputingDeals(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet>
        <title>{venue ? venue.name : 'Venue'} | QuickCourt</title>
        <meta name="description" content={venue?.description || ''} />
        <link rel="canonical" href={`/venues/${id}`} />
      </Helmet>
      {loading ? (
        <Card><CardContent className="p-6">Loading...</CardContent></Card>
      ) : !venue ? (
        <Card><CardContent className="p-6">Venue not found.</CardContent></Card>
      ) : (
      <>
        <header className="mb-6">
          <h1 className="text-3xl font-bold">{venue.name}</h1>
          <p className="text-muted-foreground mt-1">{venue.address}</p>
        </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <FairSurgeBanner />

          <Card>
            <CardHeader>
              <CardTitle>About Venue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{venue.description}</p>
              {venue.about && <p className="text-sm">{venue.about}</p>}
            </CardContent>
          </Card>

          {currentCourt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Availability & Pricing</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-2">
                    <label htmlFor="courtSel" className="hidden sm:inline">Court:</label>
                    <select
                      id="courtSel"
                      className="border border-border/50 rounded px-2 py-1 text-xs bg-background"
                      value={currentCourt?._id}
                      onChange={(e) => setSelectedCourtId(e.target.value)}
                    >
                      {(venue?.courts || []).map((c) => (
                        <option key={c._id} value={c._id}>{c.name || c._id}</option>
                      ))}
                    </select>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RushHeatmap
                  key={`${venue._id}:${currentCourt._id}`}
                  venueId={venue._id}
                  courtId={currentCourt._id}
                  basePrice={Number(currentCourt.pricePerHour || basePrice)}
                  outdoor={Boolean(currentCourt.outdoor)}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Sports Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(venue.sports || []).map((s: string) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(venue.amenities || []).map((a: string) => (
                  <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photo Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(venue.photos || []).map((p: string, i: number) => (
                  <div key={i} className="h-32 bg-muted rounded-md flex items-center justify-center">
                    <img src={p} alt={`Venue ${i+1}`} className="h-full w-full object-cover rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {(venue.reviews || []).map((r: { user: string; date: string; rating: number; comment: string }, i: number) => (
                  <li key={i} className="rounded-md border border-border/50 p-3 bg-card/50">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-foreground">{r.user}</div>
                      <div className="text-xs">{new Date(r.date).toLocaleDateString()}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">Rating: {r.rating}/5</div>
                    <p className="mt-2">{r.comment}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Location Map */}
          {coord && (
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <OSMMap
                  venues={[{
                    id: venue._id,
                    name: venue.name,
                    lat: coord.lat,
                    lng: coord.lng,
                    price: basePrice,
                    rush: undefined,
                  }]}
                  user={userLoc || undefined}
                  height={260}
                  pois={pois.map(p => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, kind: p.kind }))}
                />
                {venue.address && (
                  <div className="text-sm text-muted-foreground flex items-center justify-between">
                    <span className="line-clamp-1">{venue.address}</span>
                    <a
                      className="text-primary hover:underline"
                      href={`https://www.openstreetmap.org/directions?from=&to=${coord.lat}%2C${coord.lng}`}
                      target="_blank" rel="noreferrer"
                    >
                      Open in OSM
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Book a Court</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">Select a court and time slot on the next page.</div>
              {user?.role === 'facility_owner' ? (
                <Button className="w-full" variant="secondary" disabled title="Booking is disabled for Facility role">
                  Book Now (Disabled for Facility)
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link to={`/venues/${venue._id}/book`}>
                    Book Now
                  </Link>
                </Button>
              )}
              <Button className="w-full" variant="secondary" disabled={!firstCourt || computingDeals} onClick={handleAutoBestPrice}>
                {computingDeals ? 'Finding Best Deals…' : 'Auto Best Price'}
              </Button>
              {firstCourt && (
                <Button className="w-full" variant="outline" onClick={handleAutoBestPrice}>
                  Book Smart
                </Button>
              )}
              <div className="text-xs text-muted-foreground">Starting from ₹{Math.min(...(venue.courts||[]).map((c: Court)=>Number(c.pricePerHour||0)))}/hr</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Courts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(venue.courts || []).map((c: Court) => (
                <div key={c._id} className="rounded-md border border-border/50 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c.name} · {c.sport}</div>
                      <div className="text-xs text-muted-foreground">Hours: {c.operatingHours}</div>
                    </div>
                    <div className="text-sm font-semibold">₹ {Number(c.pricePerHour||0).toLocaleString()}/hr</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {firstCourt && (
            <RevenueLab
              venueId={venue._id}
              courtId={firstCourt._id}
              basePrice={Number(firstCourt.pricePerHour || basePrice)}
              outdoor={Boolean(firstCourt.outdoor)}
            />
          )}
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default VenueDetails;
