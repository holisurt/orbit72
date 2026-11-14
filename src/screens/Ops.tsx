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

const SPEEDS = [60, 360, 1440];
const END = 72 * 60;
const TICK_MS = 200;
const RANK_LABEL = { best: 'TỐT NHẤT', middle: 'TRUNG BÌNH', worst: 'KÉM NHẤT' } as const;

function clockText(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return `T0 + ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const triggerMin = (ev: GameEvent) => Math.max(0, ev.atH * 60);

export function Ops() {
  const data = useGameData();
  const { state, dispatch } = useStore();
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
    if (ops.satLost[i]) return { name, plane, color: 'var(--bad)', text: 'mất' };
    if (ops.satEff[i][minute]) return { name, plane, color: 'var(--amber)', text: 'đang qua HN' };
    if (run.ctx.perSat[i][minute]) return { name, plane, color: 'var(--warn)', text: 'tắt (an toàn)' };
    return { name, plane, color: 'var(--ok)', text: 'chờ lượt' };
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
        <span className="mono" style={{ fontSize: 22, fontWeight: 600 }} aria-live="off">
          {clockText(clock)}{' '}
          <span style={{ fontSize: 12, color: playing ? 'var(--ok)' : 'var(--bad)' }}>● {playing ? 'ĐANG CHẠY' : 'TẠM DỪNG'}</span>
        </span>
        <div className="row" style={{ gap: 6 }} role="group" aria-label="Tốc độ mô phỏng">
          <button
            className="chip"
            aria-pressed={playing}
            disabled={(!pending && clock >= END) || !!modal}
            onClick={() => setPlaying((p) => !p)}
            style={{ minWidth: 64 }}
          >
            {playing ? '❚❚ Dừng' : '▶ Chạy'}
          </button>
          {SPEEDS.map((s, q) => (
            <button key={s} className="chip" aria-pressed={speed === q} onClick={() => setSpeed(q)} style={{ minWidth: 52 }}>
              ×{s}
            </button>
          ))}
        </div>
      </header>

      <div className="row strip-row">
        <span className="lbl" style={{ flex: 'none' }}>
          Liên lạc Hà Nội
        </span>
        <svg width="100%" height="26" viewBox="0 0 288 26" preserveAspectRatio="none" role="img"
          aria-label={`Dòng thời gian 72 giờ: P1h ${fmt(ops.p1h, 0)}%, khoảng trống dài nhất ${fmt(ops.longestGapH, 1)} giờ`}>
          <rect width="288" height="26" fill="#1A2647" />
          <path d={strip.bins} fill="#3DD6F5" />
          <path d={strip.lost} fill="#F87171" fillOpacity="0.75" />
          <rect x="0" y="0" width={clock / 15} height="26" fill="#FFFFFF" fillOpacity="0.08" />
          <path d={ordered.map((e) => `M${triggerMin(e) / 15} 0 V26`).join(' ')} stroke="#F5A524" strokeWidth="1.2" />
          <path d={`M${clock / 15} 0 V26`} stroke="#FFFFFF" strokeWidth="1" />
        </svg>
        <span className="mono" style={{ fontSize: 11, color: 'var(--muted)', flex: 'none' }}>
          {ordered.map((e) => e.id).join(' · ')}
        </span>
      </div>

      <main className="body ops-body">
        <div className="col">
          <section className="panel" style={{ padding: '10px 12px' }} aria-label="Chòm vệ tinh">
            <span className="lbl">
              Chòm Rồng Con · {mission.orbit.planes} MP
            </span>
            {satRows.map((s) => (
              <div key={s.name} className="placed-row" style={{ padding: '6px 0' }}>
                <span className="dot" style={{ background: s.color }} aria-hidden="true" />
                <span style={{ flex: 1 }}>{s.name}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
                  MP{s.plane} · {s.text}
                </span>
              </div>
            ))}
          </section>
          <section className="panel col" style={{ padding: '10px 12px', gap: 8 }} aria-label="Chỉ số sau sự cố">
            <span className="lbl">Chỉ số sau sự cố</span>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>P1h · tin SOS ≤ 1 giờ</div>
              <div className="mono" style={{ fontSize: 26, fontWeight: 600, color: 'var(--cyan)' }}>
                {fmt(ops.p1h, 0)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>P1h_mưa · trọng số IMERG</div>
              <div className="mono" style={{ fontSize: 20, fontWeight: 600, color: 'var(--cyan)' }}>
                {fmt(ops.p1hRain, 1)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>Khoảng trống dài nhất</div>
              <div className="mono" style={{ fontSize: 26, fontWeight: 600, color: ops.longestGapH <= data.scenario.difficulty[state.difficulty].gapMaxH ? 'var(--ok)' : 'var(--bad)' }}>
                {fmt(ops.longestGapH, 1)} h
              </div>
            </div>
            <span style={{ fontSize: 11, color: '#7F90AE' }}>
              Tính lại từ mô phỏng 72 h ({mission.orbit.planes} MP × {mission.orbit.perPlane}, {mission.orbit.hKm} km) với mặt nạ sự cố. Sự cố chỉ ảnh hưởng sao 2 và sao 4;
              R1 chấm trên thiết kế danh nghĩa ({mission.coverage ? fmt(mission.coverage.longestGapH, 1) : '—'} h).
              {run.weightsSource === 'none'
                ? ' Chưa có tệp IMERG nên trọng số mưa w = 1.'
                : ' Trọng số mưa w(h) = 1 + R(h)/R̄ từ mưa IMERG trung bình vùng 103–108°E, 20–23°N.'}
            </span>
          </section>
        </div>

        <section className="panel map-panel" aria-label="Bản đồ vận hành">
          <MapVN label="Bản đồ miền Bắc, lớp mưa IMERG, điểm SOS, vệ tinh và trạm Hòa Lạc">
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
                  <rect x="-19" y="-4" width="10" height="8" fill="#3DD6F5" />
                  <rect x="9" y="-4" width="10" height="8" fill="#3DD6F5" />
                  <text x="16" y="15" fontSize="10" fontWeight="700" fill="#F5A524">
                    Rồng Con-{p.i + 1}
                  </text>
                </g>
              );
            })}
          </MapVN>
          {grid && (
            <div style={{ position: 'absolute', right: 12, top: 10 }}>
              <RainLegend bins={RATE_BINS} unit="mm/h" title={`Mưa IMERG · ${hourLocal}`} />
            </div>
          )}
          <div className="map-slider">
            <label htmlFor="ops-time" className="lbl">
              Thời gian · giờ {hour}
              {hourLocal && ` · ${hourLocal} giờ VN`}
              {hanoiRate !== undefined && ` · mưa Hà Nội ${fmt(hanoiRate, 1)} mm/h`}
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
          <span style={{ position: 'absolute', left: 12, bottom: 8, right: 12, fontSize: 10, color: '#7F90AE' }}>
            Bản đồ: Natural Earth ·{' '}
            {grid
              ? `Lớp mưa: ${IMERG_LABEL} (DOI ${data.imerg?.source?.doi ?? '10.5067/GPM/IMERG/3B-HH/07'}, lưới ${fmt(grid.step, 1)}°)`
              : 'Chưa có lớp mưa IMERG (data_prep/prepare_imerg.py)'}{' '}
            · Điểm SOS minh họa
          </span>
        </section>

        <div className="col">
          <span className="lbl">Hàng đợi điều phối</span>
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
                  {e.id} · {e.atH < 0 ? 'khi vào quỹ đạo' : `T0+${e.atH} h`}
                  {isNext ? ' · cần quyết định' : chosen ? ' · đã chọn' : ''}
                </span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{e.title}</span>
                {chosen && out && (
                  <span style={{ fontSize: 12, color: '#C9D4E8' }}>
                    {chosen} — {e.options.find((o) => o.k === chosen)?.text} · P1h {out.p1hDisplay}%
                  </span>
                )}
                {isNext && clock >= triggerMin(e) && (
                  <button className="btn-p" style={{ minHeight: 44 }} onClick={() => setModal(e.id)}>
                    Xem thẻ sự cố
                  </button>
                )}
              </div>
            );
          })}
          <div className="col" style={{ marginTop: 'auto', gap: 8 }}>
            {!allChosen && (
              <button className="btn-s" onClick={() => seek(limit)}>
                Tua tới sự cố tiếp theo
              </button>
            )}
            <button
              className="btn-p"
              aria-disabled={!allChosen}
              onClick={() => allChosen && dispatch({ type: 'finishOps' })}
            >
              Kết thúc 72 giờ · Báo cáo →
            </button>
          </div>
        </div>
      </main>

      {ev && (
        <div className="modal-backdrop">
          <div className="panel event-card" role="dialog" aria-modal="true" aria-labelledby="ev-title">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="lbl" style={{ color: 'var(--bad)' }}>
                Sự cố {ev.id} · {ev.atH < 0 ? 'khi vào quỹ đạo' : `T0+${ev.atH} h`}
              </span>
              <button className="chip" onClick={() => setModal(null)}>
                Đóng
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
                <div id="ev-title" style={{ fontSize: 24, fontWeight: 800 }}>
                  {ev.title}
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55, color: '#C9D4E8' }}>
                  {eventIntro(ev, { hasShield: run.hasShield, donki: data.donki })}
                </p>
                {ev.id === 'E1' && data.donki?.link && (
                  <a href={data.donki.link} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: 'var(--cyan)', display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>
                    {data.donki.source ?? 'NASA DONKI'} · {data.donki.gstID ?? 'xem bản ghi'} ↗
                  </a>
                )}
              </div>
            </div>
            <div className="opt-grid" role="radiogroup" aria-label="Phương án">
              {options[ev.id].map((o) => {
                const opt = ev.options.find((x) => x.k === o.key)!;
                return (
                  <button
                    key={o.key}
                    className="opt"
                    role="radio"
                    aria-checked={pick === o.key}
                    disabled={!o.available}
                    onClick={() => setPick(o.key)}
                  >
                    <span className="lbl" style={{ color: 'var(--amber)' }}>
                      {o.key}
                      {o.available ? ` · ${RANK_LABEL[o.rank]}` : ' · cần động cơ'}
                    </span>
                    <span style={{ fontSize: 15, fontWeight: 800 }}>{opt.text}</span>
                    <span style={{ fontSize: 12, color: '#C9D4E8', lineHeight: 1.45 }}>{optionDetail(ev, o.key, run.hasShield)}</span>
                    <span className="mono" style={{ fontSize: 12, color: 'var(--cyan)' }}>
                      P1h {o.p1hDisplay}% · trống {fmt(o.longestGapH, 1)} h
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)', flex: 1, minWidth: 200 }}>
                P1h và khoảng trống tính trực tiếp trên dòng thời gian 72 giờ của chòm vệ tinh (mỗi phương án xét riêng). Phương án có P1h cao nhất được xếp “tốt”.
              </span>
              <button className="btn-p" aria-disabled={!pick} onClick={confirm}>
                Xác nhận &amp; tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
