import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useGameData } from '../data/context';
import type { LauncherId } from '../data/types';
import { buildConstellation, countPasses, ELEV_MIN_DEG, groundTrack, type PresetId } from '../sim/coverage';
import { linkMarginFor } from '../sim/link';
import { statusMin, type Requirement } from '../sim/mission';
import { coverageHalfAngle, DEG, periodMin } from '../sim/orbit';
import { useMission } from '../state/mission';
import { useStore } from '../state/store';
import { fmt } from '../ui/format';
import { MapWorld, projWorld } from '../ui/MapWorld';
import { PassScreen } from '../ui/PassScreen';
import { StatusChip } from '../ui/StatusChip';
import { TopBar } from '../ui/TopBar';
import { Term } from '../ui/Term';
import { L_P1H } from '../ui/labels';
import { useT } from '../ui/i18n';

const PRESETS: { id: PresetId; name: string; launcher: LauncherId }[] = [
  { id: 'sso', name: 'SSO', launcher: 'rideshare' },
  { id: 'iss', name: 'ISS 51.6°', launcher: 'iss' },
  { id: 'low20', name: 'Low 20°', launcher: 'dedicated' },
  { id: 'leo53', name: 'LEO 53°', launcher: 'dedicated' },
];

export function Orbit() {
  const data = useGameData();
  const { state, dispatch } = useStore();
  const t = useT();
  const m = useMission();
  const o = m.orbit;
  const [pass, setPass] = useState(state.mode === 'coop' && !state.tutorial);

  useEffect(() => {
    if (!state.orbit.chosen) dispatch({ type: 'chooseOrbit' });
  }, [state.orbit.chosen, dispatch]);

  const target = state.tutorial ? data.scenario.tutorial.target : data.scenario.target;
  const targetName = state.tutorial ? 'East Sea' : 'Hà Nội';
  const tp = projWorld(target.lat, target.lon);
  const lamDeg = coverageHalfAngle(o.hKm, data.scenario.requirements.elevationDeg) / DEG;

  // Ground tracks: 2 orbits of the first satellite in each plane (one line per plane).
  const tracks = useMemo(() => {
    const sats = buildConstellation(o);
    const twoOrbits = Math.round(2 * periodMin(o.hKm));
    let d = '';
    for (let p = 0; p < o.planes; p++) {
      let prev: number | null = null;
      for (const pt of groundTrack(sats[p * o.perPlane], 0, twoOrbits, 1)) {
        const { x, y } = projWorld(pt.lat, pt.lon);
        d += `${prev === null || Math.abs(pt.lon - prev) > 180 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
        prev = pt.lon;
      }
    }
    return d;
  }, [o]);

  // 72-h strip: 288 bins of 15 min.
  const bins = useMemo(() => {
    const vis = m.coverage?.vis;
    if (!vis) return '';
    let d = '';
    for (let b = 0; b < 288; b++) {
      for (let k = b * 15; k < b * 15 + 15; k++)
        if (vis[k]) {
          d += `M${b} 0h1v22h-1z`;
          break;
        }
    }
    return d;
  }, [m.coverage]);

  const r = (id: Requirement['id']) => m.reqs.find((q) => q.id === id)!;
  const cov = m.coverage;
  const iss = o.preset === 'iss';

  const rows: { id: string; k: ReactNode; v: string; chip?: ReactNode }[] = [
    { id: 'incl', k: <>One orbit · <Term id="incl">inclination</Term></>, v: `${fmt(periodMin(o.hKm), 1)} min · ${fmt(m.inclDeg, 1)}°` },
    { id: 'ecl', k: <>Time in <Term id="eclipse">eclipse</Term></>, v: `${fmt(m.fEcl * 100, 1)}%` },
    { id: 'n', k: 'Satellites N = P × k', v: String(m.satCount) },
    {
      id: 'r1',
      k: 'Longest coverage gap · R1',
      v: cov ? `${fmt(cov.longestGapH, 1)} h` : '—',
      chip: state.tutorial ? undefined : <StatusChip status={r('R1').status} />,
    },
    { id: 'p1h', k: <Term id="p1h">{L_P1H}</Term>, v: cov ? `${fmt(cov.p1h, 0)}%` : '—' },
    { id: 'contact', k: 'Contact minutes per day (per satellite)', v: cov ? `${fmt(cov.contactMinPerDayPerSat, 0)} min` : '—' },
  ];
  if (state.tutorial && cov)
    rows.push({ id: 'passes', k: 'Passes on day 1', v: String(countPasses(cov.vis.slice(0, 1440))) });
  rows.push(
    {
      id: 'r4',
      k: (
        <>
          <Term id="lifetime">Orbital lifetime</Term> · R4{m.lifetimeExtrapolated ? ' (extrapolated)' : ''}
        </>
      ),
      v: `${fmt(m.lifetimeY, 1)} years${m.residualY !== null ? ` · residual ${fmt(m.residualY, 1)}` : ''}`,
      chip: <StatusChip status={r('R4').status} />,
    },
    {
      id: 'launcher',
      k: 'Launcher',
      v: m.launch.compatible ? 'compatible' : 'not compatible',
      chip: <StatusChip status={m.launch.compatible ? 'DAT' : 'VUOT'} />,
    },
    { id: 'r5', k: 'Total cost · R5', v: `${fmt(m.totalCostKusd, 0)}k`, chip: <StatusChip status={r('R5').status} /> },
  );

  const HERO = ['r1', 'p1h', 'r4', 'r5'];

  const launcherCostText = (id: LauncherId) => {
    const l = m.launches.find((x) => x.launcher.id === id)!;
    if (id === 'iss') return `${m.satCount} satellites × ${l.launcher.pricePerSatKusd}k = ${fmt(l.costKusd, 0)}k`;
    if (id === 'dedicated') return `${l.launches} launches × ${fmt(l.launcher.pricePerLaunchKusd!, 0)}k`;
    const per = l.costKusd / l.launches;
    return `${l.launches} launches × ${fmt(per, 0)}k = ${fmt(l.costKusd, 0)}k`;
  };

  // R7 panel shows all three links at 10° (installed or not), as in HF-Orbit.
  const allLinks = (['uhf', 's', 'sos'] as const).map((id) => {
    const installed = m.links.find((l) => l.id === id);
    return { id, margin: installed?.margin10 ?? marginFor(id, o.hKm), installed: !!installed };
  });

  return (
    <div className="screen">
      <TopBar
        subtitle={state.tutorial ? 'Tutorial · Sea Eye' : data.scenario.name}
        step="orbit"
        right={
          <span className="turn">
            Turn: <strong>Orbit &amp; Comms Engineer</strong>
          </span>
        }
      />
      <main className="body orbit-body">
        <section className="panel col" style={{ padding: 12, gap: 9 }} aria-label="Orbit settings">
          <span className="lbl">
            <Term id="incl">Inclination</Term>
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6 }} role="group" aria-label="Inclination">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                className="chip"
                aria-pressed={o.preset === p.id}
                onClick={() => dispatch({ type: 'setOrbit', patch: { preset: p.id, launcher: p.launcher } })}
              >
                {p.name}
              </button>
            ))}
          </div>
          <label htmlFor="alt" className="lbl" style={{ marginTop: 2 }}>
            Altitude ·{' '}
            <span className="mono" style={{ color: 'var(--amber)', fontSize: 'calc(13rem / 16)' }}>
              {o.hKm} km
            </span>
          </label>
          <input
            id="alt"
            type="range"
            min={300}
            max={800}
            step={10}
            value={o.hKm}
            disabled={iss}
            aria-valuetext={`${o.hKm} km`}
            onChange={(e) => dispatch({ type: 'setOrbit', patch: { hKm: Number(e.target.value) } })}
          />
          {iss && <span style={{ fontSize: 'calc(11rem / 16)', color: 'var(--muted)' }}>ISS: fixed 400 km, 1 plane</span>}
          <div className="counters">
            <Counter
              label={
            <>
              <Term id="plane">Orbital planes</Term> P
            </>
          }
              value={o.planes}
              min={1}
              max={iss ? 1 : 6}
              less="Fewer planes"
              more="More planes"
              onChange={(v) => dispatch({ type: 'setOrbit', patch: { planes: v } })}
            />
            <Counter
              label="Satellites per plane k"
              value={o.perPlane}
              min={1}
              max={3}
              less="Fewer satellites"
              more="More satellites"
              onChange={(v) => dispatch({ type: 'setOrbit', patch: { perPlane: v } })}
            />
          </div>
          <span className="lbl" style={{ marginTop: 2 }}>
            Launcher
          </span>
          {m.launches.map((l) => (
            <button
              key={l.launcher.id}
              className="lv"
              aria-pressed={o.launcher === l.launcher.id}
              onClick={() => dispatch({ type: 'setOrbit', patch: { launcher: l.launcher.id } })}
            >
              <span style={{ fontSize: 'calc(13rem / 16)', fontWeight: 800 }}>{l.launcher.name}</span>
              <span className="mono" style={{ fontSize: 'calc(11rem / 16)', color: 'var(--soft)' }}>
                {launcherCostText(l.launcher.id)}
              </span>
              <span style={{ fontSize: 'calc(11rem / 16)', fontWeight: 700, color: l.compatible ? 'var(--ok)' : 'var(--bad)' }}>
                {l.compatible ? 'COMPATIBLE' : `NO: ${l.reason}`}
              </span>
            </button>
          ))}
        </section>

        <div className="col">
          <section className="panel col" style={{ padding: 10, gap: 6 }} aria-label="Ground track map">
            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span className="lbl">Ground track, 2 orbits · one line per plane</span>
              <span className="lbl" style={{ color: 'var(--soft)' }}>
                dashed circle: {targetName} can see the satellite (ε ≥ {data.scenario.requirements.elevationDeg}°)
              </span>
            </div>
            <MapWorld label={`World map with the ground track of ${o.planes} plane(s) and the area that can see ${targetName}`}>
              <path d={tracks} fill="none" stroke="#F5A524" strokeWidth="1.4" strokeOpacity="0.9" />
              <ellipse
                cx={tp.x}
                cy={tp.y}
                rx={(lamDeg * 2) / Math.cos(target.lat * DEG)}
                ry={lamDeg * 2}
                fill="#F3F5F8"
                fillOpacity="0.08"
                stroke="#F3F5F8"
                strokeWidth="1.5"
                strokeDasharray="5 4"
              />
              <circle cx={tp.x} cy={tp.y} r="4" fill="#F87171" />
              <text x={tp.x + 8} y={tp.y - 6} fontSize="11" fontWeight="700" fill="#FFFFFF">
                {targetName}
              </text>
            </MapWorld>
            <span style={{ fontSize: 'calc(10rem / 16)', color: 'var(--dim)' }}>
              Map: Natural Earth (public domain) · circular orbits, J2 drift, equirectangular projection
            </span>
          </section>
          <section className="panel col" style={{ padding: '10px 12px', gap: 6 }} aria-label="72-hour contact timeline">
            <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <span className="lbl">72 hours after landfall · bright bar = {targetName} has contact</span>
              <span className="mono" style={{ fontSize: 'calc(11rem / 16)', color: 'var(--muted)' }}>
                T0 → T0+72 h
              </span>
            </div>
            <svg width="100%" height="22" viewBox="0 0 288 22" preserveAspectRatio="none" role="img"
              aria-label={cov ? `Longest coverage gap ${fmt(cov.longestGapH, 1)} h, SOS delivered within 1 h ${fmt(cov.p1h, 0)}%` : 'Calculating'}>
              <rect width="288" height="22" fill="#141B2A" />
              <path d={bins} fill="#F3F5F8" fillOpacity="0.85" />
              <path d="M96 0 V22 M192 0 V22" stroke="#7F90AE" strokeWidth="0.6" />
            </svg>
            <div className="mono row" style={{ justifyContent: 'space-between', fontSize: 'calc(10rem / 16)', color: 'var(--dim)' }}>
              <span>T0</span>
              <span>+24 h</span>
              <span>+48 h</span>
              <span>+72 h</span>
            </div>
          </section>
        </div>

        <div className="col" style={{ gap: 8 }}>
          {/* Hero numbers: the four key metrics (same rows, same values; shown large) */}
          <section className="hero-metrics" aria-label="Key numbers">
            {rows
              .filter((row) => HERO.includes(row.id))
              .map((row) => (
                <div key={row.id} className="panel hero-metric">
                  <span className="hero-label">{row.k}</span>
                  <span className="hero-value mono">{row.v}</span>
                  {row.chip && <span className="hero-chip">{row.chip}</span>}
                </div>
              ))}
          </section>
          <section className="panel col" style={{ padding: '10px 12px', gap: 0 }} aria-label="Numbers">
            <span className="lbl" style={{ marginBottom: 4 }}>
              Numbers (GDD model, section 6)
            </span>
            {rows.filter((row) => !HERO.includes(row.id)).map((row) => (
              <div key={row.id} className="metric">
                <span style={{ fontSize: 'calc(12rem / 16)', color: 'var(--soft)' }}>{row.k}</span>
                <span className="row" style={{ gap: 6 }}>
                  <span className="mono" style={{ fontSize: 'calc(12rem / 16)', fontWeight: 600 }}>
                    {row.v}
                  </span>
                  {row.chip}
                </span>
              </div>
            ))}
          </section>
          <section className="panel" style={{ padding: '10px 12px' }} aria-label="Link margin">
            <span className="lbl">
            <Term id="margin">Link margin</Term> to Hòa Lạc (10°) · R7
          </span>
            <div className="mono row" style={{ justifyContent: 'space-between', fontSize: 'calc(13rem / 16)', marginTop: 6, flexWrap: 'wrap' }}>
              {allLinks.map((l) => {
                const s = statusMin(l.margin, data.scenario.requirements.linkMarginDb, 1);
                return (
                  <span key={l.id} data-status={s} style={{ color: l.installed ? 'var(--text)' : 'var(--muted)' }}
                    title={l.installed ? undefined : 'not installed'}>
                    {l.id === 'uhf' ? 'UHF' : l.id === 's' ? 'S' : 'SOS'} {fmt(l.margin, 1)}
                    {l.id === 'sos' ? ' dB' : ''}
                  </span>
                );
              })}
            </div>
            <div style={{ fontSize: 'calc(11rem / 16)', color: 'var(--muted)', marginTop: 4 }}>
              R7 checks the installed links: <StatusChip status={r('R7').status} />
            </div>
          </section>
          <div className="row" style={{ marginTop: 'auto' }}>
            <button className="btn-s" aria-label={t('back')} onClick={() => dispatch({ type: 'go', screen: 'build' })}>
              ←
            </button>
            <button className="btn-p" style={{ flex: 1 }} onClick={() => dispatch({ type: 'go', screen: 'review' })}>
              {t('toReview')} →
            </button>
          </div>
        </div>
      </main>
      {pass && (
        <PassScreen
          role="QD"
          count={state.players.count}
          names={state.players.names}
          text="Everyone else puts the device down. You choose the inclination, altitude, number of planes and the launcher; the team HUD stays visible for everyone."
          onStart={() => setPass(false)}
        />
      )}
    </div>
  );
}

function marginFor(id: 'uhf' | 's' | 'sos', hKm: number): number {
  return linkMarginFor(id, hKm, ELEV_MIN_DEG);
}

function Counter(props: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  less: string;
  more: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <span className="lbl">{props.label}</span>
      <div className="row" style={{ gap: 6, marginTop: 4 }}>
        <button className="sq" aria-label={props.less} disabled={props.value <= props.min} onClick={() => props.onChange(props.value - 1)}>
          −
        </button>
        <span className="mono" style={{ fontSize: 'calc(20rem / 16)', width: 20, textAlign: 'center' }} aria-live="polite">
          {props.value}
        </span>
        <button className="sq" aria-label={props.more} disabled={props.value >= props.max} onClick={() => props.onChange(props.value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}
