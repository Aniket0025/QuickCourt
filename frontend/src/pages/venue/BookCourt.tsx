import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD (local)
  const [slot, setSlot] = useState<string>(''); // ISO string
  const [duration, setDuration] = useState<number>(1);
  // Custom time (AM/PM) inputs
  const [hour12, setHour12] = useState<string>('6');
  const [minute, setMinute] = useState<string>('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [customError, setCustomError] = useState<string>('');

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

  const todayLocalDate = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Helper: parse operating hours like "06:00-22:00"
  const parseOperatingHours = (s?: string) => {
    const def = { startHour: 6, endHour: 22 };
    if (!s || typeof s !== 'string') return def;
    const m = s.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
    if (!m) return def;
    const sh = Math.min(23, Math.max(0, Number(m[1])));
    const sm = Math.min(59, Math.max(0, Number(m[2])));
    const eh = Math.min(23, Math.max(0, Number(m[3])));
    const em = Math.min(59, Math.max(0, Number(m[4])));
    return { startHour: sh, startMinute: sm, endHour: eh, endMinute: em } as any;
  };

  // Generate fallback hourly slots for selected date within operating hours
  const generateDaySlots = (dateStr: string, intervalMin = 60): string[] => {
    if (!dateStr) return [];
    const { startHour = 6, startMinute = 0, endHour = 22, endMinute = 0 } = parseOperatingHours(selectedCourt?.operatingHours) as any;
    const day = new Date(dateStr + 'T00:00:00');
    const slots: string[] = [];
    const start = new Date(day);
    start.setHours(startHour, startMinute || 0, 0, 0);
    const end = new Date(day);
    end.setHours(endHour, endMinute || 0, 0, 0);
    const now = new Date();
    for (let t = start.getTime(); t <= end.getTime(); t += intervalMin * 60 * 1000) {
      const dt = new Date(t);
      // Only future times; also ensure the session fits within window given duration
      const endDt = new Date(t + duration * 60 * 60 * 1000);
      if (dt.getTime() >= now.getTime() && endDt.getTime() <= end.getTime()) {
        slots.push(new Date(t).toISOString());
      }
    }
    return slots;
  };

  // Filter slots by selected date and ensure only future times are selectable. If none present, fallback-generate.
  const filteredSlots = useMemo(() => {
    const now = new Date();
    const forDate = selectedDate;
    if (!forDate) return [];
    const seeded: string[] = (selectedCourt?.availableSlots || []).filter((s: string) => {
      const dt = new Date(s);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      const sameDay = `${y}-${m}-${d}` === forDate;
      if (!sameDay) return false;
      // Only future and fits within duration (guarded by backend as well)
      const endDt = new Date(dt.getTime() + duration * 60 * 60 * 1000);
      return dt.getTime() >= now.getTime() && (!selectedCourt?.operatingHours || endDt.getHours() <= 23);
    });

    const fallback = generateDaySlots(forDate);
    // Union, then sort ascending
    const set = new Set<string>([...seeded, ...fallback]);
    return Array.from(set).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  }, [selectedCourt, selectedDate, duration]);
  const total = useMemo(() => selectedCourt ? (selectedCourt.pricePerHour || 0) * duration : 0, [selectedCourt, duration]);

  // Build a custom slot from hour/minute/AM-PM for selected date when those change
  useEffect(() => {
    // Only attempt if court and date chosen
    if (!selectedCourt || !selectedDate) return;
    setCustomError('');
    const h12 = Number(hour12);
    const mm = Number(minute);
    if (Number.isNaN(h12) || h12 < 1 || h12 > 12) return;
    if (Number.isNaN(mm) || mm < 0 || mm > 59) return;

    // Convert to 24h
    let h24 = h12 % 12;
    if (period === 'PM') h24 += 12;
    const base = new Date(`${selectedDate}T00:00:00`);
    const candidate = new Date(base);
    candidate.setHours(h24, mm, 0, 0);

    // Validate future and within operating hours window
    const { startHour = 6, startMinute = 0, endHour = 22, endMinute = 0 } = parseOperatingHours(selectedCourt?.operatingHours) as any;
    const winStart = new Date(base); winStart.setHours(startHour, (startMinute as number) || 0, 0, 0);
    const winEnd = new Date(base); winEnd.setHours(endHour, (endMinute as number) || 0, 0, 0);
    const now = new Date();
    const candidateEnd = new Date(candidate.getTime() + duration * 60 * 60 * 1000);

    if (candidate.getTime() < now.getTime()) {
      setCustomError('Time must be in the future');
      return;
    }
    if (candidate < winStart || candidateEnd > winEnd) {
      setCustomError('Time must be within operating hours');
      return;
    }
    // Set as selected slot
    setSlot(candidate.toISOString());
  }, [selectedCourt, selectedDate, hour12, minute, period, duration]);

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
                <Label>Date</Label>
                <Input
                  type="date"
                  className="bg-background/50"
                  value={selectedDate}
                  onChange={(e) => { setSelectedDate(e.target.value); setSlot(''); }}
                  disabled={!selectedCourt}
                  min={todayLocalDate}
                />
              </div>

              <div className="grid gap-2">
                <Label>Custom Time (AM/PM)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Select value={hour12} onValueChange={setHour12} disabled={!selectedCourt || !selectedDate}>
                    <SelectTrigger className="bg-background/50"><SelectValue placeholder="Hour" /></SelectTrigger>
                    <SelectContent>
                      {[...Array(12)].map((_, i) => {
                        const v = String(i + 1);
                        return <SelectItem key={v} value={v}>{v}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                  <Select value={minute} onValueChange={setMinute} disabled={!selectedCourt || !selectedDate}>
                    <SelectTrigger className="bg-background/50"><SelectValue placeholder="Min" /></SelectTrigger>
                    <SelectContent>
                      {['00','15','30','45'].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={period} onValueChange={(v)=> setPeriod(v as 'AM'|'PM')} disabled={!selectedCourt || !selectedDate}>
                    <SelectTrigger className="bg-background/50"><SelectValue placeholder="AM/PM" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!!customError && <div className="text-xs text-red-500">{customError}</div>}
                <div className="text-xs text-muted-foreground">You can also pick from the generated slots below.</div>
              </div>

              <div className="grid gap-2">
                <Label>Time Slot</Label>
                <Select value={slot} onValueChange={setSlot} disabled={!selectedCourt || !selectedDate || filteredSlots.length === 0}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder={!selectedCourt ? 'Select a court first' : (!selectedDate ? 'Select a date' : (filteredSlots.length ? 'Select a slot' : 'No slots available'))} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSlots.map((s: string) => (
                      <SelectItem key={s} value={s}>
                        {new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(h => (
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
