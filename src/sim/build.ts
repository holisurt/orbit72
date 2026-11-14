// Satellite build — SPEC §3: mass, cells, cost, dev time, data, power, R8 hard constraints.
import type { Chassis, Components, Part } from '../data/types';
import { bodyPowerW, wingPowerW, powerUseW, batteryNeedWh } from './power';
import { downlinkBytesPerDay } from './link';

export const INTEGRATION_MONTHS = 4; // [GA]

export interface DesignInput {
  chassis: Chassis['id'];
  parts: string[]; // part ids (duplicates allowed, e.g. two batteries)
  wings: boolean;
  envTest: boolean;
}

export interface OrbitContext {
  fEcl: number;
  tEclH: number;
  contactMinPerDay: number;
}

export interface BuildSummary {
  chassis: Chassis;
  parts: Part[];
  massKg: number;
  massLimitKg: number;
  cellsUsed: number;
  cellsMax: number;
  pGenW: number;
  pUseW: number;
  batteryHaveWh: number;
  batteryNeedWh: number;
  costPerSatKusd: number;
  devMonths: number;
  dataProducedMB: number;
  dataDownlinkMB: number;
  bestRbps: number;
  hardErrors: HardError[];
}

export type HardErrorCode =
  | 'missing_obc'
  | 'missing_eps'
  | 'missing_adcs'
  | 'missing_tx'
  | 'missing_sos'
  | 'cells'
  | 'mass'
  | 'needs_precise_adcs';

export interface HardError {
  code: HardErrorCode;
  message: string; // Vietnamese UI text
}

export function resolveParts(comp: Components, ids: string[]): Part[] {
  return ids
    .map((id) => comp.parts.find((p) => p.id === id))
    .filter((p): p is Part => Boolean(p));
}

export function getChassis(comp: Components, id: Chassis['id']): Chassis {
  const c = comp.chassis.find((x) => x.id === id);
  if (!c) throw new Error(`unknown chassis ${id}`);
  return c;
}

export function summariseBuild(comp: Components, d: DesignInput, orbit: OrbitContext): BuildSummary {
  const chassis = getChassis(comp, d.chassis);
  const parts = resolveParts(comp, d.parts);
  const sum = (f: (p: Part) => number) => parts.reduce((a, p) => a + f(p), 0);

  const massKg = chassis.baseKg + sum((p) => p.kg) + (d.wings ? comp.wings.kg : 0);
  const cellsUsed = sum((p) => p.cells);

  const pGenW =
    bodyPowerW(chassis.areaM2, orbit.fEcl) +
    (d.wings ? wingPowerW(comp.wings.areaM2, comp.wings.orientation, orbit.fEcl) : 0);
  const pUseW = powerUseW({
    continuousW: parts.map((p) => p.w),
    txW: parts.filter((p) => p.txW).map((p) => p.txW!),
    contactMinPerDay: orbit.contactMinPerDay,
  });
  const batteryHaveWh = sum((p) => p.wh ?? 0);

  const costPerSatKusd =
    chassis.kusd + sum((p) => p.kusd) + (d.wings ? comp.wings.kusd : 0) + (d.envTest ? comp.envTest.kusd : 0);
  const partMonths = Math.max(0, ...parts.map((p) => p.months), d.wings ? comp.wings.months : 0);
  const devMonths = chassis.months + partMonths + INTEGRATION_MONTHS + (d.envTest ? comp.envTest.months : 0);

  const edge = parts.find((p) => p.cameraDataFactor);
  const dataProducedMB = sum((p) => {
    const mb = p.mbPerDay ?? 0;
    return p.id === 'cam' && edge ? mb * edge.cameraDataFactor! : mb;
  });
  // One transmitter downlinks at a time → use the fastest one.
  const bestRbps = Math.max(0, ...parts.map((p) => p.rbps ?? 0));
  const dataDownlinkMB = downlinkBytesPerDay(bestRbps, orbit.contactMinPerDay) / 1e6;

  const has = (pred: (p: Part) => boolean) => parts.some(pred);
  const hardErrors: HardError[] = [];
  if (!has((p) => p.id === 'obc' || p.id === 'obc2'))
    hardErrors.push({ code: 'missing_obc', message: 'Thiếu máy tính OBC.' });
  if (!has((p) => p.id === 'eps')) hardErrors.push({ code: 'missing_eps', message: 'Thiếu hệ nguồn EPS.' });
  if (!has((p) => p.id === 'adcs' || p.id === 'adcs2'))
    hardErrors.push({ code: 'missing_adcs', message: 'Thiếu hệ điều khiển tư thế ADCS.' });
  if (!has((p) => p.cat === 'com')) hardErrors.push({ code: 'missing_tx', message: 'Thiếu máy phát (UHF / S / X).' });
  if (!has((p) => p.id === 'sos')) hardErrors.push({ code: 'missing_sos', message: 'Thiếu Payload SOS.' });
  if (cellsUsed > chassis.cells)
    hardErrors.push({ code: 'cells', message: `Quá số ô: ${cellsUsed}/${chassis.cells} ô của khung ${chassis.id}.` });
  if (massKg > chassis.limitKg + 1e-9)
    hardErrors.push({
      code: 'mass',
      message: `Quá khối lượng: ${fmt1(massKg)}/${fmt1(chassis.limitKg)} kg.`,
    });
  if (has((p) => !!p.needsPreciseAdcs) && !has((p) => p.id === 'adcs2'))
    hardErrors.push({ code: 'needs_precise_adcs', message: 'Camera / X-band cần ADCS chính xác.' });

  return {
    chassis,
    parts,
    massKg,
    massLimitKg: chassis.limitKg,
    cellsUsed,
    cellsMax: chassis.cells,
    pGenW,
    pUseW,
    batteryHaveWh,
    batteryNeedWh: batteryNeedWh(pUseW, orbit.tEclH),
    costPerSatKusd,
    devMonths,
    dataProducedMB,
    dataDownlinkMB,
    bestRbps,
    hardErrors,
  };
}

function fmt1(x: number): string {
  return x.toFixed(1).replace('.', ',');
}

/** Can this part be added without breaking cells? (mass is checked on the summary) */
export function canAddPart(comp: Components, d: DesignInput, partId: string): boolean {
  const chassis = getChassis(comp, d.chassis);
  const used = resolveParts(comp, d.parts).reduce((a, p) => a + p.cells, 0);
  const part = comp.parts.find((p) => p.id === partId);
  return !!part && used + part.cells <= chassis.cells;
}
