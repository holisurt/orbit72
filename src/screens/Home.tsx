import type { DifficultyId } from '../data/types';
import { useStore, type Mode } from '../state/store';
import { Globe } from '../ui/Globe';
import { missionOfDay } from '../ui/format';

const MODES: { id: Mode; name: string }[] = [
  { id: 'solo', name: 'Solo' },
  { id: 'coop', name: 'Co-op 2–4 người' },
];

const LEVELS: { id: DifficultyId; name: string; note: string }[] = [
  { id: 'hoc_vien', name: 'Học viên', note: 'Ngân sách 3.500k USD, khoảng trống ≤ 6 giờ, có gợi ý từng bước' },
  { id: 'ky_su', name: 'Kỹ sư', note: 'Ngân sách 3.000k USD, khoảng trống ≤ 3,5 giờ, có sự cố' },
  { id: 'giam_doc', name: 'Giám đốc', note: 'Ngân sách 2.800k USD, Mặt Trời cực đại, rủi ro phóng 3%' },
];

export function Home() {
  const { state, dispatch } = useStore();
  const level = LEVELS.find((l) => l.id === state.difficulty) ?? LEVELS[1];
  const inProgress = state.contract.accepted;

  return (
    <div className="screen home">
      <header className="home-top">
        <div className="row" style={{ gap: 12 }}>
          <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
            <circle cx="17" cy="17" r="9" fill="#F5A524" />
            <ellipse cx="17" cy="17" rx="16" ry="6" fill="none" stroke="#3DD6F5" strokeWidth="2" transform="rotate(-25 17 17)" />
          </svg>
          <span style={{ fontWeight: 800, letterSpacing: '0.08em' }}>ORBIT 72</span>
        </div>
        <nav className="row" style={{ gap: 12, fontSize: 14 }} aria-label="Liên kết">
          <button className="link-btn" onClick={() => dispatch({ type: 'openGuide' })}>
            Sổ tay
          </button>
          <button className="link-btn" onClick={() => dispatch({ type: 'openGuide' })}>
            Science
          </button>
          <span style={{ color: 'var(--muted)', fontWeight: 600 }}>VI · EN</span>
        </nav>
      </header>

      <main className="home-main">
        <div className="home-hero">
          <span className="lbl" style={{ color: 'var(--amber)' }}>
            NASA Space Apps Challenge 2026 · Space Mission Design Game
          </span>
          <div>
            <h1 className="home-title">
              ORBIT <span style={{ color: 'var(--amber)' }}>72</span>
            </h1>
            <div className="home-sub">Bắt Sóng Cứu Hộ</div>
          </div>
          <p className="home-lead">
            Siêu bão sắp đổ bộ. Bạn có 18 tháng để ráp CubeSat, chọn quỹ đạo, phóng chòm vệ tinh — và giữ cho các xã bị
            cô lập không “mất sóng” trong 72 giờ vàng.
          </p>
          <div className="col" style={{ gap: 10 }}>
            <div className="home-opt" role="group" aria-label="Chế độ">
              <span className="lbl">Chế độ</span>
              {MODES.map((m) => (
                <button
                  key={m.id}
                  className="seg"
                  aria-pressed={state.mode === m.id}
                  onClick={() => dispatch({ type: 'setMode', mode: m.id })}
                >
                  {m.name}
                </button>
              ))}
            </div>
            <div className="home-opt" role="group" aria-label="Độ khó">
              <span className="lbl">Độ khó</span>
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  className="seg"
                  aria-pressed={state.difficulty === l.id}
                  onClick={() => dispatch({ type: 'setDifficulty', difficulty: l.id })}
                >
                  {l.name}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'var(--muted)', paddingLeft: 80 }} aria-live="polite">
              {level.note}
            </span>
          </div>
          <div className="row" style={{ gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            <button className="btn-p big" onClick={() => dispatch({ type: 'startMission' })}>
              Bắt đầu sứ mệnh →
            </button>
            <button className="btn-s" style={{ minHeight: 52 }} onClick={() => dispatch({ type: 'startTutorial' })}>
              Hướng dẫn 3 phút
            </button>
          </div>
          <div className="row" style={{ gap: 18, fontSize: 14, color: 'var(--muted)', flexWrap: 'wrap' }}>
            <span>
              Nhiệm vụ hôm nay{' '}
              <strong className="mono" style={{ color: 'var(--text)' }}>
                #{missionOfDay()}
              </strong>
            </span>
            <button className="link-btn" onClick={() => dispatch({ type: 'startSandbox' })}>
              Sandbox
            </button>
            {inProgress && (
              <button className="link-btn" onClick={() => dispatch({ type: 'go', screen: 'brief' })}>
                Tiếp tục sứ mệnh
              </button>
            )}
          </div>
        </div>
        <div className="home-globe">
          <Globe />
        </div>
      </main>

      <footer className="home-foot">
        <span>Bản đồ: Natural Earth (public domain) · Dữ liệu: NASA GPM IMERG, NASA Small Spacecraft SOA</span>
        <span>Dự án học sinh · không liên kết và không được NASA bảo trợ</span>
      </footer>
    </div>
  );
}
