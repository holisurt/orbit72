import type { DifficultyId } from '../data/types';
import { useStore, type Mode } from '../state/store';
import { Globe } from '../ui/Globe';
import { missionOfDay } from '../ui/format';
import { HeaderTools } from '../ui/HeaderTools';
import { useT, type TKey } from '../ui/i18n';

const MODES: { id: Mode; name: TKey }[] = [
  { id: 'solo', name: 'solo' },
  { id: 'coop', name: 'coop' },
];

const LEVELS: { id: DifficultyId; note: string }[] = [
  { id: 'hoc_vien', note: 'Ngân sách 3.500k USD, khoảng trống ≤ 6 giờ, có gợi ý từng bước' },
  { id: 'ky_su', note: 'Ngân sách 3.000k USD, khoảng trống ≤ 3,5 giờ, có sự cố' },
  { id: 'giam_doc', note: 'Ngân sách 2.800k USD, Mặt Trời cực đại, rủi ro phóng 3%' },
];

export function Home() {
  const { state, dispatch } = useStore();
  const t = useT();
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
        <nav className="row" style={{ gap: 12, fontSize: 'calc(14rem / 16)' }} aria-label="Liên kết">
          <button className="link-btn" onClick={() => dispatch({ type: 'openGuide', tab: 2 })}>
            {t('science')}
          </button>
          <HeaderTools />
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
            <div className="home-opt" role="group" aria-label={t('mode')}>
              <span className="lbl">{t('mode')}</span>
              {MODES.map((m) => (
                <button
                  key={m.id}
                  className="seg"
                  aria-pressed={state.mode === m.id}
                  onClick={() => dispatch({ type: 'setMode', mode: m.id })}
                >
                  {t(m.name)}
                </button>
              ))}
            </div>
            <div className="home-opt" role="group" aria-label={t('difficulty')}>
              <span className="lbl">{t('difficulty')}</span>
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  className="seg"
                  aria-pressed={state.difficulty === l.id}
                  onClick={() => dispatch({ type: 'setDifficulty', difficulty: l.id })}
                >
                  {t(l.id)}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 'calc(13rem / 16)', color: 'var(--muted)', paddingLeft: 80 }} aria-live="polite">
              {level.note}
            </span>
          </div>
          <div className="row" style={{ gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
            <button className="btn-p big" onClick={() => dispatch({ type: 'startMission' })}>
              {t('start')} →
            </button>
            <button className="btn-s" style={{ minHeight: 52 }} onClick={() => dispatch({ type: 'startTutorial' })}>
              {t('tutorial')}
            </button>
          </div>
          <div className="row" style={{ gap: 18, fontSize: 'calc(14rem / 16)', color: 'var(--muted)', flexWrap: 'wrap' }}>
            <button className="link-btn" onClick={() => dispatch({ type: 'startMission', daily: true })}>
              {t('daily')}{' '}
              <span className="mono" style={{ color: 'var(--text)' }}>
                #{missionOfDay()}
              </span>
            </button>
            <button className="link-btn" onClick={() => dispatch({ type: 'startSandbox' })}>
              {t('sandbox')}
            </button>
            {inProgress && (
              <button className="link-btn" onClick={() => dispatch({ type: 'go', screen: 'brief' })}>
                {t('resume')}
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
