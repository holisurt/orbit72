import { describe, expect, it } from 'vitest';
import { evaluateMission } from '../src/sim/mission';
import { buildOpsContext, evaluateEventOptions, imagingPasses, cloudModel, runOps } from '../src/sim/ops';
import {
  cmlLevel,
  computeScore,
  outcome,
  priorityCards,
  starsFromP1h,
  starsFromVfm,
  whyChain,
  type EventDecision,
} from '../src/sim/score';
import { hashSeed, mulberry32, simulateLaunches } from '../src/sim/launch';
import { data, HANOI, REF_DESIGN } from './fixtures';
import type { GameEvent } from '../src/data/types';

const S1orbit = { preset: 'sso' as const, hKm: 520, planes: 4, perPlane: 1, launcher: 'rideshare' as const };
const mission = evaluateMission(data, { difficulty: 'ky_su', design: REF_DESIGN, orbit: S1orbit, orbitChosen: true });
const ctx = buildOpsContext(S1orbit, HANOI, data.scenario.partnerStation);
const active = data.events.events.filter((e) => ['E0', 'E1', 'E2', 'E3'].includes(e.id)) as GameEvent[];

function play(choices: Record<string, string>) {
  const base = { events: active, hasShield: false, hourlyWeights: null };
  const ops = runOps(ctx, { ...base, choices });
  const decisions: EventDecision[] = active.map((ev) => ({
    event: ev,
    chosen: choices[ev.id],
    outcomes: evaluateEventOptions(ctx, base, ev),
  }));
  const nominal = runOps(ctx, { ...base, events: [], choices: {} });
  const score = computeScore({
    mission,
    inOrbit: true,
    p1hRainOps: ops.p1hRain,
    p1hRainNominal: nominal.p1hRain,
    imaging: imagingPasses(ops, false, cloudModel(null, 0.1, null), null),
    launchedWithVuot: false,
    launchedWithNoGo: false,
    decisions,
    decisionPenalty: ops.decisionPenalty,
    prevOverall: null,
    mode: 'solo',
  });
  return { ops, decisions, score };
}

const best = { E0: 'A', E1: 'B', E2: 'A', E3: 'A' };

describe('score: star formulas on S1 (SPEC §7)', () => {
  const { score, ops } = play(best);

  it('8/8 → THÀNH CÔNG, star 1 = 5', () => {
    expect(score.passed).toBe(8);
    expect(score.outcome).toBe('THANH_CONG');
    expect(score.stars[0].stars).toBe(5);
  });

  it('star 2 from P1h_rain after events', () => {
    expect(score.stars[1].stars).toBe(starsFromP1h(ops.p1hRain));
  });

  it('star 3: VFM = 49.1 / 2.64 ≈ 18.6 → 4 stars (nominal, events excluded)', () => {
    expect(score.stars[2].formula).toMatch(/VFM = 49,1 \/ 2,64 = 18,6/);
    expect(score.stars[2].stars).toBe(4);
  });

  it('star 4: best choices, 4/4 GO → 100 → 5 stars', () => {
    expect(score.star4Score).toBe(100);
    expect(score.stars[3].stars).toBe(5);
  });

  it('star 4: E1-A is the worst option → −20 → 4 stars', () => {
    const r = play({ ...best, E1: 'A' }).score;
    expect(r.star4Score).toBe(80);
    expect(r.stars[3].stars).toBe(4);
  });

  it('star 4: E2-C is middle → −10', () => {
    expect(play({ ...best, E2: 'C' }).score.star4Score).toBe(90);
  });

  it('star 5 solo: no env test 0 + power margin 30 + budget margin (12 %) 30 = 60 → 3', () => {
    expect(score.star5Score).toBe(60);
    expect(score.stars[4].stars).toBe(3);
  });

  it('overall = mean of the 5 stars', () => {
    const mean = score.stars.reduce((a, s) => a + s.stars, 0) / 5;
    expect(score.overall).toBeCloseTo(mean, 1);
  });
});

describe('star tables', () => {
  it('P1h thresholds', () => expect([70, 55, 40, 25, 24.9].map(starsFromP1h)).toEqual([5, 4, 3, 2, 1]));
  it('VFM thresholds', () => expect([20, 17, 14, 10, 9.9].map(starsFromVfm)).toEqual([5, 4, 3, 2, 1]));
  it('outcome', () => {
    expect(outcome(8, false)).toBe('MOT_PHAN');
    expect(outcome(6, true)).toBe('MOT_PHAN');
    expect(outcome(5, true)).toBe('THAT_BAI');
  });
});

