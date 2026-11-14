import { useState } from 'react';
import { useMission } from '../state/mission';
import { useStore } from '../state/store';
import { fmt } from '../ui/format';
import { HeaderTools } from '../ui/HeaderTools';
import { useT } from '../ui/i18n';

// Stage times are illustrative (design/HF-Launch: "thời gian minh họa, tùy tên lửa").
const STAGES: [string, string][] = [
  ['T−10 s', 'Đếm ngược tiếng Việt, Go/No-Go cuối'],
  ['T+0', 'Rời bệ phóng'],
  ['T+2:30', 'Tách tầng 1'],
  ['T+8:40', 'Tắt động cơ tầng 2'],
  ['T+55:00', 'Thả vệ tinh khỏi bộ tách'],
  ['T+1:30:00', 'Tín hiệu đầu tiên qua Hòa Lạc'],
];

export function Launch() {
  const { state, dispatch } = useStore();
  const t = useT();
  const m = useMission();
  const rec = state.ops.launch;
  const [k, setK] = useState(0);
  const last = STAGES.length - 1;

  const fire = k >= 1 && k <= 3;
  const onPad = k <= 1;
  const lift = k === 0 ? 0 : k === 1 ? -40 : -900;
  const night = k >= 2;
  const failed = rec?.attempts.filter((a) => a.failed) ?? [];
  const lost = rec?.lostPlanes.length ?? 0;
  const N = m.satCount;

  return (
    <div
      className="screen"
      style={{ background: `linear-gradient(180deg, ${night ? '#030612' : '#0B1B3D'} 0%, ${night ? '#070D1A' : '#1B3A6B'} 100%)` }}
    >
      <header className="topbar" style={{ borderBottomColor: 'rgba(255,255,255,.08)' }}>
        <span className="brand">
          ORBIT <span className="amber">72</span>{' '}
          <span className="sub">
            · Phóng · chuyến 1/{m.launch.launches} · mặt phẳng 1
          </span>
        </span>
        <span className="mono" style={{ fontSize: 'calc(13rem / 16)', color: 'var(--muted)' }}>
          {m.launch.launcher.name.toUpperCase()} · {m.orbit.hKm} km
        </span>
        <HeaderTools />
      </header>
      <main className="body launch-body">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', overflow: 'hidden', minHeight: 360 }}>
          <svg width="100%" height="100%" viewBox="0 0 300 400" style={{ maxWidth: 420, maxHeight: 560 }} role="img" aria-label={`Tên lửa: ${STAGES[k][1]}`}>
            <g className="rocket" transform={`translate(0 ${lift})`}>
              <path d="M150 40 C170 70 176 100 176 140 V300 H124 V140 C124 100 130 70 150 40Z" fill="#E8EEF8" />
              <path d="M124 270 L102 320 H124Z M176 270 L198 320 H176Z" fill="#F87171" />
              <rect x="124" y="180" width="52" height="8" fill="#F5A524" />
              <circle cx="150" cy="120" r="10" fill="#3DD6F5" stroke="#1E3A8A" strokeWidth="3" />
              <path d="M128 300 H172 L166 318 H134Z" fill="#5B6B8F" />
              {fire && (
                <>
                  <path d="M134 318 Q150 400 166 318Z" fill="#F5A524" />
                  <path d="M140 318 Q150 370 160 318Z" fill="#FFF3C4" />
                </>
              )}
            </g>
            {onPad && <path d="M60 330 V120 H72 V330 M60 160 H118 M60 220 H118 M60 280 H118" stroke="#3A4C78" strokeWidth="4" fill="none" />}
            <path d="M0 330 H300 V400 H0Z" fill="#0B1428" />
          </svg>
          <div style={{ position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center' }}>
            <div className="lbl" style={{ color: 'var(--amber)' }}>
              {STAGES[k][1]}
            </div>
            <div className="mono" style={{ fontSize: 'clamp(40px, 8vw, 64px)', fontWeight: 600, lineHeight: 1.1 }} aria-live="polite">
              {STAGES[k][0].replace(' s', '')}
            </div>
          </div>
        </div>

        <div className="col">
          <span className="lbl">Các mốc phóng · thời gian minh họa, tùy tên lửa</span>
          <ol className="col" style={{ listStyle: 'none', margin: 0, padding: 0, gap: 8 }}>
            {STAGES.map(([t, n], q) => {
              const st = q < k ? 'XONG' : q === k ? 'ĐANG' : 'CHỜ';
              return (
                <li
                  key={t}
                  className="panel row"
                  style={{ padding: '9px 12px', gap: 10, borderColor: q === k ? 'var(--amber)' : undefined, background: q === k ? '#16213D' : undefined }}
                  aria-current={q === k ? 'step' : undefined}
                >
                  <span className="mono" style={{ width: 78, fontSize: 'calc(12rem / 16)', color: 'var(--muted)' }}>
                    {t}
                  </span>
                  <span style={{ flex: 1, fontSize: 'calc(13rem / 16)', fontWeight: 600 }}>{n}</span>
                  <span className="status" style={{ background: q < k ? 'var(--ok)' : q === k ? 'var(--amber)' : '#3A4C78' }}>
                    {st}
                  </span>
                </li>
              );
            })}
          </ol>

          {k === last && rec && (
            <div className="panel" style={{ padding: 12, borderColor: lost ? 'var(--bad)' : 'var(--ok)', fontSize: 'calc(13rem / 16)', lineHeight: 1.5 }} role="status">
              {lost === 0 ? (
                <>
                  <strong style={{ color: 'var(--ok)' }}>Rồng Con-1 đã vào quỹ đạo.</strong> Tín hiệu đầu tiên qua trạm Hòa Lạc.
                  {m.launch.launches > 1 && ` ${m.launch.launches - 1} chuyến còn lại cho các mặt phẳng khác được mô phỏng tự động.`}
                </>
              ) : (
                <>
                  <strong style={{ color: 'var(--bad)' }}>
                    Mất {lost} mặt phẳng ({(lost * N) / m.orbit.planes} vệ tinh).
                  </strong>{' '}
                  Không đủ ngân sách mua chuyến thay thế.
                </>
              )}
              {failed.length > 0 && (
                <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {failed.map((a) => (
                    <li key={a.launch}>
                      Chuyến {a.launch + 1}: thất bại → {a.replaced ? 'đã mua chuyến thay thế' : 'không thay thế được'}
                    </li>
                  ))}
                  {rec.extraCostKusd > 0 && (
                    <li>
                      Chi phí thêm {fmt(rec.extraCostKusd, 0)}k · chậm {rec.extraMonths} tháng
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div style={{ fontSize: 'calc(12rem / 16)', color: 'var(--dim)', lineHeight: 1.5 }}>
            Độ khó Giám đốc: mỗi chuyến có 3% thất bại [GA]; hỏng thì mua chuyến thay thế nếu còn ngân sách, cộng 3 tháng.
          </div>
          <div className="row" style={{ marginTop: 'auto', flexWrap: 'wrap' }}>
            <button className="btn-s" onClick={() => setK(0)}>
              {t('replay')}
            </button>
            <button className="btn-s" style={{ flex: 1 }} onClick={() => setK(Math.min(k + 1, last))} disabled={k === last}>
              {t('nextStep')}
            </button>
            <button className="btn-p" onClick={() => dispatch({ type: 'go', screen: 'ops' })}>
              {t('missionControl')} →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
