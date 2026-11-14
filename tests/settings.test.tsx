// CP4.3 Settings (English-only since v1.3): menus + buttons, text size, high contrast, reduced motion, reset progress.
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import type { ReactElement } from 'react';
import tokensCss from '../src/styles/tokens.css?raw';
import { DataProvider } from '../src/data/context';
import { initialState, reducer, StoreProvider, STORAGE_KEY, type GameState } from '../src/state/store';
import { applySettings, DEFAULT_SETTINGS, SETTINGS_KEY, SettingsProvider, type Settings } from '../src/state/settings';
import { DICT, translate } from '../src/ui/i18n';
import { SettingsDialog } from '../src/ui/SettingsDialog';
import { Home } from '../src/screens/Home';
import { Build } from '../src/screens/Build';
import { data } from './fixtures';

const render = (el: ReactElement, settings: Settings = DEFAULT_SETTINGS, s: GameState = initialState) =>
  renderToString(
    <SettingsProvider initial={settings}>
      <DataProvider initial={{ data, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
        <StoreProvider initial={s}>{el}</StoreProvider>
      </DataProvider>
    </SettingsProvider>,
  ).replace(/<!-- -->/g, '');

describe('language (menu labels and buttons only)', () => {
  it('every key has VI and EN text', () => {
    for (const [k, v] of Object.entries(DICT)) {
      expect(v.vi, k).toBeTruthy();
      expect(v.en, k).toBeTruthy();
    }
    expect(translate('en', 'start')).toBe('Start mission');
  });

  it('Home menu, buttons and body copy are English', () => {
    const h = render(<Home />, { ...DEFAULT_SETTINGS, lang: 'en' });
    for (const s of ['Start mission', '3-minute tutorial', 'Engineer', 'Difficulty', 'Mode', 'Handbook', 'Settings']) expect(h).toContain(s);
    expect(h).toContain('A super typhoon is about to hit'); // lead paragraph is English too
    expect(h).not.toContain('Bắt đầu sứ mệnh');
  });

  it('stepper and screen buttons are English whatever the stored setting', () => {
    const s = reducer(reducer(initialState, { type: 'startMission' }), { type: 'acceptContract' });
    const h = render(<Build />, { ...DEFAULT_SETTINGS, lang: 'en' }, s);
    expect(h).toContain('1 Contract');
    expect(h).toContain('Choose orbit →');
    expect(render(<Build />, DEFAULT_SETTINGS, s)).toContain('Choose orbit →');
  });
});

describe('display settings', () => {
  it('applySettings sets root font size (text uses rem), contrast and motion flags; <html lang> stays vi', () => {
    const root = { lang: 'vi', style: { fontSize: '' }, dataset: {} as Record<string, string> };
    applySettings({ lang: 'en', textScale: 150, highContrast: true, reduceMotion: true }, root as unknown as HTMLElement);
    expect(root).toMatchObject({ lang: 'vi', style: { fontSize: '150%' }, dataset: { lang: 'en', text: '150', contrast: 'high', motion: 'reduce' } });
    applySettings(DEFAULT_SETTINGS, root as unknown as HTMLElement);
    expect(root).toMatchObject({ lang: 'vi', style: { fontSize: '100%' } });
    expect(root.dataset).toEqual({ lang: 'vi', text: '100' });
  });

  it('CSS: high-contrast tokens, manual reduced motion and the system preference', () => {
    expect(tokensCss).toContain(":root[data-contrast='high']");
    expect(tokensCss).toContain(":root[data-motion='reduce']");
    expect(tokensCss).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('settings are stored apart from progress, so reset keeps them', () => {
    expect(SETTINGS_KEY).not.toBe(STORAGE_KEY);
  });
});

describe('Settings dialog', () => {
  const h = render(<SettingsDialog onClose={() => {}} />);
  it('modal dialog with all controls, no language option', () => {
    expect(h).toContain('role="dialog"');
    expect(h).toContain('aria-modal="true"');
    for (const s of ['100%', '125%', '150%', 'High contrast', 'Reduce motion', 'Reset progress…']) expect(h).toContain(s);
    expect(h).not.toMatch(/Tiếng Việt|English/);
    expect(h.match(/role="switch"/g)).toHaveLength(2);
  });

  it('gear button in every header next to "?"', () => {
    expect(render(<Home />)).toMatch(/aria-label="Settings" aria-haspopup="dialog"/);
  });

  it('reset clears progress back to a fresh game', () => {
    const played = reducer(reducer(initialState, { type: 'startMission' }), { type: 'acceptContract' });
    expect(reducer(played, { type: 'reset' })).toEqual(initialState);
  });
});
