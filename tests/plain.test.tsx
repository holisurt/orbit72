// v1.1 plain language: SOS labels, cost efficiency, plain R1–R8, "?" explainers linked to Guide cards.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ReactElement } from 'react';
import appCss from '../src/styles/app.css?raw';
import { DataProvider } from '../src/data/context';
import { initialState, reducer, StoreProvider, type Action, type GameState } from '../src/state/store';
import { REQ_LABEL } from '../src/sim/mission';
import { guideTabs } from '../src/ui/guide';
import { TERMS } from '../src/ui/labels';
import { Term } from '../src/ui/Term';
import { Brief } from '../src/screens/Brief';
import { Orbit } from '../src/screens/Orbit';
import { Ops } from '../src/screens/Ops';
import { Debrief } from '../src/screens/Debrief';
import { Review } from '../src/screens/Review';
import { Build } from '../src/screens/Build';
import { Share } from '../src/screens/Share';
import { dataNasa as data } from './fixtures';

const render = (el: ReactElement, s: GameState) =>
  renderToString(
    <DataProvider initial={{ data, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
      <StoreProvider initial={s}>{el}</StoreProvider>
    </DataProvider>,
  ).replace(/<!-- -->/g, '');
const s = [
  { type: 'startMission' },
  { type: 'acceptContract' },
  { type: 'chooseOrbit' },
  { type: 'launch', record: { launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true } },
  { type: 'finishOps' },
].reduce((st, a) => reducer(st, a as Action), initialState);

describe('plain language in the UI', () => {
  const screens: [string, ReactElement][] = [
    ['Brief', <Brief />],
    ['Build', <Build />],
    ['Orbit', <Orbit />],
    ['Review', <Review />],
    ['Ops', <Ops />],
    ['Debrief', <Debrief />],
    ['Share', <Share />],
  ];
  it.each(screens)('%s shows no "P1h" or "VFM" jargon', (_n, el) => {
    const visible = render(el, s).replace(/<[^>]+>/g, ' ');
    expect(visible).not.toMatch(/P1h|VFM/);
  });

  it('Ops: SOS labels in plain words', () => {
    const h = render(<Ops />, s);
    expect(h).toContain('SOS delivered within 1 h</div>');
    expect(h).toContain('SOS delivered within 1 h (weighted by NASA IMERG rain)</div>');
  });

  it('Debrief: star 3 is "Cost efficiency"', () => expect(render(<Debrief />, s)).toContain('Cost efficiency = '));

  it('R1–R8 keep their codes and read as plain sentences (Brief + Review)', () => {
    const b = render(<Brief />, s);
    const r = render(<Review />, s);
    for (const [id, label] of Object.entries(REQ_LABEL)) {
      expect(b, id).toContain(label);
      expect(r, id).toContain(label);
    }
  });
});

describe('"?" term explainers', () => {
  it('every term links to an existing Guide card', () => {
    const tabs = guideTabs(data);
    for (const [id, t] of Object.entries(TERMS)) {
      expect(tabs[t.tab].items.some((it) => it.t === t.card), `${id} → ${t.card}`).toBe(true);
      expect(t.text.split(/[.!?](\s|$)/).filter((x) => x && x.trim()).length, id).toBeLessThanOrEqual(1); // one sentence
    }
  });

  it('Orbit has explainers for inclination, orbital plane, eclipse, link margin, orbital lifetime', () => {
    const h = render(<Orbit />, s);
    for (const w of ['inclination', 'Orbital planes', 'eclipse', 'Link margin', 'Orbital lifetime'])
      expect(h, w).toMatch(new RegExp(`aria-label="Explain: ${w}"`));
  });

  it('Debrief CML badge has an explainer', () => expect(render(<Debrief />, s)).toContain('aria-label="Explain: CML"'));

  it('"?" is a disclosure button with a 44 px touch area', () => {
    const h = render(<Term id="incl">inclination</Term>, s);
    expect(h).toMatch(/<button type="button" class="term-q" aria-expanded="false" aria-controls="[^"]+" aria-label="Explain: inclination">\?<\/button>/);
    expect(appCss).toMatch(/\.term-q \{[^}]*width: 18px;[^}]*height: 18px;/);
    expect(appCss).toMatch(/\.term-q::before \{[^}]*inset: -13px;/); // 18 + 2 × 13 = 44
  });

  it('the Guide link opens the card', () => {
    const g = reducer({ ...initialState, screen: 'orbit' }, { type: 'openGuide', tab: TERMS.margin.tab, focus: TERMS.margin.card });
    expect(g).toMatchObject({ screen: 'guide', guideTab: 0, guideFocus: 'Link margin', returnTo: 'orbit' });
  });
});
