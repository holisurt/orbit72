import { describe, expect, it } from 'vitest';
import { evaluateMission, statusMax, statusMin } from '../src/sim/mission';
import { data, REF_DESIGN } from './fixtures';

const S1 = { preset: 'sso' as const, hKm: 520, planes: 4, perPlane: 1, launcher: 'rideshare' as const };

describe('mission (SPEC §10)', () => {
  it('cost S1 (4×1) = 2640 k', () => {
    const r = evaluateMission(data, { difficulty: 'ky_su', design: REF_DESIGN, orbit: S1, orbitChosen: true });
    expect(r.totalCostKusd).toBe(2640);
  });
  it('cost S2 (3×2) = 2910 k', () => {
    const r = evaluateMission(data, {
      difficulty: 'ky_su',
      design: REF_DESIGN,
      orbit: { ...S1, planes: 3, perPlane: 2 },
      orbitChosen: true,
    });
    expect(r.totalCostKusd).toBe(2910);
  });
  it('S1 passes R1–R8 (CP2 check values)', () => {
    const r = evaluateMission(data, { difficulty: 'ky_su', design: REF_DESIGN, orbit: S1, orbitChosen: true });
    expect(r.reqs.map((q) => q.status)).not.toContain('VUOT');
    expect(r.reqs.find((q) => q.id === 'R1')!.value).toBe('3,0 h');
    expect(Math.round(r.coverage!.p1h)).toBe(49);
    expect(r.lifetimeY).toBeCloseTo(6.5, 1);
    expect(r.links.map((l) => l.margin10.toFixed(1))).toEqual(['8.4', '9.3']);
  });
  it('rideshare is incompatible with non-SSO presets', () => {
    const r = evaluateMission(data, {
      difficulty: 'ky_su',
      design: REF_DESIGN,
      orbit: { ...S1, preset: 'leo53' },
      orbitChosen: false,
    });
    expect(r.launches.find((l) => l.launcher.id === 'rideshare')!.compatible).toBe(false);
  });
});

describe('status rule (SPEC §3, §7)', () => {
  it('ĐẠT ≤ 80 %, SÁT 80–100 %, VƯỢT > 100 %', () => {
    expect(statusMax(2.8, 3.5, 1)).toBe('DAT');
    expect(statusMax(3.0, 3.5, 1)).toBe('SAT');
    expect(statusMax(3.6, 3.5, 1)).toBe('VUOT');
  });
  it('compares on displayed values', () => {
    expect(statusMax(3.54, 3.5, 1)).toBe('SAT'); // displays 3,5
    expect(statusMin(2.96, 3, 1)).toBe('SAT'); // displays 3,0 dB
  });
});
