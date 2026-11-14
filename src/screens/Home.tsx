import type { DifficultyId } from '../data/types';
import { useStore, type Mode } from '../state/store';
import { Globe } from '../ui/Globe';
import { useGameData } from '../data/context';
import { fmt } from '../ui/format';
import { HeaderTools } from '../ui/HeaderTools';
import { useT, type TKey } from '../ui/i18n';

const MODES: { id: Mode; name: TKey }[] = [
  { id: 'solo', name: 'solo' },
  { id: 'coop', name: 'coop' },
];

const LEVELS: DifficultyId[] = ['hoc_vien', 'ky_su'];

export function Home() {
  const { state, dispatch } = useStore();
  const t = useT();
  const data = useGameData();
  // Level note read from scenario_72h.json (budget, R1 gap limit, events).
  const rules = data.scenario.difficulty[state.difficulty] ?? data.scenario.difficulty.ky_su;
  const levelNote = `Ngân sách ${fmt(rules.budget, 0)}k USD, khoảng trống liên lạc ≤ ${fmt(rules.gapMaxH, 1)} giờ, sự cố ${rules.events.join(', ')}${state.difficulty === 'hoc_vien' ? ', có gợi ý từng bước' : ''}`;
  const inProgress = state.contract.accepted;

  return (
    <div className="screen home">
      <header className="home-top">
        <div className="row" style={{ gap: 12 }}>
          <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
            <circle cx="17" cy="17" r="8" fill="#F5A524" />
            <ellipse cx="17" cy="17" rx="15.5" ry="6" fill="none" stroke="#F3F5F8" strokeWidth="1.75" transform="rotate(-25 17 17)" strokeDasharray="30 5" />
            <circle cx="28.5" cy="11.5" r="2" fill="#F5A524" />
          </svg>
          <span style={{ fontWeight: 800, letterSpacing: '0.08em' }}>ORBIT 72</span>
        </div>
        <nav className="row" style={{ gap: 12, fontSize: 'calc(14rem / 16)' }} aria-label="Liên kết">
          <a className="link-btn" href={`${import.meta.env.BASE_URL}about.html`} style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
            Giới thiệu / About
          </a>
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
            Siêu bão sắp đổ bộ. Bạn có {data.scenario.requirements.devMonthsMax} tháng để ráp CubeSat, chọn quỹ đạo, phóng chòm vệ tinh — và giữ cho các xã bị
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
              {LEVELS.map((id) => (
                <button
                  key={id}
                  className="seg"
                  aria-pressed={state.difficulty === id}
                  onClick={() => dispatch({ type: 'setDifficulty', difficulty: id })}
                >
                  {t(id)}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 'calc(13rem / 16)', color: 'var(--muted)', paddingLeft: 80 }} aria-live="polite">
              {levelNote}
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
