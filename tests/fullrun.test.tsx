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
      record: { launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true },
    });
    expect(s.screen).toBe('launch');
    expect(render(<Launch />, s)).toContain('Rời bệ phóng');

    s = play(s, { type: 'go', screen: 'ops' });
    const ops = render(<Ops />, s);
    expect(ops).toContain('MISSION CONTROL');
    expect(ops).toContain('E0 · E1 · E2'); // ky_su events; E0 because no env test

    s = play(
      s,
      { type: 'chooseEvent', id: 'E0', key: 'A' },
      { type: 'chooseEvent', id: 'E1', key: 'B' },
      { type: 'chooseEvent', id: 'E2', key: 'A' },
      { type: 'finishOps' },
    );
    expect(s.screen).toBe('debrief');
    const d = render(<Debrief />, s);
    expect(d).toContain('THÀNH CÔNG — 8/8 yêu cầu đạt');
    expect(d).toContain('Hiệu quả chi phí = 49,1 / 2,64'); // star 3 uses the nominal cost (events affect only stars 2, 4)
    // spec sheet cost: nominal design cost (Star 3) + E2-A generator (+20k)
    expect(d).toContain('2.640k thiết kế + 20k sự cố = 2.660k');
    expect(d).toContain('11 tháng');
    expect(d).toMatch(/aria-label="Huy hiệu CML"[\s\S]*?CML 3/); // UHF→S-band swap satisfies CML3

    s = play(s, { type: 'exportSpec' });
    expect(render(<Debrief />, s)).toMatch(/aria-label="Huy hiệu CML"[\s\S]*?CML 4/); // SPEC §10: S1 + swap + export → CML4

    s = play(s, { type: 'go', screen: 'share' });
    const sh = render(<Share />, s);
    expect(sh).toContain('Tải thẻ PNG (9:16)');
    expect(sh).toContain('THÀNH CÔNG');
    expect((sh.match(/<polygon points="([^"]+)"/)?.[1].split(' ') ?? []).length).toBe(28); // 14-ray star
  });

  it('cost line without events shows the design cost only', () => {
    const quiet = play({ ...s, ops: { ...s.ops, choices: {} } }, { type: 'go', screen: 'debrief' });
    const h = render(<Debrief />, quiet);
    expect(h).toContain('>2.640k thiết kế<');
    expect(h).not.toContain('k sự cố');
  });

  it('exported spec sheet PNG prints the CML level reached by exporting (CML 4), before and after export', () => {
    // `s` is the S1 run (UHF → S-band swap) at Share; go back to Debrief with the export not yet done.
    const before = play({ ...s, specExported: false }, { type: 'go', screen: 'debrief' });
    const header = (h: string) => {
      const svg = h.match(/<svg[^>]*data-testid="spec-sheet"[\s\S]*?<\/svg>/)?.[0] ?? '';
      return svg.match(/<text[^>]*>([^<]*lần chạy[^<]*)<\/text>/)?.[1] ?? '';
    };
    const badge = (h: string) => h.match(/aria-label="Huy hiệu CML"[\s\S]*?(CML \d)/)?.[1];

    const h0 = render(<Debrief />, before);
    expect(badge(h0)).toBe('CML 3'); // on-screen badge: not exported yet
    expect(header(h0)).toContain('THÀNH CÔNG 8/8');
    expect(header(h0)).toContain('CML 4'); // the PNG is rendered before exportSpec fires

    const h1 = render(<Debrief />, play(before, { type: 'exportSpec' }));
    expect(badge(h1)).toBe('CML 4');
    expect(header(h1)).toContain('CML 4');
  });

  it('rerun keeps design + orbit, resets ops, run++', () => {
    const r = play(s, { type: 'rerun' });
    expect(r).toMatchObject({ screen: 'build', run: 2, design: s.design, orbit: s.orbit });
    expect(r.ops.launch).toBeNull();
    expect(r.ops.choices).toEqual({});
  });
});
