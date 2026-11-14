// Mission evaluation: launch cost/compatibility (SPEC §4) and requirements R1–R8 (SPEC §2, §3, §7).
import type { ChassisId, DifficultyId, GameData, Launcher, LauncherId } from '../data/types';
import { summariseBuild, type BuildSummary, type DesignInput } from './build';
import {
  normaliseConstellation,
  presetInclination,
  simulateCoverage,
  type ConstellationInput,
  type CoverageResult,
} from './coverage';
import { eclipseFraction, eclipseHours, periodSec } from './orbit';
import { DEFAULT_CONTACT_MIN, DEFAULT_F_ECL } from './power';
import { LINKS, linkMarginDb, type LinkId } from './link';
import { lifetimeYears, sailResidualYears } from './lifetime';

export type Status = 'DAT' | 'SAT' | 'VUOT';
export const STATUS_LABEL: Record<Status, string> = { DAT: 'ĐẠT', SAT: 'SÁT', VUOT: 'VƯỢT' };

/** Round as displayed (SPEC §7). */
export function roundTo(x: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(x * f) / f;
}

/** Status from usage ratio: ĐẠT ≤ 80 % · SÁT 80–100 % · VƯỢT > 100 %. */
export function statusFromRatio(ratio: number): Status {
  if (!Number.isFinite(ratio) || ratio > 1 + 1e-9) return 'VUOT';
  if (ratio > 0.8 + 1e-9) return 'SAT';
  return 'DAT';
}

/** value ≤ limit, compared on displayed values. */
export function statusMax(value: number, limit: number, decimals: number): Status {
  return statusFromRatio(roundTo(value, decimals) / limit);
}

/** value ≥ min, compared on displayed values. */
export function statusMin(value: number, min: number, decimals: number): Status {
  const v = roundTo(value, decimals);
  if (v <= 0) return 'VUOT';
  return statusFromRatio(min / v);
}

export function worst(...s: Status[]): Status {
  if (s.includes('VUOT')) return 'VUOT';
  if (s.includes('SAT')) return 'SAT';
  return 'DAT';
}

const CHASSIS_ORDER: ChassisId[] = ['3U', '6U', '12U'];

export interface OrbitInput extends ConstellationInput {
  launcher: LauncherId;
}

export interface LaunchOption {
  launcher: Launcher;
  compatible: boolean;
  reason: string; // why incompatible (Vietnamese)
  launches: number;
  costKusd: number;
}

export function launchOptions(
  data: GameData,
  orbit: ConstellationInput,
  chassis: ChassisId,
  satMassKg: number,
): LaunchOption[] {
  const o = normaliseConstellation(orbit);
  const N = o.planes * o.perPlane;
  return data.launchers.launchers.map((l) => {
    if (l.id === 'rideshare') {
      const p = l.price!;
      const perLaunch = p.baseKusd + Math.max(0, o.perPlane * satMassKg - p.baseKg) * p.perKgKusd;
      const ok = o.preset === 'sso' && o.hKm >= l.hMin! && o.hKm <= l.hMax!;
      return {
        launcher: l,
        compatible: ok,
        reason: ok ? '' : `Chỉ SSO ${l.hMin}–${l.hMax} km`,
        launches: o.planes,
        costKusd: Math.round(o.planes * perLaunch),
      };
    }
    if (l.id === 'iss') {
      const chassisOk = CHASSIS_ORDER.indexOf(chassis) <= CHASSIS_ORDER.indexOf(l.maxChassis!);
      const ok = o.preset === 'iss' && chassisOk;
      return {
        launcher: l,
        compatible: ok,
        reason: ok ? '' : o.preset !== 'iss' ? 'Chỉ quỹ đạo ISS 51,6° · 400 km' : `Khung tối đa ${l.maxChassis}`,
        launches: 1,
        costKusd: N * l.pricePerSatKusd!,
      };
    }
    return {
      launcher: l,
      compatible: true,
      reason: '',
      launches: o.planes,
      costKusd: o.planes * l.pricePerLaunchKusd!,
    };
  });
}

export interface LinkResult {
  id: LinkId;
  label: string;
  margin10: number;
  margin90: number;
}

