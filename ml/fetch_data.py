import argparse
import math
import os
import random
from datetime import datetime, timedelta, timezone

import numpy as np
import pandas as pd


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def hash_string(s: str) -> float:
    # FNV-like simple hash -> [0,1)
    h = 2166136261
    for ch in s:
        h ^= ord(ch)
        h = (h * 16777619) & 0xFFFFFFFF
    return (h & 0xFFFFFFFF) / (2 ** 32)


def hour_curve(hour: int) -> float:
    arr = [0.2, 0.15, 0.12, 0.1, 0.1, 0.15, 0.2, 0.3, 0.35, 0.4, 0.45, 0.5,
           0.55, 0.6, 0.65, 0.7, 0.75, 0.85, 0.9, 0.85, 0.7, 0.5, 0.35, 0.25]
    return arr[hour % 24]


def dow_curve(dow: int) -> float:
    arr = [0.5, 0.45, 0.5, 0.55, 0.6, 0.8, 0.9]
    return arr[dow % 7]


def label_rush(dt: datetime, venue_id: str, court_id: str, base_price: float, benchmark_price: float, outdoor: bool) -> float:
    hour = dt.hour
    dow = dt.weekday()
    h = hour_curve(hour)
    d = dow_curve(dow)
    iso_hour = dt.replace(minute=0, second=0, microsecond=0, tzinfo=timezone.utc).isoformat()[:13]
    jitter = (hash_string(iso_hour) - 0.5) * 0.1
    year = dt.year
    week = int(((dt - datetime(year, 1, 1)).days) / 7) % 52
    week_trend = math.sin((week / 52) * math.pi * 2) * 0.04
    venue_bias = (hash_string(venue_id) - 0.5) * 0.2
    court_bias = (hash_string(court_id) - 0.5) * 0.15
    weather_adj = -0.05 if outdoor else 0.0
    rush = clamp01(0.15 + h + d + venue_bias + court_bias + weather_adj + jitter + week_trend)
    rush = clamp01(rush / 1.4)

    # apply price elasticity (same as backend)
    bench = benchmark_price if benchmark_price and benchmark_price > 0 else base_price
    rel = (base_price / bench) if bench > 0 else 1.0
    elasticity = 0.8
    price_adj = clamp01(1 - elasticity * (rel - 1))
    effective_rush = clamp01(rush * max(0.3, min(1.0, price_adj)))
    return effective_rush


def build_features(dt: datetime, venue_id: str, court_id: str, base_price: float, outdoor: bool):
    hour = dt.hour
    dow = dt.weekday()
    hsin = math.sin(2 * math.pi * hour / 24)
    hcos = math.cos(2 * math.pi * hour / 24)
    dsin = math.sin(2 * math.pi * dow / 7)
    dcos = math.cos(2 * math.pi * dow / 7)
    vhash = hash_string(venue_id)
    chash = hash_string(court_id)
    price = min(1.0, base_price / 2000.0) if base_price and base_price > 0 else 0.25
    out = 1.0 if outdoor else 0.0
    return [hsin, hcos, dsin, dcos, vhash, chash, price, out]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--rows', type=int, default=50000, help='Total target rows when only synthetic is used')
    parser.add_argument('--out', type=str, default='data/train.csv', help='Output CSV path')
    parser.add_argument('--real_csv', type=str, default='', help='Optional path to real bookings CSV to learn from')
    parser.add_argument('--synthetic_rows', type=int, default=-1, help='If real_csv provided, number of synthetic rows to add. Default auto-top-up to ~50k total.')
    args = parser.parse_args()

    out_dir = os.path.dirname(args.out)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)

    now = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    start = now - timedelta(days=60)

    records = []

    # 1) Load REAL bookings if provided. We weak-label using the same heuristic label_rush.
    real_count = 0
    if args.real_csv and os.path.exists(args.real_csv):
        real_df = pd.read_csv(args.real_csv)
        # try to be schema-tolerant
        # expected fields: dateTime, venueId, courtId, price or basePrice, outdoor
        def coalesce(cols):
            for c in cols:
                if c in real_df.columns:
                    return c
            return None

        c_dt = coalesce(['dateTime','datetime','start','startTime'])
        c_venue = coalesce(['venueId','venue_id','venue'])
        c_court = coalesce(['courtId','court_id','court'])
        c_price = coalesce(['basePrice','price','amount'])
        c_outdoor = coalesce(['outdoor','isOutdoor'])

        if not all([c_dt, c_venue, c_court, c_price]):
            print('real_csv missing required columns; skipping real ingestion')
        else:
            # compute benchmark per venue median price when possible
            vbench = None
            try:
                vbench = real_df.groupby(c_venue)[c_price].median().to_dict()
            except Exception:
                vbench = None

            for _, row in real_df.iterrows():
                try:
                    # parse datetime robustly
                    dt_raw = row[c_dt]
                    if isinstance(dt_raw, (int, float)):
                        # epoch seconds or ms heuristic
                        val = float(dt_raw)
                        if val > 1e12:
                            dt = datetime.utcfromtimestamp(val/1000)
                        else:
                            dt = datetime.utcfromtimestamp(val)
                    else:
                        dt = datetime.fromisoformat(str(dt_raw).replace('Z','+00:00'))
                    dt = dt.replace(minute=0, second=0, microsecond=0, tzinfo=None)

                    venue_id = str(row[c_venue])
                    court_id = str(row[c_court])
                    base_price = float(row[c_price]) if not pd.isna(row[c_price]) else 600.0
                    bench = float(vbench.get(venue_id, base_price)) if vbench else base_price
                    outdoor = bool(row[c_outdoor]) if c_outdoor and c_outdoor in row and not pd.isna(row[c_outdoor]) else False

                    y = label_rush(dt, venue_id, court_id, base_price, bench, outdoor)
                    x = build_features(dt, venue_id, court_id, base_price, outdoor)
                    records.append(x + [y])
                    real_count += 1
                except Exception:
                    continue

    # 2) Add SYNTHETIC rows either to reach target or if no real provided.
    target_total = 50000
    synth_to_add = 0
    if real_count > 0:
        synth_to_add = args.synthetic_rows if args.synthetic_rows >= 0 else max(0, target_total - real_count)
    else:
        synth_to_add = args.rows

    venues = [f"v{i}" for i in range(15)]
    courts = [f"c{j}" for j in range(6)]

    for _ in range(int(synth_to_add)):
        dt = start + timedelta(hours=random.randint(0, 60 * 24))
        venue_id = random.choice(venues)
        court_id = random.choice(courts)
        outdoor = random.random() < 0.4
        base_price = float(np.clip(np.random.normal(600, 150), 150, 1800))
        benchmark_price = float(np.clip(np.random.normal(650, 120), 150, 1800))

        y = label_rush(dt, venue_id, court_id, base_price, benchmark_price, outdoor)
        x = build_features(dt, venue_id, court_id, base_price, outdoor)
        records.append(x + [y])

    cols = ['hSin','hCos','dSin','dCos','vHash','cHash','price','outdoor','rush']
    df = pd.DataFrame(records, columns=cols)
    df.to_csv(args.out, index=False)
    print(f"Wrote {len(df)} rows to {args.out} (real={real_count}, synthetic={len(df)-real_count})")


if __name__ == '__main__':
    main()
