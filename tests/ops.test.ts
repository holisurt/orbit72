import { describe, expect, it } from 'vitest';
import { buildOpsContext, evaluateEventOptions, imergWeights, runOps, type OpsConfig } from '../src/sim/ops';
import { simulateCoverage } from '../src/sim/coverage';
import { data, HANOI } from './fixtures';
import type { GameEvent } from '../src/data/types';

const S1 = { preset: 'sso' as const, hKm: 520, planes: 4, perPlane: 1 };
const HCMC = data.scenario.partnerStation;
const ctx = buildOpsContext(S1, HANOI, HCMC);
const ev = (id: string) => data.events.events.find((e) => e.id === id)! as GameEvent;
const base: Omit<OpsConfig, 'choices'> = { events: [], hasShield: false };

const pct = (id: string) => evaluateEventOptions(ctx, base, ev(id)).map((o) => o.p1hDisplay);

describe('ops (SPEC §6, §10)', () => {
  it('no events: ops P1h equals coverage P1h', () => {
    const r = runOps(ctx, { ...base, choices: {} });
    expect(r.p1h).toBeCloseTo(simulateCoverage(S1, HANOI).p1h, 9);
  });

  it('S1 E1 A/B/C = 46/48/48 %', () => expect(pct('E1')).toEqual([46, 48, 48]));
  it('S1 E2 A/B/C = 49/45/48 %', () => expect(pct('E2')).toEqual([49, 45, 48]));

  it('E1 ranking: B and C tie as best, A worst', () => {
    expect(evaluateEventOptions(ctx, base, ev('E1')).map((o) => o.rank)).toEqual(['worst', 'best', 'best']);
  });
  it('E2 ranking: A best, C middle, B worst', () => {
    expect(evaluateEventOptions(ctx, base, ev('E2')).map((o) => o.rank)).toEqual(['best', 'worst', 'middle']);
  });

  it('E1-B with radiation shielding loses nothing', () => {
    const r = runOps(ctx, { ...base, hasShield: true, events: [ev('E1')], choices: { E1: 'B' } });
    expect(Math.round(r.p1h)).toBe(49);
  });

  it('E0-B loses satellite #1 for the whole run', () => {
    const r = runOps(ctx, { ...base, events: [ev('E0')], choices: { E0: 'B' } });
    expect(r.satLost[0]).toBe(true);
    expect(r.satEff[0].every((x) => x === 0)).toBe(true);
  });

  it('E2-A costs 20k', () => {
    expect(runOps(ctx, { ...base, events: [ev('E2')], choices: { E2: 'A' } }).eventCostKusd).toBe(20);
  });

  it('no satellites (R6 > 18 months) → P1h = 0', () => {
    expect(runOps(ctx, { ...base, noSatellites: true, choices: {} }).p1h).toBe(0);
  });

  it('P1h_rain with w = 1 equals P1h', () => {
    const r = runOps(ctx, { ...base, choices: {}, hourlyWeights: new Array(72).fill(1) });
    expect(r.p1hRain).toBeCloseTo(r.p1h, 9);
  });

  it('IMERG weights w(h) = 1 + R(h)/mean(R)', () => {
    const w = imergWeights({ hours: [], hanoi_mmh: [], box_mean_mmh: [0, 2, 4] }, 3)!;
    expect(w).toEqual([1, 2, 3]); // mean R = 2
  });
});