export interface Requirement {
  id: 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8';
  name: string;
  value: string; // displayed value
  limit: string; // displayed threshold
  status: Status;
  hard: boolean;
}

export interface MissionInput {
  difficulty: DifficultyId;
  design: DesignInput;
  orbit: OrbitInput;
  /** false → Build-screen defaults (f_ecl 0.376, 17 min/day contact), no coverage. */
  orbitChosen: boolean;
  /** Coverage target; defaults to the scenario target (Hanoi). Tutorial uses its own. */
  target?: { lat: number; lon: number };
}

export interface MissionResult {
  orbit: OrbitInput; // normalised (ISS forces P=1, h=400)
  inclDeg: number;
  build: BuildSummary;
  envTest: boolean;
  coverage: CoverageResult | null;
  fEcl: number;
  contactMinPerDay: number;
  lifetimeY: number;
  lifetimeExtrapolated: boolean;
  hasSail: boolean;
  residualY: number | null;
  links: LinkResult[];
  launches: LaunchOption[];
  launch: LaunchOption;
  satCount: number;
  satsCostKusd: number;
  totalCostKusd: number;
  budgetKusd: number;
  reqs: Requirement[];
}

export const DEFAULT_ORBIT_H = 520;

const vn1 = (x: number) => roundTo(x, 1).toFixed(1).replace('.', ',');
const vn0 = (x: number) => Math.round(x).toLocaleString('vi-VN');

