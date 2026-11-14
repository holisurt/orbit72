import { useRef, useState } from 'react';
import { useGameData } from '../data/context';
import type { Status } from '../sim/mission';
import { OUTCOME_LABEL, type Outcome } from '../sim/score';
import { useRun } from '../state/run';
import { useStore } from '../state/store';
import { downloadBlob, EXPORT_FONT, EXPORT_MONO, shareOrDownload, svgToPng } from '../ui/exportPng';
import { fmt, missionOfDay } from '../ui/format';
import { Patch, PATCH_THEMES } from '../ui/Patch';
import { starGlyphs } from './Debrief';

const C: Record<Status, string> = { DAT: '#4ADE80', SAT: '#FBBF24', VUOT: '#F87171' };
const EMOJI: Record<Status, string> = { DAT: '🟩', SAT: '🟨', VUOT: '🟥' };
const OUTCOME_COLOR: Record<Outcome, string> = { THANH_CONG: '#4ADE80', MOT_PHAN: '#FBBF24', THAT_BAI: '#F87171' };
const TEAM = 'ĐỘI RỒNG CON';

function worst(list: Status[]): Status {
  return list.includes('VUOT') ? 'VUOT' : list.includes('SAT') ? 'SAT' : 'DAT';
}

export function Share() {
  const data = useGameData();
  const { state, dispatch } = useStore();
  const run = useRun();
  const [theme, setTheme] = useState(0);
  const [msg, setMsg] = useState('');
  const patchRef = useRef<SVGSVGElement>(null);
  const cardRef = useRef<SVGSVGElement>(null);

  const m = run.mission;
  const st = (ids: string[]) => worst(m.reqs.filter((r) => ids.includes(r.id)).map((r) => r.status));
  const ranks = run.decisions.map((d) => d.outcomes.find((o) => o.key === d.chosen)?.rank ?? 'best');
  const launch = state.ops.launch;
  // Six squares: Nhiệm vụ · Ráp · Quỹ đạo · Go/No-Go · Vận hành · Báo cáo
  const squares: Status[] = [
    'DAT',
    st(['R2', 'R3', 'R6', 'R8']),
    st(['R1', 'R4', 'R5', 'R7']),
    launch?.unanimousGo ? 'DAT' : launch?.launchedWithNoGo ? 'VUOT' : 'SAT',
    ranks.includes('worst') || run.ops.decisionPenalty ? 'VUOT' : ranks.includes('middle') ? 'SAT' : 'DAT',
    run.score.outcome === 'THANH_CONG' ? 'DAT' : run.score.outcome === 'MOT_PHAN' ? 'SAT' : 'VUOT',
  ];
  const no = missionOfDay();
  const p1h = Math.round(run.ops.p1h);
  const stars = starGlyphs(run.score.overall);
  const url = typeof window !== 'undefined' ? `${window.location.origin}${import.meta.env.BASE_URL}` : '';
  const shareText = `ORBIT 72 #${no}\n${squares.map((s) => EMOJI[s]).join('')} ${stars}\nP1h ${p1h}% · ${m.satCount} vệ tinh · ${OUTCOME_LABEL[run.score.outcome]}\n${url} #Orbit72`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setMsg('Đã sao chép kết quả.');
    } catch {
      setMsg('Trình duyệt không cho sao chép — hãy chọn và sao chép thủ công.');
    }
  };

  const exportSvg = async (ref: SVGSVGElement | null, name: string, share: boolean) => {
    if (!ref) return;
    try {
      const blob = await svgToPng(ref, 3);
      if (!share) {
        downloadBlob(blob, name);
        setMsg(`Đã tải ${name}.`);
        return;
      }
      const how = await shareOrDownload(blob, name, shareText);
      setMsg(how === 'shared' ? 'Đã mở bảng chia sẻ.' : `Thiết bị không hỗ trợ chia sẻ tệp — đã tải ${name}.`);
    } catch (e) {
      setMsg(`Không xuất được ảnh: ${(e as Error).message}`);
    }
  };

  return (
    <div className="screen">
      <header className="topbar">
        <span className="brand">
          ORBIT <span className="amber">72</span> <span className="sub">· Chia sẻ thành tích</span>
        </span>
        <span style={{ fontSize: 12, color: '#7F90AE' }}>Không chứa logo NASA · không chứa ảnh hay tên thật của người chơi</span>
      </header>
      <main className="body share-body">
        <div className="col" style={{ alignItems: 'center', gap: 12 }}>
          <span className="lbl" style={{ alignSelf: 'flex-start' }}>
            Mission patch tự sinh
          </span>
          <Patch ref={patchRef} theme={theme} team={TEAM} scenario={data.scenario.name} satCount={m.satCount} />
          <div className="row" style={{ gap: 6, flexWrap: 'wrap', justifyContent: 'center' }} role="group" aria-label="Màu patch">
            {PATCH_THEMES.map((t, q) => (
              <button key={t.name} className="seg" aria-pressed={theme === q} onClick={() => setTheme(q)}>
                {t.name}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center' }}>
            Ngôi sao 14 cánh của mặt trống đồng Đông Sơn · cánh sen · chấm trắng = số vệ tinh trong chòm
          </span>
        </div>

        <div className="row" style={{ justifyContent: 'center' }}>
          <svg ref={cardRef} viewBox="0 0 300 533" style={{ width: '100%', maxWidth: 300, height: 'auto' }} role="img"
            aria-label={`Thẻ kết quả: ${data.scenario.name}, ${OUTCOME_LABEL[run.score.outcome]}, P1h ${p1h}%, ${m.satCount} vệ tinh`}>
            <defs>
              <linearGradient id="card-bg" x1="0" y1="0" x2="0.3" y2="1">
                <stop offset="0%" stopColor="#13224A" />
                <stop offset="70%" stopColor="#070D1A" />
              </linearGradient>
            </defs>
            <rect x="0.5" y="0.5" width="299" height="532" rx="22" fill="url(#card-bg)" stroke="#3A4C78" />
            <text x="22" y="40" fontFamily={EXPORT_FONT} fontSize="11" fontWeight="700" letterSpacing="1.3" fill="#F5A524">
              ORBIT 72 · NHIỆM VỤ #{no}
            </text>
            <text x="22" y="76" fontFamily={EXPORT_FONT} fontSize="26" fontWeight="800" fill="#E8EEF8">
              {data.scenario.name}
            </text>
            <text x="22" y="100" fontFamily={EXPORT_FONT} fontSize="18" fontWeight="800" fill={OUTCOME_COLOR[run.score.outcome]}>
              {OUTCOME_LABEL[run.score.outcome]}
            </text>
            {squares.map((s, q) => (
              <rect key={q} x={22 + q * 43} y="116" width="38" height="30" rx="6" fill={C[s]} />
            ))}
            <text x="22" y="162" fontFamily={EXPORT_FONT} fontSize="9" fill="#7F90AE">
              Nhiệm vụ · Ráp · Quỹ đạo · Go/No-Go · Vận hành · Báo cáo
            </text>
            <text x="22" y="196" fontFamily={EXPORT_FONT} fontSize="24" letterSpacing="3" fill="#F5A524">
              {stars}
            </text>
            {[
              { k: 'P1h', v: `${p1h}%`, x: 22 },
              { k: 'Vệ tinh', v: String(m.satCount), x: 154 },
            ].map((b) => (
              <g key={b.k} transform={`translate(${b.x} 212)`}>
                <rect width="124" height="58" rx="10" fill="#0F1830" stroke="#26355A" />
                <text x="10" y="20" fontFamily={EXPORT_MONO} fontSize="12" fill="#9AABC7">
                  {b.k}
                </text>
                <text x="10" y="46" fontFamily={EXPORT_MONO} fontSize="20" fill="#3DD6F5">
                  {b.v}
                </text>
              </g>
            ))}
            <g transform="translate(90 320)">
              <rect x="8" y="46" width="26" height="30" rx="3" fill="#1E3A8A" stroke="#3DD6F5" />
              <rect x="86" y="46" width="26" height="30" rx="3" fill="#1E3A8A" stroke="#3DD6F5" />
              <rect x="34" y="34" width="52" height="56" rx="10" fill="#F5A524" />
              <path d="M44 34 L49 22 L55 34Z M65 34 L71 22 L76 34Z" fill="#FFD27A" />
              <circle cx="50" cy="56" r="7" fill="#FFFFFF" />
              <circle cx="51" cy="57" r="3.5" fill="#0B1020" />
              <circle cx="70" cy="56" r="7" fill="#FFFFFF" />
              <circle cx="71" cy="57" r="3.5" fill="#0B1020" />
              <path d="M50 74 Q60 82 70 74" stroke="#0B1020" strokeWidth="3" fill="none" strokeLinecap="round" />
            </g>
            <text x="22" y="505" fontFamily={EXPORT_FONT} fontSize="11" fontWeight="700" fill="#E8EEF8">
              Chơi thử: {url.replace(/^https?:\/\//, '')} · #Orbit72
            </text>
          </svg>
        </div>

        <div className="col" style={{ gap: 10, justifyContent: 'center' }}>
          <span className="lbl">Chia sẻ</span>
          <pre className="panel mono" style={{ padding: 12, fontSize: 13, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
            {shareText}
          </pre>
          <button className="btn-p" onClick={copy}>
            Sao chép kết quả
          </button>
          <button className="btn-s" onClick={() => exportSvg(cardRef.current, `orbit72-${no}-the.png`, false)}>
            Tải thẻ PNG (9:16)
          </button>
          <button className="btn-s" onClick={() => exportSvg(patchRef.current, `orbit72-${no}-patch.png`, false)}>
            Tải mission patch PNG
          </button>
          <button className="btn-s" onClick={() => exportSvg(cardRef.current, `orbit72-${no}-the.png`, true)}>
            Chia sẻ TikTok · Facebook · Zalo
          </button>
          <span role="status" style={{ fontSize: 12, color: 'var(--muted)' }}>
            {msg}
          </span>
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <button className="link-btn" onClick={() => dispatch({ type: 'go', screen: 'debrief' })}>
              ← Báo cáo
            </button>
            <button className="link-btn" onClick={() => dispatch({ type: 'go', screen: 'home' })}>
              Chơi nhiệm vụ khác
            </button>
          </div>
          <span style={{ fontSize: 11, color: '#7F90AE' }}>P1h sau sự cố: {fmt(run.ops.p1h, 1)}%.</span>
        </div>
      </main>
    </div>
  );
}
