// v1.1 logic audit: S1 reference values in one place, co-op cards, rounding rule, corrupted / old saves.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ReactElement } from 'react';
import { DataProvider } from '../src/data/context';
import { evaluateMission, roundTo, statusMax, statusMin } from '../src/sim/mission';
import { buildOpsContext, evaluateEventOptions, imergWeights, runOps } from '../src/sim/ops';
import { priorityCards } from '../src/sim/score';
import { initialState, loadState, reducer, sanitizeState, StoreProvider, STORAGE_KEY, type Action, type GameState } from '../src/state/store';
import { Build } from '../src/screens/Build';
import { Ops } from '../src/screens/Ops';
import { Debrief } from '../src/screens/Debrief';
import { Home } from '../src/screens/Home';
import type { GameEvent } from '../src/data/types';
import { dataNasa as data, HANOI, REF_DESIGN } from './fixtures';

const S1 = { preset: 'sso' as const, hKm: 520, planes: 4, perPlane: 1, launcher: 'rideshare' as const };
const m = evaluateMission(data, { difficulty: 'ky_su', design: REF_DESIGN, orbit: S1, orbitChosen: true });
const ctx = buildOpsContext(S1, HANOI, data.scenario.partnerStation);
const base = { events: [] as GameEvent[], hasShield: false, hourlyWeights: imergWeights(data.imerg) };
const nominal = runOps(ctx, { ...base, choices: {} });
const ev = (id: string) => data.events.events.find((e) => e.id === id) as GameEvent;
const render = (el: ReactElement, s: GameState) =>
  renderToString(
    <DataProvider initial={{ data, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
      <StoreProvider initial={s}>{el}</StoreProvider>
    </DataProvider>,
  ).replace(/<!-- -->/g, '');

describe('S1 reference values (unchanged by v1.1)', () => {
  it('3,0 h · 49,1 % · 48,1 % (IMERG) · 2.640k · L 6,5 · margins 9,7/8,4/9,3 dB', () => {
    expect(roundTo(m.coverage!.longestGapH, 1)).toBe(3.0);
    expect(roundTo(nominal.p1h, 1)).toBe(49.1);
    expect(roundTo(nominal.p1hRain, 1)).toBe(48.1);
    expect(m.totalCostKusd).toBe(2640);
    expect(roundTo(m.lifetimeY, 1)).toBe(6.5);
    expect(m.links.map((l) => roundTo(l.margin10, 1))).toEqual([8.4, 9.3]); // S-band + SOS installed
    expect(roundTo(evaluateMission(data, { difficulty: 'ky_su', design: { ...REF_DESIGN, parts: ['obc', 'eps', 'adcs', 'uhf', 'sos'] }, orbit: S1, orbitChosen: true }).links[0].margin10, 1)).toBe(9.7);
  });
  it('E1 46/48/48 · E2 49/45/48', () => {
    expect(evaluateEventOptions(ctx, base, ev('E1')).map((o) => o.p1hDisplay)).toEqual([46, 48, 48]);
    expect(evaluateEventOptions(ctx, base, ev('E2')).map((o) => o.p1hDisplay)).toEqual([49, 45, 48]);
  });
  it('8/8 requirements pass (R1, R4, R5 SÁT count as passing)', () => {
    expect(m.reqs.filter((r) => r.status !== 'VUOT')).toHaveLength(8);
    // R1 3,0/3,5 h = 86 % · R4 6,5/8 năm = 81 % · R5 2.640/3.000k = 88 % → SÁT (80–100 %)
    expect(m.reqs.filter((r) => r.status === 'SAT').map((r) => r.id)).toEqual(['R1', 'R4', 'R5']);
  });
});

describe('rounding rule: thresholds compared on displayed values', () => {
  it('3,04 h vs ≤ 3,0 → shown 3,0 → passes; 3,05 → shown 3,1 → fails', () => {
    expect(statusMax(3.04, 3.0, 1)).not.toBe('VUOT');
    expect(statusMax(3.05, 3.0, 1)).toBe('VUOT');
  });
  it('2,96 dB vs ≥ 3 → shown 3,0 → passes', () => expect(statusMin(2.96, 3, 1)).not.toBe('VUOT'));
});

describe('co-op priority cards (SPEC §8)', () => {
  const c = (cards: Parameters<typeof priorityCards>[0], mm = m) => priorityCards(cards, mm);
  it('KH (a) data ≤ 50 % of downlink: S-band 5 / 255 MB → met; UHF 5 / 1,22 MB → not met', () => {
    expect(c({ FD: 'a', VT: 'a', KH: 'a', QD: 'a' })[2]).toMatchObject({ met: true, value: 'dữ liệu 2% dung lượng tải xuống' });
    const uhf = evaluateMission(data, { difficulty: 'ky_su', design: { ...REF_DESIGN, parts: ['obc', 'eps', 'adcs', 'uhf', 'sos'] }, orbit: S1, orbitChosen: true });
    expect(c({ FD: 'a', VT: 'a', KH: 'a', QD: 'a' }, uhf)[2].met).toBe(false);
  });
  it('FD (b) reserve ≥ 200k: 360k → met · VT (b) env test → not met · QĐ (b) margins ≥ 6 dB → met', () => {
    const r = c({ FD: 'b', VT: 'b', KH: 'b', QD: 'b' });
    expect(r.map((x) => x.met)).toEqual([true, false, false, true]);
  });
});

describe('saved games', () => {
  it('corrupted JSON → fresh game, no crash', () => {
    const store = new Map<string, string>([[STORAGE_KEY, '{not json']]);
    const g = globalThis as unknown as { localStorage?: Storage };
    const prev = g.localStorage;
    g.localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: () => {} } as unknown as Storage;
    try {
      expect(loadState()).toEqual(initialState);
    } finally {
      g.localStorage = prev;
    }
  });

  it.each([
    ['wrong version', { v: 2 }],
    ['design is a string', { ...initialState, design: 'x' }],
    ['parts not strings', { ...initialState, design: { ...initialState.design, parts: [1, 2] } }],
    ['unknown screen', { ...initialState, screen: 'nowhere' }],
    ['orbit NaN', { ...initialState, orbit: { ...initialState.orbit, hKm: 'high' } }],
    ['quiz garbage', { ...initialState, quiz: { pre: 'x', post: null } }],
    ['null', null],
    ['array', []],
  ])('%s → fresh game', (_n, bad) => expect(sanitizeState(bad)).toEqual(initialState));

  it('v1.0 save (Giám đốc, camera, E3/E4 choices, launch failures) migrates and renders', () => {
    const old = {
      ...initialState,
      screen: 'debrief',
      difficulty: 'giam_doc',
      contract: { id: 'golden72', accepted: true },
      design: { chassis: '6U', parts: ['obc', 'eps', 'adcs', 'sband', 'sos', 'cam', 'adcs2'], wings: false, envTest: false },
      orbit: { ...initialState.orbit, planes: 99, chosen: true },
      ops: { ...initialState.ops, choices: { E0: 'A', E1: 'B', E2: 'A', E3: 'C', E4: 'B' }, done: true, launch: { attempts: [{ launch: 0, failed: true, replaced: true }], lostPlanes: [], extraCostKusd: 350, extraMonths: 3, inOrbit: true, launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true } },
    };
    const s = sanitizeState(JSON.parse(JSON.stringify(old)));
    expect(s.difficulty).toBe('ky_su');
    expect(s.design.parts).toEqual(['obc', 'eps', 'adcs', 'sband', 'sos']);
    expect(s.orbit.planes).toBe(6);
    expect(s.ops.choices).toEqual({ E0: 'A', E1: 'B', E2: 'A' });
    expect(s.ops.launch).toEqual({ launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true });
    for (const el of [<Home />, <Build />, <Ops />, <Debrief />]) expect(() => render(el, s)).not.toThrow();
  });

  it('a valid save round-trips unchanged', () => {
    const s = [{ type: 'startMission' }, { type: 'acceptContract' }, { type: 'addPart', id: 'sband' }].reduce((st, a) => reducer(st, a as Action), initialState);
    expect(sanitizeState(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });
});
