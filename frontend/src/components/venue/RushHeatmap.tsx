import React, { useEffect, useMemo, useState } from 'react';
import { generateHeatmap } from '@/lib/heatmapSynth';
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

// Map normalized 0..1 to stepped colors
function colorForNormalized(n: number) {
  if (n <= 0.3) return 'rgb(30, 200, 80)'; // green
  if (n <= 0.6) return 'rgb(255, 193, 7)'; // amber
  if (n <= 0.75) return 'rgb(255, 140, 0)'; // orange
  return 'rgb(220, 80, 80)'; // red
}

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const arr = [...values].sort((a, b) => a - b);
  const idx = Math.min(arr.length - 1, Math.max(0, Math.floor((p / 100) * (arr.length - 1))));
  return arr[idx];
}

function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }
function hashSeed(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Smooth per day with a 3-point moving average across adjacent hours
function smoothDay(values: (number | null)[]): (number | null)[] {
  const out: (number | null)[] = values.map((v, i) => {
    const neighbors: number[] = [];
    const push = (val: number | null | undefined) => { if (typeof val === 'number' && !Number.isNaN(val)) neighbors.push(val); };
    push(values[i - 1] ?? null);
    push(values[i] ?? null);
    push(values[i + 1] ?? null);
    if (!neighbors.length) return null;
    return neighbors.reduce((a, b) => a + b, 0) / neighbors.length;
  });
  return out;
}

export function RushHeatmap({ venueId, courtId, basePrice, outdoor }: Props) {
  // Grid is day-major: grid[dayIdx][hourIdx]
  const [cells, setCells] = useState<Cell[][]>([]);
  const [loading, setLoading] = useState(true);
  const [showAffordableOnly, setShowAffordableOnly] = useState(false);
  const [useNormalized, setUseNormalized] = useState(true);
  const demoMode = (import.meta as ImportMeta).env?.VITE_HEATMAP_DEMO === 'true';
  const [demoTime, setDemoTime] = useState(0); // retained for compatibility, but now stepwise
  const demoStep = ((import.meta as ImportMeta).env?.VITE_HEATMAP_DEMO_STEP || 'hour') as 'static' | 'hour' | 'day';
  const demoSeed = useMemo(() => hashSeed(`${venueId}:${courtId}`) || 20250812, [venueId, courtId]);

  const days = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }, []);

  // Build smoothed rush matrix and normalized values (percentile 20-80 scaling)
  const rushMatrix = useMemo(() => {
    // day-major matrix of rush scores or null
    const mat = cells.map(day => day.map(c => (typeof c.data?.rushScore === 'number' ? c.data!.rushScore : null)));
    // smooth per day
    const smoothed = mat.map(dayVals => smoothDay(dayVals));
    // gather all smoothed finite values
    const vals = smoothed.flat().filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    let domain: readonly [number, number];
    if (vals.length < 10) {
      domain = [0.2, 0.8] as const; // sparse -> sensible default
    } else {
      const p20 = percentile(vals, 20);
      const p80 = percentile(vals, 80);
      const spread = p80 - p20;
      if (spread < 0.15) {
        // too narrow -> widen around median
        const mid = percentile(vals, 50);
        const lo = clamp01(mid - 0.2);
        const hi = clamp01(mid + 0.2);
        domain = hi > lo ? [lo, hi] as const : [0, 1] as const;
      } else {
        domain = [p20, p80] as const;
      }
    }
    const normalize = (v: number | null): number | null => (typeof v === 'number') ? clamp01((v - domain[0]) / (domain[1] - domain[0] || 1)) : null;
    const norm = smoothed.map(dayVals => dayVals.map(v => normalize(v)));
    return { smoothed, norm };
  }, [cells]);

  // Aggregates for Deal Pulse using normalized rush
  const aggregates = useMemo(() => {
    const flatCells = cells.flat();
    const todayStr = new Date().toDateString();
    // Build a map iso->normalized
    const normByIso = new Map<string, number | null>();
    cells.forEach((day, dIdx) => day.forEach((c, hIdx) => {
      normByIso.set(c.iso, rushMatrix.norm[dIdx]?.[hIdx] ?? null);
    }));
    const todayCells = flatCells.filter(c => new Date(c.iso).toDateString() === todayStr);
    const affordableToday = todayCells.filter(c => {
      const n = normByIso.get(c.iso);
      return typeof n === 'number' && n < 0.4;
    });
    const lowest = flatCells
      .filter(c => c.data)
      .sort((a, b) => (a.data!.suggestedPrice - b.data!.suggestedPrice))[0];
    const affordableWeek = flatCells.filter(c => {
      const n = normByIso.get(c.iso);
      return typeof n === 'number' && n < 0.4;
    });
    return { affordableWeek: affordableWeek.length, affordableToday: affordableToday.length, lowest };
  }, [cells, rushMatrix]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // DEMO MODE: synthesize a week without hitting API; stepwise updates (static|hour|day)
        if (demoMode) {
          const makeGrid = (tVal: number): Cell[][] => {
            // generator returns [rows x cols], choose rows=days, cols=hours to match day-major grid
            const mat = generateHeatmap(days.length, HOURS.length, { t: tVal, seed: demoSeed, percentile: [10, 90], smooth: 0.12, noise: 0.18, ramp: 0.25 });
            return days.map((d, dIdx) => (
              HOURS.map((h, hIdx) => {
                const dt = new Date(d);
                dt.setHours(h,0,0,0);
                const rush = clamp01(mat[dIdx]?.[hIdx] ?? 0);
                const suggested = Math.max(50, Math.round(basePrice * (0.8 + 0.7 * rush)));
                return { iso: dt.toISOString(), hour: h, dayLabel: fmtDay(dt), data: { suggestedPrice: suggested, rushScore: rush } } as Cell;
              })
            ));
          };
          // Determine step key based on current time and mode
          const now = new Date();
          const stepKey = (() => {
            if (demoStep === 'static') return 0;
            if (demoStep === 'day') return Math.floor(now.getTime() / (24 * 3600 * 1000));
            return Math.floor(now.getTime() / (3600 * 1000)); // hour
          })();
          if (!cancelled) setCells(makeGrid(stepKey));
          if (!cancelled) setLoading(false);
          // Schedule stepwise updates as per mode
          if (demoStep === 'static') {
            return; // no timer
          }
          const intervalMs = demoStep === 'day' ? 60 * 1000 : 60 * 1000; // check every minute
          let lastKey = stepKey;
          const id = setInterval(() => {
            const now2 = new Date();
            const key = demoStep === 'day'
              ? Math.floor(now2.getTime() / (24 * 3600 * 1000))
              : Math.floor(now2.getTime() / (3600 * 1000));
            if (key !== lastKey) {
              lastKey = key;
              setCells(makeGrid(key));
            }
          }, intervalMs);
          return () => { clearInterval(id); };
        }
        // Build all items and fetch in one batch
        const items = days.flatMap((d) => HOURS.map((h) => {
          const dt = new Date(d);
          dt.setHours(h, 0, 0, 0);
          return { dateTime: dt.toISOString(), basePrice, durationHours: 1 };
        }));
        const res = await predictPriceBatch({ venueId, courtId, items, benchmarkPrice: basePrice, outdoor });
        // Helper: synthetic diurnal rush curve with light noise
        const synthRush = (dt: Date) => {
          const hour = dt.getHours();
          // base diurnal: low morning, peak evening (~19:00)
          const peak = 19;
          const dist = Math.abs(hour - peak);
          // gentler amplitude and baseline to avoid orange wall
          const base = 0.55 * Math.exp(-(dist * dist) / 16) + 0.12; // ~0.12..~0.67
          const weekendBoost = [0,6].includes(dt.getDay()) ? 0.06 : 0.0; // weekends slightly busier
          const noise = (Math.sin(dt.getTime() / 3.6e6) * 0.02);
          return clamp01(base + weekendBoost + noise);
        };

        // Index response by ISO and validate values
        const byIso = new Map((res.items || []).map(it => {
          const rs = clamp01(typeof it.rushScore === 'number' ? it.rushScore : NaN);
          const sp = (typeof it.suggestedPrice === 'number' && Number.isFinite(it.suggestedPrice)) ? it.suggestedPrice : basePrice;
          return [it.dateTime, { ...it, rushScore: rs, suggestedPrice: sp }] as const;
        }));
        // Build day-major grid: grid[dayIdx][hourIdx]
        // Build grid; synthesize missing/invalid cells
        let missingCount = 0;
        const grid: Cell[][] = days.map((d) => {
          return HOURS.map((h) => {
            const dt = new Date(d);
            dt.setHours(h, 0, 0, 0);
            const iso = dt.toISOString();
            const data = byIso.get(iso);
            let cellData: Cell['data'] | undefined;
            if (data && typeof data.rushScore === 'number' && Number.isFinite(data.rushScore)) {
              cellData = { suggestedPrice: data.suggestedPrice, rushScore: clamp01(data.rushScore) };
            } else {
              missingCount++;
              const synthetic = synthRush(dt);
              cellData = { suggestedPrice: basePrice, rushScore: synthetic };
            }
            return { iso, hour: h, dayLabel: fmtDay(dt), data: cellData };
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
  }, [venueId, courtId, basePrice, outdoor, days, demoMode, demoStep, demoSeed]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Rush Forecast & Suggested Price</CardTitle>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="h-3 w-3"
                checked={useNormalized}
                onChange={(e) => setUseNormalized(e.target.checked)}
              />
              Normalize scale
            </label>
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
        </div>
        {demoMode && (
          <div className="mt-1 text-[10px] text-muted-foreground">Demo data</div>
        )}
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
              {HOURS.map((h, hIdx) => (
                <React.Fragment key={`row-${h}`}>
                  <div className="text-right pr-2 text-xs text-muted-foreground">{h}:00</div>
                  {days.map((_, dIdx) => {
                    const cell = cells[dIdx]?.[hIdx];
                    const price = cell?.data?.suggestedPrice ?? basePrice;
                    const norm = rushMatrix.norm[dIdx]?.[hIdx] ?? null;
                    const rawSmoothed = rushMatrix.smoothed[dIdx]?.[hIdx] ?? null;
                    const paintVal = useNormalized ? norm : (typeof rawSmoothed === 'number' ? clamp01(rawSmoothed) : null);
                    const isAffordable = typeof paintVal === 'number' && paintVal < 0.4;
                    if (showAffordableOnly && !isAffordable) {
                      return <div key={`${h}-${dIdx}`} className="h-8 rounded-sm border border-border/30 opacity-20" />;
                    }
                    if (paintVal === null) {
                      return (
                        <div
                          key={`${h}-${dIdx}`}
                          title={`No data`}
                          className="h-8 rounded-sm border border-dashed border-border/40 bg-muted/40"
                          style={{ opacity: 0.8 }}
                        />
                      );
                    }
                    return (
                      <div
                        key={`${h}-${dIdx}`}
                        title={`Rush: ${Math.round(((cell?.data?.rushScore ?? 0) * 100))}%\nSuggested: ₹${price}`}
                        className={`h-8 rounded-sm border border-border/30 ${isAffordable ? 'ring-1 ring-emerald-400/50' : ''}`}
                        style={{ background: colorForNormalized(paintVal), opacity: 0.9 }}
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
            <div className="h-2 w-32 rounded" style={{
              background: 'linear-gradient(90deg, rgb(30,200,80) 0%, rgb(255,193,7) 45%, rgb(255,140,0) 70%, rgb(220,80,80) 100%)'
            }} />
            <span>High</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
