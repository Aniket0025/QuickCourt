import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

const FacilityManagement = () => {
  const { user } = useAuth();
  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
  const [venueId, setVenueId] = useState<string>(() => localStorage.getItem('quickcourt_owner_venue_id') || '');
  const [name, setName] = useState('Ace Sports Complex');
  const [address, setAddress] = useState('Koramangala, Bengaluru');
  const [description, setDescription] = useState('Premium indoor courts with pro-grade flooring and lighting.');
  const [sports, setSports] = useState<string[]>(['Badminton','Table Tennis']);
  const [amenities, setAmenities] = useState<string[]>([
    'Parking',
    'Locker Rooms',
    'Drinking Water',
    'Coaching',
    'Showers',
  ]);
  const [addingAmenity, setAddingAmenity] = useState(false);
  const [newAmenity, setNewAmenity] = useState('');

  const addAmenity = () => {
    const a = newAmenity.trim();
    if (!a) return;
    // avoid duplicates (case-insensitive)
    const exists = amenities.some(x => x.toLowerCase() === a.toLowerCase());
    if (exists) {
      setNewAmenity('');
      return;
    }
    setAmenities(prev => [...prev, a]);
    setNewAmenity('');
  };

  const removeAmenity = (name: string) => {
    setAmenities(prev => prev.filter(x => x.toLowerCase() !== name.toLowerCase()));
  };

  const canSave = useMemo(() => !!name && !!address && !!description, [name, address, description]);

  // Preload from backend if a venue id exists
  useEffect(() => {
    if (!venueId) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/venues/${venueId}`);
        if (!res.ok) return;
        const data = await res.json();
        const v = data?.data;
        if (!v) return;
        if (v.name) setName(v.name);
        if (v.address) setAddress(v.address);
        if (v.description) setDescription(v.description);
        if (Array.isArray(v.sports)) setSports(v.sports);
        if (Array.isArray(v.amenities)) setAmenities(v.amenities);
      } catch {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveChanges = async () => {
    if (!canSave) {
      toast.error('Please fill Name, Location and Description');
      return;
    }
    const payload = {
      name: name.trim(),
      address: address.trim(),
      description: description.trim(),
      sports,
      amenities,
    };
    try {
      const creating = !venueId;
      const res = await fetch(`${API_URL}/api/venues${creating ? '' : `/${venueId}`}`, {
        method: creating ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({} as any));
        toast.error(typeof err?.error === 'string' ? err.error : 'Failed to save venue');
        return;
      }
      const data = await res.json();
      const id = data?.data?._id;
      if (id) {
        setVenueId(id);
        localStorage.setItem('quickcourt_owner_venue_id', id);
      }
      toast.success(creating ? 'Venue created' : 'Venue updated');
    } catch (e) {
      console.error(e);
      toast.error('Failed to save venue');
    }
  };
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== 'facility_owner') return <Navigate to="/" replace />;
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Facility Management</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Facility Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Venue ID (auto after save)" value={venueId} readOnly />
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Location" value={address} onChange={(e) => setAddress(e.target.value)} />
            <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex gap-2 flex-wrap">
              {sports.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
            <div className="flex gap-2">
              <Button onClick={saveChanges} disabled={!canSave}>Save Changes</Button>
              <Button variant="outline">Upload Photos</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">Select amenities offered</div>
            <div className="flex gap-2 flex-wrap">
              {amenities.map(a => (
                <Badge key={a} variant="outline" className="flex items-center gap-1">
                  <span>{a}</span>
                  {addingAmenity && (
                    <button
                      aria-label={`Remove ${a}`}
                      className="ml-1 rounded-full px-1 text-xs hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => removeAmenity(a)}
                    >
                      ×
                    </button>
                  )}
                </Badge>
              ))}
            </div>
            <div className="mt-2 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Button onClick={() => setAddingAmenity(v => !v)}>
                  {addingAmenity ? 'Done' : 'Update Amenities'}
                </Button>
              </div>
              {addingAmenity && (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add new amenity (e.g., Wi-Fi)"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }}
                  />
                  <Button onClick={addAmenity} variant="secondary">Add</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacilityManagement;
