import { Card, CardContent } from '@/components/ui/card';
import { Helmet } from 'react-helmet-async';
import { Info, Users, Shield, QrCode } from 'lucide-react';
import placeholderQr from '@/assets/whatsapp-community-qr.svg';

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
      </div>
    </div>
  );
};

export default About;
