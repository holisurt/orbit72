// About page (public/about.html, static so it survives reload on GitHub Pages) + link from Home.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import about from '../public/about.html?raw';
import { DataProvider } from '../src/data/context';
import { initialState, StoreProvider } from '../src/state/store';
import { Home } from '../src/screens/Home';
import { data } from './fixtures';

describe('About page', () => {
  it('has every required section', () => {
    for (const s of [
      'Keep everyone connected', 'id="why"', '6,285', 'strategic technologies', 'id="how"', 'Mission', 'Build', 'Orbit', 'Go/No-Go', 'Operations', 'Debrief',
      'id="science"', 'IMERG V07 Final', '10.5067/GPM/IMERG/3B-HH/07', 'https://data.nasa.gov/dataset/gpm-imerg-final', '10 May 2024, Kp 9',
      'Small Spacecraft SOA 2026', 'Design and Develop Science Missions', 'automated tests', 'docs/guidebook.pdf', 'id="faq"',
      'Team HDMK', 'not affiliated with or endorsed by NASA', 'AI use',
    ]) expect(about, s).toContain(s);
  });
  it('no NASA logo, no external scripts', () => {
    expect(about).not.toMatch(/<img/i);
    expect(about).not.toMatch(/<script[^>]+src=/i);
  });
  it('Home links to it with the Pages base path', () => {
    const h = renderToString(
      <DataProvider initial={{ data, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
        <StoreProvider initial={initialState}>
          <Home />
        </StoreProvider>
      </DataProvider>,
    );
    expect(h).toMatch(/href="\/orbit72\/about\.html"[^>]*>About/);
  });
});
