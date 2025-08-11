import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { predictPrice } from '@/lib/api';

type Props = {
  venueId: string;
  courtId: string;
  basePrice: number;
  outdoor?: boolean;
};

export function RevenueLab({ venueId, courtId, basePrice, outdoor }: Props) {
  const [price, setPrice] = useState(basePrice);
  const [suggested, setSuggested] = useState<number | null>(null);
  const [rush, setRush] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const targetDate = useMemo(() => {
    const dt = new Date();
    // pick a representative busy time: next 19:00
    if (dt.getHours() >= 19) dt.setDate(dt.getDate() + 1);
    dt.setHours(19, 0, 0, 0);
    return dt.toISOString();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await predictPrice({
          venueId,
          courtId,
          dateTime: targetDate,
          basePrice: price,
          benchmarkPrice: basePrice, // price elasticity baseline
          durationHours: 1,
          outdoor: !!outdoor,
        });
        if (cancelled) return;
        setSuggested(res.suggestedPrice);
        setRush(res.rushScore);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);
    return () => { cancelled = true; clearTimeout(t); };
  }, [venueId, courtId, targetDate, price, outdoor, basePrice]);

  const utilization = rush != null ? Math.round(rush * 100) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Lab</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="text-muted-foreground">Experiment with base price to see suggested price and projected utilization for a typical peak hour.</div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span>Base Price</span>
            <span className="font-medium">₹{price}</span>
          </div>
          <Slider
            value={[price]}
            min={Math.max(100, Math.round(basePrice * 0.5))}
            max={Math.round(basePrice * 1.5)}
            step={10}
            onValueChange={(v) => setPrice(v[0])}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-border/50 p-3">
            <div className="text-xs text-muted-foreground">Suggested Price</div>
            <div className="text-lg font-semibold">{loading ? '...' : `₹${suggested ?? price}`}</div>
          </div>
          <div className="rounded-md border border-border/50 p-3">
            <div className="text-xs text-muted-foreground">Projected Utilization</div>
            <div className="text-lg font-semibold">{loading || utilization == null ? '...' : `${utilization}%`}</div>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">Assumes upcoming evening slot; actual values vary by day/time.</div>
      </CardContent>
    </Card>
  );
}
