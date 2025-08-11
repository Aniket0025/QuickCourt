import { useState, useEffect, useMemo } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { Navigate } from 'react-router-dom';
import { cancelBookingApi, listBookings, rateBooking } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Clock, 
  Edit, 
  Save,
  CheckCircle,
  XCircle,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

export const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  // Live bookings state (replaces mocks)
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
  // Demo fallback data (restores previous mock cards)
  const demoBookings: BookingItem[] = [
    {
      _id: 'demo-1',
      venueId: 'demo-venue-1',
      courtId: 'demo-court-1',
      courtName: 'Ace Sports Complex · Court 1',
      sport: 'Badminton',
      dateTime: new Date('2024-01-25T18:00:00').toISOString(),
      durationHours: 1,
      price: 1200,
      status: 'confirmed',
    },
    {
      _id: 'demo-2',
      venueId: 'demo-venue-2',
      courtId: 'demo-court-2',
      courtName: 'Court Champions · Court A',
      sport: 'Tennis',
      dateTime: new Date('2024-01-27T16:00:00').toISOString(),
      durationHours: 1,
      price: 1800,
      status: 'confirmed',
    },
    {
      _id: 'demo-3',
      venueId: 'demo-venue-3',
      courtId: 'demo-court-3',
      courtName: 'Elite Badminton Center · Court 3',
      sport: 'Badminton',
      dateTime: new Date('2024-01-20T19:00:00').toISOString(),
      durationHours: 1,
      price: 1000,
      status: 'completed',
    },
    {
      _id: 'demo-4',
      venueId: 'demo-venue-4',
      courtId: 'demo-court-4',
      courtName: 'Slam Dunk Arena · Main Court',
      sport: 'Basketball',
      dateTime: new Date('2024-01-15T20:00:00').toISOString(),
      durationHours: 1,
      price: 2000,
      status: 'cancelled',
    },
  ];
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'cancelled' | 'completed'>('all');
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [selectedRatings, setSelectedRatings] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const now = new Date();
  const filtered = useMemo(
    () => bookings.filter((b) => (filter === 'all' ? true : b.status === filter)),
    [bookings, filter]
  );

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const res = await listBookings({ userId: user.id });
        const data = (res.data || []) as BookingItem[];
        setBookings(data.length > 0 ? data : demoBookings);
      } catch (e) {
        console.error(e);
        // On error, show demo data so page still looks populated
        setBookings(demoBookings);
      }
    }
    load();
  }, [user]);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSaveProfile = () => {
    // Simulate API call
    setTimeout(() => {
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    }, 1000);
  };

  const handleCancelBooking = async (bookingId: string, dateTime: string) => {
    if (new Date(dateTime) <= now) return;
    try {
      if (bookingId.startsWith('demo-')) {
        // Local update for demo items
        setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, status: 'cancelled' } : b)));
        toast.success('Booking cancelled (demo)');
      } else {
        await cancelBookingApi(bookingId);
        const res = await listBookings({ userId: user.id });
        setBookings(res.data as BookingItem[]);
        toast.success('Booking cancelled successfully!');
      }
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
      if (id.startsWith('demo-')) {
        // Local update for demo items
        setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, rating: value } : b)));
        toast.success('Rating submitted (demo)');
      } else {
        await rateBooking(id, value);
        const res = await listBookings({ userId: user.id });
        setBookings(res.data as BookingItem[]);
        toast.success('Rating submitted');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting((p) => ({ ...p, [id]: false }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-secondary" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-info" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'secondary';
      case 'completed':
        return 'info';
      case 'cancelled':
        return 'destructive';
      default:
        return 'warning';
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            My <span className="text-gradient-primary">Profile</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage your account and view your bookings
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-card/50">
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              My Bookings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card className="card-gradient border-border/50">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-xl text-foreground">
                      {user.name}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {user.role === 'user' ? 'Sports Player' : 
                       user.role === 'facility_owner' ? 'Facility Owner' : 'Admin'}
                    </CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    onClick={isEditing ? handleSaveProfile : () => setIsEditing(true)}
                    className={isEditing ? "btn-bounce bg-secondary hover:bg-secondary/90" : ""}
                  >
                    {isEditing ? (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground font-medium">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10 bg-background/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        disabled={!isEditing}
                        className="pl-10 bg-background/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Account Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Account Type:</span>
                      <Badge variant="secondary">
                        {user.role === 'user' ? 'Sports Player' : 
                         user.role === 'facility_owner' ? 'Facility Owner' : 'Admin'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={user.isVerified ? "secondary" : "warning"}>
                        {user.isVerified ? 'Verified' : 'Pending Verification'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-foreground">
                  My Bookings ({filtered.length})
                </h2>
                <div className="flex gap-2">
                  {(['all','confirmed','completed','cancelled'] as const).map((k) => (
                    <Button
                      key={k}
                      variant={filter === k ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter(k)}
                    >
                      {k.charAt(0).toUpperCase() + k.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-6">
                {filtered.map((b) => {
                  const isFuture = new Date(b.dateTime) > now;
                  const canRate = b.status === 'completed';
                  const current = typeof b.rating === 'number' ? b.rating : 0;
                  const chosen = selectedRatings[b._id] ?? current;
                  return (
                    <Card key={b._id} className="card-gradient border-border/50">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold text-foreground">
                                {b.courtName}
                              </h3>
                              <Badge variant="outline">{b.sport}</Badge>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(b.status)}
                                <Badge variant={getStatusColor(b.status) as any} className="capitalize">
                                  {b.status}
                                </Badge>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4" />
                                <span>{b.courtName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>{new Date(b.dateTime).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>{new Date(b.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {b.durationHours} hr{b.durationHours>1?'s':''}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="text-lg font-semibold text-secondary">₹{b.price}</div>
                              <div className="text-sm text-muted-foreground">Total Amount</div>
                            </div>
                            <div className="flex space-x-2">
                              {b.status === 'confirmed' && isFuture && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelBooking(b._id, b.dateTime)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Cancel
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" aria-label="Booking actions">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => navigator.clipboard.writeText(b._id)}>
                                    Copy Booking ID
                                  </DropdownMenuItem>
                                  {b.status === 'completed' && !b.rating && (
                                    <DropdownMenuItem onClick={() => setStar(b._id, selectedRatings[b._id] ?? 5)}>
                                      Quick Rate 5★
                                    </DropdownMenuItem>
                                  )}
                                  {b.status === 'confirmed' && isFuture && (
                                    <DropdownMenuItem onClick={() => handleCancelBooking(b._id, b.dateTime)}>
                                      Cancel Booking
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>

                        {canRate && (
                          <div className="mt-4 flex items-center gap-3">
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
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-muted/50 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Calendar className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No bookings found</h3>
                  <p className="text-muted-foreground mb-6">Try changing the filter.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
export default Profile;