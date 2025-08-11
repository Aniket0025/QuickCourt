import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { listMyVenues } from '@/lib/api';
import { toast } from 'sonner';

const TimeSlotManagement = () => {
  const { user } = useAuth();
  const [venues, setVenues] = useState<any[]>([]);
  const [venueId, setVenueId] = useState('');
  const [court, setCourt] = useState('Court 1');
  const [date, setDate] = useState('2025-08-11');
  const [from, setFrom] = useState('18:00');
  const [to, setTo] = useState('20:00');
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== 'facility_owner') return <Navigate to="/" replace />;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await listMyVenues();
        const list = (res as any)?.data || [];
        if (!mounted) return;
        setVenues(list);
        const saved = localStorage.getItem('quickcourt_owner_venue_id');
        if (saved && list.some((v: any) => v._id === saved)) setVenueId(saved);
        else if (list.length === 1) setVenueId(list[0]._id);
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load your venues');
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet><title>Time Slot Management | QuickCourt</title></Helmet>
      <h1 className="text-3xl font-bold mb-6">Time Slot Management</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Set Availability</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2">
              <Label>Venue</Label>
              <Select value={venueId} onValueChange={setVenueId}>
                <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select venue" /></SelectTrigger>
                <SelectContent>
                  {venues.map(v => <SelectItem key={v._id} value={v._id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Court</Label>
              <Select value={court} onValueChange={setCourt} disabled={!venueId}>
                <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select court" /></SelectTrigger>
                <SelectContent>
                  {['Court 1','Court 2','Table 1'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e=> setDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>From</Label>
                <Input type="time" value={from} onChange={e=> setFrom(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>To</Label>
                <Input type="time" value={to} onChange={e=> setTo(e.target.value)} />
              </div>
            </div>
            <Button disabled={!venueId}>Save Availability</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Block Time Slots</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">Use this to block slots for maintenance or events</div>
            <div className="grid gap-2">
              <Label>Venue</Label>
              <Select value={venueId} onValueChange={setVenueId}>
                <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select venue" /></SelectTrigger>
                <SelectContent>
                  {venues.map(v => <SelectItem key={v._id} value={v._id}>{v.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Court</Label>
              <Select value={court} onValueChange={setCourt} disabled={!venueId}>
                <SelectTrigger className="bg-background/50"><SelectValue placeholder="Select court" /></SelectTrigger>
                <SelectContent>
                  {['Court 1','Court 2','Table 1'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button variant="destructive" disabled={!venueId}>Block Selected</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TimeSlotManagement;
