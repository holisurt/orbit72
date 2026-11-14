import { useRef, useState } from 'react';
import { useGameData } from '../data/context';
import { STATUS_LABEL, type Status } from '../sim/mission';
import { OUTCOME_LABEL, type Outcome } from '../sim/score';
import { cardHeader, phaseSquares, PHASES, runLine } from '../ui/share';
import { L_P1H, L_P1H_RAIN, SI_LABEL } from '../ui/labels';
import { useRun } from '../state/run';
import { useStore } from '../state/store';
import { downloadBlob, EXPORT_FONT, EXPORT_MONO, shareOrDownload, svgToPng } from '../ui/exportPng';
import { fmt } from '../ui/format';
import { Patch, PATCH_THEMES } from '../ui/Patch';
import { starGlyphs } from './Debrief';
import { HeaderTools } from '../ui/HeaderTools';
import { useT } from '../ui/i18n';

const C: Record<Status, string> = { DAT: '#4ADE80', SAT: '#FBBF24', VUOT: '#F87171' };
const EMOJI: Record<Status, string> = { DAT: '🟩', SAT: '🟨', VUOT: '🟥' };
const OUTCOME_COLOR: Record<Outcome, string> = { THANH_CONG: '#4ADE80', MOT_PHAN: '#FBBF24', THAT_BAI: '#F87171' };
const TEAM = 'TEAM BABY DRAGON';

