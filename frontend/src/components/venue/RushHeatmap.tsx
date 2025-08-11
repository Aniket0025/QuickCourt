import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { predictPrice, PredictPriceResponse } from '@/lib/api';

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
  data?: PredictPriceResponse;
};

const HOURS = Array.from({ length: 17 }, (_ , i) => i + 6); // 6..22

function fmtDay(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: 'short' });
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

  const days = useMemo(() => {
    const arr: Date[] = [];
    const d0 = new Date();
    d0.setHours(0,0,0,0);
    for (let i = 0; i < 7; i++) {
      const d = new Date(d0);
      d.setDate(d0.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const grid: Cell[][] = [];
      for (const h of HOURS) {
        const rowPromises = days.map(async (d) => {
          const dt = new Date(d);
          dt.setHours(h, 0, 0, 0);
          const iso = dt.toISOString();
          try {
            const data = await predictPrice({
              venueId,
              courtId,
              dateTime: iso,
              basePrice,
              durationHours: 1,
              outdoor: !!outdoor,
            });
            return { iso, hour: h, dayLabel: fmtDay(dt), data } as Cell;
          } catch {
            return { iso, hour: h, dayLabel: fmtDay(dt) } as Cell;
          }
        });
        const row = await Promise.all(rowPromises);
        if (cancelled) return;
        grid.push(row);
      }
      if (!cancelled) setCells(grid);
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [venueId, courtId, basePrice, outdoor, days]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rush Forecast & Suggested Price</CardTitle>
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
                    return (
                      <div
                        key={`${h}-${j}`}
                        title={`Rush: ${(rush*100).toFixed(0)}%\nSuggested: ₹${price}`}
                        className="h-8 rounded-sm border border-border/30"
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