describe('priority cards (SPEC §8) on S1', () => {
  const c = priorityCards({ FD: 'a', VT: 'a', KH: 'b', QD: 'a' }, mission);
  it('FD cost ≤ 90 %: 88 % → met', () => expect(c[0].met).toBe(true));
  it('VT power margin ≥ 20 % → met', () => expect(c[1].met).toBe(true));
  it('KH P1h ≥ 55 %: 49 % → not met', () => expect(c[2].met).toBe(false));
  it('QĐ gap ≤ 3,0 h: 3,0 → met (display rounding)', () => expect(c[3].met).toBe(true));
});

describe('why-chain', () => {
  it('lists near/failed requirements with lever, and non-best event choices', () => {
    const { decisions } = play({ ...best, E1: 'A' });
    const w = whyChain(mission, decisions.map((d) => (d.event.id === 'E1' ? { ...d, chosen: 'A' } : d)));
    expect(w.find((x) => x.cause.startsWith('Khoảng trống'))?.sentence).toMatch(
      /Khoảng trống liên lạc dài nhất = 3,0 h, ngưỡng ≤ 3,5 h → Sát ngưỡng: .*\. Thử: thêm mặt phẳng/,
    );
    expect(w.some((x) => x.cause.startsWith('E1'))).toBe(true);
  });
});

describe('CML badge (SPEC §12)', () => {
  // S1 with the UHF → S-band swap: two design changes (remove + add), 8/8 passed (R1, R5 SÁT count as passing)
  const s1 = { contractAccepted: true, hardOk: true, designChanges: 2, reruns: 0, launched: true, allPassed: true };
  it('S1 run (UHF→S-band swap) + spec sheet export → CML4', () => expect(cmlLevel({ ...s1, specExported: true })).toBe(4));
  it('S1 run without export → CML3', () => expect(cmlLevel({ ...s1, specExported: false })).toBe(3));
  it('no design change and no rerun → CML2, even launched 8/8 with export (cumulative)', () =>
    expect(cmlLevel({ ...s1, designChanges: 0, specExported: true })).toBe(2));
  it('a rerun alone satisfies CML3', () => expect(cmlLevel({ ...s1, designChanges: 0, reruns: 1, specExported: false })).toBe(3));
  it('a VƯỢT requirement blocks CML4', () => expect(cmlLevel({ ...s1, allPassed: false, specExported: true })).toBe(3));
  it('hard constraint failed → CML1 (higher levels do not count)', () =>
    expect(cmlLevel({ ...s1, hardOk: false, specExported: true })).toBe(1));
  it('contract not accepted → CML0', () => expect(cmlLevel({ ...s1, contractAccepted: false, specExported: true })).toBe(0));
});

describe('launch (giam_doc 3 %, seeded)', () => {
  it('is deterministic for a seed', () => {
    const run = () =>
      simulateLaunches({ launches: 4, planesPerLaunch: 1, costPerLaunchKusd: 350, failProb: 0.03, budgetKusd: 2800, costKusd: 2640, rng: mulberry32(hashSeed('20261114-1')) });
    expect(run()).toEqual(run());
  });
  it('failed launch without budget loses that plane', () => {
    const r = simulateLaunches({ launches: 2, planesPerLaunch: 1, costPerLaunchKusd: 350, failProb: 1, budgetKusd: 1000, costKusd: 1000, rng: () => 0 });
    expect(r.lostPlanes).toEqual([0, 1]);
    expect(r.inOrbit).toBe(false);
  });
  it('failed launch with budget is replaced (+cost, +3 months)', () => {
    let n = 0;
    const r = simulateLaunches({ launches: 1, planesPerLaunch: 1, costPerLaunchKusd: 350, failProb: 0.5, budgetKusd: 3000, costKusd: 2000, rng: () => (n++ === 0 ? 0.1 : 0.9) });
    expect(r).toMatchObject({ lostPlanes: [], extraCostKusd: 350, extraMonths: 3, inOrbit: true });
  });
  it('difficulty-free: failProb 0 never fails', () => {
    const r = simulateLaunches({ launches: 6, planesPerLaunch: 1, costPerLaunchKusd: 350, failProb: 0, budgetKusd: 0, costKusd: 0, rng: Math.random });
    expect(r.inOrbit).toBe(true);
  });
});
