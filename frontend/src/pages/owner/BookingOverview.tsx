import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { cancelBookingApi, confirmBookingApi, listMyVenues, listVenueBookings, type Booking } from '@/lib/api';

const BookingOverview = () => {
  const { user } = useAuth();
  const [venueId, setVenueId] = useState<string>(() => localStorage.getItem('quickcourt_owner_venue_id') || '');
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== 'facility_owner') return <Navigate to="/" replace />;

  // Ensure we have a valid venueId (reuse logic similar to OwnerDashboard)
  useEffect(() => {
    const isValidObjectId = (id?: string) => !!id && /^[a-f\d]{24}$/i.test(id);
    async function ensureVenue() {
      try {
        const mine = await listMyVenues();
        const arr = Array.isArray((mine as any)?.data) ? (mine as any).data : [];
        const ids: string[] = arr.map((v: any) => v?._id || v?.id).filter(Boolean);
        if (ids.length === 0) {
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
        // ignore
      }
    }
    ensureVenue();
  }, [venueId]);

  const canCancel = (b: Booking) => b.status === 'confirmed' || b.status === 'pending';
  const canConfirm = (b: Booking) => b.status === 'pending';
  const fmtWhen = (dt: string | Date) => {
    const d = new Date(dt);
    const opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' } as any;
    return d.toLocaleString(undefined, opts);
  };

  async function load() {
    if (!venueId) { setItems([]); setLoading(false); return; }
    try {
      setError(undefined);
      const res = await listVenueBookings({ venueId, limit: 30 });
      setItems(Array.isArray(res) ? res : []);
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

  async function onCancel(id: string) {
    try {
      setCancellingId(id);
      await cancelBookingApi(id);
      await load();
    } catch (e) {
      // surface as toast in future; for now, inline fallback reload
      await load();
    } finally {
      setCancellingId(null);
    }
  }

  async function onConfirm(id: string) {
    try {
      setCancellingId(id);
      await confirmBookingApi(id);
      await load();
    } catch (e) {
      await load();
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet><title>Booking Overview | QuickCourt</title></Helmet>
      <h1 className="text-3xl font-bold mb-6">Booking Overview</h1>

      <Card>
        <CardHeader><CardTitle>Upcoming & Past Bookings</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {!venueId && (
            <div className="text-sm text-muted-foreground">Create or save your facility to see bookings.</div>
          )}
          {venueId && loading && (
            <ul className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <li key={i} className="flex items-center justify-between border border-border/50 rounded-md p-3 bg-card/50">
                  <div>
                    <div className="h-4 w-48 bg-muted rounded mb-2" />
                    <div className="h-3 w-28 bg-muted rounded" />
                  </div>
                  <div className="h-8 w-20 bg-muted rounded" />
                </li>
              ))}
            </ul>
          )}
          {venueId && !loading && error && (
            <div className="text-sm text-red-500">{error} <button className="underline" onClick={load}>Retry</button></div>
          )}
          {venueId && !loading && !error && items.length === 0 && (
            <div className="text-sm text-muted-foreground">No bookings found.</div>
          )}
          {venueId && !loading && !error && items.length > 0 && (
            <ul className="space-y-3">
              {items.map(b => (
                <li key={b._id} className="flex items-center justify-between border border-border/50 rounded-md p-3 bg-card/50">
                  <div>
                    <div className="font-medium">{(b.courtName || 'Court')}{b.sport ? ` · ${b.sport}` : ''}</div>
                    <div className="text-xs text-muted-foreground">{fmtWhen(b.dateTime)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`text-xs ${b.status === 'confirmed' ? 'text-secondary' : b.status === 'cancelled' ? 'text-destructive' : 'text-warning'}`}>{b.status}</div>
                    {canConfirm(b) && (
                      <Button size="sm" variant="default" disabled={cancellingId === b._id} onClick={() => onConfirm(b._id)}>
                        {cancellingId === b._id ? 'Confirming…' : 'Confirm'}
                      </Button>
                    )}
                    {canCancel(b) && (
                      <Button size="sm" variant="outline" disabled={cancellingId === b._id} onClick={() => onCancel(b._id)}>
                        {cancellingId === b._id ? 'Cancelling…' : 'Cancel'}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingOverview;
