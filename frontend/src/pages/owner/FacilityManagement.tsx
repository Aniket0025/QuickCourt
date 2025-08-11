import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';

const FacilityManagement = () => {
  const { user } = useAuth();
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
            <Input placeholder="Name" defaultValue="Ace Sports Complex" />
            <Input placeholder="Location" defaultValue="Koramangala, Bengaluru" />
            <Textarea placeholder="Description" defaultValue="Premium indoor courts with pro-grade flooring and lighting." />
            <div className="flex gap-2 flex-wrap">
              {['Badminton','Table Tennis'].map(s => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
            <div className="flex gap-2">
              <Button>Save Changes</Button>
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
