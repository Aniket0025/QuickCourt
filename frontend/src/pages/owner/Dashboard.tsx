import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { OwnerStatsCards } from "./components/OwnerStatsCards";
import { OwnerBookingActivity } from "./components/OwnerBookingActivity";
import { listMyVenues } from "@/lib/api";

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
              <ul className="space-y-3 text-sm">
                {[
                  { when: 'Today 5:00 PM', item: 'Court 1 · Badminton', who: 'Ananya S.', price: 1200, status: 'confirmed' },
                  { when: 'Today 7:30 PM', item: 'Turf A · Football (5v5)', who: 'Rahul M.', price: 2500, status: 'pending' },
                  { when: 'Thu 6:00 PM', item: 'Table 2 · Table Tennis', who: 'Karthik P.', price: 600, status: 'confirmed' },
                  { when: 'Fri 8:00 PM', item: 'Court 3 · Badminton', who: 'Sneha R.', price: 1200, status: 'cancelled' },
                ].map((b, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border border-border/50 p-3 bg-card/50">
                    <div>
                      <div className="font-medium text-foreground">{b.item}</div>
                      <div className="text-xs text-muted-foreground">{b.when} · {b.who}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">₹ {b.price.toLocaleString()}</div>
                      <div className={`text-xs ${b.status === 'confirmed' ? 'text-secondary' : b.status === 'cancelled' ? 'text-destructive' : 'text-warning'}`}>{b.status}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default OwnerDashboard;
