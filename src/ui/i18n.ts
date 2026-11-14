// Menu labels and buttons (VI/EN). Body text, data and science copy stay Vietnamese.
export const DICT = {
  continue: { vi: 'Tiếp tục', en: 'Continue' },
  skip: { vi: 'Bỏ qua', en: 'Skip' },
  submit: { vi: 'Nộp bài', en: 'Submit' },
} as const;

export type TKey = keyof typeof DICT;
export type Lang = 'vi' | 'en';

export function translate(lang: Lang, key: TKey): string {
  return DICT[key][lang];
}

export function useT(): (key: TKey) => string {
  return (key) => translate('vi', key);
}
