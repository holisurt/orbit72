// UI strings: dictionaries and t(key, params). This build is English-only (src/i18n/en.ts);
// vi.ts is kept as the reference for the Vietnamese release (v1.2-hanoi).
import { useEffect } from 'react';
import { setNumberLocale } from '../ui/format';
import { en } from './en';
import { vi } from './vi';

export type Lang = 'vi' | 'en';
export type Key = keyof typeof vi;
export const DICTS: Record<Lang, Record<Key, string>> = { vi, en };

/** English-only build: every screen is translated. */
export const EN_COMPLETE = true;

/** Translate a key; {name} placeholders are filled from params. */
export function t(lang: Lang, key: Key, params?: Record<string, string | number>): string {
  let s: string = DICTS[lang][key] ?? DICTS.vi[key];
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Current language: always English in this build (numbers 3.0 · 2,640). */
export function useLang(): Lang {
  const lang: Lang = 'en';
  setNumberLocale(lang);
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }, [lang]);
  return lang;
}

/** English-only build: nothing to gate (kept so callers stay unchanged). */
export function useEnglishGate(): void {}

/** Hook form: const tr = useTr(); tr('home_lead', { months: 18 }). */
export function useTr(): (key: Key, params?: Record<string, string | number>) => string {
  const lang = useLang();
  return (key, params) => t(lang, key, params);
}
