// v1.1.1 layout of long labels: the Review checklist label column can never collapse (one letter per line).
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import appCss from '../src/styles/app.css?raw';
import { DataProvider } from '../src/data/context';
import { initialState, reducer, StoreProvider, type Action } from '../src/state/store';
import { Review } from '../src/screens/Review';
import { data } from './fixtures';

const css = appCss.replace(/\/\*[\s\S]*?\*\//g, '');
/** Declarations of the first top-level rule whose selector list is exactly `sel`. */
function rule(sel: string): string {
  const m = css.match(new RegExp(`(?:^|\\})\\s*${sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
  return m?.[1] ?? '';
}

describe('Review checklist grid', () => {
  it('label column keeps a minimum width of 160 px; value column may shrink', () => {
    const cols = rule('.ready-row').match(/grid-template-columns:\s*([^;]+);/)?.[1].trim();
    expect(cols).toBe('28px minmax(160px, 1fr) minmax(0, auto) auto');
    const min = Number(cols!.match(/minmax\((\d+)px, 1fr\)/)![1]);
    expect(min).toBeGreaterThanOrEqual(160);
  });

  it('label and value wrap by word, never nowrap', () => {
    const cells = rule('.ready-row > *');
    expect(cells).toMatch(/min-width:\s*0/);
    expect(cells).toMatch(/overflow-wrap:\s*break-word/);
    expect(cells).toMatch(/word-break:\s*normal/);
    for (const sel of ['.ready-row', '.ready-label', '.ready-value']) expect(rule(sel)).not.toMatch(/white-space:\s*nowrap/);
  });

  it('under 1100 px (and at 150 % text) the value moves below the label', () => {
    const narrow = css.slice(css.indexOf('@media (max-width: 1100px) {\n  .ready-row'));
    expect(narrow).toMatch(/grid-template-areas: 'id label chip' '\. value value'/);
    expect(css).toMatch(/:root\[data-text='150'\] \.ready-row \{[^}]*grid-template-areas: 'id label chip' '\. value value'/);
  });

  it('Review rows use the label/value classes; bottleneck card is a non-shrinking block in a scrollable panel', () => {
    const s = [{ type: 'startMission' }, { type: 'acceptContract' }, { type: 'chooseOrbit' }, { type: 'go', screen: 'review' }].reduce(
      (st, a) => reducer(st, a as Action),
      initialState,
    );
    const h = renderToString(
      <DataProvider initial={{ data, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
        <StoreProvider initial={s}>
          <Review />
        </StoreProvider>
      </DataProvider>,
    );
    expect(h.match(/class="ready-label"/g)).toHaveLength(8);
    expect(h.match(/class="mono ready-value"/g)).toHaveLength(8);
    expect(h).toContain('class="bottleneck"');
    expect(h).toContain('Hà Nội'); // bottleneck text keeps proper-noun capitals
    expect(rule('.bottleneck')).toMatch(/flex:\s*none/);
    expect(css).toMatch(/\.review-screen \.review-body > section \{[^}]*overflow-y:\s*auto/);
  });
});

describe('other long-label lists', () => {
  it('Brief requirements, Orbit metrics, Debrief why-chain, Guide cards wrap by word', () => {
    expect(css).toMatch(/\.req-list > div > \*,\s*\.metric > \*,\s*\.placed-row > \*,\s*\.why-row > \*,\s*\.guide-grid > \*,\s*\.ready-row > \* \{[^}]*overflow-wrap: break-word/);
  });
  it('HUD tiles grow with text size (rem minimum)', () => expect(css).toContain('minmax(calc(150rem / 16), 1fr)'));
  it('a modal taller than the screen scrolls from its top (not centred out of reach)', () => {
    expect(rule('.modal-backdrop')).toMatch(/align-items:\s*flex-start/);
    expect(rule('.modal-backdrop > .panel')).toMatch(/margin:\s*auto/);
  });
});
