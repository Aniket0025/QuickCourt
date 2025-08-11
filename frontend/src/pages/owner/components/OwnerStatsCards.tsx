import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnerMetrics } from "../hooks/useOwnerMetrics";

export function OwnerStatsCards({ venueId }: { venueId?: string }) {
  const { data, isLoading, error, refetch } = useOwnerMetrics(venueId);

  const skeleton = (
    <div className="grid gap-6 md:grid-cols-3">
      {[0,1,2].map(i => (
        <Card key={i}>
          <CardHeader><CardTitle>&nbsp;</CardTitle></CardHeader>
          <CardContent>
            <div className="h-6 bg-muted rounded w-24 mb-2" />
            <div className="h-4 bg-muted rounded w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (isLoading) return skeleton;
  if (error) return (
    <div className="text-sm text-red-500">Failed to load metrics. <button className="underline" onClick={() => refetch()}>Retry</button></div>
  );

  const activeCourts = data?.activeCourts ?? 0;
  const totalBookings = data?.totalBookings ?? 0;
  const monthEarnings = data?.monthEarnings ?? 0;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card>
        <CardHeader><CardTitle>Active Courts</CardTitle></CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{activeCourts}</div>
          <div className="text-xs text-muted-foreground">From this venue</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Total Bookings</CardTitle></CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{totalBookings.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">All time</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Earnings</CardTitle></CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">₹ {monthEarnings.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">This month</div>
        </CardContent>
      </Card>
    </div>
  );
}
