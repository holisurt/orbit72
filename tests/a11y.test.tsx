// CP4.6 Accessibility + mobile: labelled SVGs, named buttons, touch targets, contrast, stacking ≤ 900 px,
// no horizontal scroll, modals, portrait hint. (Keyboard behaviour in a real browser: tests/e2e-checklist.md.)
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ReactElement } from 'react';
import appCss from '../src/styles/app.css?raw';
import tokensCss from '../src/styles/tokens.css?raw';
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
import { Modal } from '../src/ui/Modal';
import { RotateHint } from '../src/ui/RotateHint';
import { SettingsDialog } from '../src/ui/SettingsDialog';
import { dataNasa } from './fixtures';

const render = (el: ReactElement, s: GameState = initialState) =>
  renderToString(
    <DataProvider initial={{ data: dataNasa, maps: { world: 'M0 0', vn: 'M0 0', globe: 'M0 0', seaLand: 'M0 0' } }}>
      <StoreProvider initial={s}>{el}</StoreProvider>
    </DataProvider>,
  ).replace(/<!-- -->/g, '');

const launched = [
  { type: 'startMission' },
  { type: 'acceptContract' },
  { type: 'launch', record: { launchedWithVuot: false, launchedWithNoGo: false, unanimousGo: true } },
  { type: 'finishOps' },
].reduce((s, a) => reducer(s, a as Action), initialState);
const coop = { ...initialState, mode: 'coop' as const };

const SCREENS: [string, ReactElement, GameState][] = [
  ['Home', <Home />, initialState],
  ['Setup', <Setup />, coop],
  ['Quiz', <Quiz phase="pre" />, initialState],
  ['Brief', <Brief />, initialState],
  ['Build', <Build />, launched],
  ['Orbit', <Orbit />, launched],
  ['Review', <Review />, launched],
  ['Launch', <Launch />, launched],
  ['Ops', <Ops />, launched],
  ['Debrief', <Debrief />, launched],
  ['Share', <Share />, launched],
  ['Guide', <Guide />, initialState],
  ['Settings', <SettingsDialog onClose={() => {}} />, initialState],
];

describe.each(SCREENS)('%s', (_name, el, s) => {
  const h = render(el, s);

  it('every SVG is labelled (role=img + aria-label) or hidden from assistive tech', () => {
    for (const tag of h.match(/<svg[^>]*>/g) ?? []) expect(tag, tag).toMatch(/aria-label="[^"]+"|aria-hidden="true"/);
  });

  it('every button has an accessible name', () => {
    for (const m of h.matchAll(/<button([^>]*)>([\s\S]*?)<\/button>/g)) {
      const text = m[2].replace(/<[^>]+>/g, '').trim();
      expect(text || /aria-label="[^"]+"/.test(m[1]), m[0].slice(0, 120)).toBeTruthy();
    }
  });

  it('form fields have labels', () => {
    for (const m of h.matchAll(/<input([^>]*)>/g)) {
      const a = m[1];
      if (/type="radio"/.test(a)) continue; // wrapped in <label>
      const id = a.match(/id="([^"]+)"/)?.[1];
      expect(Boolean(/aria-label=/.test(a) || (id && h.includes(`for="${id}"`))), m[0]).toBe(true);
    }
  });
});

// ---- CSS rules ----
function rulesFor(css: string, cls: string): string[] {
  const out: string[] = [];
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].split(',').map((x) => x.trim());
    if (sel.includes(cls)) out.push(m[2]);
  }
  return out;
}

describe('touch targets ≥ 44 px', () => {
  const interactive = ['.btn-p', '.btn-s', '.link-btn', '.seg', '.chip', '.tab', '.tg', '.sq', '.add', '.x', '.flip', '.vote', '.select', '.lv', '.opt', '.quiz-opt', '.tool-btn', '.guide-tab', '.guide-link', '.card', 'button.step'];
  it.each(interactive)('%s', (cls) => {
    const body = rulesFor(appCss, cls).join(';');
    const sizes = [...body.matchAll(/(?:min-height|height):\s*(\d+)px/g)].map((m) => Number(m[1]));
    expect(sizes.length, cls).toBeGreaterThan(0);
    expect(Math.max(...sizes), cls).toBeGreaterThanOrEqual(44);
  });
  it('touch-min token is 44 px', () => expect(tokensCss).toContain('--touch-min: 44px'));
});

