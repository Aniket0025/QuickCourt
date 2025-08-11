// Synthetic heatmap generator with realistic clusters, ramps, hotspots, coolspots, and time evolution
export type HeatmapOptions = {
  t?: number;              // time seconds
  seed?: number;           // deterministic
  clusters?: number;       // gaussian blobs
  hotspots?: number;       // sharp peaks
  coolspots?: number;      // sharp dips
  ramp?: number;           // 0..1 global gradient strength
  noise?: number;          // 0..1 fine noise
  smooth?: number;         // 0..1 blur amount
  percentile?: [number, number]; // normalization window
};

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => (s = (s * 48271) % 0x7fffffff) / 0x7fffffff;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const gauss2 = (dx: number, dy: number, sx: number, sy: number) => Math.exp(-((dx*dx)/(2*sx*sx) + (dy*dy)/(2*sy*sy)));

function movers(n: number, amp: number, rnd: () => number) {
  return Array.from({ length: n }, () => {
    const baseX = rnd(), baseY = rnd();
    const wx = 0.6 + 0.8*rnd(), wy = 0.6 + 0.8*rnd();
    const ax = amp*(0.3 + 0.7*rnd()), ay = amp*(0.3 + 0.7*rnd());
    const phx = 6*rnd(), phy = 6*rnd();
    return (t: number) => ({
      x: (baseX + ax*Math.sin(t*wx + phx)) % 1,
      y: (baseY + ay*Math.cos(t*wy + phy)) % 1,
    });
  });
}

export function generateHeatmap(rows: number, cols: number, opt: HeatmapOptions = {}) {
  const {
    t = 0,
    seed = 1337,
    clusters = Math.max(3, Math.round((rows*cols)/300)),
    hotspots = Math.max(1, Math.round(Math.sqrt(rows+cols)/3)),
    coolspots = Math.max(1, Math.round(Math.sqrt(rows+cols)/3)),
    ramp = 0.25,
    noise = 0.15,
    smooth = 0.15,
    percentile = [10, 90],
  } = opt;

  const rnd = lcg(seed);
  const B = movers(clusters, 0.25, rnd).map(f => f(t));
  const H = movers(hotspots, 0.18, rnd).map(f => f(t));
  const C = movers(coolspots, 0.18, rnd).map(f => f(t));

  const grid: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c/(cols-1 || 1), y = r/(rows-1 || 1);
      let v = ramp*(0.6*x + 0.4*y) + 0.15*Math.sin(2*Math.PI*(x*1.2 + y*0.7 + 0.1*t));
      for (const p of B) v += 0.5*gauss2(x-p.x, y-p.y, 0.12, 0.10);
      for (const p of H) v += 0.7*gauss2(x-p.x, y-p.y, 0.05, 0.05);
      for (const p of C) v -= 0.6*gauss2(x-p.x, y-p.y, 0.06, 0.06);
      v += noise*(0.5 - (Math.sin(12*x + 5*y + 3*t) + Math.cos(7*x - 9*y + 2.3*t))/4);
      grid[r][c] = v;
    }
  }

  if (smooth > 0) {
    const k = Math.max(1, Math.round(2*smooth));
    const tmp = grid.map(row => row.slice());
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let acc = 0, wsum = 0;
        for (let dr = -k; dr <= k; dr++) for (let dc = -k; dc <= k; dc++) {
          const rr = Math.min(rows-1, Math.max(0, r+dr));
          const cc = Math.min(cols-1, Math.max(0, c+dc));
          const w = Math.exp(-(dr*dr+dc*dc)/(2*(k*0.7)*(k*0.7)));
          acc += w*tmp[rr][cc]; wsum += w;
        }
        grid[r][c] = acc/(wsum || 1);
      }
    }
  }

  // Percentile normalization
  const flat = grid.flat().sort((a,b)=>a-b);
  const pick = (q:number) => flat[Math.min(flat.length-1, Math.max(0, Math.floor((q/100)*(flat.length-1))))];
  const lo = pick(percentile[0]);
  const hi = pick(percentile[1]);
  const sc = Math.max(1e-6, hi - lo);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      grid[r][c] = clamp01((grid[r][c] - lo) / sc);
    }
  }

  return grid; // [rows][cols] in [0,1]
}
