import { describe, expect, it } from 'vitest';
import { countPasses, simulateCoverage, weightedP1h, type PresetId } from '../src/sim/coverage';
import { HANOI } from './fixtures';

// SPEC §10: gap h / P1h % / contact min/day/sat. Tolerances: gap ±0.1 h, % ±1, contact ±1 %.
const rows: [PresetId, number, number, number, number, number, number | null][] = [
  ['sso', 520, 1, 1, 11.9, 12, 19],
  ['sso', 520, 1, 3, 11.1, 22, 17],
  ['sso', 520, 2, 1, 6.0, 25, 17],
  ['sso', 520, 3, 1, 4.4, 38, 17],
  ['sso', 520, 4, 1, 3.0, 49, 17],
  ['sso', 520, 3, 2, 3.2, 58, 16],
  ['sso', 520, 5, 1, 2.9, 61, 17],
  ['iss', 400, 1, 1, 13.2, 14, 16],
  ['low20', 520, 3, 1, 1.6, 73, 41],
  ['leo53', 550, 1, 1, 13.6, 16, null],
  ['leo53', 550, 3, 1, 5.9, 42, null],
  ['leo53', 550, 5, 1, 3.7, 57, null],
];

describe('coverage (SPEC §10)', () => {
  it.each(rows)('%s@%i %i×%i → gap %f h, P1h %f %%, contact %s', (preset, h, P, k, gap, p1, contact) => {
    const r = simulateCoverage({ preset, hKm: h, planes: P, perPlane: k }, HANOI);
    expect(Math.abs(r.longestGapH - gap)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(r.p1h - p1)).toBeLessThanOrEqual(1);
    // contact is reported as an integer in SPEC → compare rounded values
    if (contact !== null) expect(Math.round(r.contactMinPerDayPerSat)).toBe(contact);
  });

  it('tutorial (3U SSO 520, target 16°N 112°E): 3 passes on day 1', () => {
    const r = simulateCoverage({ preset: 'sso', hKm: 520, planes: 1, perPlane: 1 }, { lat: 16, lon: 112 });
    expect(countPasses(r.vis.slice(0, 1440))).toBe(3);
  });

  it('P1h_rain with w = 1 equals P1h', () => {
    const r = simulateCoverage({ preset: 'sso', hKm: 520, planes: 4, perPlane: 1 }, HANOI);
    const w = new Array(r.vis.length).fill(1);
    expect(weightedP1h(r.vis, w)).toBeCloseTo(r.p1h, 9);
  });

  it('ISS preset forces P = 1, h = 400', () => {
    const r = simulateCoverage({ preset: 'iss', hKm: 520, planes: 3, perPlane: 1 }, HANOI);
    expect(r.perSat.length).toBe(1);
  });
});
