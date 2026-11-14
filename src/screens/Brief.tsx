import { useGameData } from '../data/context';
import type { DifficultyId } from '../data/types';
import { useStore } from '../state/store';
import { fmt } from '../ui/format';
import { MapVN, projVN } from '../ui/MapVN';
import { TopBar } from '../ui/TopBar';

const LEVEL_NAME: Record<DifficultyId, string> = { hoc_vien: 'HỌC VIÊN', ky_su: 'KỸ SƯ', giam_doc: 'GIÁM ĐỐC' };

export function Brief() {
  const data = useGameData();
  const { state, dispatch } = useStore();
  const rules = data.scenario.difficulty[state.difficulty];
  const req = data.scenario.requirements;
  const hn = projVN(data.scenario.target.lat, data.scenario.target.lon);

  const reqs = [
    { id: 'R1', t: 'Khoảng trống liên lạc dài nhất', v: `≤ ${fmt(rules.gapMaxH, 1)} h` },
    { id: 'R2', t: 'Dữ liệu tạo ra ≤ tải xuống', v: '0 tồn đọng' },
    { id: 'R3', t: 'Dư công suất, đủ pin bóng tối', v: `≥ ${Math.round((req.powerMargin - 1) * 100)}%` },
    { id: 'R4', t: 'Tuổi thọ quỹ đạo', v: `${req.lifetimeMinY}–${req.lifetimeMaxY} năm` },
    { id: 'R5', t: 'Tổng chi phí', v: `≤ ${fmt(rules.budget, 0)}k` },
    { id: 'R6', t: 'Thời gian phát triển', v: `≤ ${req.devMonthsMax} th` },
    { id: 'R7', t: 'Biên mọi đường truyền (10°)', v: `≥ ${req.linkMarginDb} dB` },
    { id: 'R8', t: 'Đủ linh kiện bắt buộc', v: 'Đủ' },
  ];

  const back = () => dispatch({ type: 'go', screen: state.mode === 'coop' ? 'setup' : 'home' });

  return (
    <div className="screen">
      <TopBar
        step="brief"
        right={
          <span className="mono" style={{ fontSize: 13, color: 'var(--muted)' }}>
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
            <span style={{ fontSize: 19, fontWeight: 800 }}>Mắt Biển</span>
            <span style={{ fontSize: 13, lineHeight: 1.45, color: '#C9D4E8' }}>
              CubeSat 3U theo dõi tàu cá bằng AIS — tri ân NanoDragon (2021).
            </span>
          </button>
          <button className="card" aria-pressed={true}>
            <span className="lbl" style={{ color: 'var(--amber)' }}>
              Kịch bản chính
            </span>
            <span style={{ fontSize: 19, fontWeight: 800 }}>72 Giờ Vàng</span>
            <span style={{ fontSize: 13, lineHeight: 1.45, color: '#C9D4E8' }}>
              Chòm CubeSat chuyển tiếp SOS khi siêu bão đổ bộ miền Bắc.
            </span>
          </button>
          <button className="card" disabled>
            <span className="lbl" style={{ color: '#7F90AE' }}>
              Sắp có
            </span>
            <span style={{ fontSize: 19, fontWeight: 800 }}>Mùa Lũ Miền Trung</span>
            <span style={{ fontSize: 13, lineHeight: 1.45, color: '#C9D4E8' }}>
              Lập bản đồ ngập khi mây dày: quang học hay radar?
            </span>
          </button>
          <div className="subtle" style={{ marginTop: 'auto', fontSize: 13, lineHeight: 1.5, color: '#C9D4E8' }}>
            <span className="lbl" style={{ color: 'var(--amber)' }}>
              Vì sao quan trọng
            </span>
            <br />
            Bão Yagi (9/2024) làm <strong style={{ color: '#FFFFFF' }}>6.285 trạm phát sóng</strong> mất liên lạc do mất
            điện ở 15 tỉnh, thành.
            <br />
            <span style={{ fontSize: 11, color: '#7F90AE' }}>Nguồn: Bộ TT&amp;TT qua VnEconomy, 13/9/2024</span>
          </div>
        </div>

        <div className="panel map-panel">
          <MapVN label="Bản đồ miền Bắc Việt Nam với đường đi siêu bão và vùng mưa minh họa">
            <ellipse cx="245" cy="140" rx="110" ry="70" fill="#3DD6F5" fillOpacity="0.12" stroke="#3DD6F5" strokeOpacity="0.5" strokeDasharray="3 3" />
            <ellipse cx="250" cy="142" rx="60" ry="38" fill="#3DD6F5" fillOpacity="0.22" stroke="#3DD6F5" strokeOpacity="0.7" strokeDasharray="3 3" />
            <path d="M480 210 L375 186 L276 153 L180 126 L105 105" fill="none" stroke="#F87171" strokeWidth="3" strokeDasharray="8 5" />
            <g transform="translate(375 186)">
              <circle r="11" fill="none" stroke="#F87171" strokeWidth="2.5" />
              <path d="M-6 -6 Q0 -14 6 -6 M6 6 Q0 14 -6 6" stroke="#F87171" strokeWidth="2.5" fill="none" />
            </g>
            <circle cx={hn.x} cy={hn.y} r="5" fill="#F5A524" />
            <text x="200" y="176" fontSize="11" fontWeight="700" fill="#FFFFFF">
              Hà Nội · Hòa Lạc
            </text>
            <circle cx="261" cy="154.5" r="4" fill="#F87171" />
            <text x="270" y="170" fontSize="10" fill="#FCA5A5">
              Đổ bộ T0
            </text>
            <text x="300" y="120" fontSize="10" fill="#8BE9FA">
              Mưa lớn (minh họa)
            </text>
          </MapVN>
          <div style={{ position: 'absolute', left: 16, top: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="lbl" style={{ color: 'var(--bad)' }}>
              Siêu bão · T0 = đổ bộ
            </span>
            <span style={{ fontSize: 22, fontWeight: 800 }}>{data.scenario.name}</span>
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
              fontSize: 11,
              color: '#7F90AE',
            }}
          >
            <span>Bản đồ: Natural Earth (public domain). Vùng mưa minh họa — bản game dùng lưới NASA GPM IMERG.</span>
            <span>— — đường đi bão</span>
          </div>
        </div>

        <div className="col">
          <span className="lbl">Mục tiêu</span>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: '#C9D4E8' }}>
            Chuyển tiếp tin SOS từ các xã bị cô lập về trạm Hòa Lạc trong 72 giờ sau khi bão đổ bộ.
          </p>
          <span className="lbl" style={{ marginTop: 4 }}>
            8 yêu cầu bắt buộc
          </span>
          <div className="panel req-list" style={{ padding: '6px 12px' }}>
            {reqs.map((r) => (
              <div key={r.id}>
                <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)', width: 22 }}>
                  {r.id}
                </span>
                <span style={{ flex: 1, fontSize: 13 }}>{r.t}</span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--cyan)', textAlign: 'right' }}>
                  {r.v}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <div className="panel" style={{ padding: '10px 12px' }}>
              <span className="lbl">Ngân sách</span>
              <div className="mono" style={{ fontSize: 22, fontWeight: 600 }}>
                {fmt(rules.budget, 0)}k <span style={{ fontSize: 12, color: 'var(--muted)' }}>USD</span>
              </div>
            </div>
            <div className="panel" style={{ padding: '10px 12px' }}>
              <span className="lbl">Hạn sẵn sàng</span>
              <div className="mono" style={{ fontSize: 22, fontWeight: 600 }}>
                {req.devMonthsMax} <span style={{ fontSize: 12, color: 'var(--muted)' }}>tháng</span>
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 10, marginTop: 'auto' }}>
            <button className="btn-s" onClick={back} aria-label="Quay lại">
              ←
            </button>
            <button className="btn-p" style={{ flex: 1 }} onClick={() => dispatch({ type: 'acceptContract' })}>
              Nhận hợp đồng · Ráp vệ tinh →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
