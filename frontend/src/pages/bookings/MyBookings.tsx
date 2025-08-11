import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { cancelBookingApi, listBookings } from '@/lib/api';

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
  };
  const [bookings, setBookings] = useState<BookingItem[]>([]);
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

  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== 'user') {
    const target = user.role === 'admin' ? '/dashboard/admin' : '/dashboard/facility';
    return <Navigate to={target} replace />;
  }

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
              return (
                <div key={b._id} className="flex items-center justify-between rounded-md border border-border/50 p-3 bg-card/50">
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
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyBookings;
