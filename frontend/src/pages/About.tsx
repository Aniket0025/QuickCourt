import { Card, CardContent } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import { Info, Users, Shield, QrCode, Calendar, MapPin, CreditCard, Star, Sparkles } from 'lucide-react';
import placeholderQr from '@/assets/whatsapp-community-qr.svg';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const About = () => {
  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <Helmet>
        <title>About • QuickCourt</title>
      </Helmet>

      <div className="mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center justify-center gap-3">
          <Info className="h-8 w-8 text-primary" />
          About QuickCourt
        </h1>
        <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
          QuickCourt makes it effortless to discover, book, and manage sports courts near you. 
          Whether you are a player or a facility owner, we help you save time and focus on the game.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">Fast Bookings</Badge>
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Secure Payments</Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Nearby Venues</Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="card-gradient hover-lift hover-grow border-border/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Our Mission</h2>
            <p className="text-muted-foreground">
              To connect players with the best local facilities through a fast, transparent, and secure booking experience.
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient hover-lift hover-grow border-border/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Trusted and Secure
            </h2>
            <p className="text-muted-foreground">
              We use modern infrastructure and best practices to keep your data and payments protected.
            </p>
          </CardContent>
        </Card>

        <Card className="card-gradient hover-lift hover-grow border-border/50 md:col-span-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              For Players and Facilities
            </h2>
            <p className="text-muted-foreground">
              Players can search, compare, and book instantly. Facility owners can manage courts, schedules, and bookings with ease.
            </p>
          </CardContent>
        </Card>

        {/* WhatsApp Community QR Section */}
        <Card className="card-gradient hover-lift hover-grow border-border/50 md:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-primary" />
                  Join our WhatsApp Community
                </h2>
                <p className="text-muted-foreground mb-4">
                  Scan the QR code to join our WhatsApp community for updates, pickup games, and support.
                </p>
                {/* Join link button */}
                <a
                  href="https://chat.whatsapp.com/KKDEbq8cLx0FaDo7gT9khh?mode=ac_t"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center mt-2 rounded-md bg-green-600/90 text-white px-4 py-2 text-sm font-medium shadow hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500/40"
                >
                  Join WhatsApp Group
                </a>
              </div>
              <div className="w-full md:w-auto text-center">
                <div className="inline-block rounded-2xl border border-border/60 bg-muted/20 p-3 shadow-lg backdrop-blur-sm">
                  <img
                    src="/whatsapp-community-qr.png"
                    alt="WhatsApp Community QR code"
                    className="mx-auto select-none rounded-xl shadow-sm ring-1 ring-border/40 w-[260px] h-[260px] md:w-[320px] md:h-[320px] object-contain"
                    style={{ imageRendering: 'pixelated' }}
                    loading="eager"
                    draggable={false}
                    onError={(e) => {
                      const img = e.currentTarget as HTMLImageElement;
                      img.onerror = null;
                      img.src = placeholderQr;
                    }}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Scan to join or
                  {' '}
                  <a
                    href="https://chat.whatsapp.com/KKDEbq8cLx0FaDo7gT9khh?mode=ac_t"
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-foreground"
                  >
                    tap here
                  </a>
                </p>
                {/* Place your exact PNG at frontend/public/whatsapp-community-qr.png */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Highlights */}
        <Card className="hover-lift hover-grow border-border/50 md:col-span-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Why players love QuickCourt
            </h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border/60 p-4 bg-muted/30">
                <div className="flex items-center gap-2 font-medium"><Calendar className="h-4 w-4 text-primary"/> Smart scheduling</div>
                <p className="text-sm text-muted-foreground mt-1">Real-time availability and instant confirmation.</p>
              </div>
              <div className="rounded-lg border border-border/60 p-4 bg-muted/30">
                <div className="flex items-center gap-2 font-medium"><MapPin className="h-4 w-4 text-primary"/> Nearby discovery</div>
                <p className="text-sm text-muted-foreground mt-1">Find courts around you with powerful filters.</p>
              </div>
              <div className="rounded-lg border border-border/60 p-4 bg-muted/30">
                <div className="flex items-center gap-2 font-medium"><CreditCard className="h-4 w-4 text-primary"/> Seamless payments</div>
                <p className="text-sm text-muted-foreground mt-1">Pay securely and manage refunds with ease.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="hover-lift hover-grow border-border/50">
          <CardContent className="p-6">
            <h3 className="text-sm uppercase tracking-wide text-muted-foreground">At a glance</h3>
            {(() => {
              const stats: { label: string; value: string }[] = [
                { label: 'Venues', value: '50+' },
                { label: 'Bookings', value: '5k+' },
                { label: 'Avg rating', value: '4.8' },
                { label: 'Cities', value: '—' },
                { label: 'Sports', value: '—' },
                { label: 'Users', value: '—' },
              ];
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-3">
                  {stats.map((s) => (
                    <div key={s.label} className="text-center">
                      <div className="text-2xl font-bold">{s.value}</div>
                      <div className="text-xs text-muted-foreground">{s.label}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Testimonials */}
        <Card className="hover-lift hover-grow border-border/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">What our users say</h2>
            <div className="grid gap-4">
              <div className="rounded-lg border border-border/60 p-4 bg-background/60">
                <p className="text-sm mt-2">“Booking a court now takes under a minute. Love the clean UI!”</p>
                <p className="text-xs text-muted-foreground mt-1">— Aniket, Badminton Player</p>
              </div>
              <div className="rounded-lg border border-border/60 p-4 bg-background/60">
                <p className="text-sm mt-2">“Managing slots and payments is so much easier.”</p>
                <p className="text-xs text-muted-foreground mt-1">— Sunny, Facility Owner</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card className="hover-lift hover-grow border-border/50 md:col-span-2">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Frequently asked questions</h2>
            <Separator className="my-3" />
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Is QuickCourt free to use?</AccordionTrigger>
                <AccordionContent>
                  Yes. Browsing venues is free. You only pay when you make a booking.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>How do refunds work?</AccordionTrigger>
                <AccordionContent>
                  Refunds follow each venue’s policy. You’ll see the policy before checkout.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Do you support team or group bookings?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can book multiple slots and share details with teammates easily.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Call to action banner */}
        <Card className="relative overflow-hidden md:col-span-2 border-primary/30">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold">Ready to book your next game?</h3>
                <p className="text-muted-foreground mt-1">Explore nearby courts and secure your slot in seconds.</p>
              </div>
              <a href="/venues" className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium shadow hover:bg-primary/90">
                Browse Venues
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;