// ---- contrast ----
const lum = (hex: string) => {
  const v = (hex.replace('#', '').match(/../g) ?? []).map((h) => parseInt(h, 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
function tokens(block: string): Record<string, string> {
  return Object.fromEntries([...block.matchAll(/--([a-z]+):\s*(#[0-9a-f]{6})/gi)].map((m) => [m[1], m[2].toLowerCase()]));
}

describe('text contrast ≥ 4.5:1', () => {
  const base = tokens(tokensCss.slice(tokensCss.indexOf(':root {'), tokensCss.indexOf('}', tokensCss.indexOf(':root {'))));
  const hcStart = tokensCss.indexOf(":root[data-contrast='high']");
  const hc = { ...base, ...tokens(tokensCss.slice(hcStart, tokensCss.indexOf('}', hcStart))) };
  const TEXT = ['text', 'muted', 'soft', 'dim', 'amber', 'cyan', 'ok', 'warn', 'bad'];
  const SURFACES = { bg: 'bg', panel: 'panel', subtle: '#16213d', line: '#1a2647', card: '#13224a', map: '#0a1a33' } as const;

  it.each([
    ['default', base],
    ['high contrast', hc],
  ])('%s theme: every text token on every surface', (_n, t) => {
    for (const tk of TEXT)
      for (const [sn, sv] of Object.entries(SURFACES)) {
        const surface = sv.startsWith('#') ? sv : t[sv];
        expect(ratio(t[tk], surface), `${tk} on ${sn}`).toBeGreaterThanOrEqual(4.5);
      }
  });

  it('buttons and chips', () => {
    expect(ratio('#1a1205', base.amber)).toBeGreaterThanOrEqual(4.5); // primary button
    expect(ratio('#c9d4e8', '#3a4c78')).toBeGreaterThanOrEqual(4.5); // disabled button text
    for (const c of [base.ok, base.warn, base.bad]) expect(ratio('#0b1020', c)).toBeGreaterThanOrEqual(4.5); // status chips
    expect(appCss).not.toContain('color: #9aabc7;'); // old 3.6:1 disabled text is gone
  });

  it('map labels get a dark halo so they stay readable over land', () => {
    expect(appCss).toMatch(/\.map-panel svg text \{[^}]*paint-order: stroke/);
  });
});

describe('layout', () => {
  it('≤ 900 px: all screen bodies stack in one column (reading order), HUD wraps', () => {
    const block = appCss.slice(appCss.indexOf('@media (max-width: 900px)'));
    for (const b of ['.brief-body', '.build-body', '.orbit-body', '.review-body', '.launch-body', '.ops-body', '.debrief-body', '.share-body', '.setup-body'])
      expect(block).toContain(b);
    expect(block).toMatch(/grid-template-columns: minmax\(0, 1fr\);/);
    expect(block).toMatch(/\.hud \{\s*grid-template-columns: repeat\(auto-fit, minmax\(150px, 1fr\)\)/);
  });

  it('no CSS reordering that would break focus order (no grid-row/order on panels)', () => {
    expect(appCss).not.toMatch(/-body > :nth-child\(2\)/);
  });

  it('no horizontal page scroll', () => {
    expect(appCss).toMatch(/\.screen \{\s*overflow-x: clip;/);
    expect(appCss).toMatch(/svg \{\s*max-width: 100%;/);
  });

  it('portrait hint on phones', () => {
    expect(appCss).toContain('@media (orientation: portrait) and (max-width: 600px)');
    const h = render(<RotateHint />);
    expect(h).toContain('Xoay ngang để chơi tốt hơn');
    expect(h).toContain('role="note"');
    expect(h).toContain('aria-label="Ẩn gợi ý xoay ngang"');
  });

  it('reduced motion: system preference and Settings switch', () => {
    expect(tokensCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(appCss).toContain(":root[data-motion='reduce'] .rocket");
  });
});

describe('modals', () => {
  it('Modal renders an aria-modal dialog labelled by its title (Esc / focus trap run in the browser)', () => {
    const h = renderToString(
      <Modal labelledBy="t" onClose={() => {}}>
        <h2 id="t">Tiêu đề</h2>
        <button>OK</button>
      </Modal>,
    );
    expect(h).toContain('role="dialog"');
    expect(h).toContain('aria-modal="true"');
    expect(h).toContain('aria-labelledby="t"');
  });
});
