import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnerStats7d } from "../hooks/useOwnerStats7d";

export function OwnerBookingActivity({ venueId }: { venueId?: string }) {
  const { data, isLoading, error, refetch } = useOwnerStats7d(venueId);

  const labels = data?.dayLabels || [];
  const values = data?.bookingsPerDay || [];
  const max = Math.max(1, ...values, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Activity (7d)</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-red-500 mb-2">Failed to load. <button className="underline" onClick={() => refetch()}>Retry</button></div>
        )}
        <div className="grid grid-cols-7 gap-2 text-center">
          {labels.map((iso, idx) => {
            const v = values[idx] || 0;
            const h = Math.max(4, Math.round((v / max) * 100));
            const day = new Date(iso).toLocaleDateString(undefined, { weekday: 'short' });
            return (
              <div key={iso} className="space-y-2">
                <div className="h-28 w-full bg-primary/15 rounded-md relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 bg-primary" style={{ height: `${h}%` }} />
                </div>
                <div className="text-xs text-muted-foreground">{day}</div>
                <div className="text-xs font-medium">{v.toLocaleString()}</div>
              </div>
            );
          })}
          {isLoading && !labels.length && (
            <div className="col-span-7 text-sm text-muted-foreground">Loading...</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
