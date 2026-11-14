// Number display. Vietnamese (default): comma decimal, dot thousands (CLAUDE.md rule 4) — "3,0", "2.640".
// English: point decimal, comma thousands — "3.0", "2,640". Same rounding, only the separators change.

let locale: 'vi' | 'en' = 'vi';

/** Set by useLang() (src/i18n) when the UI language changes. */
export function setNumberLocale(l: 'vi' | 'en'): void {
  locale = l;
}

/** Fixed decimals: fmt(3.04, 1) → "3,0" (VI) / "3.0" (EN). */
export function fmt(x: number, decimals = 1): string {
  if (!Number.isFinite(x)) return '—';
  const s = Math.abs(x).toFixed(decimals);
  const [int, frac] = s.split('.');
  const [thousands, decimal] = locale === 'en' ? [',', '.'] : ['.', ','];
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
  return (x < 0 && Number(s) !== 0 ? '−' : '') + grouped + (frac ? decimal + frac : '');
}

/** Integer with thousands separator: kusd(2640) → "2.640k" (VI) / "2,640k" (EN). */
export function kusd(x: number): string {
  return fmt(Math.round(x), 0) + 'k';
}
