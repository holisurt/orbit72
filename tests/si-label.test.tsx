// Space Apps SI rule: AI-drawn artwork carries a visible "SI-assisted artwork" label on every exported PNG,
// under the Home mascot and in the About page footer.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ReactElement } from 'react';
import aboutHtml from '../public/about.html?raw';
import { DataProvider } from '../src/data/context';
import { initialState, reducer, StoreProvider, type Action, type GameState } from '../src/state/store';
import { Home } from '../src/screens/Home';
import { Debrief } from '../src/screens/Debrief';
import { Share } from '../src/screens/Share';
import { Patch } from '../src/ui/Patch';
import { SI_LABEL } from '../src/ui/labels';
import { dataNasa } from './fixtures';

const render = (el: ReactElement, s: GameState = initialState) =>
  renderToString(
    <DataProvider initial={{ data: dataNasa, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
      <StoreProvider initial={s}>{el}</StoreProvider>
    </DataProvider>,
  ).replace(/<!-- -->/g, '');

const done = [
  { type: 'startMission' },
  { type: 'answerQuiz', phase: 'pre', answers: 'skip' },
  { type: 'acceptContract' },
  { type: 'launch', record: { launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true } },
  { type: 'finishOps' },
].reduce((s, a) => reducer(s, a as Action), initialState);

/** Text of one exported <svg> (found by a marker inside it), so the label is inside what becomes the PNG. */
const svgWith = (h: string, marker: string) => h.match(new RegExp(`<svg(?:(?!</svg>)[\\s\\S])*?${marker}[\\s\\S]*?</svg>`))?.[0] ?? '';

describe('SI-assisted artwork label', () => {
  it('label text', () => expect(SI_LABEL).toBe('SI-assisted artwork'));

  it('inside the mission patch SVG', () => {
    expect(renderToString(<Patch theme={0} team="TEAM BABY DRAGON" scenario="72 Golden Hours" satCount={4} />)).toContain(`>${SI_LABEL}</text>`);
  });

  it('inside the 9:16 result card SVG and the patch on Share', () => {
    const h = render(<Share />, reducer(done, { type: 'go', screen: 'share' }));
    expect(svgWith(h, 'Result card')).toContain(`>${SI_LABEL}</text>`);
    expect(svgWith(h, 'Mission patch')).toContain(`>${SI_LABEL}</text>`);
  });

  it('inside the exported spec sheet SVG', () => {
    expect(svgWith(render(<Debrief />, done), 'data-testid="spec-sheet"')).toContain(`>${SI_LABEL}</text>`);
  });

  it('under the mascot on Home', () => {
    expect(render(<Home />)).toMatch(new RegExp(`Rồng Con</text><text[^>]*>${SI_LABEL}</text>`));
  });

  it('in the About page footer', () => {
    expect(aboutHtml).toMatch(/<footer[\s\S]*SI-assisted artwork: Vector illustrations \(mascot, rocket, satellite, mission patch\) were drawn as SVG code with Claude’s assistance\.[\s\S]*<\/footer>/);
  });
});
