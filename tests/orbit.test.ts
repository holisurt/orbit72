import { describe, expect, it } from 'vitest';
import {
  coverageRadiusKm,
  eclipseFraction,
  periodMin,
  ssoInclinationDeg,
  slantRangeKm,
} from '../src/sim/orbit';
import { near } from './fixtures';

describe('orbit (SPEC §10)', () => {
  it.each([
    [500, 94.6],
    [520, 95.0],
    [420, 93.0],
  ])('T(%i) = %f min', (h, T) => expect(near(periodMin(h), T)).toBe(true));

  it.each([
    [500, 37.8],
    [520, 37.6],
  ])('f_ecl(%i) = %f %%', (h, f) => expect(near(eclipseFraction(h) * 100, f)).toBe(true));

  it('λ(500) = 1564 km', () => expect(near(coverageRadiusKm(500, 10), 1564)).toBe(true));

  it.each([
    [500, 97.4],
    [520, 97.48],
    [550, 97.59],
  ])('SSO i(%i) = %f°', (h, i) => expect(near(ssoInclinationDeg(h), i)).toBe(true));

  it('slant range @520, 10° ≈ 1744 km', () => expect(near(slantRangeKm(520, 10), 1744)).toBe(true));
});
