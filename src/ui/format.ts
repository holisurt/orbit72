// Vietnamese number display: comma decimal, dot thousands (CLAUDE.md rule 4).

/** Fixed decimals with comma: fmt(3.04, 1) → "3,0". */
export function fmt(x: number, decimals = 1): string {
  if (!Number.isFinite(x)) return '—';
  const s = Math.abs(x).toFixed(decimals);
  const [int, frac] = s.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (x < 0 && Number(s) !== 0 ? '−' : '') + grouped + (frac ? ',' + frac : '');
}

/** Integer with dot thousands: kusd(2640) → "2.640k". */
export function kusd(x: number): string {
  return fmt(Math.round(x), 0) + 'k';
}

/** Today's mission number, e.g. #20261114. */
export function missionOfDay(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}
