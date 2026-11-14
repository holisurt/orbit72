// Power budget — SPEC §3.

export const SOLAR_CONST = 1361; // W/m² [CT]
export const CELL_EFF = 0.29; // η [GA]
export const BODY_FILL = 0.7; // fill factor [GA]
export const POWER_LOSS = 0.85; // system loss factor [GA]
export const DOD = 0.3; // depth of discharge [GA]
export const DEFAULT_F_ECL = 0.376; // before an orbit is chosen
export const DEFAULT_CONTACT_MIN = 17; // min/day, before an orbit is chosen
export const POWER_MARGIN = 1.1; // R3: P_gen ≥ 1.1·P_use

/**
 * Body-mounted generation: 1361 × 0.29 × 0.7 × (A/4) × (1 − f_ecl) × 0.85.
 * A/4 = mean projected area of a convex body [CT].
 */
export function bodyPowerW(areaM2: number, fEcl: number): number {
  return SOLAR_CONST * CELL_EFF * BODY_FILL * (areaM2 / 4) * (1 - fEcl) * POWER_LOSS;
}

/** Deployable wings: 1361 × 0.29 × 0.85 × A_w × orientation × (1 − f_ecl) × 0.85. */
export function wingPowerW(wingAreaM2: number, orientation: number, fEcl: number): number {
  return SOLAR_CONST * CELL_EFF * 0.85 * wingAreaM2 * orientation * (1 - fEcl) * POWER_LOSS;
}

export interface LoadInput {
  continuousW: number[]; // Σ part.w
  txW: number[]; // transmitter powers
  contactMinPerDay: number;
}

/** P_use = Σ continuous + Σ tx_W × contact_min/1440. */
export function powerUseW(l: LoadInput): number {
  const cont = l.continuousW.reduce((a, b) => a + b, 0);
  const tx = l.txW.reduce((a, b) => a + b, 0) * (l.contactMinPerDay / 1440);
  return cont + tx;
}

/** Battery need = P_use × t_ecl[h] / DoD (Wh). */
export function batteryNeedWh(pUseW: number, tEclH: number): number {
  return (pUseW * tEclH) / DOD;
}
