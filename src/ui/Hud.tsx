import { STATUS_LABEL, statusFromRatio, type Status } from '../sim/mission';
import { STATUS_COLOR } from './StatusChip';

export interface HudBar {
  name: string;
  ratio: number; // usage / limit
  text: string;
  status?: Status; // defaults to statusFromRatio(ratio)
}

/** Six budget bars across the top of Build (HF-Build HUD). */
export function Hud({ bars }: { bars: HudBar[] }) {
  return (
    <div className="hud" role="list" aria-label="Ngân sách thiết kế">
      {bars.map((b) => {
        const status = b.status ?? statusFromRatio(b.ratio);
        const pct = Math.round(Math.min(Math.max(b.ratio, 0), 1) * 100);
        return (
          <div key={b.name} className="panel hud-item" role="listitem">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
              <span className="lbl">{b.name}</span>
              <span className={`status ${status}`}>{STATUS_LABEL[status]}</span>
            </div>
            <div
              className="bar"
              role="meter"
              aria-label={b.name}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-valuetext={`${b.text} · ${STATUS_LABEL[status]}`}
            >
              <div style={{ width: `${pct}%`, background: STATUS_COLOR[status] }} />
            </div>
            <span className="mono" style={{ fontSize: 'calc(12rem / 16)', color: 'var(--text)', fontWeight: 600 }}>
              {b.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
