import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { ensureModelLoaded, predictBatch } from '../ml/model';

const router = Router();

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function normalizeRushBatch<T extends { rushScore: number | undefined }>(items: T[], pLo = 0.1, pHi = 0.9): T[] {
  if (!items || items.length < 3) return items;
  const arr: number[] = items.map((x) => Number(x.rushScore ?? 0));
  const sorted: number[] = [...arr].sort((a, b) => a - b);
  if (sorted.length < 2) return items;
  const idxLo = Math.max(0, Math.min(sorted.length - 1, Math.floor(sorted.length * pLo)));
  const idxHi = Math.max(0, Math.min(sorted.length - 1, Math.floor(sorted.length * pHi)));
  const lo: number = Number.isFinite(sorted[idxLo]) ? (sorted[idxLo] as number) : (sorted[0] as number);
  const hi: number = Number.isFinite(sorted[idxHi]) ? (sorted[idxHi] as number) : (sorted[sorted.length - 1] as number);
  const span = Math.max(1e-6, hi - lo);
  return items.map((it) => {
    const v = Number(it.rushScore ?? 0);
    return { ...it, rushScore: clamp01((v - lo) / span) } as T;
  });
}

function buildFeatures(args: {
  dt: Date;
  venueId?: string;
  courtId?: string;
  basePrice: number;
  outdoor?: boolean;
}) {
  const { dt, venueId, courtId, basePrice, outdoor } = args;
  const hour = dt.getUTCHours();
  const dow = dt.getUTCDay();
  // cyclical encodings
  const hSin = Math.sin((2 * Math.PI * hour) / 24);
  const hCos = Math.cos((2 * Math.PI * hour) / 24);
  const dSin = Math.sin((2 * Math.PI * dow) / 7);
  const dCos = Math.cos((2 * Math.PI * dow) / 7);
  // id hashes (stable in [0,1])
  const vHash = typeof venueId === 'string' ? hashString(venueId) : 0.5;
  const cHash = typeof courtId === 'string' ? hashString(courtId) : 0.5;
  // price scaling (rough normalization)
  const price = isFinite(basePrice) && basePrice > 0 ? Math.min(1, basePrice / 2000) : 0.25;
  const out = outdoor ? 1 : 0;
  return new Float32Array([
    hSin, hCos, dSin, dCos,
    vHash, cHash,
    price,
    out,
  ]);
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

// Simple in-memory cache (5 minutes default)
type CacheEntry<T> = { value: T; expires: number };
const cache = new Map<string, CacheEntry<any>>();
function getCache<T>(key: string): T | undefined {
  const e = cache.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expires) { cache.delete(key); return undefined; }
  return e.value as T;
}
function setCache<T>(key: string, val: T, ttlMs = 5 * 60 * 1000) { // 5m
  cache.set(key, { value: val, expires: Date.now() + ttlMs });
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

    const cacheKey = `rush:${venueId}:${courtId}:${dt.toISOString().slice(0,13)}:out${outdoor}`;
    const cached = getCache<any>(cacheKey);
    if (cached) return res.json(cached);

    let rushScore = clamp01(0.15 + h + d + venueBias + courtBias + weatherAdj);
    // normalize into 0..1 softly
    rushScore = clamp01(rushScore / 1.4);

    const payload = {
      rushScore,
      factors: { hour, dow, venueBias: Number(venueBias.toFixed(3)), courtBias: Number(courtBias.toFixed(3)), weather: weatherAdj },
      durationHours,
    };
    setCache(cacheKey, payload);
    return res.json(payload);
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

    const payload = {
      suggestedPrice: suggested,
      rushScore: effectiveRush,
      capApplied,
      factors: { hour, dow, venueBias: Number(venueBias.toFixed(3)), courtBias: Number(courtBias.toFixed(3)), weather: weatherAdj },
      basePrice,
      durationHours,
    };
    const cacheKey = `price:${venueId}:${courtId}:${dt.toISOString().slice(0,13)}:p${basePrice}:b${bench}:k${k}:c${cap}:o${outdoor}`;
    setCache(cacheKey, payload);
    return res.json(payload);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to predict price' });
  }
});

