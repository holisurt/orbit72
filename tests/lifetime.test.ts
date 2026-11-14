import { describe, expect, it } from 'vitest';
import { lifetimeYears, sailResidualYears } from '../src/sim/lifetime';
import { data, near } from './fixtures';

describe('lifetime (SPEC §10)', () => {
  it('L(520) = 6.5 y', () => expect(near(lifetimeYears(data.lifetime, 520).years, 6.5)).toBe(true));
  it('L(550) = 10.9 y', () => expect(near(lifetimeYears(data.lifetime, 550).years, 10.9)).toBe(true));
  it('sail @600 → residual 1.9 y', () => {
    const L = lifetimeYears(data.lifetime, 600).years;
    expect(sailResidualYears(L, 3, 0.047, 0.5)).toBeCloseTo(1.9, 1);
  });
  it('interpolates log-linearly between table rows', () => {
    const y = lifetimeYears(data.lifetime, 535).years;
    expect(near(y, Math.sqrt(6.5 * 10.9))).toBe(true);
  });
  it('labels extrapolation outside 450–600', () => {
    expect(lifetimeYears(data.lifetime, 400).extrapolated).toBe(true);
    expect(lifetimeYears(data.lifetime, 500).extrapolated).toBe(false);
  });
});
