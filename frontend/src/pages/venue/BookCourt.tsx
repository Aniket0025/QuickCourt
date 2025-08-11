import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { findVenue } from '@/lib/data';
import { createBooking, listVenues } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';

const BookCourt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const venue = id ? findVenue(id) : undefined;

  const [courtId, setCourtId] = useState<string>('');
  const [slot, setSlot] = useState<string>('');
  const [duration, setDuration] = useState<number>(1);

  const selectedCourt = useMemo(() => venue?.courts.find(c => c.id === courtId), [venue, courtId]);
  const total = useMemo(() => selectedCourt ? selectedCourt.pricePerHour * duration : 0, [selectedCourt, duration]);

  if (!user) return <Navigate to="/auth" replace />;

  if (!venue) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card><CardContent className="p-6">Venue not found.</CardContent></Card>
      </div>
    );
  }

  const handleConfirm = async () => {
    if (!selectedCourt || !slot) {
      toast.error('Please select court and time slot');
      return;
    }

    try {
      // Simulate payment delay
      await new Promise(r => setTimeout(r, 800));

      // Map UI mock venue to real server venue by name
      const venuesRes = await listVenues();
      const serverVenue = (venuesRes.data as any[]).find(v => v.name === venue.name);
      if (!serverVenue?._id) throw new Error('Server venue not found. Please seed venues or check names.');

      await createBooking({
        userId: user!.id,
        venueId: serverVenue._id,
        courtId: selectedCourt.id,
        dateTime: slot,
        durationHours: duration,
      });

      toast.success('Booking confirmed!');
      navigate('/bookings');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create booking');
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet>
        <title>Book Court | {venue.name}</title>
        <link rel="canonical" href={`/venues/${venue.id}/book`} />
      </Helmet>

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Book a Court at {venue.name}</h1>
        <p className="text-muted-foreground">{venue.address}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Choose Court</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Court</Label>
                <Select value={courtId} onValueChange={setCourtId}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select a court" />
                  </SelectTrigger>
                  <SelectContent>
                    {venue.courts.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} · {c.sport} · ₹{c.pricePerHour}/hr</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Time Slot</Label>
                <Select value={slot} onValueChange={setSlot} disabled={!selectedCourt}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder={selectedCourt ? 'Select a slot' : 'Select a court first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedCourt?.availableSlots || []).map(s => (
                      <SelectItem key={s} value={s}>
                        {new Date(s).toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Duration</Label>
                <Select value={String(duration)} onValueChange={(v)=> setDuration(Number(v))}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3].map(h => (
                      <SelectItem key={h} value={String(h)}>{h} hour{h>1?'s':''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">Venue: <span className="font-medium">{venue.name}</span></div>
              <div className="text-sm">Court: <span className="font-medium">{selectedCourt ? `${selectedCourt.name} · ${selectedCourt.sport}` : '-'}</span></div>
              <div className="text-sm">Time: <span className="font-medium">{slot ? new Date(slot).toLocaleString() : '-'}</span></div>
              <div className="text-sm">Duration: <span className="font-medium">{duration} hour{duration>1?'s':''}</span></div>
              <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                <div className="text-muted-foreground">Total</div>
                <div className="text-xl font-semibold">₹ {total.toLocaleString()}</div>
              </div>
              <Button className="w-full" onClick={handleConfirm} disabled={!selectedCourt || !slot}>Proceed & Confirm</Button>
              <div className="text-xs text-muted-foreground text-center">Payment simulated for demo</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookCourt;
