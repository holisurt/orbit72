// UI strings for older callers — English-only build; the dictionaries live in src/i18n.
import { en } from '../i18n/en';
import { vi } from '../i18n/vi';

export type TKey = keyof typeof vi;
export type Lang = 'vi' | 'en';

/** { key: { vi, en } } view of the dictionaries (used by tests and older code). */
export const DICT = Object.fromEntries((Object.keys(vi) as TKey[]).map((k) => [k, { vi: vi[k], en: en[k] }])) as Record<
  TKey,
  { vi: string; en: string }
>;

export function translate(lang: Lang, key: TKey): string {
  return DICT[key][lang];
}

export function useT(): (key: TKey) => string {
  return (key) => translate('en', key);
}
