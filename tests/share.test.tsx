// CP4.5 Share card polish: phase squares by result, CML band + run line, header by mode, P1h_mưa tile.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { DataProvider } from '../src/data/context';
import type { GameData } from '../src/data/types';
import { initialState, reducer, StoreProvider, type Action, type GameState } from '../src/state/store';
import { Share } from '../src/screens/Share';
import { cardHeader, starStatus } from '../src/ui/share';
import { data, dataNasa } from './fixtures';

const C = { DAT: '#4ADE80', SAT: '#FBBF24', VUOT: '#F87171' };

function s1(): GameState {
  return [
    { type: 'startMission' },
    { type: 'answerQuiz', phase: 'pre', answers: 'skip' },
    { type: 'acceptContract' },
    { type: 'removePart', index: 3 },
    { type: 'addPart', id: 'sband' },
    { type: 'go', screen: 'orbit' },
    { type: 'chooseOrbit' },
    ...(['FD', 'VT', 'KH', 'QD'] as const).map((role) => ({ type: 'vote', role, vote: 'go' })),
    { type: 'launch', record: { launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true } },
    { type: 'chooseEvent', id: 'E0', key: 'A' },
    { type: 'chooseEvent', id: 'E1', key: 'B' },
    { type: 'chooseEvent', id: 'E2', key: 'A' },
    { type: 'finishOps' },
    { type: 'exportSpec' },
    { type: 'go', screen: 'share' },
  ].reduce((s, a) => reducer(s, a as Action), initialState);
}

const render = (s: GameState, d: GameData = dataNasa) =>
  renderToString(
    <DataProvider initial={{ data: d, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
      <StoreProvider initial={s}>
        <Share />
      </StoreProvider>
    </DataProvider>,
  ).replace(/<!-- -->/g, '');

const squares = (h: string) => [...h.matchAll(/<rect x="(\d+)" y="116" width="38" height="30" rx="6" fill="(#[0-9A-F]+)"/g)].map((m) => m[2]);

describe('share card (S1 run)', () => {
  const h = render(s1());

  it('phase squares coloured by result; Vận hành (Star 2 = 3) is yellow', () => {
    // Nhiệm vụ R5/R8 · Ráp (R2,R3,R6,R8) · Quỹ đạo (R1, R5 SÁT) · Go/No-Go 4/4 · Vận hành ★3 · Báo cáo THÀNH CÔNG
    expect(squares(h)).toEqual([C.SAT, C.DAT, C.SAT, C.DAT, C.SAT, C.DAT]);
    expect(h).toContain('<title>Vận hành: SÁT</title>');
  });

  it('Vận hành stays yellow without IMERG (w = 1)', () => {
    expect(squares(render(s1(), data))[4]).toBe(C.SAT);
  });

  it('CML badge and run line fill the band above the mascot', () => {
    expect(h).toContain('CML 4 · JPL');
    expect(h).toContain('4 mặt phẳng → khoảng trống 3,0 h');
  });

  it('header shows scenario · difficulty', () => {
    expect(h).toContain('>72 GIỜ VÀNG · KỸ SƯ</text>');
    expect(h).not.toContain('NHIỆM VỤ HÔM NAY');
  });


  it('P1h tile is labelled P1h_mưa (IMERG) and shows P1h_rain after events', () => {
    expect(h).toContain('>P1h_mưa (IMERG)</text>');
    expect(h).toContain('>44%</text>'); // 43,8 % with IMERG weights after E0-A, E1-B, E2-A
    expect(render(s1(), data)).toContain('>P1h_mưa (w = 1)</text>');
  });
});

describe('share helpers', () => {
  it('stars → colour: ≥ 4 green, 3 yellow, ≤ 2 red', () => {
    expect([5, 4, 3, 2, 1].map(starStatus)).toEqual(['DAT', 'DAT', 'SAT', 'VUOT', 'VUOT']);
  });
  it('cardHeader', () => {
    expect(cardHeader('72 Giờ Vàng', 'hoc_vien')).toBe('72 GIỜ VÀNG · HỌC VIÊN');
    expect(cardHeader('72 Giờ Vàng', 'ky_su')).toBe('72 GIỜ VÀNG · KỸ SƯ');
  });
});
