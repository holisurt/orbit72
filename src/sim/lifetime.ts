// Orbital lifetime — SPEC §5. Table [NG FACSAT-2, 6U, B = 72.3 kg/m²].

export interface LifetimeTable {
  h: number[];
  avg: number[];
  max: number[];
  aBodyM2: number;
}

export type SolarColumn = 'avg' | 'max';

export interface LifetimeResult {
  years: number;
  extrapolated: boolean; // outside table range → label "ngoại suy"
}

/** Log-linear interpolation; outside the table, extrapolate with the end segment. */
export function lifetimeYears(table: LifetimeTable, hKm: number, col: SolarColumn): LifetimeResult {
  const hs = table.h;
  const ys = table[col];
  const last = hs.length - 1;
  let i = 0;
  if (hKm <= hs[0]) i = 0;
  else if (hKm >= hs[last]) i = last - 1;
  else while (i < last - 1 && hKm > hs[i + 1]) i++;
  const t = (hKm - hs[i]) / (hs[i + 1] - hs[i]);
  const lnY = Math.log(ys[i]) + t * (Math.log(ys[i + 1]) - Math.log(ys[i]));
  return { years: Math.exp(lnY), extrapolated: hKm < hs[0] || hKm > hs[last] };
}

/** Drag sail deployed at end of ops: residual = (L − opsYears) × A_body/(A_body + A_sail). */
export function sailResidualYears(L: number, opsYears: number, aBodyM2: number, aSailM2: number): number {
  return Math.max(0, L - opsYears) * (aBodyM2 / (aBodyM2 + aSailM2));
}
