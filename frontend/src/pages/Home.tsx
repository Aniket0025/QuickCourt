import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Star, Users, Zap, Shield, Clock } from 'lucide-react';
import heroImage from '@/assets/hero-sports.jpg';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CardHeader, CardTitle } from '@/components/ui/card';

export const Home = () => {
  const popularSports = [
    { name: 'Badminton', icon: '🏸', venues: 24 },
    { name: 'Tennis', icon: '🎾', venues: 18 },
    { name: 'Basketball', icon: '🏀', venues: 12 },
    { name: 'Football', icon: '⚽', venues: 8 },
  ];

  const featuredVenues = [
    {
      id: 1,
      name: 'Ace Sports Complex',
      sport: 'Badminton',
      price: 1200,
      rating: 4.8,
      location: 'Koramangala',
      image: '/api/placeholder/300/200',
    },
    {
      id: 2,
      name: 'Court Champions',
      sport: 'Tennis',
      price: 1800,
      rating: 4.9,
      location: 'Indiranagar',
      image: '/api/placeholder/300/200',
    },
    {
      id: 3,
      name: 'Slam Dunk Arena',
      sport: 'Basketball',
      price: 2000,
      rating: 4.7,
      location: 'Whitefield',
      image: '/api/placeholder/300/200',
    },
  ];

  const features = [
    {
      icon: Zap,
      title: 'Instant Booking',
      description: 'Book courts in seconds with real-time availability',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Safe and encrypted payment processing',
    },
    {
      icon: Clock,
      title: 'Flexible Timing',
      description: 'Choose from morning, evening, or late-night slots',
    },
  ];

  const [comments, setComments] = useState<{ name: string; message: string; createdAt: string; topic?: string }[]>(() => {
    try {
      const raw = localStorage.getItem('quickcourt_home_comments');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [topic, setTopic] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('quickcourt_home_comments', JSON.stringify(comments));
    } catch {}
  }, [comments]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        {/* Base dark overlay with theme-aware opacity */}
        <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
        {/* Gradient + multiply layer to blend photo and UI, adds night realism */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent dark:from-black/80 dark:via-black/60 dark:to-black/10 mix-blend-multiply" />
        
        <div className="relative z-10 text-center space-y-6 px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)]">
            Book Your Perfect{' '}
            <span className="text-gradient-primary">Sports Court</span>
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
            Discover and book local sports facilities instantly. Join matches, 
            meet players, and elevate your game.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/venues">
              <Button size="lg" className="btn-bounce neon-glow bg-primary hover:bg-primary/90 text-lg px-8">
                <Calendar className="mr-2 h-5 w-5" />
                Book Now
              </Button>
            </Link>
            <Link to="/venues">
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 border-white/30 text-white bg-transparent hover:bg-white/10 focus:ring-2 focus:ring-white/40"
              >
                <MapPin className="mr-2 h-5 w-5" />
                Find Venues
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose QuickCourt?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the future of sports booking with our cutting-edge platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-gradient hover-lift hover-grow border-border/50">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Sports */}
      <section className="py-16 px-4 bg-card/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Popular Sports
            </h2>
            <p className="text-muted-foreground text-lg">
              Choose from a variety of sports and find the perfect venue
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {popularSports.map((sport, index) => (
              <Link key={index} to={`/venues?sport=${sport.name.toLowerCase()}`}>
                <Card className="card-gradient hover-lift hover-grow border-border/50 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{sport.icon}</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {sport.name}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {sport.venues} venues
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Venues */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Featured Venues
            </h2>
            <p className="text-muted-foreground text-lg">
              Top-rated sports facilities in your area
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredVenues.map((venue) => (
              <Link key={venue.id} to={`/venues/${venue.id}`}>
                <Card className="card-gradient hover-lift hover-grow border-border/50 overflow-hidden">
                  <div className="h-48 bg-muted/50 flex items-center justify-center">
                    <span className="text-muted-foreground">Venue Image</span>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        {venue.name}
                      </h3>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-warning fill-current" />
                        <span className="text-sm text-muted-foreground">
                          {venue.rating}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="mb-3">
                      {venue.sport}
                    </Badge>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{venue.location}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-secondary">
                          ₹{venue.price}
                        </span>
                        <span className="text-sm text-muted-foreground">/hr</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/venues">
              <Button size="lg" variant="outline" className="btn-bounce">
                View All Venues
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Play?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Join thousands of sports enthusiasts who book their courts with QuickCourt
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="btn-bounce text-lg px-8 bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-white/30">
                <Users className="mr-2 h-5 w-5" />
                Get Started
              </Button>
            </Link>
            <Link to="/venues">
              <Button 
                size="lg"
                className="text-lg px-8 bg-white text-primary hover:bg-gray-100 focus:ring-2 focus:ring-white/40"
              >
                Browse Venues
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Comments Section */}
      <section className="py-16 px-4 bg-card/40">
        <div className="container mx-auto max-w-4xl">
          <Card className="border-border/50">
            <CardHeader className="items-center text-center">
              <CardTitle className="text-center">What our Customers
Say about QuickCourt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form
                className="grid gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const nm = name.trim();
                  const msg = message.trim();
                  const tp = topic.trim();
                  if (!nm || !msg) return;
                  setComments((prev) => [
                    { name: nm, message: msg, createdAt: new Date().toISOString(), ...(tp ? { topic: tp } : {}) },
                    ...prev,
                  ]);
                  setName('');
                  setMessage('');
                  setTopic('');
                }}
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input
                    placeholder="Optional topic (e.g., Badminton courts)"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </div>
                <Textarea
                  placeholder="Share your experience or suggestions..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
                <div className="flex justify-center">
                  <Button type="submit" className="btn-bounce">Post Comment</Button>
                </div>
              </form>

              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No comments yet. Be the first to share your thoughts!</p>
                ) : (
                  comments.map((c, idx) => (
                    <div key={idx} className="p-4 rounded-lg border border-border/50 bg-background/60">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{c.name}</span>
                        <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{c.message}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Home;