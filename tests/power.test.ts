import { describe, expect, it } from 'vitest';
import { bodyPowerW, wingPowerW } from '../src/sim/power';
import { eclipseFraction, periodSec } from '../src/sim/orbit';
import { summariseBuild } from '../src/sim/build';
import { DEFAULT_CONTACT_MIN, DEFAULT_F_ECL } from '../src/sim/power';
import { data, near, REF_DESIGN } from './fixtures';

const f520 = eclipseFraction(520);

describe('power (SPEC §10)', () => {
  it.each([
    ['3U', 0.156, 5.7],
    ['6U', 0.267, 9.8],
    ['12U', 0.41, 15.0],
  ])('P_gen %s = %f W @520', (_id, area, w) => expect(near(bodyPowerW(area as number, f520), w as number)).toBe(true));

  it('wings +12.1 W', () => expect(near(wingPowerW(0.136, 0.5, f520), 12.1)).toBe(true));
});

describe('build: reference design (SPEC §10)', () => {
  const s = summariseBuild(data.components, REF_DESIGN, {
    fEcl: DEFAULT_F_ECL,
    tEclH: (DEFAULT_F_ECL * periodSec(520)) / 3600,
    contactMinPerDay: DEFAULT_CONTACT_MIN,
  });
  it('P_use 3.27 W', () => expect(near(s.pUseW, 3.27)).toBe(true));
  it('battery need 6.5 Wh', () => expect(near(s.batteryNeedWh, 6.5)).toBe(true));
  it('cost 310 k/sat', () => expect(s.costPerSatKusd).toBe(310));
  it('11 months', () => expect(s.devMonths).toBe(11));
  it('passes R8', () => expect(s.hardErrors).toEqual([]));
  it('S-band downlink 255 MB/day', () => expect(near(s.dataDownlinkMB, 255)).toBe(true));
});

describe('build: hard constraints (R8)', () => {
  const ctx = { fEcl: 0.376, tEclH: 0.6, contactMinPerDay: 17 };
  it('flags missing subsystems', () => {
    const s = summariseBuild(data.components, { ...REF_DESIGN, parts: ['sband'] }, ctx);
    expect(s.hardErrors.map((e) => e.code).sort()).toEqual(['missing_adcs', 'missing_eps', 'missing_obc', 'missing_sos']);
  });
  it('flags cells over chassis', () => {
    const s = summariseBuild(
      data.components,
      { ...REF_DESIGN, chassis: '3U', parts: ['obc', 'eps', 'adcs', 'sband', 'sos', 'bat', 'bat'] },
      ctx,
    );
    expect(s.hardErrors.map((e) => e.code)).toContain('cells');
  });
});
