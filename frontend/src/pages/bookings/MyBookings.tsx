import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { cancelBookingApi, listBookings, rateBooking } from '@/lib/api';

const MyBookings = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled' | 'completed'>('all');
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
    rating?: number;
  };
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const now = new Date();
  const filtered = useMemo(() => bookings.filter(b => (filter === 'all' ? true : b.status === filter)), [bookings, filter]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const res = await listBookings({ userId: user.id });
        // Expect { data: Booking[] }
        setBookings(res.data as BookingItem[]);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [user]);

  const handleCancel = async (id: string, dateTime: string) => {
    if (new Date(dateTime) <= now) return;
    try {
      await cancelBookingApi(id);
      // Refresh
      const res = await listBookings({ userId: user!.id });
      setBookings(res.data as BookingItem[]);
    } catch (e) {
      console.error(e);
    }
  };

  const setStar = (id: string, value: number) => {
    setSelectedRatings((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmitRating = async (id: string) => {
    const value = selectedRatings[id];
    if (!value) return;
    try {
      setSubmitting((p) => ({ ...p, [id]: true }));
      await rateBooking(id, value);
      // Refresh bookings to get updated rating
      const res = await listBookings({ userId: user!.id });
      setBookings(res.data as BookingItem[]);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting((p) => ({ ...p, [id]: false }));
    }
  };

  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== 'user') {
    const target = user.role === 'admin' ? '/dashboard/admin' : '/dashboard/facility';
    return <Navigate to={target} replace />;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet>
        <title>My Bookings | QuickCourt</title>
        <link rel="canonical" href="/bookings" />
      </Helmet>

      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground">View, filter and manage your court bookings</p>
        </div>
        <div className="flex gap-2">
          {(['all','confirmed','completed','cancelled'] as const).map(k => (
            <Button key={k} variant={filter === k ? 'default' : 'outline'} size="sm" onClick={()=> setFilter(k)}>
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </Button>
          ))}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-sm text-muted-foreground">No bookings found for this filter.</div>
            )}
            {filtered.map((b) => {
              const isFuture = new Date(b.dateTime) > now;
              const canRate = b.status === 'completed';
              const current = typeof b.rating === 'number' ? b.rating : 0;
              const chosen = selectedRatings[b._id] ?? current;
              return (
                <div key={b._id} className="flex flex-col gap-2 rounded-md border border-border/50 p-3 bg-card/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">{b.courtName} ({b.sport})</div>
                      <div className="text-xs text-muted-foreground">{new Date(b.dateTime).toLocaleString()} · {b.durationHours} hr{b.durationHours>1?'s':''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">₹ {b.price.toLocaleString()}</div>
                      <div className={`text-xs ${b.status === 'confirmed' ? 'text-secondary' : b.status === 'completed' ? 'text-info' : b.status === 'cancelled' ? 'text-destructive' : 'text-warning'}`}>{b.status}</div>
                      {b.status === 'confirmed' && isFuture && (
                        <Button size="sm" variant="outline" className="mt-2" onClick={()=> handleCancel(b._id, b.dateTime)}>Cancel</Button>
                      )}
                    </div>
                  </div>
                  {canRate && (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <button
                            key={i}
                            type="button"
                            className={`text-xl ${i <= chosen ? 'text-yellow-400' : 'text-muted-foreground'}`}
                            onClick={() => setStar(b._id, i)}
                            aria-label={`Rate ${i} star${i>1?'s':''}`}
                            disabled={!!b.rating}
                          >
                            {i <= chosen ? '★' : '☆'}
                          </button>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleSubmitRating(b._id)}
                        disabled={!!b.rating || !selectedRatings[b._id] || !!submitting[b._id]}
                      >
                        {b.rating ? 'Rated' : (submitting[b._id] ? 'Submitting...' : 'Submit Rating')}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyBookings;
