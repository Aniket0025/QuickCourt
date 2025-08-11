import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addCourtSlots, createCourt, getVenue, listMyVenues } from '@/lib/api';
import { toast } from 'sonner';

const CourtManagement = () => {
  const [venues, setVenues] = useState<any[]>([]);
  const [venueId, setVenueId] = useState<string>('');
  const [venueDetail, setVenueDetail] = useState<any | null>(null);

  // form state
  const [name, setName] = useState('');
  const [sport, setSport] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [hours, setHours] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await listMyVenues();
        const list = (res as any)?.data || [];
        if (!mounted) return;
        setVenues(list);
        // preselect from localStorage if exists
        const saved = localStorage.getItem('quickcourt_owner_venue_id');
        if (saved && list.some((v: any) => v._id === saved)) setVenueId(saved);
        // if only one venue, select it by default
        else if (list.length === 1) setVenueId(list[0]._id);
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load your venues');
      }
    })();
    return () => { mounted = false; };
  }, []);

  // load selected venue detail (for courts list)
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!venueId) { setVenueDetail(null); return; }
      try {
        const res = await getVenue(venueId);
        if (!mounted) return;
        setVenueDetail((res as any)?.data || null);
      } catch (e: any) {
        if (mounted) setVenueDetail(null);
      }
    })();
    return () => { mounted = false; };
  }, [venueId]);

  const existingCourts = useMemo(() => Array.isArray(venueDetail?.courts) ? venueDetail.courts : [], [venueDetail]);

  function generateUpcomingSlotsISO(count = 6): string[] {
    const slots: string[] = [];
    const now = new Date();
    const start = new Date(now);
    start.setMinutes(0, 0, 0);
    start.setHours(start.getHours() + 1);
    for (let i = 0; i < count; i++) {
      const d = new Date(start);
      d.setHours(start.getHours() + i);
      slots.push(d.toISOString());
    }
    return slots;
  }

  const handleAddCourt = async () => {
    if (!venueId) return;
    if (!name || !sport || !price || !hours) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      setLoading(true);
      const created = await createCourt(venueId, {
        name,
        sport,
        pricePerHour: Number(price),
        operatingHours: hours,
      });
      const createdCourt = (created as any)?.data || (created as any);
      // seed initial slots to avoid Unavailable status
      const slots = generateUpcomingSlotsISO(8);
      await addCourtSlots(venueId, String(createdCourt._id), slots);
      toast.success('Court added');
      // reset form
      setName(''); setSport(''); setPrice(''); setHours('');
      // refresh venue detail
      const res = await getVenue(venueId);
      setVenueDetail((res as any)?.data || null);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add court');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Court Management</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add New Court</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={venueId} onValueChange={setVenueId}>
              <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select Venue" /></SelectTrigger>
              <SelectContent>
                {venues.map(v => (
                  <SelectItem key={v._id} value={v._id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Court Name" value={name} onChange={e=>setName(e.target.value)} />
            <Select value={sport} onValueChange={setSport}>
              <SelectTrigger className="bg-background/50"><SelectValue placeholder="Sport Type" /></SelectTrigger>
              <SelectContent>
                {['Badminton','Table Tennis','Tennis','Basketball','Football','Squash','Cricket','Hockey','Golf'].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Pricing per hour (₹)" value={price} onChange={e=>setPrice(e.target.value?Number(e.target.value):'')} />
            <Input placeholder="Operating hours (e.g. 06:00-22:00)" value={hours} onChange={e=>setHours(e.target.value)} />
            <Button disabled={!venueId || loading} onClick={handleAddCourt}>{loading ? 'Adding...' : 'Add Court'}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Courts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={venueId} onValueChange={setVenueId}>
              <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select Venue" /></SelectTrigger>
              <SelectContent>
                {venues.map(v => (
                  <SelectItem key={v._id} value={v._id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {existingCourts.length === 0 && (
              <div className="text-sm text-muted-foreground">No courts yet for this venue.</div>
            )}
            {existingCourts.map((c: any) => (
              <div key={c._id} className="flex items-center justify-between border border-border/50 rounded-md p-3">
                <div>
                  <div className="font-medium">{c.name} · {c.sport}</div>
                  <div className="text-xs text-muted-foreground">₹{Number(c.pricePerHour||0)}/hr · {c.operatingHours}</div>
                  <div className="text-xs text-muted-foreground">Slots: {Array.isArray(c.availableSlots)? c.availableSlots.length : 0}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled>Manage Slots</Button>
                  <Button size="sm" variant="destructive" disabled>Delete</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CourtManagement;
