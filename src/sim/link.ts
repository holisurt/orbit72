// Link budget — SPEC §5. Formulas [CT], station parameters [GA].
import { slantRangeKm } from './orbit';

export type LinkId = 'uhf' | 's' | 'sos';

export interface LinkParams {
  id: LinkId;
  label: string;
  fMHz: number;
  pW: number;
  gTx: number;
  lLine: number;
  lMisc: number;
  gRx: number;
  tSysK: number;
  rbps: number;
  reqDb: number;
}

export const LINKS: Record<LinkId, LinkParams> = {
  uhf: { id: 'uhf', label: 'UHF xuống', fMHz: 437, pW: 1, gTx: 0, lLine: 1, lMisc: 3, gRx: 14, tSysK: 500, rbps: 9600, reqDb: 12 },
  s: { id: 's', label: 'S xuống', fMHz: 2200, pW: 2, gTx: 6, lLine: 1, lMisc: 1, gRx: 34.2, tSysK: 150, rbps: 2e6, reqDb: 12.5 },
  sos: { id: 'sos', label: 'SOS lên', fMHz: 437, pW: 0.5, gTx: 2, lLine: 0, lMisc: 3, gRx: 0, tSysK: 700, rbps: 300, reqDb: 12 },
};

const BOLTZMANN_DB = 228.6;
const log10 = Math.log10;

/** FSPL = 20log d_km + 20log f_MHz + 32.44 (dB). */
export function fsplDb(dKm: number, fMHz: number): number {
  return 20 * log10(dKm) + 20 * log10(fMHz) + 32.44;
}

/** Link margin (dB) at altitude h and elevation ε. */
export function linkMarginDb(p: LinkParams, hKm: number, elevDeg: number): number {
  const d = slantRangeKm(hKm, elevDeg);
  const eirp = 10 * log10(p.pW) + p.gTx - p.lLine;
  const cn0 = eirp - fsplDb(d, p.fMHz) - p.lMisc + (p.gRx - 10 * log10(p.tSysK)) + BOLTZMANN_DB;
  const ebn0 = cn0 - 10 * log10(p.rbps);
  return ebn0 - p.reqDb;
}

/** Margin of a named link at altitude h and elevation ε — used by the Orbit R7 panel and the Build part cards. */
export function linkMarginFor(id: LinkId, hKm: number, elevDeg: number): number {
  return linkMarginDb(LINKS[id], hKm, elevDeg);
}

/** Bytes downlinked per day: R_b × contact_min × 60 / 8. */
export function downlinkBytesPerDay(rbps: number, contactMinPerDay: number): number {
  return (rbps * contactMinPerDay * 60) / 8;
}
