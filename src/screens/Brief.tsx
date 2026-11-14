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

const LEVEL_NAME: Record<DifficultyId, string> = { hoc_vien: 'CADET', ky_su: 'ENGINEER' };

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
    { id: 'R2', t: REQ_LABEL.R2, v: '0 waiting' },
    { id: 'R3', t: REQ_LABEL.R3, v: `≥ ${Math.round((req.powerMargin - 1) * 100)}%` },
    { id: 'R4', t: REQ_LABEL.R4, v: `${req.lifetimeMinY}–${req.lifetimeMaxY} years` },
    { id: 'R5', t: REQ_LABEL.R5, v: `≤ ${fmt(rules.budget, 0)}k` },
    { id: 'R6', t: REQ_LABEL.R6, v: `≤ ${req.devMonthsMax} months` },
    { id: 'R7', t: REQ_LABEL.R7, v: `≥ ${req.linkMarginDb} dB` },
    { id: 'R8', t: REQ_LABEL.R8, v: 'Complete' },
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
          <span className="lbl">Contract</span>
          <button className="card" aria-pressed={false} onClick={() => dispatch({ type: 'startTutorial' })}>
            <span className="lbl" style={{ color: 'var(--ok)' }}>
              Tutorial
            </span>
            <span style={{ fontSize: 'calc(19rem / 16)', fontWeight: 800 }}>Sea Eye</span>
            <span style={{ fontSize: 'calc(13rem / 16)', lineHeight: 1.45, color: 'var(--soft)' }}>
              Your first 3U CubeSat, one satellite — a tribute to NanoDragon (2021).
            </span>
          </button>
          <button className="card" aria-pressed={true}>
            <span className="lbl" style={{ color: 'var(--amber)' }}>
              Main scenario
            </span>
            <span style={{ fontSize: 'calc(19rem / 16)', fontWeight: 800 }}>72 Golden Hours</span>
            <span style={{ fontSize: 'calc(13rem / 16)', lineHeight: 1.45, color: 'var(--soft)' }}>
              A CubeSat constellation relays SOS messages when a super typhoon hits northern Vietnam.
            </span>
          </button>
          <div className="subtle" style={{ marginTop: 'auto', fontSize: 'calc(13rem / 16)', lineHeight: 1.5, color: 'var(--soft)' }}>
            <span className="lbl" style={{ color: 'var(--amber)' }}>
              Why it matters
            </span>
            <br />
            Typhoon Yagi (Sep 2024) cut off <strong style={{ color: 'var(--text)' }}>6,285 telecom stations</strong> after power cuts
            in 15 provinces and cities.
            <br />
            <span style={{ fontSize: 'calc(11rem / 16)', color: 'var(--dim)' }}>Source: Vietnam MIC via VnEconomy, 13 Sep 2024</span>
          </div>
        </div>

        <div className="panel map-panel">
          <MapVN
            label={
              total
                ? `Map of northern Vietnam: 72-hour total rain (${IMERG_LABEL}) and the typhoon track`
                : 'Map of northern Vietnam with the typhoon track'
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
              Landfall T0
            </text>
          </MapVN>
          {grid && (
            <div style={{ position: 'absolute', right: 16, top: 14 }}>
              <RainLegend bins={TOTAL_BINS} unit="mm" title="72 h total rain" />
            </div>
          )}
          <div style={{ position: 'absolute', left: 16, top: 14, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="lbl" style={{ color: 'var(--bad)' }}>
              Super typhoon · T0 = landfall
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
              Map: Natural Earth (public domain) ·{' '}
              {grid ? (
                <>
                  Rain: {IMERG_LABEL} ({fmt(grid.step, 1)}° grid) · Hà Nội {fmt(hanoiTotal, 0)} mm / 72 h
                </>
              ) : (
                'No IMERG rain layer yet (data_prep/prepare_imerg.py)'
              )}
            </span>
            <span>— — typhoon track</span>
          </div>
        </div>

        <div className="col">
          <span className="lbl">Goal</span>
          <p style={{ margin: 0, fontSize: 'calc(14rem / 16)', lineHeight: 1.55, color: 'var(--soft)' }}>
            Relay SOS messages from cut-off villages to the Hòa Lạc station for 72 hours after landfall.
          </p>
          <span className="lbl" style={{ marginTop: 4 }}>
            8 required requirements
          </span>
          <div className="panel req-list" style={{ padding: '6px 12px' }}>
            {reqs.map((r) => (
              <div key={r.id}>
                <span className="mono" style={{ fontSize: 'calc(12rem / 16)', fontWeight: 700, color: 'var(--amber)', width: 24 }}>
                  {r.id}
                </span>
                <span style={{ flex: 1, fontSize: 'calc(13rem / 16)', color: 'var(--soft)' }}>{r.t}</span>
                <span className="mono" style={{ fontSize: 'calc(12rem / 16)', color: 'var(--text)', fontWeight: 600, textAlign: 'right' }}>
                  {r.v}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
            <div className="panel" style={{ padding: '10px 12px' }}>
              <span className="lbl">Budget</span>
              <div className="mono" style={{ fontSize: 'calc(22rem / 16)', fontWeight: 600 }}>
                {fmt(rules.budget, 0)}k <span style={{ fontSize: 'calc(12rem / 16)', color: 'var(--muted)' }}>USD</span>
              </div>
            </div>
            <div className="panel" style={{ padding: '10px 12px' }}>
              <span className="lbl">Ready by</span>
              <div className="mono" style={{ fontSize: 'calc(22rem / 16)', fontWeight: 600 }}>
                {req.devMonthsMax} <span style={{ fontSize: 'calc(12rem / 16)', color: 'var(--muted)' }}>months</span>
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
