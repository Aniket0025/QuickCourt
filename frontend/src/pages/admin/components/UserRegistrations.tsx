import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useMemo, useState } from "react";
import { useAdminRegistrations } from "../hooks/useAdminRegistrations";
import { Area, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

export function UserRegistrations() {
  const [granularity, setGranularity] = useState<'day' | 'week' | 'month' | 'year'>('day');
  const [limit, setLimit] = useState<number>(30);

  const { data, isLoading, error, refetch } = useAdminRegistrations({ granularity, limit });

  const rows = useMemo(() => {
    const labels = data?.labels || [];
    const counts = data?.counts || [];
    return labels.map((label, i) => ({ label, count: counts[i] || 0 }));
  }, [data]);

  const config = useMemo(() => ({
    users: {
      label: "Registrations",
      // green theme (light/dark)
      theme: { light: "hsl(142.1 76.2% 36.3%)", dark: "hsl(142.1 70% 45%)" },
    },
  }), []);

  // Friendly tick labels based on granularity
  const formatLabel = (label: string) => {
    try {
      if (granularity === 'year') return label;
      if (granularity === 'month') {
        const [y, m] = label.split('-').map(Number);
        return new Date(Date.UTC(y, (m || 1) - 1, 1)).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      }
      // day or week (YYYY-MM-DD)
      const d = new Date(label);
      if (granularity === 'week') return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
      return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
    } catch {
      return label;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>User Registrations</CardTitle>
        <div className="flex items-center gap-2">
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as any)}
            className="h-8 rounded border bg-background px-2 text-sm"
          >
            <option value="day">Daily</option>
            <option value="week">Weekly</option>
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
          <input
            type="number"
            min={granularity === 'year' ? 1 : 7}
            max={granularity === 'day' ? 365 : granularity === 'week' ? 104 : granularity === 'month' ? 60 : 20}
            value={limit}
            onChange={(e) => setLimit(Math.max(1, Number(e.target.value) || 1))}
            className="h-8 w-20 rounded border bg-background px-2 text-sm"
            aria-label="Limit"
            title="Number of points"
          />
          <button onClick={() => refetch()} className="h-8 rounded border px-2 text-sm">Refresh</button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-sm text-red-500 mb-2">Failed to load. <button className="underline" onClick={() => refetch()}>Retry</button></div>
        )}
        <ChartContainer config={config} className="h-72">
          <LineChart data={rows} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickFormatter={formatLabel} minTickGap={12} />
            <YAxis allowDecimals={false} width={36} domain={[0, 'dataMax + 2']} />
            <ChartTooltip content={<ChartTooltipContent nameKey="users" />} />
            <ChartLegend verticalAlign="bottom" content={<ChartLegendContent nameKey="users" />} />
            <defs>
              <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-users)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--color-users)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="count" name="users" stroke="none" fill="url(#usersFill)" />
            <Line type="monotone" dataKey="count" name="users" stroke="var(--color-users)" dot={{ r: 2 }} activeDot={{ r: 4 }} strokeWidth={2} />
          </LineChart>
        </ChartContainer>
        {isLoading && !rows.length && (
          <div className="text-sm text-muted-foreground mt-2">Loading...</div>
        )}
      </CardContent>
    </Card>
  );
}
