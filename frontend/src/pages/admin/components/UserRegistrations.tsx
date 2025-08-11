import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStats7d } from "../hooks/useAdminStats7d";

export function UserRegistrations() {
  const { data, isLoading, error, refetch } = useAdminStats7d();

  const labels = data?.dayLabels || [];
  const values = data?.registrationsPerDay || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Registrations (7d)</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-red-500 mb-2">Failed to load. <button className="underline" onClick={() => refetch()}>Retry</button></div>
        )}
        <ul className="text-sm space-y-2">
          {labels.map((iso, idx) => {
            const v = values[idx] || 0;
            const date = new Date(iso);
            const day = date.toLocaleDateString(undefined, { weekday: 'short' });
            return (
              <li key={iso} className="flex items-center justify-between">
                <span className="text-muted-foreground">{day}</span>
                <span className="px-2 py-0.5 rounded bg-secondary/20 text-secondary-foreground text-xs">
                  {v.toLocaleString()} new users
                </span>
              </li>
            );
          })}
          {isLoading && !labels.length && (
            <li className="text-sm text-muted-foreground">Loading...</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
