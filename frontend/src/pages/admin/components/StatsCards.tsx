import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  loading?: boolean;
  metrics: {
    totalUsers: number;
    facilityOwners: number;
    activeCourts: number;
    totalBookings: number;
    totalVenues: number;
  };
};

export function StatsCards({ loading, metrics }: Props) {
  const fmt = (n: number) => n.toLocaleString();
  const dash = '—';
  return (
    <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{loading ? dash : fmt(metrics.totalUsers)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total registered users</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Facility Owners</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{loading ? dash : fmt(metrics.facilityOwners)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total owners</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{loading ? dash : fmt(metrics.totalVenues)}</p>
          <p className="text-xs text-muted-foreground mt-1">Facilities on platform</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Active Courts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{loading ? dash : fmt(metrics.activeCourts)}</p>
          <p className="text-xs text-muted-foreground mt-1">Courts across all venues</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{loading ? dash : fmt(metrics.totalBookings)}</p>
          <p className="text-xs text-muted-foreground mt-1">All-time bookings</p>
        </CardContent>
      </Card>
    </section>
  );
}
