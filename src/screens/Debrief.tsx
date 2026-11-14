import { useEffect, useRef, useState } from 'react';
import { useGameData } from '../data/context';
import type { GameData } from '../data/types';
import { CML_TEXT, OUTCOME_LABEL, type Outcome } from '../sim/score';
import { useRun, type RunView } from '../state/run';
import { useStore } from '../state/store';
import { quizSummary } from '../state/quiz';
import { downloadBlob, EXPORT_FONT, EXPORT_MONO, svgToPng } from '../ui/exportPng';
import { fmt } from '../ui/format';
import { TopBar } from '../ui/TopBar';
import { useT } from '../ui/i18n';

const LEVEL_NAME = { hoc_vien: 'HỌC VIÊN', ky_su: 'KỸ SƯ', giam_doc: 'GIÁM ĐỐC' } as const;

export const OUTCOME_STYLE: Record<Outcome, { color: string; bg: string; border: string }> = {
  THANH_CONG: { color: '#4ADE80', bg: 'linear-gradient(90deg, #11361F, #0F1830 70%)', border: '#2E6B45' },
  MOT_PHAN: { color: '#FBBF24', bg: 'linear-gradient(90deg, #3A2E0E, #0F1830 70%)', border: '#6B5320' },
  THAT_BAI: { color: '#F87171', bg: 'linear-gradient(90deg, #3A1518, #0F1830 70%)', border: '#7F2A30' },
};

export function starGlyphs(n: number): string {
  const k = Math.max(0, Math.min(5, Math.round(n)));
  return '★'.repeat(k) + '☆'.repeat(5 - k);
}

export function specRows(run: RunView, data: GameData, extraMonths: number, quizText = '—'): { k: string; v: string }[] {
  const m = run.mission;
  const b = m.build;
  const preset = data.launchers.presets.find((p) => p.id === m.orbit.preset)?.name ?? m.orbit.preset;
  const tx = b.parts.filter((p) => p.rbps).sort((a, c) => (c.rbps ?? 0) - (a.rbps ?? 0))[0];
  const minMargin = m.links.length ? Math.min(...m.links.map((l) => l.margin10)) : NaN;
  const residual = m.residualY ?? Math.max(0, m.lifetimeY - data.scenario.opsYears);
  // Design cost is the nominal cost Star 3 uses; extra parts appear only when > 0.
  const replace = run.launchExtraKusd;
  const events = run.ops.eventCostKusd;
  const cost = [
    `${fmt(m.totalCostKusd, 0)}k thiết kế`,
    replace > 0 ? `${fmt(replace, 0)}k phóng bù` : '',
    events > 0 ? `${fmt(events, 0)}k sự cố` : '',
  ].filter(Boolean);
  return [
    { k: 'Quỹ đạo', v: `${preset} ${m.orbit.hKm} km · i ${fmt(m.inclDeg, 1)}°` },
    { k: 'Chòm', v: `${m.orbit.planes} mặt phẳng × ${m.orbit.perPlane}` },
    { k: 'Khung · khối lượng', v: `${b.chassis.id} · ${fmt(b.massKg, 2)} kg` },
    { k: 'Công suất sinh · dùng', v: `${fmt(b.pGenW, 1)} · ${fmt(b.pUseW, 1)} W` },
    { k: 'Pin', v: `${fmt(b.batteryHaveWh, 0)} Wh (cần ${fmt(b.batteryNeedWh, 1)})` },
    { k: 'Tải xuống', v: tx ? tx.name : '—' },
    { k: 'Biên tới Hòa Lạc', v: Number.isFinite(minMargin) ? `${fmt(minMargin, 1)} dB (10°)` : '—' },
    { k: 'Tuổi thọ · tồn lưu', v: `${fmt(m.lifetimeY, 1)} · ${fmt(residual, 1)} năm` },
    { k: 'Chi phí', v: cost.length > 1 ? `${cost.join(' + ')} = ${fmt(run.totalCostKusd, 0)}k` : cost[0] },
    { k: 'Phát triển', v: `${b.devMonths + extraMonths} tháng` },
    { k: 'Quiz trước → sau', v: quizText },
  ];
}

