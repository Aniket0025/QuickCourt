import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, User as UserIcon } from 'lucide-react';
import logo from "@/assets/logo.png";
import { listBookings, getFeaturedVenues, type VenueSummary } from "@/lib/api";

const UserDashboard = () => {
  const { user } = useAuth();
  type BookingItem = {
    _id: string;
    venueId: string;
    courtId: string;
    courtName: string;
    sport: string;
    dateTime: string;
    durationHours: number;
    price: number;
    status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  };
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [recLoading, setRecLoading] = useState(true);
  const [recommended, setRecommended] = useState<VenueSummary[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!user) return;
      try {
        setLoading(true);
        const res = await listBookings({ userId: user.id });
        if (!mounted) return;
        setBookings((res as any)?.data || []);
      } catch (_e) {
        // noop; could add toast
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const upcoming = useMemo(() => {
    return bookings
      .filter(b => new Date(b.dateTime) > now && b.status !== 'cancelled')
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime())
      .slice(0, 5);
  }, [bookings]);

  // Load recommended venues (reuse featured for now)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setRecLoading(true);
        const data = await getFeaturedVenues(6);
        if (!mounted) return;
        setRecommended(data);
      } catch (_e) {
        // noop
      } finally {
        if (mounted) setRecLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== "user") {
    const target = user.role === "admin" ? "/dashboard/admin" : "/dashboard/facility";
    return <Navigate to={target} replace />;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet>
        <title>User Dashboard | QuickCourt</title>
        <meta name="description" content="Your QuickCourt dashboard with upcoming bookings and recommendations." />
        <link rel="canonical" href="/dashboard/user" />
      </Helmet>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground mt-2">See your upcoming bookings and explore venues.</p>
      </header>

      <main className="space-y-6">
        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>Upcoming Bookings</CardTitle>
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white uppercase">Upcoming</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="text-sm text-muted-foreground">Loading upcoming bookings...</div>
              )}
              {!loading && upcoming.length === 0 && (
                <div className="text-sm text-muted-foreground">No upcoming bookings yet.</div>
              )}
              {!loading && upcoming.length > 0 && (
                <ul className="space-y-3 text-sm">
                  {upcoming.map((b) => {
                    const when = new Date(b.dateTime).toLocaleString();
                    return (
                      <li key={b._id} className="flex items-center justify-between rounded-md border border-border/50 p-3 bg-card/50">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 text-muted-foreground"><Calendar size={16} /></div>
                          <div>
                            <div className="font-medium text-foreground">{b.courtName} ({b.sport})</div>
                            <div className="text-xs text-muted-foreground">{when}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">₹ {b.price.toLocaleString()}</div>
                          <div className={`text-xs ${b.status === 'confirmed' ? 'text-secondary' : b.status === 'pending' ? 'text-warning' : b.status === 'completed' ? 'text-info' : 'text-muted-foreground'}`}>{b.status}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-4">
                <Button asChild size="sm" variant="outline">
                  <Link to="/profile?tab=bookings">View all bookings</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <img src={logo} alt="QuickCourt" className="h-6 w-6 rounded-sm" />
                <CardTitle>Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button asChild variant="secondary" size="sm" className="justify-start gap-2">
                  <Link to="/venues">
                    <MapPin size={16} />
                    Browse Venues
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="sm" className="justify-start gap-2">
                  <Link to="/profile?tab=bookings">
                    <Calendar size={16} />
                    My Bookings
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="sm" className="justify-start gap-2">
                  <Link to="/profile">
                    <UserIcon size={16} />
                    Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Recommended Venues</CardTitle>
            </CardHeader>
            <CardContent>
              {recLoading && (
                <div className="text-sm text-muted-foreground">Loading recommendations...</div>
              )}
              {!recLoading && recommended.length === 0 && (
                <div className="text-sm text-muted-foreground">No recommendations yet.</div>
              )}
              {!recLoading && recommended.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recommended.map((v) => {
                    const primarySport = (v.sports && v.sports[0]) || 'Multi-sport';
                    const price = v.pricePerHour ? `₹ ${v.pricePerHour.toLocaleString()}/hr` : '—';
                    const photo = (v.photos && v.photos[0]) || logo;
                    return (
                      <div key={v._id} className="rounded-md border border-border/50 p-4 bg-card/50 hover:bg-card transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <img src={photo} alt={v.name} className="h-14 w-20 rounded object-cover" />
                            <div>
                              <div className="font-semibold text-foreground line-clamp-1">{v.name}</div>
                              <div className="text-xs text-muted-foreground line-clamp-2">{(v.city || v.address || '').toString()} · {primarySport}</div>
                            </div>
                          </div>
                          {typeof v.rating === 'number' && (
                            <div className="text-right">
                              <div className="text-xs text-muted-foreground">Rating</div>
                              <div className="text-sm font-medium">{v.rating}</div>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-sm font-semibold">{price}</div>
                          <Button asChild size="sm" variant="secondary">
                            <Link to={`/venues/${v._id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default UserDashboard;