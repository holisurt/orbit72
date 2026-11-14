// UI language: dictionaries, t(key, params), useLang(). The language itself is the existing Settings field
// (src/state/settings.tsx, saved under orbit72.settings) — the state shape is unchanged.
import { useEffect } from 'react';
import { useSettings } from '../state/settings';
import { setNumberLocale } from '../ui/format';
import { en } from './en';
import { vi } from './vi';

export type Lang = 'vi' | 'en';
export type Key = keyof typeof vi;
export const DICTS: Record<Lang, Record<Key, string>> = { vi, en };

/**
 * English covers the whole UI only when every screen is translated. Until then the Settings option is
 * disabled so the game never shows a half-English state (see report / docs).
 */
export const EN_COMPLETE = false;

/** Translate a key; {name} placeholders are filled from params. Falls back to Vietnamese. */
export function t(lang: Lang, key: Key, params?: Record<string, string | number>): string {
  let s: string = DICTS[lang][key] ?? DICTS.vi[key];
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/** Current language; also switches number separators (VI 3,0 · 2.640 — EN 3.0 · 2,640). */
export function useLang(): Lang {
  const { settings } = useSettings();
  const lang: Lang = settings.lang === 'en' && EN_COMPLETE ? 'en' : 'vi';
  setNumberLocale(lang);
  useEffect(() => {
    if (typeof document !== 'undefined') document.documentElement.lang = lang;
  }, [lang]);
  return lang;
}

/**
 * While English is incomplete, a stored "en" (chosen before) is switched back to Vietnamese on first mount,
 * so no screen shows a half-English UI. Used by the header (every screen) and the Guide.
 */
export function useEnglishGate(): void {
  const { settings, update } = useSettings();
  useEffect(() => {
    if (settings.lang === 'en' && !EN_COMPLETE) update({ lang: 'vi' });
  }, [settings.lang, update]);
}

/** Hook form: const tr = useTr(); tr('home_lead', { months: 18 }). */
export function useTr(): (key: Key, params?: Record<string, string | number>) => string {
  const lang = useLang();
  return (key, params) => t(lang, key, params);
}
