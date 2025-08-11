import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Star, Search, Filter, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listVenues } from '@/lib/api';
import { toast } from 'sonner';

export const Venues = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [venues, setVenues] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await listVenues();
        const data = (res as any)?.data || [];
        if (!mounted) return;
        setVenues(data);
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load venues');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const sports = ['all', 'badminton', 'tennis', 'basketball', 'squash', 'football', 'table tennis'];

  const priceRanges = [
    { value: 'all', label: 'All Prices' },
    { value: '0-1500', label: '₹0 - ₹1,500' },
    { value: '1500-2000', label: '₹1,500 - ₹2,000' },
    { value: '2000+', label: '₹2,000+' },
  ];

  const mapped = useMemo(() => {
    return venues.map((v) => {
      const courts = Array.isArray(v.courts) ? v.courts : [];
      const price = courts.length ? Math.min(...courts.map((c: any) => c.pricePerHour || 0)) : 0;
      const reviews = Array.isArray(v.reviews) ? v.reviews : [];
      const rating = reviews.length
        ? Number((reviews.reduce((a: number, r: any) => a + (r.rating || 0), 0) / reviews.length).toFixed(1))
        : 4.5;
      const available = courts.some((c: any) => Array.isArray(c.availableSlots) && c.availableSlots.length > 0);
      return {
        id: v._id,
        name: v.name,
        sports: v.sports || [],
        sport: (v.sports && v.sports[0]) || 'Multi-sport',
        price,
        rating,
        location: v.address,
        amenities: v.amenities || [],
        courts: courts.length,
        available,
        photo: (Array.isArray(v.photos) && v.photos[0]) || undefined,
      };
    });
  }, [venues]);

  const filteredVenues = mapped.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = selectedSport === 'all' || venue.sports.map((s: string) => s.toLowerCase()).includes(selectedSport);
    let matchesPrice = true;
    if (priceRange === '0-1500') matchesPrice = venue.price <= 1500;
    else if (priceRange === '1500-2000') matchesPrice = venue.price > 1500 && venue.price <= 2000;
    else if (priceRange === '2000+') matchesPrice = venue.price > 2000;
    return matchesSearch && matchesSport && matchesPrice;
  });

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Find Your Perfect <span className="text-gradient-primary">Sports Venue</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Discover top-rated sports facilities in your area and book instantly
          </p>
        </div>

        {/* Filters */}
        <div className="bg-card/50 rounded-lg p-6 mb-8 border border-border/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search venues or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>

            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Sport Type" />
              </SelectTrigger>
              <SelectContent>
                {sports.map(sport => (
                  <SelectItem key={sport} value={sport}>
                    {sport === 'all' ? 'All Sports' : sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                {priceRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="border-border">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Found {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Venues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVenues.map((venue) => (
            <Card key={venue.id} className="card-gradient hover-lift hover-grow border-border/50 overflow-hidden">
              {loading && (
                <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground">Loading venues...</div>
              )}
              {!loading && filteredVenues.map((venue) => (
                <Card key={venue.id} className="card-gradient hover-lift border-border/50 overflow-hidden">
                  <div className="h-48 bg-muted/50 flex items-center justify-center relative">
                    {venue.photo ? (
                      <img
                        src={venue.photo}
                        alt={venue.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-muted" />
                    )}
                    <div className="absolute inset-0 bg-black/20" />
                    {!venue.available && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="destructive">Fully Booked</Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold text-foreground line-clamp-1">
                        {venue.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-warning fill-current" />
                        <span className="text-sm font-medium">{venue.rating}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{venue.sport}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {venue.courts} court{venue.courts !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span className="text-sm line-clamp-1">{venue.location}</span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {venue.amenities.slice(0, 3).map((amenity, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {venue.amenities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{venue.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-border/50">
                        <div>
                          <span className="text-2xl font-bold text-secondary">
                            ₹{venue.price}
                          </span>
                          <span className="text-sm text-muted-foreground">/hour</span>
                        </div>
                        <Link to={`/venues/${venue.id}`}>
                          <Button
                            className="btn-bounce bg-primary hover:bg-primary/90"
                            disabled={!venue.available}
                          >
                            <Calendar className="h-4 w-4 mr-2" />
                            {venue.available ? 'Book Now' : 'Unavailable'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

        {/* No Results */ }
        {
              filteredVenues.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-muted/50 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Search className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    No venues found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search criteria or browse all venues
                  </p>
                  <Button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSport('all');
                      setPriceRange('all');
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                </div>
              )
            }
      </div>
      </div>
      );
};

      export default Venues;