export function Debrief() {
  const data = useGameData();
  const { state, dispatch } = useStore();
  const t = useT();
  const run = useRun();
  const { score, why, cml, cmlOnExport } = run;
  const style = OUTCOME_STYLE[score.outcome];
  const quizText = quizSummary(state.quiz, data.quiz);
  const rows = specRows(run, data, state.ops.launch?.extraMonths ?? 0, quizText);
  const postPending = state.quiz.post === null;
  const specRef = useRef<SVGSVGElement>(null);
  const [exportMsg, setExportMsg] = useState('');

  useEffect(() => {
    if (state.ops.done) dispatch({ type: 'recordRun', overall: score.overall });
  }, [state.ops.done, score.overall, dispatch]);

  const exportSpec = async () => {
    if (!specRef.current) return;
    try {
      const blob = await svgToPng(specRef.current, 2);
      downloadBlob(blob, `orbit72-spec-sheet-run${state.run}.png`);
      dispatch({ type: 'exportSpec' });
      setExportMsg('Đã xuất spec sheet.');
    } catch (e) {
      setExportMsg(`Không xuất được: ${(e as Error).message}`);
    }
  };

  return (
    <div className="screen">
      <TopBar
        subtitle={`Báo cáo sứ mệnh · lần chạy ${state.run}`}
        step="debrief"
        right={
          <span className="mono" style={{ fontSize: 'calc(13rem / 16)', color: 'var(--muted)' }}>
            {LEVEL_NAME[state.difficulty]} · {state.mode === 'coop' ? `CO-OP ${state.players.count}` : 'SOLO'}
          </span>
        }
      />
      <div className="outcome-banner" style={{ background: style.bg, borderColor: style.border }} role="status">
        <svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true" style={{ flex: 'none' }}>
          <circle cx="29" cy="29" r="27" fill={style.color} />
          {score.outcome === 'THAT_BAI' ? (
            <path d="M19 19 L39 39 M39 19 L19 39" stroke="#0B1020" strokeWidth="6" strokeLinecap="round" />
          ) : (
            <path d="M16 30 L25 39 L43 20" stroke="#0B1020" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="lbl" style={{ color: style.color }}>
            Kết cục
          </div>
          <div style={{ fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 800 }}>
            {OUTCOME_LABEL[score.outcome]} — {score.passed}/8 yêu cầu đạt
            {state.ops.launch && !state.ops.launch.inOrbit && ' · mất vệ tinh khi phóng'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="lbl">Điểm tổng (trung bình 5 sao)</div>
          <div className="mono" style={{ fontSize: 'calc(34rem / 16)', fontWeight: 600, color: 'var(--amber)' }}>
            {fmt(score.overall, 1)} <span style={{ fontSize: 'calc(16rem / 16)', color: 'var(--muted)' }}>/ 5</span>
          </div>
        </div>
      </div>

      <main className="body debrief-body">
        <section className="panel col" style={{ padding: '12px 16px', gap: 0 }} aria-label="5 sao">
          <span className="lbl" style={{ marginBottom: 4 }}>
            5 sao · GDD mục 10
          </span>
          {score.stars.map((s) => (
            <div key={s.n} style={{ padding: '8px 0', borderBottom: '1px solid #1A2647' }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <span style={{ fontSize: 'calc(14rem / 16)', fontWeight: 800 }}>
                  {s.n} · {s.name}
                </span>
                <span style={{ fontSize: 'calc(18rem / 16)', letterSpacing: 2, color: 'var(--amber)' }} aria-label={`${s.stars} trên 5 sao`}>
                  {starGlyphs(s.stars)}
                </span>
              </div>
              <div className="mono" style={{ fontSize: 'calc(11rem / 16)', color: 'var(--muted)', marginTop: 2 }}>
                {s.formula}
              </div>
            </div>
          ))}
        </section>

        <div className="col">
          <span className="lbl">Vì sao? · Nguyên nhân → Hệ quả → Thử lần sau</span>
          {why.length === 0 && (
            <div className="panel" style={{ padding: '10px 12px', fontSize: 'calc(13rem / 16)', color: 'var(--soft)' }}>
              Không có yêu cầu nào SÁT hay VƯỢT, và mọi quyết định sự cố đều là phương án tốt nhất.
            </div>
          )}
          {why.map((w, i) => (
            <div key={i} className="panel why-row" title={w.sentence}>
              <div style={{ fontSize: 'calc(13rem / 16)', lineHeight: 1.45 }}>
                <span className="lbl">Nguyên nhân</span>
                <br />
                {w.cause}
              </div>
              <div style={{ fontSize: 'calc(13rem / 16)', lineHeight: 1.45 }}>
                <span className="lbl">Hệ quả</span>
                <br />
                {w.effect}
              </div>
              <div style={{ fontSize: 'calc(13rem / 16)', lineHeight: 1.45, borderLeft: '2px solid var(--amber)', paddingLeft: 10 }}>
                <span className="lbl" style={{ color: 'var(--amber)' }}>
                  Thử lần sau
                </span>
                <br />
                {w.lever[0].toUpperCase() + w.lever.slice(1)}
              </div>
            </div>
          ))}
          <div className="panel" style={{ padding: '10px 12px', fontSize: 'calc(13rem / 16)', lineHeight: 1.5, color: 'var(--soft)' }}>
            <span className="lbl">So với nhiệm vụ thật</span>
            <br />
            NanoDragon (3U, 3,8 kg, SSO ~560 km, 2021) là một vệ tinh đơn lẻ; với mô hình này, một vệ tinh SSO chỉ cho Hà Nội 3 lượt/ngày
            và khoảng trống ~12 giờ — lý do sứ mệnh cứu hộ cần một chòm.
          </div>
        </div>

        <div className="col">
          <section className="panel col" style={{ padding: '12px 14px', gap: 4, fontSize: 'calc(12rem / 16)' }} aria-label="Huy hiệu CML">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="lbl" style={{ color: 'var(--amber)' }}>
                Huy hiệu CML · JPL
              </span>
              <span className="mono" style={{ fontSize: 'calc(18rem / 16)', fontWeight: 600, color: cml ? 'var(--amber)' : 'var(--muted)' }}>
                CML {cml}
              </span>
            </div>
            <div className="row" style={{ gap: 4 }} aria-hidden="true">
              {[1, 2, 3, 4].map((l) => (
                <div key={l} style={{ flex: 1, height: 8, borderRadius: 4, background: l <= cml ? 'var(--amber)' : '#1A2647' }} />
              ))}
            </div>
            {([1, 2, 3, 4] as const).map((l) => (
              <div key={l} style={{ color: l <= cml ? 'var(--text)' : 'var(--muted)' }}>
                {l <= cml ? '✓' : '○'} CML{l} · {CML_TEXT[l]}
              </div>
            ))}
          </section>

          <section className="panel col" style={{ padding: '12px 14px', gap: 4, fontSize: 'calc(12rem / 16)' }} aria-label="Spec sheet">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="lbl" style={{ color: 'var(--amber)' }}>
                Spec sheet · Rồng Con
              </span>
              <svg width="34" height="34" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="46" fill="#0B1F45" stroke="#F5A524" strokeWidth="5" />
                <path d="M50 18 L56 44 L82 50 L56 56 L50 82 L44 56 L18 50 L44 44Z" fill="#F5A524" />
              </svg>
            </div>
            {rows.map((r) => (
              <div key={r.k} className="row" style={{ justifyContent: 'space-between', gap: 8, padding: '3px 0', borderBottom: '1px solid #1A2647' }}>
                <span style={{ color: 'var(--muted)' }}>{r.k}</span>
                <span className="mono" style={{ textAlign: 'right' }}>
                  {r.v}
                </span>
              </div>
            ))}
            <button className="btn-s" style={{ marginTop: 6 }} onClick={exportSpec}>
              {t('exportSpec')}
            </button>
            <span role="status" style={{ fontSize: 'calc(11rem / 16)', color: 'var(--muted)' }}>
              {exportMsg}
            </span>
          </section>

          <section className="panel row" style={{ padding: '10px 14px', justifyContent: 'space-between', flexWrap: 'wrap', fontSize: 'calc(13rem / 16)' }} aria-label="Quiz">
            <span>
              Quiz trước → sau: <strong className="mono">{quizText}</strong>
            </span>
            {postPending && (
              <button className="link-btn" onClick={() => dispatch({ type: 'openPostQuiz', next: 'debrief' })}>
                {t('postQuiz')}
              </button>
            )}
          </section>

          <div className="col" style={{ gap: 8, marginTop: 'auto' }}>
            <button className="btn-s" onClick={() => dispatch({ type: 'rerun' })}>
              {t('rerun')}
            </button>
            <button
              className="btn-p"
              onClick={() => dispatch(postPending ? { type: 'openPostQuiz', next: 'share' } : { type: 'go', screen: 'share' })}
            >
              {postPending ? t('toShareQuiz') : t('toShare')} →
            </button>
          </div>
        </div>
      </main>

      {/* Off-screen, exportable spec sheet (literal colours). */}
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        {/* The PNG is rendered before the exportSpec action, so it prints the level reached by exporting. */}
        <svg ref={specRef} data-testid="spec-sheet" viewBox={`0 0 600 ${120 + rows.length * 36}`}>
          <rect width="600" height={120 + rows.length * 36} fill="#0F1830" />
          <text x="30" y="46" fontFamily={EXPORT_FONT} fontSize="26" fontWeight="800" fill="#E8EEF8">
            ORBIT 72 · Spec sheet · Rồng Con
          </text>
          <text x="30" y="78" fontFamily={EXPORT_FONT} fontSize="15" fill="#9AABC7">
            {data.scenario.name} · lần chạy {state.run} · {OUTCOME_LABEL[score.outcome]} {score.passed}/8 · CML {cmlOnExport}
          </text>
          {rows.map((r, i) => (
            <g key={r.k} transform={`translate(30 ${118 + i * 36})`}>
              <text fontFamily={EXPORT_FONT} fontSize="16" fill="#9AABC7">
                {r.k}
              </text>
              <text x="540" textAnchor="end" fontFamily={EXPORT_MONO} fontSize="16" fill="#E8EEF8">
                {r.v}
              </text>
              <path d="M0 12 H540" stroke="#26355A" />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
