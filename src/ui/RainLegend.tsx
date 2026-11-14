import type { RainBin } from './rain';
import { fmt } from './format';

/** Stepped legend for the IMERG layer: swatch + lower bound of each class, with the unit. */
export function RainLegend({ bins, unit, title }: { bins: RainBin[]; unit: string; title: string }) {
  return (
    <div className="rain-legend" role="img" aria-label={`${title}: ${bins.map((b) => `≥ ${fmt(b.min, b.min % 1 ? 1 : 0)}`).join(', ')} ${unit}`}>
      <span className="lbl">{title}</span>
      <div className="row" style={{ gap: 2 }} aria-hidden="true">
        {bins.map((b) => (
          <span key={b.min} className="col" style={{ gap: 2, alignItems: 'flex-start' }}>
            {/* same cyan-over-land blend as the map cells */}
            <span style={{ width: 30, height: 8, borderRadius: 2, background: `linear-gradient(rgba(61,214,245,${b.opacity}), rgba(61,214,245,${b.opacity})), #2F6B4F` }} />
            <span className="mono" style={{ fontSize: 'calc(10rem / 16)', color: 'var(--soft)' }}>
              {fmt(b.min, b.min % 1 ? 1 : 0)}
            </span>
          </span>
        ))}
        <span className="mono" style={{ fontSize: 'calc(10rem / 16)', color: 'var(--dim)', alignSelf: 'flex-end' }}>
          {unit}
        </span>
      </div>
    </div>
  );
}
