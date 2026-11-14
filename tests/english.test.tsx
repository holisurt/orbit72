// v1.3 English-only UI: no Vietnamese diacritics on any screen except the proper nouns, and the S1 reference run
// renders its SPEC §10 values in English number format (3.0 h · 49 % · 48.1 % · 2,640k · 6.5 years …).
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ReactElement } from 'react';
import { DataProvider } from '../src/data/context';
import { initialState, reducer, StoreProvider, type Action, type GameState } from '../src/state/store';
import { Home } from '../src/screens/Home';
import { Setup } from '../src/screens/Setup';
import { Quiz } from '../src/screens/Quiz';
import { Brief } from '../src/screens/Brief';
import { Build } from '../src/screens/Build';
import { Orbit } from '../src/screens/Orbit';
import { Review } from '../src/screens/Review';
import { Launch } from '../src/screens/Launch';
import { Ops } from '../src/screens/Ops';
import { Debrief } from '../src/screens/Debrief';
import { Share } from '../src/screens/Share';
import { Guide } from '../src/screens/Guide';
import { SettingsDialog } from '../src/ui/SettingsDialog';
import { PassScreen } from '../src/ui/PassScreen';
import { Term } from '../src/ui/Term';
import { TERMS, type TermId } from '../src/ui/labels';
import { eventIntro } from '../src/ui/events';
import { dataNasa } from './fixtures';
import type { GameEvent } from '../src/data/types';

