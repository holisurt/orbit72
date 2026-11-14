// CP4.2 Guide (Handbook): five tabs, [GA] assumptions, sources, segments + CML cards, reachable everywhere.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ReactElement } from 'react';
import { DataProvider } from '../src/data/context';
import { initialState, reducer, StoreProvider, type GameState } from '../src/state/store';
import { Guide } from '../src/screens/Guide';
import { guideTabs } from '../src/ui/guide';
import { Home } from '../src/screens/Home';
import { Brief } from '../src/screens/Brief';
import { Build } from '../src/screens/Build';
import { Orbit } from '../src/screens/Orbit';
import { Review } from '../src/screens/Review';
import { Launch } from '../src/screens/Launch';
import { Ops } from '../src/screens/Ops';
import { Debrief } from '../src/screens/Debrief';
import { Share } from '../src/screens/Share';
import { Setup } from '../src/screens/Setup';
import { Quiz } from '../src/screens/Quiz';
import { dataNasa } from './fixtures';

const render = (el: ReactElement, s: GameState = initialState) =>
  renderToString(
    <DataProvider initial={{ data: dataNasa, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
      <StoreProvider initial={s}>{el}</StoreProvider>
    </DataProvider>,
  )
    .replace(/<!-- -->/g, '')
    .replace(/&amp;/g, '&');

const tabs = guideTabs(dataNasa);
const text = (i: number) => tabs[i].items.map((it) => `${it.t} ${it.d} ${it.s} ${(it.link ?? []).map((l) => l.href).join(' ')}`).join('\n');

describe('Guide content', () => {
  it('five tabs in order', () => {
    expect(tabs.map((t) => t.n)).toEqual(['Glossary', 'Formulas', 'Science · assumptions', 'Dragon files', 'Sources']);
  });

  it('Glossary: segments card and CML card', () => {
    const t = text(0);
    expect(t).toContain('Four mission segments');
    expect(t).toContain('Launch = the rocket · Space = the satellite · Ground = the Hòa Lạc station · User = the rescue centre and the SOS villages');
    expect(t).toContain('CML badge');
    expect(t).toMatch(/CML4 launched with r1–r8 all passing/i);
  });

  it('Formulas: worked values computed from the sim (SPEC §10 at 520 km)', () => {
    const t = text(1);
    expect(t).toContain('95.0 min');
    expect(t).toContain('37.6%');
    expect(t).toContain('97.48°');
    expect(t).toContain('6U: 9.8 W · wings +12.1 W');
  });

  it('Science: every [GA] assumption, incl. Hoa Lac station parameters', () => {
    const t = text(2);
    for (const s of [
      'Hòa Lạc station · UHF down', 'G_rx 14.0 dBi, T_sys 500 K', 'link margin 9.7 dB',
      'Hòa Lạc station · S down', 'G_rx 34.2 dBi, T_sys 150 K', 'link margin 8.4 dB',
      'Hòa Lạc station · SOS up', 'transmit 0.5 W', 'link margin 9.3 dB',
      'more than 10°', 'η = 0.29', 'pointing factor 0.5', 'Depth of discharge 0.3', '3U: 6 cells', 'integration +4 months',
      '250k per satellite [GA]', 'every launch succeeds', 'Opens 0.5 m²', 'T0 = typhoon landfall',
      'Cadet: budget 3,500k, R1 ≤ 6.0 h', 'PASS ≤ 80%', 'Five stars', 'Secret priority cards (co-op)', 'Data made ≤ 50%', 'Event card effects',
    ]) expect(t).toContain(s);
  });

  it('Sources: NASA data, SOA, challenge resources, FACSAT-2, Natural Earth, VnEconomy, fonts', () => {
    const t = text(4);
    for (const s of [
      'NASA GPM IMERG V07 Final · 7–10 Sep 2024', 'https://doi.org/10.5067/GPM/IMERG/3B-HH/07', 'https://data.nasa.gov/dataset/gpm-imerg-final',
      'NASA DONKI', 'Kp 9', 'NASA Small Spacecraft SOA 2026',
      'Design and Develop Science Missions', 'GMAT', 'JPL Concept Maturity Levels', 'Mission Design Lab', 'NASA Mission Viz',
      'telescope', 'CubeSat 101', 'CSA', 'arXiv:2609.24534', 'FACSAT-2', 'Natural Earth', 'VnEconomy', 'Be Vietnam Pro', 'IBM Plex Mono',
    ]) expect(t).toContain(s);
    expect(t).not.toMatch(/logo/i);
  });

  it('renders the HF-Guide layout: search, tablist, close, cards', () => {
    const h = render(<Guide initialTab={4} />);
    expect(h).toContain('Search the Handbook');
    expect(h).toContain('role="tablist"');
    expect(h.match(/role="tab"/g)).toHaveLength(5);
    expect(h).toContain('aria-selected="true"');
    expect(h).toContain('Close ✕');
    expect(h).toContain('href="https://doi.org/10.5067/GPM/IMERG/3B-HH/07"');
  });
});

describe('Guide is reachable from every screen', () => {
  const launched = [
    { type: 'startMission' },
    { type: 'acceptContract' },
    { type: 'launch', record: { launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true } },
  ].reduce((s, a) => reducer(s, a as never), initialState);
  const screens: [string, ReactElement, GameState][] = [
    ['Home', <Home />, initialState],
    ['Setup', <Setup />, { ...initialState, mode: 'coop' }],
    ['Quiz', <Quiz phase="pre" />, initialState],
    ['Brief', <Brief />, initialState],
    ['Build', <Build />, launched],
    ['Orbit', <Orbit />, launched],
    ['Review', <Review />, launched],
    ['Launch', <Launch />, launched],
    ['Ops', <Ops />, launched],
    ['Debrief', <Debrief />, launched],
    ['Share', <Share />, launched],
  ];
  it.each(screens)('%s has the "?" Handbook button', (_n, el, s) => {
    expect(render(el, s)).toMatch(/<button class="tool-btn"[^>]*aria-label="Handbook"/);
  });

  it('openGuide remembers where to return; Science link opens tab 2', () => {
    const g = reducer({ ...initialState, screen: 'build' }, { type: 'openGuide', tab: 2 });
    expect(g).toMatchObject({ screen: 'guide', returnTo: 'build', guideTab: 2 });
    expect(reducer(g, { type: 'closeGuide' }).screen).toBe('build');
  });
});
