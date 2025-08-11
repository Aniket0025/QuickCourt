import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getVenue } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const BookCourt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [venue, setVenue] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [courtId, setCourtId] = useState<string>('');
  const [slot, setSlot] = useState<string>('');
  const [duration, setDuration] = useState<number>(1);

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

  const selectedCourt = useMemo(() => venue?.courts.find((c: any) => c._id === courtId), [venue, courtId]);
  const total = useMemo(() => selectedCourt ? (selectedCourt.pricePerHour || 0) * duration : 0, [selectedCourt, duration]);

  if (!user) return <Navigate to="/auth" replace />;

  if (!loading && !venue) {
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
    // Go to payment simulation with booking details. Actual booking creation happens there.
    navigate('/payment', {
      state: {
        venueId: venue._id,
        courtId: selectedCourt._id,
        dateTime: slot,
        durationHours: duration,
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet>
        <title>Book Court | {venue?.name || 'Venue'}</title>
        <link rel="canonical" href={`/venues/${id}/book`} />
      </Helmet>

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Book a Court at {venue?.name || ''}</h1>
        <p className="text-muted-foreground">{venue?.address || ''}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(venue?.sports || []).map((s: string, i: number) => (
            <Badge key={`${s}-${i}`} variant="secondary">{s}</Badge>
          ))}
        </div>
        {!!(venue?.amenities?.length) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {venue!.amenities.slice(0, 6).map((a: string, i: number) => (
              <Badge key={`${a}-${i}`} variant="outline" className="text-xs">{a}</Badge>
            ))}
            {venue!.amenities.length > 6 && (
              <Badge variant="outline" className="text-xs">+{venue!.amenities.length - 6} more</Badge>
            )}
          </div>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Choose Court</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Court</Label>
                <Select value={courtId} onValueChange={setCourtId} disabled={loading || !venue}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Select a court" />
                  </SelectTrigger>
                  <SelectContent>
                    {(venue?.courts || []).map((c: any) => (
                      <SelectItem key={c._id} value={c._id}>{c.name} · {c.sport} · ₹{Number(c.pricePerHour||0)}/hr</SelectItem>
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
                    {(selectedCourt?.availableSlots || []).map((s: string) => (
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
              <div className="text-sm">Venue: <span className="font-medium">{venue?.name || '-'}</span></div>
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