const render = (el: ReactElement, s: GameState = initialState) =>
  renderToString(
    <DataProvider initial={{ data: dataNasa, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
      <StoreProvider initial={s}>{el}</StoreProvider>
    </DataProvider>,
  )
    .replace(/<!-- -->/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, '’');

const play = (s: GameState, ...a: object[]) => a.reduce<GameState>((st, x) => reducer(st, x as Action), s);

/** S1 (SPEC §10): reference design with the UHF → S-band swap, SSO 520 km, 4 planes × 1, Engineer. */
const s1Orbit = play(
  initialState,
  { type: 'startMission' },
  { type: 'answerQuiz', phase: 'pre', answers: 'skip' },
  { type: 'acceptContract' },
  { type: 'removePart', index: 3 },
  { type: 'addPart', id: 'sband' },
  { type: 'go', screen: 'orbit' },
  { type: 'chooseOrbit' },
);
const s1Review = play(s1Orbit, { type: 'go', screen: 'review' }, ...(['FD', 'VT', 'KH', 'QD'] as const).map((role) => ({ type: 'vote', role, vote: 'go' })));
const s1Ops = play(s1Review, { type: 'launch', record: { launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true } }, { type: 'go', screen: 'ops' });
const s1Done = play(
  s1Ops,
  { type: 'chooseEvent', id: 'E0', key: 'A' },
  { type: 'chooseEvent', id: 'E1', key: 'B' },
  { type: 'chooseEvent', id: 'E2', key: 'A' },
  { type: 'finishOps' },
  { type: 'exportSpec' },
);

// Vietnamese letters with diacritics (Latin-1 + Latin Extended + Vietnamese block), minus × and ÷.
const DIACRITIC = /[À-ÖØ-öø-ɏḀ-ỿ]/g;
// Proper nouns that keep their Vietnamese spelling (plus one author name in the Handbook sources).
const PROPER = /Hà Nội|Hòa Lạc|Đông Sơn|Rồng Con|RỒNG CON|Be Vietnam Pro|Domínguez/g;
// Vietnamese words that have no diacritics and so slip past DIACRITIC (pin = battery, sao = star, MP = plane, …).
const VI_PLAIN = /\b(pin|sao|MP|VT|nam|thang|phut|gio|lan|the|khong)\b/g;
const visible = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/\bthe\b/g, '');
const leftovers = (h: string) => [
  ...new Set([...(h.replace(PROPER, '').match(DIACRITIC) ?? []), ...(visible(h).match(VI_PLAIN) ?? []), ...(h.match(/aria-label="[^"]*\b(sao|MP|pin)\b[^"]*"/g) ?? [])]),
];
const context = (h: string) => {
  const t = h.replace(PROPER, '');
  const i = t.search(DIACRITIC);
  return i < 0 ? '' : t.slice(Math.max(0, i - 60), i + 40);
};

describe('English-only UI: no Vietnamese diacritics except proper nouns', () => {
  const screens: [string, ReactElement, GameState][] = [
    ['Home', <Home />, initialState],
    ['Setup (co-op 4)', <Setup />, { ...initialState, mode: 'coop', screen: 'setup' }],
    ['Quiz (pre)', <Quiz phase="pre" />, play(initialState, { type: 'startMission' })],
    ['Quiz (post)', <Quiz phase="post" />, s1Done],
    ['Brief', <Brief />, s1Orbit],
    ['Build (fresh)', <Build />, play(initialState, { type: 'startMission' }, { type: 'acceptContract' })],
    ['Build (S1)', <Build />, s1Orbit],
    ['Build (tutorial)', <Build />, play(initialState, { type: 'startTutorial' })],
    ['Orbit (S1)', <Orbit />, s1Orbit],
    ['Orbit (tutorial)', <Orbit />, play(initialState, { type: 'startTutorial' }, { type: 'chooseOrbit' })],
    ['Review (no votes)', <Review />, play(s1Orbit, { type: 'go', screen: 'review' })],
    ['Review (4/4 GO)', <Review />, s1Review],
    ['Launch', <Launch />, play(s1Review, { type: 'launch', record: { launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true } })],
    ['Ops (start)', <Ops />, s1Ops],
    ['Ops (all chosen)', <Ops />, play(s1Ops, { type: 'chooseEvent', id: 'E0', key: 'A' }, { type: 'chooseEvent', id: 'E1', key: 'C' }, { type: 'chooseEvent', id: 'E2', key: 'B' })],
    ['Debrief', <Debrief />, s1Done],
    ['Share', <Share />, play(s1Done, { type: 'go', screen: 'share' })],
    ['Settings', <SettingsDialog onClose={() => {}} />, initialState],
    ['Pass screen', <PassScreen role="QD" count={4} names={['', '', '', '']} text="x" onStart={() => {}} />, initialState],
    ...[0, 1, 2, 3, 4].map((tab): [string, ReactElement, GameState] => [`Handbook tab ${tab}`, <Guide initialTab={tab} />, initialState]),
  ];
  it.each(screens)('%s', (_n, el, s) => {
    const h = render(el, s);
    expect(leftovers(h), context(h)).toEqual([]);
  });

  it('every "?" explainer and event card text', () => {
    for (const id of Object.keys(TERMS) as TermId[]) expect(leftovers(render(<Term id={id}>x</Term>)), id).toEqual([]);
    for (const e of dataNasa.events.events as GameEvent[]) {
      const t = `${e.title} ${e.options.map((o) => o.text).join(' ')} ${eventIntro(e, { hasShield: false, donki: dataNasa.donki })}`;
      expect(leftovers(t), `${e.id}: ${context(t)}`).toEqual([]);
    }
  });

  it('<html lang="en"> and an English title', async () => {
    const html = (await import('../index.html?raw')).default;
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<title>ORBIT 72 - Keep Them Connected</title>');
  });
});

describe('S1 renders the SPEC §10 values in English format', () => {
  it('Orbit: 3.0 h · 49 % · 2,640k · 6.5 years · UHF 9.7 / S 8.4 / SOS 9.3 dB', () => {
    const h = render(<Orbit />, s1Orbit);
    expect(h).toContain('3.0 h');
    expect(h).toContain('49%');
    expect(h).toContain('2,640k');
    expect(h).toContain('6.5 years');
    expect(h).toMatch(/UHF 9\.7/);
    expect(h).toMatch(/S 8\.4/);
    expect(h).toMatch(/SOS 9\.3/);
  });

  it('Ops: SOS delivered within 1 h (weighted by NASA IMERG rain) 48.1 % before any event', () => {
    expect(render(<Ops />, s1Ops)).toMatch(/48\.1\s*%/);
  });

  it('Ops queue: E1 options 46 / 48 / 48 and E2 options 49 / 45 / 48', () => {
    const queue = (s: GameState, id: string) => render(<Ops />, s).match(new RegExp(`${id} · (?:T0\\+|on reaching)[\\s\\S]*?SOS ≤ 1 h (\\d+)%`))?.[1];
    const base = (key: string) => play(s1Ops, { type: 'chooseEvent', id: 'E0', key: 'A' }, { type: 'chooseEvent', id: 'E1', key });
    expect(['A', 'B', 'C'].map((k) => queue(base(k), 'E1'))).toEqual(['46', '48', '48']);
    const e2 = (key: string) => play(base('B'), { type: 'chooseEvent', id: 'E2', key });
    expect(['A', 'B', 'C'].map((k) => queue(e2(k), 'E2'))).toEqual(['49', '45', '48']);
  });

  it('Debrief: MISSION SUCCESS 8/8 and CML 4', () => {
    const h = render(<Debrief />, s1Done);
    expect(h).toContain('MISSION SUCCESS — 8/8 requirements passed');
    expect(h).toMatch(/aria-label="CML badge"[\s\S]*?CML 4/);
  });
});
