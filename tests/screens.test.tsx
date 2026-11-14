// Server-render every CP2 screen with real data to catch runtime errors and check displayed values.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import world from '../public/data/maps/world.txt?raw';
import vn from '../public/data/maps/vn.txt?raw';
import globe from '../public/data/maps/globe.txt?raw';
import seaLand from '../public/data/maps/sea_land.txt?raw';
import { DataProvider } from '../src/data/context';
import { initialState, reducer, StoreProvider, type GameState } from '../src/state/store';
import { Home } from '../src/screens/Home';
import { Setup } from '../src/screens/Setup';
import { Brief } from '../src/screens/Brief';
import { Build } from '../src/screens/Build';
import { Orbit } from '../src/screens/Orbit';
import { data, REF_DESIGN } from './fixtures';
import type { ReactElement } from 'react';

const maps = { world, vn, globe, seaLand };

function render(el: ReactElement, state: GameState): string {
  const html = renderToString(
    <DataProvider initial={{ data, maps }}>
      <StoreProvider initial={state}>{el}</StoreProvider>
    </DataProvider>,
  );
  return html.replace(/<!-- -->/g, '');
}

const fresh: GameState = reducer(initialState, { type: 'startMission' });
/** S1 after the player swaps UHF → S-band (reference design, SPEC §10), orbit chosen. */
const S1: GameState = reducer({ ...fresh, design: REF_DESIGN }, { type: 'chooseOrbit' });

describe('screens render (CP2)', () => {
  it('Home', () => {
    const h = render(<Home />, initialState);
    expect(h).toContain('Keep Them Connected');
    expect(h).toContain('Start mission');
  });

  it('Setup (co-op 4)', () => {
    const h = render(<Setup />, { ...initialState, mode: 'coop', screen: 'setup' });
    expect(h).toContain('Orbit &amp; Comms Engineer');
    expect(h).toContain('face down');
  });

  it('Brief shows contract values for Kỹ sư', () => {
    const h = render(<Brief />, { ...S1, screen: 'brief' });
    expect(h).toContain('≤ 3.5 h');
    expect(h).toContain('3,000k');
  });

  it('Build HUD for the reference design', () => {
    const h = render(<Build />, { ...S1, orbit: { ...S1.orbit, chosen: false } });
    expect(h).toContain('3.27 / 9.8 W');
    expect(h).toContain('need 6.5 / 20 Wh');
    expect(h).toContain('310k × 4 + launch = 2,640k');
    expect(h).toContain('11 / 18 months');
    expect(h).toContain('R8 PASS');
  });

  it('Build fresh default: Data bar VƯỢT, UHF card uses 17 min default', () => {
    const h = render(<Build />, fresh);
    expect(h).toMatch(/Data<\/span><span class="status VUOT">OVER/);
    expect(h).toContain('5 / 1.22 MB/day');
    expect(h).toContain('≈ 1.22 MB/day with 17 min of contact');
    expect(h).not.toContain('~1.2 MB');
  });

  it('Build S-band card uses simulated contact minutes once an orbit exists', () => {
    const h = render(<Build />, S1);
    expect(/with ([\d.]+) min of contact/.exec(h)?.[1]).toBe('16.7');
    expect(h).toMatch(/≈ 25\d MB\/day with 16\.7 min of contact/);
  });

  it('Build reports missing parts (R8)', () => {
    const h = render(<Build />, { ...S1, design: { ...S1.design, parts: ['obc'] } });
    expect(h).toContain('Missing the EPS power system.');
  });

  it('Orbit shows the CP2 check values for S1', () => {
    const h = render(<Orbit />, S1);
    expect(h).toContain('3.0 h');
    expect(h).toContain('49%');
    expect(h).toContain('2,640k');
    expect(h).toContain('6.5 years');
    expect(h).toMatch(/UHF 9\.7/);
    expect(h).toMatch(/S 8\.4/);
    expect(h).toMatch(/SOS 9\.3/);
    expect(h).toContain('COMPATIBLE');
  });

  it('Orbit tutorial shows 3 passes on day 1', () => {
    const t = reducer(reducer(initialState, { type: 'startTutorial' }), { type: 'chooseOrbit' });
    const h = render(<Orbit />, { ...t, orbit: { ...t.orbit, planes: 1 } });
    expect(h).toMatch(/Passes on day 1.*?>3</);
  });
});
