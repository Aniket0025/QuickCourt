import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStats7d } from "../hooks/useAdminStats7d";

export function BookingActivity() {
  const { data, isLoading, error, refetch } = useAdminStats7d();

  const max = Math.max(1, ...(data?.bookingsPerDay || [1]));
  const labels = data?.dayLabels || [];
  const values = data?.bookingsPerDay || [];

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
            const heightPct = Math.max(4, Math.round((v / max) * 100));
            const date = new Date(iso);
            const day = date.toLocaleDateString(undefined, { weekday: 'short' });
            return (
              <div key={iso} className="space-y-2">
                <div className="h-28 w-full bg-primary/15 rounded-md relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 right-0 bg-primary" style={{ height: `${heightPct}%` }} />
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
