import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { findVenue } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import { RushHeatmap } from '@/components/venue/RushHeatmap';
import { FairSurgeBanner } from '@/components/venue/FairSurgeBanner';
import { RevenueLab } from '@/components/venue/RevenueLab';

const VenueDetails = () => {
  const { id } = useParams();
  const venue = id ? findVenue(id) : undefined;
  const { user } = useAuth();

  if (!venue) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card>
          <CardContent className="p-6">Venue not found.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet>
        <title>{venue.name} | QuickCourt</title>
        <meta name="description" content={venue.description} />
        <link rel="canonical" href={`/venues/${venue.id}`} />
      </Helmet>

      <header className="mb-6">
        <h1 className="text-3xl font-bold">{venue.name}</h1>
        <p className="text-muted-foreground mt-1">{venue.address}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          {/* Rush & Price Heatmap - moved to main column for visibility */}
          {venue.courts.length > 0 && (
            <RushHeatmap
              venueId={venue.id}
              courtId={venue.courts[0].id}
              basePrice={venue.courts[0].pricePerHour}
            />
          )}
          <Card>
            <CardHeader>
              <CardTitle>About Venue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{venue.description}</p>
              <p className="text-sm">{venue.about}</p>
            </CardContent>
          </Card>

          {/* Fair Surge banner */}
          <FairSurgeBanner />

          {/* Revenue Lab */}
          {venue.courts.length > 0 && (
            <RevenueLab
              venueId={venue.id}
              courtId={venue.courts[0].id}
              basePrice={venue.courts[0].pricePerHour}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Sports Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {venue.sports.map((s) => (
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
                {venue.amenities.map((a) => (
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
                {venue.photos.map((p, i) => (
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
                {venue.reviews.map((r, i) => (
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
                <Link to={user ? `/venues/${venue.id}/book` : '/auth'}>
                  {user ? 'Book Now' : 'Sign in to Book'}
                </Link>
              </Button>
              <div className="text-xs text-muted-foreground">Starting from ₹{Math.min(...venue.courts.map(c=>c.pricePerHour))}/hr</div>
            </CardContent>
          </Card>

          

          <Card>
            <CardHeader>
              <CardTitle>Courts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {venue.courts.map((c) => (
                <div key={c.id} className="rounded-md border border-border/50 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{c.name} · {c.sport}</div>
                      <div className="text-xs text-muted-foreground">Hours: {c.operatingHours}</div>
                    </div>
                    <div className="text-sm font-semibold">₹ {c.pricePerHour.toLocaleString()}/hr</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VenueDetails;