// Batch endpoint
router.post('/predict-price-batch', (req, res) => {
  try {
    const { venueId, courtId, items = [], benchmarkPrice, k = 0.6, cap = 0.3, outdoor = false } = req.body || {};
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' });
    const useML = String(process.env.USE_ML_MODEL || '').toLowerCase() === 'true';
    const modelPath = process.env.MODEL_PATH ? path.resolve(process.cwd(), String(process.env.MODEL_PATH)) : '';

    const baseResults = items.map((it: any) => {
      const { dateTime, basePrice = 500, durationHours = 1 } = it || {};
      const dt = dateTime ? new Date(dateTime) : new Date();
      const hour = dt.getHours();
      const dow = dt.getDay();

      const hourCurve = [0.2,0.15,0.12,0.1,0.1,0.15,0.2,0.3,0.35,0.4,0.45,0.5,0.55,0.6,0.65,0.7,0.75,0.85,0.9,0.85,0.7,0.5,0.35,0.25];
      const dayCurve  = [0.5,0.45,0.5,0.55,0.6,0.8,0.9];
      const h = hourCurve[hour] || 0.4;
      const d = dayCurve[dow] || 0.5;
      // Deterministic per-slot jitter based on ISO hour hash to avoid static bands
      const isoHour = dt.toISOString().slice(0,13); // YYYY-MM-DDTHH
      const jitter = ((hashString(isoHour) - 0.5) * 0.1); // ~[-0.05, 0.05]
      // Mild weekly trend (stable over week)
      const year = dt.getUTCFullYear();
      const start = new Date(Date.UTC(year, 0, 1));
      const week = Math.floor(((dt.getTime() - start.getTime()) / (7 * 24 * 3600 * 1000)) % 52);
      const weekTrend = Math.sin((week / 52) * Math.PI * 2) * 0.04; // [-0.04, 0.04]
      const venueBias = (hashString(String(venueId)) - 0.5) * 0.2;
      const courtBias = (hashString(String(courtId)) - 0.5) * 0.15;
      const weatherAdj = outdoor ? -0.05 : 0;
      let rushScore = clamp01(0.15 + h + d + venueBias + courtBias + weatherAdj + jitter + weekTrend);
      rushScore = clamp01(rushScore / 1.4);

      const bench = typeof benchmarkPrice === 'number' && benchmarkPrice > 0 ? benchmarkPrice : basePrice;
      const rel = bench > 0 ? basePrice / bench : 1;
      const elasticity = 0.8;
      const priceAdj = clamp01(1 - elasticity * (rel - 1));
      const effectiveRush = clamp01(rushScore * Math.max(0.3, Math.min(1, priceAdj)));

      const rawMult = 1 + k * effectiveRush;
      const cappedMult = Math.min(1 + cap, rawMult);
      const suggested = Math.round(basePrice * cappedMult);
      const capApplied = rawMult > cappedMult;

      return {
        dateTime: dt.toISOString(),
        suggestedPrice: suggested,
        rushScore: effectiveRush,
        capApplied,
        factors: { hour, dow, venueBias: Number(venueBias.toFixed(3)), courtBias: Number(courtBias.toFixed(3)), weather: weatherAdj },
        basePrice,
        durationHours
      };
    });

    const run = async () => {
      if (!useML) return baseResults;
      try {
        if (!modelPath || !fs.existsSync(modelPath)) return baseResults;
        const loaded = await ensureModelLoaded(modelPath);
        if (!loaded) return baseResults;
        const feats = items.map((it: any) => {
          const { dateTime, basePrice = 500 } = it || {};
          const dt = dateTime ? new Date(dateTime) : new Date();
          return buildFeatures({ dt, venueId, courtId, basePrice, outdoor });
        });
        const ml = await predictBatch(feats);
        if (!ml || ml.length !== baseResults.length) return baseResults;
        const merged = baseResults.map((r, i) => {
          const rush = clamp01(Number(ml[i]));
          const rawMult = 1 + k * rush;
          const cappedMult = Math.min(1 + cap, rawMult);
          const suggested = Math.round((r.basePrice || 500) * cappedMult);
          return { ...r, rushScore: rush, suggestedPrice: suggested };
        });
        return normalizeRushBatch(merged, 0.1, 0.9);
      } catch {
        return baseResults;
      }
    };

    return Promise.resolve(run()).then((finalItems) => {
      const out = normalizeRushBatch(finalItems, 0.1, 0.9);
      res.json({ items: out });
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Failed to predict price batch' });
  }
});

export default router;
