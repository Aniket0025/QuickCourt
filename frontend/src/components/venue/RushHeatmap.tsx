import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { predictPriceBatch } from '@/lib/api';

type Props = {
  venueId: string;
  courtId: string;
  basePrice: number;
  outdoor?: boolean;
};

type Cell = {
  iso: string;
  hour: number;
  dayLabel: string;
  data?: { suggestedPrice: number; rushScore: number };
};

const HOURS = Array.from({ length: 17 }, (_ , i) => i + 6); // 6..22

function fmtDay(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function colorForRush(r: number) {
  // 0..1 -> green to red
  const g = Math.round(200 * (1 - r));
  const rC = Math.round(220 * r + 30);
  return `rgb(${rC}, ${g}, 80)`;
}

export function RushHeatmap({ venueId, courtId, basePrice, outdoor }: Props) {
  const [cells, setCells] = useState<Cell[][]>([]);
  const [loading, setLoading] = useState(true);
  const [showAffordableOnly, setShowAffordableOnly] = useState(false);

  const days = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, []);

  // Aggregates for Deal Pulse
  const aggregates = useMemo(() => {
    const flat = cells.flat();
    const today = new Date().toDateString();
    const todayCells = flat.filter(c => new Date(c.iso).toDateString() === today);
    const affordableToday = todayCells.filter(c => (c.data?.rushScore ?? 1) < 0.4);
    const lowest = flat
      .filter(c => c.data)
      .sort((a, b) => (a.data!.suggestedPrice - b.data!.suggestedPrice))[0];
    return {
      affordableWeek: flat.filter(c => (c.data?.rushScore ?? 1) < 0.4).length,
      affordableToday: affordableToday.length,
      lowest
    };
  }, [cells]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Build all items and fetch in one batch
        const items = days.flatMap((d) => HOURS.map((h) => {
          const dt = new Date(d);
          dt.setHours(h, 0, 0, 0);
          return { dateTime: dt.toISOString(), basePrice, durationHours: 1 };
        }));
        const res = await predictPriceBatch({ venueId, courtId, items, benchmarkPrice: basePrice, outdoor });
        const byIso = new Map(res.items.map(it => [it.dateTime, it] as const));
        const grid: Cell[][] = days.map((d) => {
          return HOURS.map((h) => {
            const dt = new Date(d);
            dt.setHours(h, 0, 0, 0);
            const iso = dt.toISOString();
            const data = byIso.get(iso);
            return { iso, hour: h, dayLabel: fmtDay(dt), data: data ? { suggestedPrice: data.suggestedPrice, rushScore: data.rushScore } : undefined };
          });
        });
        if (!cancelled) setCells(grid);
        if (!cancelled) setLoading(false);
      } catch (e) {
        console.error(e);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [venueId, courtId, basePrice, outdoor, days]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Rush Forecast & Suggested Price</CardTitle>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input
              type="checkbox"
              className="h-3 w-3"
              checked={showAffordableOnly}
              onChange={(e) => setShowAffordableOnly(e.target.checked)}
            />
            Smart Saver ({aggregates.affordableWeek} this week)
          </label>
        </div>
        {/* Deal Pulse strip */}
        {!loading && (
          <div className="mt-2 text-xs text-muted-foreground animate-pulse">
            {aggregates.affordableToday} Affordable Hours today
            {aggregates.lowest?.data && (
              <>
                {` • Lowest: ₹${aggregates.lowest.data.suggestedPrice} at `}
                {new Date(aggregates.lowest.iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground mb-3">
          Next 7 days, hours 6:00–22:00. Hover cells for details.
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid" style={{ gridTemplateColumns: `80px repeat(${days.length}, 1fr)` }}>
              <div></div>
              {days.map((d, idx) => (
                <div key={idx} className="text-center text-xs font-medium pb-1">{fmtDay(d)}</div>
              ))}
              {HOURS.map((h) => (
                <React.Fragment key={`row-${h}`}>
                  <div className="text-right pr-2 text-xs text-muted-foreground">{h}:00</div>
                  {cells[h-6]?.map((cell, j) => {
                    const rush = cell.data?.rushScore ?? 0;
                    const price = cell.data?.suggestedPrice ?? basePrice;
                    const affordable = rush < 0.4;
                    if (showAffordableOnly && !affordable) {
                      return (
                        <div key={`${h}-${j}`} className="h-8 rounded-sm border border-border/30 opacity-20" />
                      );
                    }
                    return (
                      <div
                        key={`${h}-${j}`}
                        title={`Rush: ${(rush*100).toFixed(0)}%\nSuggested: ₹${price}`}
                        className={`h-8 rounded-sm border border-border/30 ${affordable ? 'ring-1 ring-emerald-400/50' : ''}`}
                        style={{ background: colorForRush(rush), opacity: 0.9 }}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
        {loading && <div className="text-xs text-muted-foreground mt-2">Loading predictions…</div>}
        {!loading && (
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <span>Low</span>
            <div className="h-2 w-24 rounded" style={{
              background: 'linear-gradient(90deg, rgb(30,200,80) 0%, rgb(220,80,80) 100%)'
            }} />
            <span>High</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
