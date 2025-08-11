import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getVenue } from '@/lib/api';
import { toast } from 'sonner';

const VenueDetails = () => {
  const { id } = useParams();
  const [venue, setVenue] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await getVenue(id);
        const data = (res as any)?.data;
        if (!mounted) return;
        setVenue(data || null);
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load venue');
        if (mounted) setVenue(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

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
          <Card>
            <CardHeader>
              <CardTitle>About Venue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{venue.description}</p>
              {venue.about && <p className="text-sm">{venue.about}</p>}
            </CardContent>
          </Card>

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
                {(venue.reviews || []).map((r: any, i: number) => (
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
          <Card>
            <CardHeader>
              <CardTitle>Book a Court</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">Select a court and time slot on the next page.</div>
              <Button asChild className="w-full">
                <Link to={`/venues/${venue._id}/book`}>
                  Book Now
                </Link>
              </Button>
              <div className="text-xs text-muted-foreground">Starting from ₹{Math.min(...(venue.courts||[]).map((c:any)=>c.pricePerHour||0))}/hr</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Courts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(venue.courts || []).map((c: any) => (
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
        </div>
      </div>
      </>
      )}
    </div>
  );
};

export default VenueDetails;
