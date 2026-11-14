// CP4.7 Automated walk of tests/e2e-checklist.md (reducer + server render). The checklist's browser-only
// parts (clicks, keyboard, downloads, layout) are marked "manual" there.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ReactElement } from 'react';
import { DataProvider } from '../src/data/context';
import { initialState, loadState, reducer, saveState, StoreProvider, type Action, type GameState } from '../src/state/store';
import { evaluateMission } from '../src/sim/mission';
import { canAddPart } from '../src/sim/build';
import { ROLE_GROUPS } from '../src/state/roles';
import { Home } from '../src/screens/Home';
import { Brief } from '../src/screens/Brief';
import { Build } from '../src/screens/Build';
import { Orbit } from '../src/screens/Orbit';
import { Review } from '../src/screens/Review';
import { Ops } from '../src/screens/Ops';
import { Debrief } from '../src/screens/Debrief';
import { Setup } from '../src/screens/Setup';
import { Quiz } from '../src/screens/Quiz';
import { dataNasa as data } from './fixtures';

const play = (s: GameState, ...a: Action[]) => a.reduce(reducer, s);
const render = (el: ReactElement, s: GameState) =>
  renderToString(
    <DataProvider initial={{ data, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
      <StoreProvider initial={s}>{el}</StoreProvider>
    </DataProvider>,
  )
    .replace(/<!-- -->/g, '')
    .replace(/&amp;/g, '&');
const mission = (s: GameState) => evaluateMission(data, { difficulty: s.difficulty, design: s.design, orbit: s.orbit, orbitChosen: s.orbit.chosen });
const status = (s: GameState, id: string) => mission(s).reqs.find((r) => r.id === id)!.status;
const LAUNCH = { attempts: [], lostPlanes: [], extraCostKusd: 0, extraMonths: 0, inOrbit: true, launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true };
const allGo = (['FD', 'VT', 'KH', 'QD'] as const).map((role) => ({ type: 'vote', role, vote: 'go' }) as Action);

describe('e2e checklist walk (solo Kỹ sư)', () => {
  let s = initialState;

  it('1 · Home → Quiz(pre): "?" and ⚙ in the header; skip goes to Brief', () => {
    const h = render(<Home />, s);
    expect(h).toContain('aria-label="Sổ tay"');
    expect(h).toContain('aria-label="Cài đặt"');
    s = play(s, { type: 'startMission' });
    expect(s.screen).toBe('quiz_pre');
    expect(render(<Quiz phase="pre" />, s)).toContain('Bỏ qua');
    s = play(s, { type: 'answerQuiz', phase: 'pre', answers: 'skip' });
    expect(s.screen).toBe('brief');
  });

  it('2 · Brief: real IMERG 72 h map, accept contract → Build', () => {
    expect(render(<Brief />, s)).toContain('NASA GPM IMERG V07 Final · 7–10/9/2024');
    s = play(s, { type: 'acceptContract' });
    expect(s.screen).toBe('build');
  });

  it('3 · GDD §12 #1: missing SOS payload locks "Chọn quỹ đạo" and says what is missing (R8)', () => {
    const noSos = play(s, { type: 'removePart', index: s.design.parts.indexOf('sos') });
    const h = render(<Build />, noSos);
    expect(h).toContain('Thiếu Payload SOS.');
    expect(h).toMatch(/aria-disabled="true"[^>]*>Chọn quỹ đạo →/);
    expect(status(noSos, 'R8')).toBe('VUOT');
  });

  it('4 · GDD §12 #2–#4: no free cells → part cannot be added; smaller chassis → cells error; camera without ADCS+', () => {
    let full = s;
    while (canAddPart(data.components, full.design, 'bat')) full = play(full, { type: 'addPart', id: 'bat' });
    expect(mission(full).build.cellsUsed).toBe(12);
    expect(canAddPart(data.components, full.design, 'sos')).toBe(false);
    expect(render(<Build />, full)).toMatch(/aria-disabled="true"[^>]*aria-label="Thêm /);
    const small = play(full, { type: 'setChassis', chassis: '3U' });
    expect(mission(small).build.hardErrors.map((e) => e.code)).toContain('cells');
    const cam = play(s, { type: 'addPart', id: 'cam' });
    expect(mission(cam).build.hardErrors.map((e) => e.code)).toContain('needs_precise_adcs');
  });

  it('5 · Build: swap UHF → S-band (CML3 design change), go to Orbit', () => {
    s = play(s, { type: 'removePart', index: s.design.parts.indexOf('uhf') }, { type: 'addPart', id: 'sband' }, { type: 'go', screen: 'orbit' }, { type: 'chooseOrbit' });
    expect(s.designChanges).toBe(2);
    expect(status(s, 'R2')).not.toBe('VUOT');
  });

  it('6 · GDD §12 #5, #9, #16: incompatible launcher shows the reason and blocks launch; low orbit → R4 + "ngoại suy"', () => {
    const iss = play(s, { type: 'setOrbit', patch: { launcher: 'iss' } });
    expect(render(<Orbit />, iss)).toContain('KHÔNG: Chỉ quỹ đạo ISS 51,6° · 400 km');
    expect(render(<Review />, play(iss, ...allGo))).toContain('Tên lửa không tương thích');
    const low = play(s, { type: 'setOrbit', patch: { preset: 'low20', hKm: 420, launcher: 'dedicated' } });
    expect(render(<Orbit />, low)).toContain('(ngoại suy)');
    expect(status(low, 'R4')).toBe('VUOT');
  });

  it('7 · GDD §12 #6, #10: 6 planes × 3 → over budget (hard R5) → launch locked', () => {
    const spam = play(s, { type: 'setOrbit', patch: { planes: 6, perPlane: 3 } });
    expect(status(spam, 'R5')).toBe('VUOT');
    const h = render(<Review />, play(spam, ...allGo));
    expect(h).toContain('Ràng buộc cứng chưa đạt: R5');
    expect(h).toMatch(/aria-disabled="true"[^>]*>PHÓNG/);
  });

  it('8 · GDD §12 #8: dev time > 18 months is unreachable with components.json (max 15) — sim path covered in ops.test', () => {
    const slow = play(s, { type: 'setChassis', chassis: '12U' }, { type: 'addPart', id: 'prop' }, { type: 'toggleEnvTest' });
    expect(mission(slow).build.devMonths).toBeLessThanOrEqual(data.scenario.requirements.devMonthsMax);
  });

  it('9 · GDD §12 #12: Go/No-Go cannot be skipped; NO-GO needs a reason; 4/4 GO → launch', () => {
    s = play(s, { type: 'go', screen: 'review' });
    expect(render(<Review />, s)).not.toMatch(/<button class="step"[^>]*>5 /); // Ops is not a jump target
    const noReason = play(s, { type: 'vote', role: 'FD', vote: 'no' });
    expect(render(<Review />, noReason)).toContain('NO-GO cần ghi lý do (mã R).');
    s = play(s, ...allGo);
    expect(render(<Review />, s)).toContain('4/4 GO — Đồng thuận');
    s = play(s, { type: 'launch', record: LAUNCH }, { type: 'go', screen: 'ops' });
    expect(s.screen).toBe('ops');
  });

  it('10 · Ops + GDD §12 #11: event cards, then reload mid-game resumes at the start of the same screen', () => {
    expect(render(<Ops />, s)).toContain('MISSION CONTROL');
    s = play(s, { type: 'chooseEvent', id: 'E0', key: 'A' }, { type: 'chooseEvent', id: 'E1', key: 'B' });
    const store = new Map<string, string>();
    const g = globalThis as unknown as { localStorage?: Storage };
    const prev = g.localStorage;
    g.localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) } as Storage;
    try {
      saveState(s);
      const back = loadState();
      expect(back.screen).toBe('ops');
      expect(back.ops.choices).toEqual({ E0: 'A', E1: 'B' });
      expect(back.design).toEqual(s.design);
    } finally {
      g.localStorage = prev;
    }
    s = play(s, { type: 'chooseEvent', id: 'E2', key: 'A' }, { type: 'chooseEvent', id: 'E3', key: 'A' }, { type: 'finishOps' });
  });

  it('11 · Debrief → export → Share; GDD §12 #14: rerun keeps design + orbit, resets ops, run++', () => {
    expect(render(<Debrief />, s)).toContain('THÀNH CÔNG — 8/8 yêu cầu đạt');
    s = play(s, { type: 'exportSpec' });
    expect(render(<Debrief />, s)).toMatch(/aria-label="Huy hiệu CML"[\s\S]*?CML 4/);
    const r = play(s, { type: 'rerun' });
    expect(r).toMatchObject({ screen: 'build', run: 2, design: s.design, orbit: s.orbit, ops: { launch: null, choices: {} } });
  });
});

describe('12 · co-op 2/3/4 players (GDD §12 #13)', () => {
  it.each([2, 3, 4] as const)('%i players: roles grouped per SPEC §8, one card per player', (n) => {
    const s = play({ ...initialState, mode: 'coop' }, { type: 'setPlayerCount', count: n }, { type: 'startMission' });
    expect(s.screen).toBe('setup');
    expect(ROLE_GROUPS[n]).toHaveLength(n);
    expect(ROLE_GROUPS[n].flat().sort()).toEqual(['FD', 'KH', 'QD', 'VT']);
    const h = render(<Setup />, s);
    expect(h.match(/class="avatar"/g)?.length).toBe(n);
  });
});
