// Constellation geometry and 72-h coverage — SPEC §4.
import {
  centralAngle,
  coverageHalfAngle,
  ssoInclinationDeg,
  subSatellitePoint,
  type LatLon,
  type SatElements,
} from './orbit';

export const SIM_MINUTES = 72 * 60; // 72 h at 1-min steps
export const ELEV_MIN_DEG = 10; // ε [GA]
export const RAAN_BASE_DEG = 105.5; // Ω0 of plane 0

export type PresetId = 'sso' | 'iss' | 'low20' | 'leo53';

export interface ConstellationInput {
  preset: PresetId;
  hKm: number;
  planes: number; // P
  perPlane: number; // k
}

/** Inclination for a preset (SSO depends on altitude). */
export function presetInclination(preset: PresetId, hKm: number): number {
  switch (preset) {
    case 'sso':
      return ssoInclinationDeg(hKm);
    case 'iss':
      return 51.6;
    case 'low20':
      return 20;
    case 'leo53':
      return 53;
  }
}

/** ISS preset forces P = 1, h = 400. */
export function normaliseConstellation(c: ConstellationInput): ConstellationInput {
  if (c.preset === 'iss') return { ...c, hKm: 400, planes: 1 };
  return c;
}

/**
 * Walker-like layout (SPEC §4): Ω0_p = 105.5° + p·S/P, S = 180° for SSO, 360° otherwise;
 * phase = s·2π/k + p·π/(P·k).
 */
export function buildConstellation(input: ConstellationInput): SatElements[] {
  const c = normaliseConstellation(input);
  const incl = presetInclination(c.preset, c.hKm);
  const S = c.preset === 'sso' ? 180 : 360;
  const sats: SatElements[] = [];
  for (let p = 0; p < c.planes; p++) {
    for (let s = 0; s < c.perPlane; s++) {
      sats.push({
        hKm: c.hKm,
        inclDeg: incl,
        raan0Deg: RAAN_BASE_DEG + (p * S) / c.planes,
        phaseRad: (s * 2 * Math.PI) / c.perPlane + (p * Math.PI) / (c.planes * c.perPlane),
      });
    }
  }
  return sats;
}

/** Per-satellite visibility of a target over `minutes` 1-min steps. */
export function satVisibility(
  sat: SatElements,
  target: LatLon,
  minutes = SIM_MINUTES,
  elevDeg = ELEV_MIN_DEG,
): Uint8Array {
  const lambda = coverageHalfAngle(sat.hKm, elevDeg);
  const vis = new Uint8Array(minutes);
  for (let m = 0; m < minutes; m++) {
    const p = subSatellitePoint(sat, m * 60);
    vis[m] = centralAngle(p, target) <= lambda ? 1 : 0;
  }
  return vis;
}

export interface CoverageResult {
  perSat: Uint8Array[];
  vis: Uint8Array; // union
  longestGapH: number;
  p1h: number; // %
  contactMinPerDayPerSat: number;
  passesPerDay: number; // union passes (runs of visible minutes) per day
}

/** Longest run of non-visible minutes, no wrap-around (hours). */
export function longestGapH(vis: Uint8Array): number {
  let best = 0;
  let run = 0;
  for (let m = 0; m < vis.length; m++) {
    if (vis[m]) run = 0;
    else {
      run++;
      if (run > best) best = run;
    }
  }
  return best / 60;
}

/** % of minutes whose next visible minute (itself included) is ≤ 60 min away. */
export function p1h(vis: Uint8Array, okMask?: Uint8Array): number {
  return weightedP1h(vis, undefined, okMask);
}

/** Per-minute "ok" flag: next visible minute ≤ 60 min away. */
export function okMinutes(vis: Uint8Array): Uint8Array {
  const ok = new Uint8Array(vis.length);
  let next = Infinity;
  for (let m = vis.length - 1; m >= 0; m--) {
    if (vis[m]) next = m;
    ok[m] = next - m <= 60 ? 1 : 0;
  }
  return ok;
}

/** P1h with optional per-minute weights (IMERG, SPEC §6). w = 1 → plain P1h. */
export function weightedP1h(vis: Uint8Array, w?: ArrayLike<number>, okOverride?: Uint8Array): number {
  const ok = okOverride ?? okMinutes(vis);
  let num = 0;
  let den = 0;
  for (let m = 0; m < vis.length; m++) {
    const wm = w ? w[m] : 1;
    num += wm * ok[m];
    den += wm;
  }
  return den === 0 ? 0 : (100 * num) / den;
}

export function countPasses(vis: Uint8Array): number {
  let n = 0;
  for (let m = 0; m < vis.length; m++) if (vis[m] && (m === 0 || !vis[m - 1])) n++;
  return n;
}

export function simulateCoverage(
  input: ConstellationInput,
  target: LatLon,
  minutes = SIM_MINUTES,
): CoverageResult {
  const sats = buildConstellation(input);
  const perSat = sats.map((s) => satVisibility(s, target, minutes));
  const vis = new Uint8Array(minutes);
  let contact = 0;
  for (const v of perSat) {
    for (let m = 0; m < minutes; m++) {
      if (v[m]) {
        vis[m] = 1;
        contact++;
      }
    }
  }
  const days = minutes / 1440;
  return {
    perSat,
    vis,
    longestGapH: longestGapH(vis),
    p1h: p1h(vis),
    contactMinPerDayPerSat: sats.length ? contact / days / sats.length : 0,
    passesPerDay: countPasses(vis) / days,
  };
}

/** Ground track points for map drawing (deg). */
export function groundTrack(sat: SatElements, fromMin: number, toMin: number, stepMin = 1): LatLon[] {
  const pts: LatLon[] = [];
  for (let m = fromMin; m <= toMin; m += stepMin) pts.push(subSatellitePoint(sat, m * 60));
  return pts;
}
