import { Router } from 'express';

const router = Router();

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function hashString(s: string) {
  let h = 2166136261 >>> 0; // FNV-like simple hash
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 2 ** 32; // 0..1
}

function hourCurve(hour: number) {
  // 0..23: low early morning, peak 18-21
  const peaks = [18, 19, 20, 21];
  const base = 0.15 + (hour >= 17 && hour <= 22 ? 0.45 : hour >= 7 && hour <= 9 ? 0.25 : 0);
  const proximity = Math.min(
    ...peaks.map((p) => Math.abs(hour - p))
  );
  const bump = Math.max(0, 0.35 - 0.08 * proximity);
  return clamp01(base + bump);
}

function dowCurve(dow: number) {
  // 0=Sun..6=Sat; weekends higher
  if (dow === 0 || dow === 6) return 0.35;
  if (dow === 5) return 0.25; // Friday
  return 0.1; // weekdays base
}

router.post('/predict-rush', (req, res) => {
  try {
    const { venueId, courtId, dateTime, durationHours = 1, outdoor = false } = req.body || {};
    const dt = dateTime ? new Date(dateTime) : new Date();
    const hour = dt.getHours();
    const dow = dt.getDay();

    const venueBias = hashString(String(venueId || 'v')) * 0.2; // 0..0.2
    const courtBias = hashString(String(courtId || 'c')) * 0.1; // 0..0.1

    const h = hourCurve(hour);
    const d = dowCurve(dow);

    // weatherAdj: simple stub, reduce evenings slightly if outdoor and late
    const weatherAdj = outdoor && (hour >= 18 || hour <= 6) ? -0.05 : 0;

    let rushScore = clamp01(0.15 + h + d + venueBias + courtBias + weatherAdj);
    // normalize into 0..1 softly
    rushScore = clamp01(rushScore / 1.4);

    return res.json({
      rushScore,
      factors: { hour, dow, venueBias: Number(venueBias.toFixed(3)), courtBias: Number(courtBias.toFixed(3)), weather: weatherAdj },
      durationHours,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to predict rush' });
  }
});

router.post('/predict-price', (req, res) => {
  try {
    const { venueId, courtId, dateTime, basePrice = 500, benchmarkPrice, durationHours = 1, k = 0.6, cap = 0.3, outdoor = false } = req.body || {};

    // reuse rush
    const dt = dateTime ? new Date(dateTime) : new Date();
    const hour = dt.getHours();
    const dow = dt.getDay();
    const venueBias = hashString(String(venueId || 'v')) * 0.2;
    const courtBias = hashString(String(courtId || 'c')) * 0.1;
    const h = hourCurve(hour);
    const d = dowCurve(dow);
    const weatherAdj = outdoor && (hour >= 18 || hour <= 6) ? -0.05 : 0;
    let rushScore = clamp01(0.15 + h + d + venueBias + courtBias + weatherAdj);
    rushScore = clamp01(rushScore / 1.4);

    // Price elasticity: if price is above benchmark, reduce effective rush; if below, increase a bit
    const bench = typeof benchmarkPrice === 'number' && benchmarkPrice > 0 ? benchmarkPrice : basePrice;
    const rel = bench > 0 ? basePrice / bench : 1; // >1 means more expensive than benchmark
    const elasticity = 0.8; // sensitivity coefficient
    const priceAdj = clamp01(1 - elasticity * (rel - 1)); // rel=1 ->1, rel=1.25 -> 0.8, rel=0.8 -> 1.16 -> clamp to 1
    const effectiveRush = clamp01(rushScore * Math.max(0.3, Math.min(1, priceAdj)));

    const rawMult = 1 + k * effectiveRush; // e.g., 1..1.6 when k=0.6
    const cappedMult = Math.min(1 + cap, rawMult); // cap to +30%

    const suggested = Math.round(basePrice * cappedMult);
    const capApplied = rawMult > cappedMult;

    return res.json({
      suggestedPrice: suggested,
      rushScore: effectiveRush,
      capApplied,
      factors: { hour, dow, venueBias: Number(venueBias.toFixed(3)), courtBias: Number(courtBias.toFixed(3)), weather: weatherAdj },
      basePrice,
      durationHours,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to predict price' });
  }
});

export default router;