export function evaluateMission(data: GameData, input: MissionInput): MissionResult {
  const rules = data.scenario.difficulty[input.difficulty];
  const req = data.scenario.requirements;
  const orbit = { ...normaliseConstellation(input.orbit), launcher: input.orbit.launcher };
  const inclDeg = presetInclination(orbit.preset, orbit.hKm);

  const coverage = input.orbitChosen ? simulateCoverage(orbit, input.target ?? data.scenario.target) : null;
  const fEcl = input.orbitChosen ? eclipseFraction(orbit.hKm) : DEFAULT_F_ECL;
  const tEclH = input.orbitChosen
    ? eclipseHours(orbit.hKm)
    : (DEFAULT_F_ECL * periodSec(DEFAULT_ORBIT_H)) / 3600;
  const contactMinPerDay = coverage ? coverage.contactMinPerDayPerSat : DEFAULT_CONTACT_MIN;

  const build = summariseBuild(data.components, input.design, { fEcl, tEclH, contactMinPerDay });

  const lt = lifetimeYears(data.lifetime, orbit.hKm, rules.lifetime);
  const sail = build.parts.find((p) => p.sailAreaM2);
  const residualY = sail
    ? sailResidualYears(lt.years, data.scenario.opsYears, data.lifetime.aBodyM2, sail.sailAreaM2!)
    : null;

  const bands = new Set(build.parts.map((p) => p.band).filter(Boolean));
  const linkIds: LinkId[] = [];
  if (bands.has('uhf')) linkIds.push('uhf');
  if (bands.has('s')) linkIds.push('s');
  if (build.parts.some((p) => p.id === 'sos')) linkIds.push('sos');
  const links = linkIds.map((id) => ({
    id,
    label: LINKS[id].label,
    margin10: linkMarginDb(LINKS[id], orbit.hKm, req.elevationDeg),
    margin90: linkMarginDb(LINKS[id], orbit.hKm, 90),
  }));

  const launches = launchOptions(data, orbit, input.design.chassis, build.massKg);
  const launch = launches.find((l) => l.launcher.id === orbit.launcher) ?? launches[0];
  const satCount = orbit.planes * orbit.perPlane;
  const satsCostKusd = satCount * build.costPerSatKusd;
  const totalCostKusd = satsCostKusd + launch.costKusd;

  // ---- Requirements ----
  const reqs: Requirement[] = [];
  reqs.push({
    id: 'R1',
    name: 'Khoảng trống liên lạc dài nhất',
    value: coverage ? `${vn1(coverage.longestGapH)} h` : '—',
    limit: `≤ ${vn1(rules.gapMaxH)} h`,
    status: coverage ? statusMax(coverage.longestGapH, rules.gapMaxH, 1) : 'SAT',
    hard: false,
  });
  const prod = roundTo(build.dataProducedMB, 1);
  const down = roundTo(build.dataDownlinkMB, 1);
  reqs.push({
    id: 'R2',
    name: 'Dữ liệu tạo ≤ dữ liệu tải xuống',
    value: `${vn1(build.dataProducedMB)} / ${vn1(build.dataDownlinkMB)} MB/ngày`,
    limit: 'không tồn đọng',
    status: down > 0 ? statusFromRatio(prod / down) : 'VUOT',
    hard: false,
  });
  const pGen = roundTo(build.pGenW, 1);
  const pNeed = roundTo(build.pUseW, 1) * req.powerMargin;
  const batt = roundTo(build.batteryHaveWh, 1);
  reqs.push({
    id: 'R3',
    name: 'Năng lượng & pin',
    value: `${vn1(build.pGenW)} / ${vn1(build.pUseW)} W · pin ${vn1(build.batteryHaveWh)}/${vn1(build.batteryNeedWh)} Wh`,
    limit: `P ≥ ${vn1(req.powerMargin)}× · pin đủ`,
    status: worst(
      pGen > 0 ? statusFromRatio(pNeed / pGen) : 'VUOT',
      batt > 0 ? statusFromRatio(roundTo(build.batteryNeedWh, 1) / batt) : 'VUOT',
    ),
    hard: false,
  });
  const lowStatus = statusMin(lt.years, req.lifetimeMinY, 1);
  reqs.push({
    id: 'R4',
    name: 'Tuổi thọ quỹ đạo',
    value:
      `${vn1(lt.years)} năm` +
      (lt.extrapolated ? ' (ngoại suy)' : '') +
      (residualY !== null ? ` · tồn lưu ${vn1(residualY)} năm` : ''),
    limit:
      residualY !== null
        ? `L ≥ ${req.lifetimeMinY} · tồn lưu ≤ ${req.residualMaxY} năm`
        : `${req.lifetimeMinY}–${req.lifetimeMaxY} năm`,
    status: worst(
      lowStatus,
      residualY !== null
        ? statusMax(residualY, req.residualMaxY, 1)
        : statusMax(lt.years, req.lifetimeMaxY, 1),
    ),
    hard: false,
  });
  reqs.push({
    id: 'R5',
    name: 'Tổng chi phí',
    value: `${vn0(totalCostKusd)}k`,
    limit: `≤ ${vn0(rules.budget)}k`,
    status: statusMax(totalCostKusd, rules.budget, 0),
    hard: true,
  });
  reqs.push({
    id: 'R6',
    name: 'Thời gian phát triển',
    value: `${build.devMonths} tháng`,
    limit: `≤ ${req.devMonthsMax} tháng`,
    status: statusMax(build.devMonths, req.devMonthsMax, 0),
    hard: false,
  });
  const minMargin = links.length ? Math.min(...links.map((l) => l.margin10)) : -Infinity;
  reqs.push({
    id: 'R7',
    name: 'Biên đường truyền @10°',
    value: links.length ? links.map((l) => `${vn1(l.margin10)}`).join(' / ') + ' dB' : '—',
    limit: `≥ ${req.linkMarginDb} dB`,
    status: links.length ? statusMin(minMargin, req.linkMarginDb, 1) : 'VUOT',
    hard: false,
  });
  reqs.push({
    id: 'R8',
    name: 'Đủ hệ thống bắt buộc · ô & khối lượng',
    value: build.hardErrors.length ? `${build.hardErrors.length} lỗi` : 'đủ',
    limit: 'OBC · EPS · ADCS · máy phát · SOS',
    status: build.hardErrors.length ? 'VUOT' : 'DAT',
    hard: true,
  });

  return {
    orbit,
    inclDeg,
    build,
    envTest: input.design.envTest,
    coverage,
    fEcl,
    contactMinPerDay,
    lifetimeY: lt.years,
    lifetimeExtrapolated: lt.extrapolated,
    hasSail: !!sail,
    residualY,
    links,
    launches,
    launch,
    satCount,
    satsCostKusd,
    totalCostKusd,
    budgetKusd: rules.budget,
    reqs,
  };
}