export function Share() {
  const data = useGameData();
  const { state, dispatch } = useStore();
  const t = useT();
  const run = useRun();
  const [theme, setTheme] = useState(0);
  const [msg, setMsg] = useState('');
  const patchRef = useRef<SVGSVGElement>(null);
  const cardRef = useRef<SVGSVGElement>(null);

  const m = run.mission;
  const launch = state.ops.launch;
  // Six squares: Nhiệm vụ · Ráp · Quỹ đạo · Go/No-Go · Vận hành (Star 2) · Báo cáo (outcome)
  const squares = phaseSquares(m, launch, run.score.stars[1].stars, run.score.outcome);
  const no = `run${state.run}`; // file names: orbit72-run1-card.png
  const header = cardHeader(data.scenario.name, state.difficulty);
  const p1hRain = Math.round(run.ops.p1hRain);
  const p1hLabel = run.weightsSource === 'imerg' ? L_P1H_RAIN : `${L_P1H} (no rain data yet)`;
  // Tile label on two lines (SVG has no wrapping): "Tin SOS tới nơi trong 1 giờ" / "(tính theo mưa NASA IMERG)"
  const tileLines = run.weightsSource === 'imerg' ? [L_P1H, '(weighted by NASA IMERG rain)'] : [L_P1H, '(no rain data yet)'];
  const stars = starGlyphs(run.score.overall);
  const line = runLine(m);
  const url = typeof window !== 'undefined' ? `${window.location.origin}${import.meta.env.BASE_URL}` : '';
  const shareText = `ORBIT 72 · ${header}\n${squares.map((s) => EMOJI[s]).join('')} ${stars}\n${p1hLabel}: ${p1hRain}% · ${m.satCount} satellites · ${OUTCOME_LABEL[run.score.outcome]} · CML ${run.cml}\n${url} #Orbit72`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setMsg('Result copied.');
    } catch {
      setMsg('The browser blocked copying — select the text and copy it by hand.');
    }
  };

  const exportSvg = async (ref: SVGSVGElement | null, name: string, share: boolean) => {
    if (!ref) return;
    try {
      const blob = await svgToPng(ref, 3);
      if (!share) {
        downloadBlob(blob, name);
        setMsg(`Downloaded ${name}.`);
        return;
      }
      const how = await shareOrDownload(blob, name, shareText);
      setMsg(how === 'shared' ? 'Share sheet opened.' : `This device cannot share files — downloaded ${name}.`);
    } catch (e) {
      setMsg(`Could not export the image: ${(e as Error).message}`);
    }
  };

  return (
    <div className="screen">
      <header className="topbar">
        <span className="brand">
          ORBIT <span className="amber">72</span> <span className="sub">· Share your result</span>
        </span>
        <span style={{ fontSize: 'calc(12rem / 16)', color: 'var(--dim)' }}>No NASA logo · no photos or real names of players</span>
        <HeaderTools />
      </header>
      <main className="body share-body">
        <div className="col" style={{ alignItems: 'center', gap: 12 }}>
          <span className="lbl" style={{ alignSelf: 'flex-start' }}>
            Generated mission patch
          </span>
          <Patch ref={patchRef} theme={theme} team={TEAM} scenario={data.scenario.name} satCount={m.satCount} />
          <div className="row" style={{ gap: 6, flexWrap: 'wrap', justifyContent: 'center' }} role="group" aria-label="Patch colour">
            {PATCH_THEMES.map((t, q) => (
              <button key={t.name} className="seg" aria-pressed={theme === q} onClick={() => setTheme(q)}>
                {t.name}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 'calc(12rem / 16)', color: 'var(--muted)', textAlign: 'center' }}>
            14-point star of the Đông Sơn bronze drum · lotus petals · white dots = satellites in the constellation
          </span>
        </div>

        <div className="row" style={{ justifyContent: 'center' }}>
          <svg ref={cardRef} viewBox="0 0 300 533" style={{ width: '100%', maxWidth: 300, height: 'auto' }} role="img"
            aria-label={`Result card: ${header}, ${OUTCOME_LABEL[run.score.outcome]}, ${PHASES.map((p, q) => `${p} ${STATUS_LABEL[squares[q]]}`).join(', ')}, ${p1hLabel} ${p1hRain}%, ${m.satCount} satellites, CML ${run.cml}, ${line}`}>
            <defs>
              <linearGradient id="card-bg" x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0%" stopColor="#141B2A" />
                <stop offset="70%" stopColor="#07090F" />
              </linearGradient>
            </defs>
            <rect x="0.5" y="0.5" width="299" height="532" rx="22" fill="url(#card-bg)" stroke="#646971" />
            <text x="22" y="40" fontFamily={EXPORT_FONT} fontSize="11" fontWeight="700" letterSpacing="1.3" fill="#F5A524">
              {header}
            </text>
            <text x="22" y="76" fontFamily={EXPORT_FONT} fontSize="26" fontWeight="800" fill="#F3F5F8">
              {data.scenario.name}
            </text>
            <text x="22" y="100" fontFamily={EXPORT_FONT} fontSize="18" fontWeight="800" fill={OUTCOME_COLOR[run.score.outcome]}>
              {OUTCOME_LABEL[run.score.outcome]}
            </text>
            {squares.map((s, q) => (
              <rect key={q} x={22 + q * 43} y="116" width="38" height="30" rx="6" fill={C[s]}>
                <title>{`${PHASES[q]}: ${STATUS_LABEL[s]}`}</title>
              </rect>
            ))}
            <text x="22" y="162" fontFamily={EXPORT_FONT} fontSize="9" fill="#8E9BAE">
              {PHASES.join(' · ')}
            </text>
            <text x="22" y="196" fontFamily={EXPORT_FONT} fontSize="24" letterSpacing="3" fill="#F5A524">
              {stars}
            </text>
            <g transform="translate(22 208)">
              <rect width="256" height="66" rx="10" fill="#0E131D" stroke="#292E37" />
              {tileLines.map((ln, q) => (
                <text key={q} x="12" y={19 + q * 14} fontFamily={EXPORT_FONT} fontSize="11" fill="#8E9BAE">
                  {ln}
                </text>
              ))}
              <text x="12" y="57" fontFamily={EXPORT_MONO} fontSize="20" fill="#F3F5F8">
                {p1hRain}%
              </text>
              <text x="244" y="57" textAnchor="end" fontFamily={EXPORT_MONO} fontSize="13" fill="#F3F5F8">
                {m.satCount} satellites
              </text>
            </g>
            {/* CML badge + one line from the run (fills the band above the mascot) */}
            <g transform="translate(22 288)">
              <rect width="124" height="32" rx="16" fill="#3A2E0E" stroke="#F5A524" />
              <text x="62" y="21" textAnchor="middle" fontFamily={EXPORT_MONO} fontSize="14" fontWeight="600" fill="#F5A524">
                CML {run.cml} · JPL
              </text>
            </g>
            <text x="22" y="346" fontFamily={EXPORT_FONT} fontSize="13" fontWeight="700" fill="#F3F5F8">
              {line}
            </text>
            <g transform="translate(90 368)">
              <rect x="8" y="46" width="26" height="30" rx="3" fill="#1C2536" stroke="#8E9BAE" />
              <rect x="86" y="46" width="26" height="30" rx="3" fill="#1C2536" stroke="#8E9BAE" />
              <rect x="34" y="34" width="52" height="56" rx="10" fill="#F5A524" />
              <path d="M44 34 L49 22 L55 34Z M65 34 L71 22 L76 34Z" fill="#FFD27A" />
              <circle cx="50" cy="56" r="7" fill="#FFFFFF" />
              <circle cx="51" cy="57" r="3.5" fill="#0B1020" />
              <circle cx="70" cy="56" r="7" fill="#FFFFFF" />
              <circle cx="71" cy="57" r="3.5" fill="#0B1020" />
              <path d="M50 74 Q60 82 70 74" stroke="#0B1020" strokeWidth="3" fill="none" strokeLinecap="round" />
            </g>
            <text x="22" y="505" fontFamily={EXPORT_FONT} fontSize="11" fontWeight="700" fill="#F3F5F8">
              Play: {url.replace(/^https?:\/\//, '')} · #Orbit72
            </text>
            <text x="272" y="522" textAnchor="end" fontFamily={EXPORT_FONT} fontSize="8" fill="#8E9BAE">
              {SI_LABEL}
            </text>
          </svg>
        </div>

        <div className="col" style={{ gap: 10, justifyContent: 'center' }}>
          <span className="lbl">Share</span>
          <pre className="panel mono" style={{ padding: 12, fontSize: 'calc(13rem / 16)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
            {shareText}
          </pre>
          <button className="btn-p" onClick={copy}>
            {msg.startsWith('Result copied') ? 'Copied ✓' : t('copy')}
          </button>
          <button className="btn-s" onClick={() => exportSvg(cardRef.current, `orbit72-${no}-card.png`, false)}>
            {t('dlCard')}
          </button>
          <button className="btn-s" onClick={() => exportSvg(patchRef.current, `orbit72-${no}-patch.png`, false)}>
            {t('dlPatch')}
          </button>
          <button className="btn-s" onClick={() => exportSvg(cardRef.current, `orbit72-${no}-card.png`, true)}>
            {t('shareSocial')}
          </button>
          <span role="status" style={{ fontSize: 'calc(12rem / 16)', color: 'var(--muted)' }}>
            {msg}
          </span>
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button className="link-btn" onClick={() => dispatch({ type: 'go', screen: 'debrief' })}>
              ← {t('stepDebrief')}
            </button>
            <button className="link-btn" onClick={() => dispatch({ type: 'go', screen: 'home' })}>
              {t('playAnother')}
            </button>
          </div>
          <span style={{ fontSize: 'calc(11rem / 16)', color: 'var(--dim)' }}>{L_P1H} after events (not rain-weighted): {fmt(run.ops.p1h, 1)}%.</span>
        </div>
      </main>
    </div>
  );
}
