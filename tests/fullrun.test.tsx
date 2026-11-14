// CHECK CP3: one full S1 Kỹ sư run without errors; Debrief shows 8/8 THÀNH CÔNG.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ReactElement } from 'react';
import { DataProvider } from '../src/data/context';
import { initialState, reducer, StoreProvider, type Action, type GameState } from '../src/state/store';
import { Review } from '../src/screens/Review';
import { Launch } from '../src/screens/Launch';
import { Ops } from '../src/screens/Ops';
import { Debrief } from '../src/screens/Debrief';
import { Share } from '../src/screens/Share';
import { data } from './fixtures';

const maps = { world: '', vn: '', globe: '', seaLand: '' };
const render = (el: ReactElement, s: GameState) =>
  renderToString(
    <DataProvider initial={{ data, maps }}>
      <StoreProvider initial={s}>{el}</StoreProvider>
    </DataProvider>,
  ).replace(/<!-- -->/g, '');
const play = (s: GameState, ...a: Action[]) => a.reduce(reducer, s);

describe('full run S1 Kỹ sư (solo)', () => {
  let s = play(
    initialState,
    { type: 'startMission' },
    { type: 'acceptContract' },
    // Build: swap UHF → S-band (reference design)
    { type: 'removePart', index: 3 },
    { type: 'addPart', id: 'sband' },
    { type: 'go', screen: 'orbit' },
    { type: 'chooseOrbit' },
    { type: 'go', screen: 'review' },
  );

  it('Review: 8 rows, no VƯỢT, launch enabled after 4/4 GO', () => {
    expect(s.design.parts).toEqual(['obc', 'eps', 'adcs', 'sos', 'sband']);
    const before = render(<Review />, s);
    expect(before).toContain('Chờ đủ 4 câu trả lời');
    s = play(s, ...(['FD', 'VT', 'KH', 'QD'] as const).map((role) => ({ type: 'vote', role, vote: 'go' }) as Action));
    const h = render(<Review />, s);
    expect(h).toContain('4/4 GO — Đồng thuận');
    expect(h).not.toContain('class="status VUOT"');
    expect(h).not.toMatch(/aria-disabled="true"[^>]*>PHÓNG/);
  });

  it('Launch → Ops → Debrief → Share', () => {
    s = play(s, {
      type: 'launch',
      record: { attempts: [0, 1, 2, 3].map((l) => ({ launch: l, failed: false, replaced: false })), lostPlanes: [], extraCostKusd: 0, extraMonths: 0, inOrbit: true, launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true },
    });
    expect(s.screen).toBe('launch');
    expect(render(<Launch />, s)).toContain('Rời bệ phóng');

    s = play(s, { type: 'go', screen: 'ops' });
    const ops = render(<Ops />, s);
    expect(ops).toContain('MISSION CONTROL');
    expect(ops).toContain('E0 · E1 · E2 · E3'); // ky_su events; E0 because no env test

    s = play(
      s,
      { type: 'chooseEvent', id: 'E0', key: 'A' },
      { type: 'chooseEvent', id: 'E1', key: 'B' },
      { type: 'chooseEvent', id: 'E2', key: 'A' },
      { type: 'chooseEvent', id: 'E3', key: 'A' },
      { type: 'finishOps' },
    );
    expect(s.screen).toBe('debrief');
    const d = render(<Debrief />, s);
    expect(d).toContain('THÀNH CÔNG — 8/8 yêu cầu đạt');
    expect(d).toContain('VFM = 49,1 / 2,64'); // star 3 uses the nominal cost (events affect only stars 2, 4)
    expect(d).toContain('2.660k · 11 tháng'); // spec sheet total includes the E2-A generator (+20k)
    expect(d).toContain('CML 2');

    s = play(s, { type: 'exportSpec' });
    expect(render(<Debrief />, s)).toContain('CML 4'); // SPEC §10: S1 run with spec sheet export → CML4

    s = play(s, { type: 'go', screen: 'share' });
    const sh = render(<Share />, s);
    expect(sh).toContain('Tải thẻ PNG (9:16)');
    expect(sh).toContain('THÀNH CÔNG');
    expect((sh.match(/<polygon points="([^"]+)"/)?.[1].split(' ') ?? []).length).toBe(28); // 14-ray star
  });

  it('rerun keeps design + orbit, resets ops, run++', () => {
    const r = play(s, { type: 'rerun' });
    expect(r).toMatchObject({ screen: 'build', run: 2, design: s.design, orbit: s.orbit });
    expect(r.ops.launch).toBeNull();
    expect(r.ops.choices).toEqual({});
  });
});
