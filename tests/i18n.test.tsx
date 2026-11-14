// i18n: dictionaries in src/i18n — same keys in VI and EN, no empty values, parameters filled, numbers per locale.
import { describe, expect, it, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { vi } from '../src/i18n/vi';
import { en } from '../src/i18n/en';
import { EN_COMPLETE, t } from '../src/i18n';
import { fmt, kusd, setNumberLocale } from '../src/ui/format';
import { DataProvider } from '../src/data/context';
import { initialState, StoreProvider } from '../src/state/store';
import { DEFAULT_SETTINGS, SettingsProvider } from '../src/state/settings';
import { SettingsDialog } from '../src/ui/SettingsDialog';
import { data } from './fixtures';

afterEach(() => setNumberLocale('en'));

describe('dictionaries', () => {
  it('every key exists in both vi and en, and no value is empty', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(vi).sort());
    for (const [k, v] of Object.entries(vi)) expect(v.trim(), `vi.${k}`).not.toBe('');
    for (const [k, v] of Object.entries(en)) expect(v.trim(), `en.${k}`).not.toBe('');
  });

  it('placeholders match between languages', () => {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    for (const k of Object.keys(vi) as (keyof typeof vi)[]) expect(ph(en[k]), k).toEqual(ph(vi[k]));
  });

  it('t() fills parameters', () => {
    expect(t('vi', 'home_lead', { months: 18 })).toContain('Bạn có 18 tháng');
    expect(t('en', 'home_lead', { months: 18 })).toContain('You have 18 months');
  });
});

describe('English quiz (keyed by question index; quiz.json unchanged)', () => {
  it('one English entry per question, same number of options', async () => {
    const { enQuiz } = await import('../src/i18n/en');
    expect(enQuiz).toHaveLength(data.quiz.questions.length);
    data.quiz.questions.forEach((q, i) => {
      expect(enQuiz[i].options, `q${i}`).toHaveLength(q.options.length);
      expect(enQuiz[i].q.trim(), `q${i}`).not.toBe('');
    });
  });
});

describe('number display', () => {
  it('VI is unchanged: comma decimal, dot thousands', () => {
    setNumberLocale('vi');
    expect([fmt(3.04, 1), fmt(49.12, 1), kusd(2640), fmt(-0.04, 1)]).toEqual(['3,0', '49,1', '2.640k', '0,0']);
  });
  it('EN: point decimal, comma thousands — same rounding', () => {
    setNumberLocale('en');
    expect([fmt(3.04, 1), fmt(48.11, 1), kusd(2640), fmt(1234567.891, 2)]).toEqual(['3.0', '48.1', '2,640k', '1,234,567.89']);
  });
});

describe('English-only UI', () => {
  it('English is complete and Settings has no language option', () => {
    const h = renderToString(
      <SettingsProvider initial={DEFAULT_SETTINGS}>
        <DataProvider initial={{ data, maps: { world: '', vn: '', globe: '', seaLand: '' } }}>
          <StoreProvider initial={initialState}>
            <SettingsDialog onClose={() => {}} />
          </StoreProvider>
        </DataProvider>
      </SettingsProvider>,
    );
    expect(EN_COMPLETE).toBe(true);
    expect(h).not.toMatch(/Tiếng Việt|English/);
  });
});
