import { Helmet } from "react-helmet-async";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const UserDashboard = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== "user") {
    const target = user.role === "admin" ? "/dashboard/admin" : "/dashboard/facility";
    return <Navigate to={target} replace />;
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet>
        <title>User Dashboard | QuickCourt</title>
        <meta name="description" content="Your QuickCourt dashboard with upcoming bookings and recommendations." />
        <link rel="canonical" href="/dashboard/user" />
      </Helmet>

      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground mt-2">See your upcoming bookings and explore venues.</p>
      </header>

      <main className="space-y-6">
        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {[
                  { when: 'Today 6:00 PM', item: 'Ace Sports Complex · Court 2 (Badminton)', location: 'Koramangala', price: 1200, status: 'confirmed' },
                  { when: 'Thu 7:30 PM', item: 'Court Champions · Court A (Tennis)', location: 'Indiranagar', price: 1800, status: 'confirmed' },
                  { when: 'Sat 9:00 AM', item: 'Slam Dunk Arena · Main Court (Basketball)', location: 'Whitefield', price: 2000, status: 'pending' },
                ].map((b, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border border-border/50 p-3 bg-card/50">
                    <div>
                      <div className="font-medium text-foreground">{b.item}</div>
                      <div className="text-xs text-muted-foreground">{b.when} · {b.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">₹ {b.price.toLocaleString()}</div>
                      <div className={`text-xs ${b.status === 'confirmed' ? 'text-secondary' : b.status === 'pending' ? 'text-warning' : 'text-muted-foreground'}`}>{b.status}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="secondary" size="sm">
                  <Link to="/venues">Browse Venues</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Recommended Venues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { name: 'Ace Sports Complex', sport: 'Badminton', rating: 4.8, price: 1200, location: 'Koramangala' },
                  { name: 'Court Champions', sport: 'Tennis', rating: 4.9, price: 1800, location: 'Indiranagar' },
                  { name: 'Slam Dunk Arena', sport: 'Basketball', rating: 4.7, price: 2000, location: 'Whitefield' },
                ].map((v, i) => (
                  <div key={i} className="rounded-md border border-border/50 p-4 bg-card/50 hover:bg-card transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-foreground">{v.name}</div>
                        <div className="text-xs text-muted-foreground">{v.location} · {v.sport}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Rating</div>
                        <div className="text-sm font-medium">{v.rating}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm font-semibold">₹ {v.price.toLocaleString()}/hr</div>
                      <Button asChild size="sm" variant="secondary">
                        <Link to={`/venues?name=${encodeURIComponent(v.name)}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default UserDashboard;
