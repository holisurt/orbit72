import { useEffect, useMemo, useState } from 'react';
import { useGameData } from '../data/context';
import type { GameEvent } from '../data/types';
import { buildConstellation } from '../sim/coverage';
import { subSatellitePoint } from '../sim/orbit';
import { useRun } from '../state/run';
import { useStore } from '../state/store';
import { eventIntro, optionDetail } from '../ui/events';
import { fmt } from '../ui/format';
import { MapVN, projVN } from '../ui/MapVN';
import { ictLabel, IMERG_LABEL, RATE_BINS, rainCells } from '../ui/rain';
import { RainLegend } from '../ui/RainLegend';
import { HeaderTools } from '../ui/HeaderTools';
import { Modal } from '../ui/Modal';
import { L_P1H, L_P1H_RAIN } from '../ui/labels';
import { useT } from '../ui/i18n';

const SPEEDS = [60, 360, 1440];
const END = 72 * 60;
const TICK_MS = 200;
const RANK_LABEL = { best: 'BEST', middle: 'MEDIUM', worst: 'WORST' } as const;

function clockText(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return `T0 + ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const triggerMin = (ev: GameEvent) => Math.max(0, ev.atH * 60);

export function Ops() {
  const data = useGameData();
  const { state, dispatch } = useStore();
  const t = useT();
  const run = useRun();
  const { ops, nominal, events, options, mission } = run;
  const choices = state.ops.choices;

  const [clock, setClock] = useState(state.ops.clockMin);
  const [speed, setSpeed] = useState(2);
  const [playing, setPlaying] = useState(false);
  const [modal, setModal] = useState<string | null>(null);
  const [pick, setPick] = useState<string | null>(null);

  const ordered = useMemo(() => [...events].sort((a, b) => a.atH - b.atH), [events]);
  const pending = ordered.find((e) => !choices[e.id]);
  const limit = pending ? triggerMin(pending) : END;

  // Advance the clock; pause on the next undecided event (SPEC §6).
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setClock((c) => Math.min(limit, c + (SPEEDS[speed] / 60) * (TICK_MS / 1000)));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [playing, speed, limit]);

  useEffect(() => {
    if (pending && clock >= triggerMin(pending) && !modal) {
      setPlaying(false);
      setModal(pending.id);
      setPick(null);
      dispatch({ type: 'setClock', min: clock });
    } else if (!pending && clock >= END && playing) {
      setPlaying(false);
      dispatch({ type: 'setClock', min: END });
    }
  }, [clock, pending, modal, playing, dispatch]);

  const confirm = () => {
    if (!modal || !pick) return;
    dispatch({ type: 'chooseEvent', id: modal, key: pick });
    dispatch({ type: 'setClock', min: clock });
    setModal(null);
    setPlaying(true);
  };

  const seek = (min: number) => {
    const v = Math.min(min, limit);
    setClock(v);
    dispatch({ type: 'setClock', min: v });
  };

  // ---- strip: 288 bins of 15 min ----
  const strip = useMemo(() => {
    let bins = '';
    let lost = '';
    for (let b = 0; b < 288; b++) {
      let on = false;
      let gone = false;
      for (let m = b * 15; m < b * 15 + 15; m++) {
        if (ops.vis[m]) on = true;
        if (nominal.vis[m] && !ops.vis[m]) gone = true;
      }
      if (on) bins += `M${b} 0h1v26h-1z`;
      if (gone) lost += `M${b} 0h1v26h-1z`;
    }
    return { bins, lost };
  }, [ops, nominal]);

  // ---- satellites ----
  const sats = useMemo(() => buildConstellation(mission.orbit), [mission.orbit]);
  const minute = Math.min(END - 1, Math.floor(clock));
  const satRows = sats.map((_s, i) => {
    const plane = Math.floor(i / mission.orbit.perPlane) + 1;
    const name = `Rồng Con-${i + 1}`;
    if (ops.satLost[i]) return { name, plane, color: 'var(--bad)', text: 'lost' };
    if (ops.satEff[i][minute]) return { name, plane, color: 'var(--amber)', text: 'over Hà Nội' };
    if (run.ctx.perSat[i][minute]) return { name, plane, color: 'var(--warn)', text: 'off (safe mode)' };
    return { name, plane, color: 'var(--ok)', text: 'waiting' };
  });
  const satPts = sats.map((s, i) => ({ i, ...subSatellitePoint(s, minute * 60) }));

  // ---- IMERG frame ----
  const hour = Math.min(71, Math.floor(clock / 60));
  const grid = data.imerg?.grid;
  const rain = useMemo(() => (grid?.frames[hour] ? rainCells(grid, grid.frames[hour], RATE_BINS) : null), [grid, hour]);
  const hourLocal = ictLabel(data.imerg?.hours[hour]);
  const hanoiRate = data.imerg?.hanoi_mmh[hour];

  const hn = projVN(data.scenario.target.lat, data.scenario.target.lon);
  const ev = modal ? events.find((e) => e.id === modal)! : null;
  const allChosen = !pending;

  return (
    <div className="screen">
      <header className="topbar">
        <span className="brand">
          MISSION CONTROL <span className="amber">· {data.scenario.name.toUpperCase()}</span>
        </span>
        <span className="mono" style={{ fontSize: 'calc(22rem / 16)', fontWeight: 600 }} aria-live="off">
          {clockText(clock)}{' '}
          <span style={{ fontSize: 'calc(12rem / 16)', color: playing ? 'var(--ok)' : 'var(--bad)' }}>● {playing ? 'RUNNING' : 'PAUSED'}</span>
        </span>
        <div className="row" style={{ gap: 6 }} role="group" aria-label="Simulation speed">
          <button
            className="chip"
            aria-pressed={playing}
            disabled={(!pending && clock >= END) || !!modal}
            onClick={() => setPlaying((p) => !p)}
            style={{ minWidth: 64 }}
          >
            {playing ? `❚❚ ${t('pause')}` : `▶ ${t('run')}`}
          </button>
          {SPEEDS.map((s, q) => (
            <button key={s} className="chip" aria-pressed={speed === q} onClick={() => setSpeed(q)} style={{ minWidth: 52 }}>
              ×{s}
            </button>
          ))}
        </div>
        <HeaderTools />
      </header>

      <div className="row strip-row">
        <span className="lbl" style={{ flex: 'none' }}>
          Hà Nội contact
        </span>
        <svg width="100%" height="26" viewBox="0 0 288 26" preserveAspectRatio="none" role="img"
          aria-label={`72-hour timeline: SOS delivered within 1 h ${fmt(ops.p1h, 0)}%, longest coverage gap ${fmt(ops.longestGapH, 1)} h`}>
          <rect width="288" height="26" fill="#141B2A" />
          <path d={strip.bins} fill="#F3F5F8" fillOpacity="0.85" />
          <path d={strip.lost} fill="#F87171" fillOpacity="0.75" />
          <rect x="0" y="0" width={clock / 15} height="26" fill="#FFFFFF" fillOpacity="0.08" />
          <path d={ordered.map((e) => `M${triggerMin(e) / 15} 0 V26`).join(' ')} stroke="#F5A524" strokeWidth="1.2" />
          <path d={`M${clock / 15} 0 V26`} stroke="#FFFFFF" strokeWidth="1" />
        </svg>
        <span className="mono" style={{ fontSize: 'calc(11rem / 16)', color: 'var(--muted)', flex: 'none' }}>
          {ordered.map((e) => e.id).join(' · ')}
        </span>
      </div>

      <main className="body ops-body">
        <div className="col">
          <section className="panel" style={{ padding: '10px 12px' }} aria-label="Constellation">
            <span className="lbl">
              Rồng Con constellation · {mission.orbit.planes} planes
            </span>
            {satRows.map((s) => (
              <div key={s.name} className="placed-row" style={{ padding: '6px 0' }}>
                <span className="dot" style={{ background: s.color }} aria-hidden="true" />
                <span style={{ flex: 1 }}>{s.name}</span>
                <span className="mono" style={{ fontSize: 'calc(11rem / 16)', color: 'var(--muted)' }}>
                  Plane {s.plane} · {s.text}
                </span>
              </div>
            ))}
          </section>
          <section className="panel col" style={{ padding: '10px 12px', gap: 8 }} aria-label="Numbers after events">
            <span className="lbl">Numbers after events</span>
            <div>
              <div style={{ fontSize: 'calc(12rem / 16)', color: 'var(--muted)' }}>{L_P1H}</div>
              <div className="mono" style={{ fontSize: 'calc(26rem / 16)', fontWeight: 700, color: 'var(--text)' }}>
                {fmt(ops.p1h, 0)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'calc(12rem / 16)', color: 'var(--muted)' }}>{L_P1H_RAIN}</div>
              <div className="mono" style={{ fontSize: 'calc(20rem / 16)', fontWeight: 700, color: 'var(--text)' }}>
                {fmt(ops.p1hRain, 1)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 'calc(12rem / 16)', color: 'var(--muted)' }}>Longest coverage gap</div>
              <div className="mono" style={{ fontSize: 'calc(26rem / 16)', fontWeight: 600, color: ops.longestGapH <= data.scenario.difficulty[state.difficulty].gapMaxH ? 'var(--ok)' : 'var(--bad)' }}>
                {fmt(ops.longestGapH, 1)} h
              </div>
            </div>
            <span style={{ fontSize: 'calc(11rem / 16)', color: 'var(--dim)' }}>
              Recomputed from the 72 h simulation ({mission.orbit.planes} planes × {mission.orbit.perPlane}, {mission.orbit.hKm} km) with the event masks. Events only affect stars 2 and 4;
              R1 is scored on the nominal design ({mission.coverage ? fmt(mission.coverage.longestGapH, 1) : '—'} h).
              {run.weightsSource === 'none'
                ? ' No IMERG file, so the rain weight is w = 1.'
                : ' Rain weight w(h) = 1 + R(h)/R̄ from mean IMERG rain over 103–108°E, 20–23°N.'}
            </span>
          </section>
        </div>

        <section className="panel map-panel" aria-label="Operations map">
          <MapVN label="Map of northern Vietnam with the IMERG rain layer, SOS points, satellites and the Hòa Lạc station">
            {rain?.map((c, k) => <rect key={k} x={c.x} y={c.y} width={c.s} height={c.s} fill="#3DD6F5" fillOpacity={c.o} />)}
            <g fill="#F87171">
              <circle cx="196" cy="104" r="4" />
              <circle cx="214" cy="122" r="4" />
              <circle cx="262" cy="118" r="4" />
              <circle cx="250" cy="162" r="4" />
              <circle cx="226" cy="168" r="4" />
            </g>
            <text x="266" y="114" fontSize="10" fill="#FCA5A5">
              SOS
            </text>
            <circle cx={hn.x} cy={hn.y} r="5" fill="none" stroke="#FFFFFF" strokeWidth="2" />
            <text x={hn.x - 53} y={hn.y - 4} fontSize="10" fontWeight="700" fill="#FFFFFF">
              Hòa Lạc
            </text>
            {satPts.map((p) => {
              const q = projVN(p.lat, p.lon);
              if (q.x < 40 || q.x > 500 || q.y < 0 || q.y > 340 || ops.satLost[p.i]) return null;
              const on = ops.satEff[p.i][minute];
              return (
                <g key={p.i} transform={`translate(${q.x} ${q.y})`} opacity={on ? 1 : 0.6}>
                  <rect x="-7" y="-7" width="14" height="14" rx="3" fill="#F5A524" />
                  <rect x="-19" y="-4" width="10" height="8" fill="#8E9BAE" />
                  <rect x="9" y="-4" width="10" height="8" fill="#8E9BAE" />
                  <text x="16" y="15" fontSize="10" fontWeight="700" fill="#F5A524">
                    Rồng Con-{p.i + 1}
                  </text>
                </g>
              );
            })}
          </MapVN>
          {grid && (
            <div style={{ position: 'absolute', right: 12, top: 10 }}>
              <RainLegend bins={RATE_BINS} unit="mm/h" title={`IMERG rain · ${hourLocal}`} />
            </div>
          )}
          <div className="map-slider">
            <label htmlFor="ops-time" className="lbl">
              Time · hour {hour}
              {hourLocal && ` · ${hourLocal} Vietnam time`}
              {hanoiRate !== undefined && ` · Hà Nội rain ${fmt(hanoiRate, 1)} mm/h`}
            </label>
            <input
              id="ops-time"
              type="range"
              min={0}
              max={END}
              step={15}
              value={Math.floor(clock)}
              aria-valuetext={clockText(clock)}
              onChange={(e) => seek(Number(e.target.value))}
            />
          </div>
          <span style={{ position: 'absolute', left: 12, bottom: 8, right: 12, fontSize: 'calc(10rem / 16)', color: 'var(--dim)' }}>
            Map: Natural Earth ·{' '}
            {grid
              ? `Rain layer: ${IMERG_LABEL} (DOI ${data.imerg?.source?.doi ?? '10.5067/GPM/IMERG/3B-HH/07'}, ${fmt(grid.step, 1)}° grid)`
              : 'No IMERG rain layer yet (data_prep/prepare_imerg.py)'}{' '}
            · SOS points are illustrative
          </span>
        </section>

        <div className="col">
          <span className="lbl">Dispatch queue</span>
          {ordered.map((e) => {
            const chosen = choices[e.id];
            const isNext = pending?.id === e.id;
            const out = options[e.id]?.find((o) => o.key === chosen);
            return (
              <div
                key={e.id}
                className="panel col"
                style={{ padding: 12, gap: 4, borderColor: isNext ? 'var(--bad)' : undefined, opacity: chosen || isNext ? 1 : 0.7 }}
              >
                <span className="lbl" style={{ color: isNext ? 'var(--bad)' : undefined }}>
                  {e.id} · {e.atH < 0 ? 'on reaching orbit' : `T0+${e.atH} h`}
                  {isNext ? ' · decision needed' : chosen ? ' · chosen' : ''}
                </span>
                <span style={{ fontSize: 'calc(14rem / 16)', fontWeight: 700 }}>{e.title}</span>
                {chosen && out && (
                  <span style={{ fontSize: 'calc(12rem / 16)', color: 'var(--soft)' }}>
                    {chosen} — {e.options.find((o) => o.k === chosen)?.text} · SOS ≤ 1 h {out.p1hDisplay}%
                  </span>
                )}
                {isNext && clock >= triggerMin(e) && (
                  <button className="btn-p" style={{ minHeight: 44 }} onClick={() => setModal(e.id)}>
                    {t('openEvent')}
                  </button>
                )}
              </div>
            );
          })}
          <div className="col" style={{ marginTop: 'auto', gap: 8 }}>
            {!allChosen && (
              <button className="btn-s" onClick={() => seek(limit)}>
                {t('nextEvent')}
              </button>
            )}
            <button
              className="btn-p"
              aria-disabled={!allChosen}
              onClick={() => allChosen && dispatch({ type: 'finishOps' })}
            >
              {t('endOps')} →
            </button>
          </div>
        </div>
      </main>

      {ev && (
        <Modal labelledBy="ev-title" onClose={() => setModal(null)} className="event-card">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="lbl" style={{ color: 'var(--bad)' }}>
                Event {ev.id} · {ev.atH < 0 ? 'on reaching orbit' : `T0+${ev.atH} h`}
              </span>
              <button className="chip" onClick={() => setModal(null)}>
                {t('close')}
              </button>
            </div>
            <div className="row" style={{ gap: 18, alignItems: 'center' }}>
              <svg width="72" height="72" viewBox="0 0 96 96" aria-hidden="true" style={{ flex: 'none' }}>
                <circle cx="48" cy="48" r="22" fill="#F5A524" />
                <g stroke="#F5A524" strokeWidth="4" strokeLinecap="round">
                  <path d="M48 8 V18 M48 78 V88 M8 48 H18 M78 48 H88 M20 20 L27 27 M69 69 L76 76 M20 76 L27 69 M69 27 L76 20" />
                </g>
              </svg>
              <div style={{ flex: 1 }}>
                <div id="ev-title" style={{ fontSize: 'calc(24rem / 16)', fontWeight: 800 }}>
                  {ev.title}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 'calc(14rem / 16)', lineHeight: 1.55, color: 'var(--soft)' }}>
                  {eventIntro(ev, { hasShield: run.hasShield, donki: data.donki })}
                </p>
                {ev.id === 'E1' && data.donki?.link && (
                  <a href={data.donki.link} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 'calc(12rem / 16)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>
                    {data.donki.source ?? 'NASA DONKI'} · {data.donki.gstID ?? 'see the record'} ↗
                  </a>
                )}
              </div>
            </div>
            <div className="opt-grid" role="group" aria-label="Options">
              {options[ev.id].map((o) => {
                const opt = ev.options.find((x) => x.k === o.key)!;
                return (
                  <button
                    key={o.key}
                    className="opt"
                    aria-pressed={pick === o.key}
                    disabled={!o.available}
                    onClick={() => setPick(o.key)}
                  >
                    <span className="lbl" style={{ color: 'var(--amber)' }}>
                      {o.key}
                      {o.available ? ` · ${RANK_LABEL[o.rank]}` : ` · ${run.blocked[ev.id]?.[o.key] ?? 'not available'}`}
                    </span>
                    <span style={{ fontSize: 'calc(15rem / 16)', fontWeight: 800 }}>{opt.text}</span>
                    <span style={{ fontSize: 'calc(12rem / 16)', color: 'var(--soft)', lineHeight: 1.45 }}>{optionDetail(ev, o.key, run.hasShield)}</span>
                    <span className="mono" style={{ fontSize: 'calc(12rem / 16)', color: 'var(--text)', fontWeight: 600 }}>
                      SOS delivered within 1 h: {o.p1hDisplay}% · longest gap {fmt(o.longestGapH, 1)} h
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 'calc(12rem / 16)', color: 'var(--muted)', flex: 1, minWidth: 200 }}>
                SOS delivered within 1 h and the longest coverage gap are computed on the constellation’s 72-hour timeline, separately for each option. The option that keeps the most SOS messages is ranked “best”.
              </span>
              <button className="btn-p" aria-disabled={!pick} onClick={confirm}>
                {t('confirm')}
              </button>
            </div>
        </Modal>
      )}
    </div>
  );
}
