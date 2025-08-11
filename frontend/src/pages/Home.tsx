import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Zap, Shield, Star, CheckCircle2, MessageCircle, TrendingUp, Clock, Heart, User, PenSquare, Trash2 } from 'lucide-react';
import SplitText from '@/components/SplitText';
import { Calendar, MapPin, Star, Users, Zap, Shield, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import heroImage from '@/assets/hero-sports.jpg';
import { useEffect, useRef, useState } from 'react';
import { getPopularSports, type PopularSport, getFeaturedVenues, type VenueSummary } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CardHeader, CardTitle } from '@/components/ui/card';

export const Home = () => {
  const [popularSports, setPopularSports] = useState<PopularSport[]>([]);
  const [loadingSports, setLoadingSports] = useState(true);
  const defaultSports: PopularSport[] = [
    { name: 'badminton', venues: 0 },
    { name: 'tennis', venues: 0 },
    { name: 'football', venues: 0 },
    { name: 'cricket', venues: 0 },
    { name: 'golf', venues: 0 },
    { name: 'hockey', venues: 0 },
  ];
  const sportIcon: Record<string, string> = {
    badminton: '🏸',
    tennis: '🎾',
    basketball: '🏀',
    football: '⚽',
    soccer: '⚽',
    cricket: '🏏',
    squash: '🎯',
    tabletennis: '🏓',
    table_tennis: '🏓',
    volleyball: '🏐',
    golf: '⛳',
    hockey: '🏑',
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingSports(true);
        const data = await getPopularSports();
        if (!mounted) return;
        setPopularSports((Array.isArray(data) && data.length > 0) ? data : defaultSports);
      } catch (_e) {
        if (mounted) setPopularSports(defaultSports);
      } finally {
        if (mounted) setLoadingSports(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const [featured, setFeatured] = useState<VenueSummary[]>([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingFeatured(true);
        const data = await getFeaturedVenues(6);
        if (!mounted) return;
        setFeatured(Array.isArray(data) ? data : []);
      } catch (_e) {
        if (mounted) setFeatured([]);
      } finally {
        if (mounted) setLoadingFeatured(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

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

  // Backend API base URL
  const API_BASE = (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') || '';

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
  const commentsRowRef = useRef<HTMLDivElement | null>(null);
  const scrollComments = (dir: 'left' | 'right') => {
    const el = commentsRowRef.current;
    if (!el) return;
    const delta = dir === 'left' ? -400 : 400;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // Persist comments locally for offline quick load
  useEffect(() => {
    try {
      localStorage.setItem('quickcourt_home_comments', JSON.stringify(comments));
    } catch { }
  }, [comments]);

  // Load latest comments from backend
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/comments`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) return; // keep local data if backend not available
        const json = await res.json();
        if (json && Array.isArray(json.data)) {
          setComments(json.data.map((c: any) => ({
            name: c.name,
            message: c.message,
            topic: c.topic || undefined,
            createdAt: c.createdAt || new Date().toISOString(),
          })));
        }
      } catch {
        // ignore network errors, fall back to localStorage
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <div role="heading" aria-level={1} className="leading-tight">
            <SplitText
              text="Book Your Perfect"
              className="block text-4xl md:text-6xl font-bold text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)]"
              delay={60}
              duration={0.5}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.15}
              rootMargin="-80px"
              textAlign="center"
            />
            <div className="text-4xl md:text-6xl font-extrabold leading-tight">
              <SplitText
                text="Sports"
                className="inline-block split-gradient-sports drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)]"
                delay={60}
                duration={0.5}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 40 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.15}
                rootMargin="-80px"
                textAlign="center"
              />
              {' '}
              <SplitText
                text="Court"
                className="inline-block split-gradient-court drop-shadow-[0_3px_10px_rgba(0,0,0,0.6)]"
                delay={60}
                duration={0.5}
                ease="power3.out"
                splitType="chars"
                from={{ opacity: 0, y: 40 }}
                to={{ opacity: 1, y: 0 }}
                threshold={0.15}
                rootMargin="-80px"
                textAlign="center"
              />
            </div>
          </div>
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
            {loadingSports ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-border/50 animate-pulse">
                  <CardContent className="p-6 h-28" />
                </Card>
              ))
            ) : (
              popularSports.map((sport, index) => {
                const key = String(sport.name || '').toLowerCase().replace(/\s+/g, '');
                const icon = sportIcon[key] || '🎯';
                // Link uses the exact sport label to match DB filter
                const query = encodeURIComponent(String(sport.name));
                return (
                  <Link key={index} to={`/venues?sport=${query}`}>
                    <Card className="card-gradient hover-lift border-border/50 cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <div className="text-4xl mb-3">{icon}</div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {sport.name}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {sport.venues} venues
                        </Badge>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            )}
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
            {loadingFeatured ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="border-border/50 animate-pulse overflow-hidden">
                  <div className="h-48 bg-muted/40" />
                  <CardContent className="p-6 h-36" />
                </Card>
              ))
            ) : featured.length === 0 ? (
              <div className="col-span-3 text-center text-muted-foreground">
                No venues yet. Check back soon!
              </div>
            ) : (
              featured.map((venue) => {
                const primaryPhoto = venue.photos && venue.photos[0];
                const sportLabel = Array.isArray(venue.sports) && venue.sports.length > 0 ? venue.sports[0] : 'Multi-sport';
                const locLabel = venue.city || venue.address || '';
                const price = venue.pricePerHour;
                const rating = venue.rating ?? '-';
                return (
                  <Link key={venue._id} to={`/venues/${venue._id}`}>
                    <Card className="card-gradient hover-lift border-border/50 overflow-hidden">
                      <div className="h-48 bg-muted/50 flex items-center justify-center">
                        {primaryPhoto ? (
                          <img src={primaryPhoto} alt={venue.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-muted-foreground">Venue Image</span>
                        )}
                      </div>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {venue.name}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-warning fill-current" />
                            <span className="text-sm text-muted-foreground">
                              {rating}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="mb-3">
                          {sportLabel}
                        </Badge>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="text-sm">{locLabel}</span>
                          </div>
                          <div className="text-right">
                            {typeof price === 'number' ? (
                              <>
                                <span className="text-lg font-bold text-secondary">₹{price}</span>
                                <span className="text-sm text-muted-foreground">/hr</span>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">View pricing</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            )}
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
      <section className="py-3 px-4 bg-card/40">
        <div className="container mx-auto max-w-5xl">
          <Card className="border-border/50">
            <CardHeader className="items-center text-center py-2">
              <CardTitle className="text-center">What our Customers
                Say about QuickCourt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form
                className="grid gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const nm = name.trim();
                  const msg = message.trim();
                  const tp = topic.trim();
                  if (!nm || !msg) return;
                  (async () => {
                    try {
                      const res = await fetch(`${API_BASE}/api/comments`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: nm, message: msg, topic: tp || undefined }),
                      });
                      if (res.ok) {
                        const json = await res.json();
                        const data = json?.data || {};
                        setComments((prev) => [
                          {
                            name: data.name ?? nm,
                            message: data.message ?? msg,
                            topic: data.topic || (tp || undefined),
                            createdAt: data.createdAt ?? new Date().toISOString(),
                          },
                          ...prev,
                        ]);
                      } else {
                        // fallback: optimistic add
                        setComments((prev) => [
                          { name: nm, message: msg, createdAt: new Date().toISOString(), ...(tp ? { topic: tp } : {}) },
                          ...prev,
                        ]);
                      }
                    } catch {
                      // network error fallback
                      setComments((prev) => [
                        { name: nm, message: msg, createdAt: new Date().toISOString(), ...(tp ? { topic: tp } : {}) },
                        ...prev,
                      ]);
                    } finally {
                      setName('');
                      setMessage('');
                      setTopic('');
                    }
                  })();
                }}
              >
                <div className="grid gap-2">
                  <Input className="h-9" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <Textarea
                  placeholder="Share your experience or suggestions..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  className="min-h-[56px]"
                />
                <div className="flex justify-center">
                  <Button type="submit" className="btn-bounce h-9 px-4">Post Comment</Button>
                </div>
              </form>

              <div className="relative mt-1">
                {comments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No comments yet. Be the first to share your thoughts!</p>
                ) : (
                  <>
                    <button
                      type="button"
                      aria-label="Scroll left"
                      onClick={() => scrollComments('left')}
                      className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-background/80 border border-border/50 shadow hover:bg-background"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div
                      ref={commentsRowRef}
                      className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    >
                      <div className="flex gap-3 snap-x snap-mandatory">
                        {comments.map((c, idx) => (
                          <div
                            key={idx}
                            className="snap-start min-w-[280px] md:min-w-[360px] p-3 rounded-lg border border-border/50 bg-background/60"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-foreground">{c.name}</span>
                              <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</span>
                            </div>
                            {c.topic ? (
                              <div className="mb-1 text-xs text-muted-foreground">Topic: {c.topic}</div>
                            ) : null}
                            <p className="text-sm text-foreground whitespace-pre-wrap">{c.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Scroll right"
                      onClick={() => scrollComments('right')}
                      className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 items-center justify-center rounded-full bg-background/80 border border-border/50 shadow hover:bg-background"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
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