import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { OwnerStatsCards } from './components/OwnerStatsCards';
import { OwnerBookingActivity } from './components/OwnerBookingActivity';

const FacilityManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';
  const [venueId, setVenueId] = useState<string>('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [about, setAbout] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [sports, setSports] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
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

  // Note: intentionally do not preload any existing venue to keep form blank for new creation

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
      about: about.trim(),
      photos: imageUrl.trim() ? [imageUrl.trim()] : [],
    };
    try {
      const creating = !venueId;
      const token = localStorage.getItem('quickcourt_token');
      const res = await fetch(`${API_URL}/api/venues${creating ? '' : `/${venueId}`}`, {
        method: creating ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
      // Redirect owner to dashboard after saving
      navigate('/dashboard/facility', { replace: true });
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
      {!!venueId && (
        <div className="mb-8 space-y-6">
          <OwnerStatsCards venueId={venueId} />
          <OwnerBookingActivity venueId={venueId} />
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Facility Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Location" value={address} onChange={(e) => setAddress(e.target.value)} />
            <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <Textarea placeholder="About (optional)" value={about} onChange={(e) => setAbout(e.target.value)} />
            <Input placeholder="Image URL (optional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            <div className="flex gap-2 flex-wrap">
              {sports.map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
            <div className="flex gap-2">
              <Button onClick={saveChanges} disabled={!canSave}>Save Changes</Button>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  const input = document.getElementById('venue-photo-input') as HTMLInputElement | null;
                  input?.click();
                }}
              >
                Upload Photo
              </Button>
              <input
                id="venue-photo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  // Limit ~3MB for safety
                  if (file.size > 3 * 1024 * 1024) {
                    toast.error('Please choose an image under 3 MB');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = reader.result as string;
                    setImageUrl(dataUrl);
                    toast.success('Photo added');
                  };
                  reader.onerror = () => toast.error('Failed to read image');
                  reader.readAsDataURL(file);
                  // reset value so selecting same file again triggers change
                  e.currentTarget.value = '';
                }}
              />
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
