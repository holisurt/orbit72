// IMERG rain layer helpers for the Viet Nam map (Brief: 72 h total, Ops: hourly frame).
// Bin edges are display classes only; game numbers (weights, cloud threshold) come from SPEC / scenario.
import type { Imerg } from '../data/types';
import { projVN } from './MapVN';

export const IMERG_LABEL = 'NASA GPM IMERG V07 Final · 7–10 Sep 2024';

export interface RainBin {
  min: number;
  opacity: number;
}

/** Hourly rate classes, mm/h. */
export const RATE_BINS: RainBin[] = [
  { min: 0.5, opacity: 0.18 },
  { min: 2, opacity: 0.32 },
  { min: 5, opacity: 0.48 },
  { min: 10, opacity: 0.64 },
  { min: 20, opacity: 0.8 },
];

/** 72 h accumulation classes, mm. */
export const TOTAL_BINS: RainBin[] = [
  { min: 25, opacity: 0.16 },
  { min: 50, opacity: 0.28 },
  { min: 100, opacity: 0.42 },
  { min: 200, opacity: 0.58 },
  { min: 300, opacity: 0.76 },
];

export type ImergGrid = NonNullable<Imerg['grid']>;

/** Sum of hourly frames (mm/h × 1 h) → 72 h accumulated rain per cell, mm. */
export function accumulate(grid: ImergGrid, hours = 72): number[] {
  const out = new Array<number>(grid.cols * grid.rows).fill(0);
  for (const f of grid.frames.slice(0, hours)) for (let k = 0; k < out.length; k++) out[k] += f[k] ?? 0;
  return out;
}

export interface RainCell {
  x: number;
  y: number;
  s: number;
  o: number;
}

/** Map cells (MapVN coordinates) for values at or above the first bin. */
export function rainCells(grid: ImergGrid, values: number[], bins: RainBin[]): RainCell[] {
  const s = grid.step * 30;
  const cells: RainCell[] = [];
  for (let r = 0; r < grid.rows; r++)
    for (let c = 0; c < grid.cols; c++) {
      const v = values[r * grid.cols + c];
      let o = 0;
      for (const b of bins) if (v >= b.min) o = b.opacity;
      if (!o) continue;
      const p = projVN(grid.lat0 + r * grid.step, grid.lon0 + c * grid.step);
      cells.push({ x: p.x - s / 2, y: p.y - s / 2, s, o });
    }
  return cells;
}

/** "07/09 14:00" in Viet Nam time (UTC+7) for an ISO UTC hour stamp. */
export function ictLabel(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(Date.parse(iso) + 7 * 3600_000);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n: number) => String(n).padStart(2, '0');
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
  return `${d.getUTCDate()} ${mon} ${p(d.getUTCHours())}:00`;
}
