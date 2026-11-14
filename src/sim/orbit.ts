// Orbit mechanics — SPEC §4. Pure functions, no React.
// All constants [CT].

export const R_E = 6378.14; // km
export const MU = 398600.4418; // km³/s²
export const OMEGA_E = 7.2921159e-5; // rad/s
export const J2 = 1.08263e-3;
export const OMEGA_SUN = 1.991e-7; // rad/s, required SSO node rate
export const DEG = Math.PI / 180;

/** Semi-major axis a = R⊕ + h (km). */
export function semiMajorAxis(hKm: number): number {
  return R_E + hKm;
}

/** Mean motion n = √(μ/a³) (rad/s). */
export function meanMotion(hKm: number): number {
  const a = semiMajorAxis(hKm);
  return Math.sqrt(MU / (a * a * a));
}

/** Orbital period T = 2π/n (s). */
export function periodSec(hKm: number): number {
  return (2 * Math.PI) / meanMotion(hKm);
}

export function periodMin(hKm: number): number {
  return periodSec(hKm) / 60;
}

/** Sun-synchronous inclination: cos i = −2·Ω̇☉·a² / (3·J2·R⊕²·n). Returns degrees. */
export function ssoInclinationDeg(hKm: number): number {
  const a = semiMajorAxis(hKm);
  const n = meanMotion(hKm);
  const cosI = (-2 * OMEGA_SUN * a * a) / (3 * J2 * R_E * R_E * n);
  return Math.acos(cosI) / DEG;
}

/** J2 RAAN drift Ω̇ = −1.5·J2·(R⊕/a)²·n·cos i (rad/s). */
export function raanRate(hKm: number, inclDeg: number): number {
  const a = semiMajorAxis(hKm);
  const n = meanMotion(hKm);
  return -1.5 * J2 * (R_E / a) ** 2 * n * Math.cos(inclDeg * DEG);
}

/** Eclipse fraction at β = 0: f = acos(√(h²+2R⊕h)/a)/π. */
export function eclipseFraction(hKm: number): number {
  const a = semiMajorAxis(hKm);
  return Math.acos(Math.sqrt(hKm * hKm + 2 * R_E * hKm) / a) / Math.PI;
}

/** Eclipse duration per orbit t_ecl = f_ecl × T (hours). */
export function eclipseHours(hKm: number): number {
  return (eclipseFraction(hKm) * periodSec(hKm)) / 3600;
}

/** Coverage half-angle λ = acos(R⊕ cos ε / a) − ε (rad). */
export function coverageHalfAngle(hKm: number, elevDeg: number): number {
  const eps = elevDeg * DEG;
  return Math.acos((R_E * Math.cos(eps)) / semiMajorAxis(hKm)) - eps;
}

/** Ground radius of the coverage circle (km, arc length on R⊕). */
export function coverageRadiusKm(hKm: number, elevDeg: number): number {
  return coverageHalfAngle(hKm, elevDeg) * R_E;
}

/** Slant range at elevation ε: d = √(a² − (R⊕cos ε)²) − R⊕ sin ε (km). */
export function slantRangeKm(hKm: number, elevDeg: number): number {
  const a = semiMajorAxis(hKm);
  const eps = elevDeg * DEG;
  return Math.sqrt(a * a - (R_E * Math.cos(eps)) ** 2) - R_E * Math.sin(eps);
}

export interface SatElements {
  hKm: number;
  inclDeg: number;
  raan0Deg: number; // Ω0 — Earth-fixed longitude of ascending node at t = 0
  phaseRad: number; // argument of latitude at t = 0
}

export interface LatLon {
  lat: number; // deg
  lon: number; // deg, normalised to (−180, 180]
}

export function normLon(lonDeg: number): number {
  let l = ((lonDeg + 180) % 360 + 360) % 360 - 180;
  if (l === -180) l = 180;
  return l;
}

/**
 * Sub-satellite point (SPEC §4):
 * u = n·t + phase; lat = asin(sin i · sin u);
 * lon = Ω0 + Ω̇t + atan2(cos i·sin u, cos u) − ω⊕t.
 */
export function subSatellitePoint(sat: SatElements, tSec: number): LatLon {
  const n = meanMotion(sat.hKm);
  const i = sat.inclDeg * DEG;
  const u = n * tSec + sat.phaseRad;
  const lat = Math.asin(Math.sin(i) * Math.sin(u));
  const lon =
    sat.raan0Deg * DEG +
    raanRate(sat.hKm, sat.inclDeg) * tSec +
    Math.atan2(Math.cos(i) * Math.sin(u), Math.cos(u)) -
    OMEGA_E * tSec;
  return { lat: lat / DEG, lon: normLon(lon / DEG) };
}

/** Great-circle central angle between two points (rad). */
export function centralAngle(a: LatLon, b: LatLon): number {
  const la1 = a.lat * DEG;
  const la2 = b.lat * DEG;
  const dLon = (b.lon - a.lon) * DEG;
  const c = Math.sin(la1) * Math.sin(la2) + Math.cos(la1) * Math.cos(la2) * Math.cos(dLon);
  return Math.acos(Math.min(1, Math.max(-1, c)));
}
