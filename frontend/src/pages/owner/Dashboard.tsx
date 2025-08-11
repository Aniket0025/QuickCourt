import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { OwnerStatsCards } from "./components/OwnerStatsCards";
import { OwnerBookingActivity } from "./components/OwnerBookingActivity";
import { listMyVenues, listVenueBookings, type Booking } from "@/lib/api";

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [venueId, setVenueId] = useState<string>(() => localStorage.getItem('quickcourt_owner_venue_id') || '');

  // Ensure we have a valid venueId; if missing/invalid, auto-pick the owner's first venue
  useEffect(() => {
    const isValidObjectId = (id?: string) => !!id && /^[a-f\d]{24}$/i.test(id);
    async function ensureVenue() {
      try {
        const mine = await listMyVenues();
        const arr = Array.isArray((mine as any)?.data) ? (mine as any).data : [];
        const ids: string[] = arr.map((v: any) => v?._id || v?.id).filter(Boolean);
        // If current is invalid format OR not in my venues, pick first available
        if (ids.length === 0) {
          // No venues owned: clear any stale id so hooks won't fire
          localStorage.removeItem('quickcourt_owner_venue_id');
          if (venueId) setVenueId('');
        } else if (!isValidObjectId(venueId) || !ids.includes(venueId)) {
          const id = ids[0];
          if (isValidObjectId(id)) {
            localStorage.setItem('quickcourt_owner_venue_id', id);
            setVenueId(id);
          }
        }
      } catch {
        // ignore; UI shows placeholders
      }
    }
    ensureVenue();
  }, [venueId]);

  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== "facility_owner") {
    const target = user.role === "admin" ? "/dashboard/admin" : "/dashboard/user";
    return <Navigate to={target} replace />;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet>
        <title>Facility Owner Dashboard | QuickCourt</title>
        <meta name="description" content="Facility owner dashboard to manage courts, availability, and earnings on QuickCourt." />
        <link rel="canonical" href="/dashboard/facility" />
      </Helmet>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Facility Owner Dashboard</h1>
        <p className="text-muted-foreground mt-2">Manage courts, availability, and view earnings.</p>
      </header>

      <main className="space-y-6">
        {venueId ? (
          <section className="space-y-6">
            <OwnerStatsCards venueId={venueId} />
          </section>
        ) : (
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">No Venue Selected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Create or save your facility to see live metrics.</p>
                <Button asChild size="sm" variant="secondary">
                  <Link to="/owner/facility">Add / Edit Facility</Link>
                </Button>
              </CardContent>
            </Card>
          </section>
        )}

        <section className="grid gap-6 md:grid-cols-2">
          {venueId ? (
            <OwnerBookingActivity venueId={venueId} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Booking Activity (7d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Create or save your facility to see bookings.</div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="secondary" size="sm">
                  <Link to="/owner/facility">Add / Edit Facility</Link>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <Link to="/owner/courts">Manage Courts</Link>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <Link to="/owner/time-slots">Set Time Slots</Link>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <Link to="/owner/bookings">Booking Overview</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              {venueId ? <RecentBookingsList venueId={venueId} /> : (
                <div className="text-sm text-muted-foreground">Create or save your facility to see recent bookings.</div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default OwnerDashboard;

// Recent bookings list with lightweight polling (10s)
function RecentBookingsList({ venueId }: { venueId: string }) {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();

  async function load() {
    try {
      setError(undefined);
      const data = await listVenueBookings({ venueId, limit: 8 });
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    let t: any;
    (async () => {
      if (!cancelled) await load();
      t = setInterval(() => { if (!cancelled) load(); }, 10000);
    })();
    return () => { cancelled = true; if (t) clearInterval(t); };
  }, [venueId]);

  const fmtWhen = (dt: string | Date) => {
    const d = new Date(dt);
    const opts: Intl.DateTimeFormatOptions = { weekday: 'short', hour: 'numeric', minute: '2-digit' };
    return d.toLocaleString(undefined, opts);
  };

  if (loading) {
    return (
      <ul className="space-y-3 text-sm">
        {[...Array(4)].map((_, i) => (
          <li key={i} className="flex items-center justify-between rounded-md border border-border/50 p-3 bg-card/50">
            <div>
              <div className="h-4 w-40 bg-muted rounded mb-2" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
            <div className="text-right">
              <div className="h-4 w-16 bg-muted rounded mb-2 ml-auto" />
              <div className="h-3 w-12 bg-muted rounded ml-auto" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">{error} <button className="underline" onClick={load}>Retry</button></div>
    );
  }

  if (!items.length) {
    return <div className="text-sm text-muted-foreground">No recent bookings.</div>;
  }

  return (
    <ul className="space-y-3 text-sm">
      {items.map((b) => {
        const leftTitle = `${b.courtName ?? 'Court'}${b.sport ? ` · ${b.sport}` : ''}`;
        const price = Number(b.price || 0);
        return (
          <li key={b._id} className="flex items-center justify-between rounded-md border border-border/50 p-3 bg-card/50">
            <div>
              <div className="font-medium text-foreground">{leftTitle}</div>
              <div className="text-xs text-muted-foreground">{fmtWhen(b.dateTime)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">₹ {price.toLocaleString()}</div>
              <div className={`text-xs ${b.status === 'confirmed' ? 'text-secondary' : b.status === 'cancelled' ? 'text-destructive' : 'text-warning'}`}>{b.status}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
