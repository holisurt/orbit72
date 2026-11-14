import { useMemo } from 'react';
import { useGameData } from '../data/context';
import type { DifficultyId } from '../data/types';
import { useStore } from '../state/store';
import { fmt } from '../ui/format';
import { REQ_LABEL } from '../sim/mission';
import { MapVN, projVN } from '../ui/MapVN';
import { accumulate, IMERG_LABEL, rainCells, TOTAL_BINS } from '../ui/rain';
import { RainLegend } from '../ui/RainLegend';
import { TopBar } from '../ui/TopBar';
import { useT } from '../ui/i18n';

const LEVEL_NAME: Record<DifficultyId, string> = { hoc_vien: 'HỌC VIÊN', ky_su: 'KỸ SƯ' };

export function Brief() {
  const data = useGameData();
  const { state, dispatch } = useStore();
  const t = useT();
  const rules = data.scenario.difficulty[state.difficulty];
  const req = data.scenario.requirements;
  const hn = projVN(data.scenario.target.lat, data.scenario.target.lon);
  const grid = data.imerg?.grid;
  // Real 72 h accumulated rain (sum of hourly IMERG frames); Hanoi total from the native 0.1° cell.
  const total = useMemo(() => (grid ? rainCells(grid, accumulate(grid), TOTAL_BINS) : null), [grid]);
  const hanoiTotal = (data.imerg?.hanoi_mmh ?? []).slice(0, 72).reduce((a, b) => a + b, 0);

  const reqs = [
    { id: 'R1', t: REQ_LABEL.R1, v: `≤ ${fmt(rules.gapMaxH, 1)} h` },
    { id: 'R2', t: REQ_LABEL.R2, v: '0 tồn đọng' },
    { id: 'R3', t: REQ_LABEL.R3, v: `≥ ${Math.round((req.powerMargin - 1) * 100)}%` },
    { id: 'R4', t: REQ_LABEL.R4, v: `${req.lifetimeMinY}–${req.lifetimeMaxY} năm` },
    { id: 'R5', t: REQ_LABEL.R5, v: `≤ ${fmt(rules.budget, 0)}k` },
    { id: 'R6', t: REQ_LABEL.R6, v: `≤ ${req.devMonthsMax} th` },
    { id: 'R7', t: REQ_LABEL.R7, v: `≥ ${req.linkMarginDb} dB` },
    { id: 'R8', t: REQ_LABEL.R8, v: 'Đủ' },
  ];

  const back = () => dispatch({ type: 'go', screen: state.mode === 'coop' ? 'setup' : 'home' });

  return (
    <div className="screen">
      <TopBar
        step="brief"
        right={
          <span className="mono" style={{ fontSize: 'calc(13rem / 16)', color: 'var(--muted)' }}>
            {LEVEL_NAME[state.difficulty]} · {state.mode === 'coop' ? `CO-OP ${state.players.count}` : 'SOLO'}
          </span>
        }
      />
      <main className="body brief-body">
        <div className="col" style={{ gap: 12 }}>
          <span className="lbl">Hợp đồng</span>
          <button className="card" aria-pressed={false} onClick={() => dispatch({ type: 'startTutorial' })}>
            <span className="lbl" style={{ color: 'var(--ok)' }}>
              Tutorial
            </span>
            <span style={{ fontSize: 'calc(19rem / 16)', fontWeight: 800 }}>Mắt Biển</span>
            <span style={{ fontSize: 'calc(13rem / 16)', lineHeight: 1.45, color: 'var(--soft)' }}>
              CubeSat 3U đầu tay, một vệ tinh — tri ân NanoDragon (2021).
            </span>
          </button>
          <button className="card" aria-pressed={true}>
            <span className="lbl" style={{ color: 'var(--amber)' }}>
              Kịch bản chính
            </span>
            <span style={{ fontSize: 'calc(19rem / 16)', fontWeight: 800 }}>72 Giờ Vàng</span>
            <span style={{ fontSize: 'calc(13rem / 16)', lineHeight: 1.45, color: 'var(--soft)' }}>
              Chòm CubeSat chuyển tiếp SOS khi siêu bão đổ bộ miền Bắc.
            </span>
          </button>
          <div className="subtle" style={{ marginTop: 'auto', fontSize: 'calc(13rem / 16)', lineHeight: 1.5, color: 'var(--soft)' }}>
            <span className="lbl" style={{ color: 'var(--amber)' }}>
              Vì sao quan trọng
            </span>
            <br />
            Bão Yagi (9/2024) làm <strong style={{ color: '#FFFFFF' }}>6.285 trạm phát sóng</strong> mất liên lạc do mất
            điện ở 15 tỉnh, thành.
            <br />
            <span style={{ fontSize: 'calc(11rem / 16)', color: 'var(--dim)' }}>Nguồn: Bộ TT&amp;TT qua VnEconomy, 13/9/2024</span>
          </div>
        </div>

        <div className="panel map-panel">
          <MapVN
            label={
              total
                ? `Bản đồ miền Bắc Việt Nam: mưa tích lũy 72 giờ (${IMERG_LABEL}) và đường đi siêu bão`
                : 'Bản đồ miền Bắc Việt Nam với đường đi siêu bão'
            }
          >
            {total?.map((c, k) => <rect key={k} x={c.x} y={c.y} width={c.s} height={c.s} fill="#3DD6F5" fillOpacity={c.o} />)}
            <path d="M480 210 L375 186 L276 153 L180 126 L105 105" fill="none" stroke="#F87171" strokeWidth="3" strokeDasharray="8 5" />
            <g transform="translate(375 186)">
              <circle r="11" fill="none" stroke="#F87171" strokeWidth="2.5" />
              <path d="M-6 -6 Q0 -14 6 -6 M6 6 Q0 14 -6 6" stroke="#F87171" strokeWidth="2.5" fill="none" />
            </g>
            <circle cx={hn.x} cy={hn.y} r="5" fill="#F5A524" />
            {/* centred under the dot so a narrow (cropped) map never cuts it */}
            <text x={hn.x} y={hn.y + 18} textAnchor="middle" fontSize="11" fontWeight="700" fill="#FFFFFF">
              Hà Nội · Hòa Lạc
            </text>
            <circle cx="261" cy="154.5" r="4" fill="#F87171" />
            <text x="272" y="146" fontSize="10" fill="#FCA5A5">
              Đổ bộ T0
            </text>
          </MapVN>
          {grid && (
            <div style={{ position: 'absolute', right: 16, top: 14 }}>
              <RainLegend bins={TOTAL_BINS} unit="mm" title="Mưa tích lũy 72 h" />
            </div>
          )}
          <div style={{ position: 'absolute', left: 16, top: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="lbl" style={{ color: 'var(--bad)' }}>
              Siêu bão · T0 = đổ bộ
            </span>
            <span style={{ fontSize: 'calc(22rem / 16)', fontWeight: 800 }}>{data.scenario.name}</span>
          </div>
          <div
            style={{
              position: 'absolute',
              left: 16,
              bottom: 12,
              right: 16,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
              flexWrap: 'wrap',
              fontSize: 'calc(11rem / 16)',
              color: 'var(--dim)',
            }}
          >
            <span>
              Bản đồ: Natural Earth (public domain) ·{' '}
              {grid ? (
                <>
                  Mưa: {IMERG_LABEL} (lưới {fmt(grid.step, 1)}°) · Hà Nội {fmt(hanoiTotal, 0)} mm / 72 h
                </>
              ) : (
                'Chưa có lớp mưa IMERG (data_prep/prepare_imerg.py)'
              )}
            </span>
            <span>— — đường đi bão</span>
          </div>
        </div>

        <div className="col">
          <span className="lbl">Mục tiêu</span>
          <p style={{ margin: 0, fontSize: 'calc(14rem / 16)', lineHeight: 1.55, color: 'var(--soft)' }}>
            Chuyển tiếp tin SOS từ các xã bị cô lập về trạm Hòa Lạc trong 72 giờ sau khi bão đổ bộ.
          </p>
          <span className="lbl" style={{ marginTop: 4 }}>
            8 yêu cầu bắt buộc
          </span>
          <div className="panel req-list" style={{ padding: '6px 12px' }}>
            {reqs.map((r) => (
              <div key={r.id}>
                <span className="mono" style={{ fontSize: 'calc(12rem / 16)', fontWeight: 600, color: 'var(--amber)', width: 22 }}>
                  {r.id}
                </span>
                <span style={{ flex: 1, fontSize: 'calc(13rem / 16)' }}>{r.t}</span>
                <span className="mono" style={{ fontSize: 'calc(12rem / 16)', color: 'var(--cyan)', textAlign: 'right' }}>
                  {r.v}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <div className="panel" style={{ padding: '10px 12px' }}>
              <span className="lbl">Ngân sách</span>
              <div className="mono" style={{ fontSize: 'calc(22rem / 16)', fontWeight: 600 }}>
                {fmt(rules.budget, 0)}k <span style={{ fontSize: 'calc(12rem / 16)', color: 'var(--muted)' }}>USD</span>
              </div>
            </div>
            <div className="panel" style={{ padding: '10px 12px' }}>
              <span className="lbl">Hạn sẵn sàng</span>
              <div className="mono" style={{ fontSize: 'calc(22rem / 16)', fontWeight: 600 }}>
                {req.devMonthsMax} <span style={{ fontSize: 'calc(12rem / 16)', color: 'var(--muted)' }}>tháng</span>
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 10, marginTop: 'auto' }}>
            <button className="btn-s" onClick={back} aria-label={t('back')}>
              ←
            </button>
            <button className="btn-p" style={{ flex: 1 }} onClick={() => dispatch({ type: 'acceptContract' })}>
              {t('acceptBuild')} →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
