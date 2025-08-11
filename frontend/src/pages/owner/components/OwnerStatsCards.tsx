import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnerMetrics } from "../hooks/useOwnerMetrics";

export function OwnerStatsCards({ venueId }: { venueId?: string }) {
  const { data, isLoading, error, refetch } = useOwnerMetrics(venueId);

  const skeleton = (
    <section className="grid gap-6 md:grid-cols-3">
      {[0,1,2].map(i => (
        <Card key={i} className="bg-card/50 border border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">&nbsp;</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-7 bg-muted rounded w-24 mb-2" />
            <div className="h-4 bg-muted rounded w-40" />
          </CardContent>
        </Card>
      ))}
    </section>
  );

  if (isLoading) return skeleton;
  if (error) return (
    <div className="text-sm text-red-500">Failed to load metrics. <button className="underline" onClick={() => refetch()}>Retry</button></div>
  );

  const activeCourts = data?.activeCourts ?? 0;
  const totalBookings = data?.totalBookings ?? 0;
  const monthEarnings = data?.monthEarnings ?? 0;

  return (
    <section className="grid gap-6 md:grid-cols-3">
      <Card className="bg-card/50 border border-border/50 hover:bg-card transition-colors">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Active Courts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{activeCourts}</p>
          <p className="text-xs text-muted-foreground mt-1">From this venue</p>
        </CardContent>
      </Card>
      <Card className="bg-card/50 border border-border/50 hover:bg-card transition-colors">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalBookings.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">All time</p>
        </CardContent>
      </Card>
      <Card className="bg-card/50 border border-border/50 hover:bg-card transition-colors">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">₹ {monthEarnings.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">This month</p>
        </CardContent>
      </Card>
    </section>
  );
}
