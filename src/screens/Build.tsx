import { useEffect, useState } from 'react';
import { useGameData } from '../data/context';
import type { ChassisId, Part, PartCat } from '../data/types';
import { resolveParts } from '../sim/build';
import { roundTo, statusFromRatio, statusMax } from '../sim/mission';
import { wingPowerW } from '../sim/power';
import { useMission } from '../state/mission';
import { useStore } from '../state/store';
import { fmt } from '../ui/format';
import { Hud, type HudBar } from '../ui/Hud';
import { PassScreen } from '../ui/PassScreen';
import { CAT_COLOR, CAT_TABS, PART_INFO, downlinkText, partWhy } from '../ui/parts';
import { TopBar } from '../ui/TopBar';
import { useT } from '../ui/i18n';

const BAY_WIDTH: Record<ChassisId, string> = { '3U': '300px', '6U': '380px', '12U': '470px' };

function partStats(p: Part): string {
  return `${p.cells} cells · ${fmt(p.kg, 2)} kg · ${p.txW ? `${fmt(p.txW, p.txW % 1 ? 1 : 0)} W when transmitting` : `${fmt(p.w, 1)} W`} · ${p.kusd}k · ${p.months} mo`;
}

export function Build() {
  const data = useGameData();
  const comp = data.components;
  const { state, dispatch } = useStore();
  const t = useT();
  const m = useMission();
  const b = m.build;
  const design = state.design;

  const [tab, setTab] = useState<PartCat>('com');
  const [sel, setSel] = useState<string>(design.parts.includes('sband') ? 'sband' : 'uhf');
  const [msg, setMsg] = useState('');
  const [pass, setPass] = useState(state.mode === 'coop' && !state.tutorial);

  const used = b.cellsUsed;
  const hasPart = (id: string) => design.parts.includes(id);

  // ---- hard constraints on actions (cells, mass) ----
  const massWith = (deltaKg: number, chassisId = design.chassis) => {
    const ch = comp.chassis.find((c) => c.id === chassisId)!;
    return b.massKg - b.chassis.baseKg + ch.baseKg + deltaKg;
  };
  const tryAdd = (p: Part) => {
    setSel(p.id);
    if (used + p.cells > b.cellsMax) return setMsg(`No room: ${p.name} needs ${p.cells} cells`);
    if (massWith(p.kg) > b.massLimitKg + 1e-9)
      return setMsg(`Too heavy: ${p.name} weighs ${fmt(p.kg, 2)} kg, the ${b.chassis.id} chassis allows ${b.massLimitKg} kg`);
    setMsg('');
    dispatch({ type: 'addPart', id: p.id });
  };
  const tryChassis = (id: ChassisId) => {
    const ch = comp.chassis.find((c) => c.id === id)!;
    if (used > ch.cells) return setMsg(`The ${id} chassis has only ${ch.cells} cells`);
    if (massWith(0, id) > ch.limitKg + 1e-9) return setMsg(`The ${id} chassis carries only ${ch.limitKg} kg`);
    setMsg('');
    dispatch({ type: 'setChassis', chassis: id });
  };
  const tryWings = () => {
    if (!design.wings && massWith(comp.wings.kg) > b.massLimitKg + 1e-9)
      return setMsg(`Too heavy: the solar wings weigh ${fmt(comp.wings.kg, 1)} kg`);
    setMsg('');
    dispatch({ type: 'toggleWings' });
  };

  // ---- HUD (all values from src/sim) ----
  const est = m.satCount;
  const bars: HudBar[] = [
    {
      name: 'Mass',
      ratio: b.massKg / b.massLimitKg,
      status: statusMax(b.massKg, b.massLimitKg, 2),
      text: `${fmt(b.massKg, 2)} / ${b.massLimitKg} kg`,
    },
    {
      name: 'Power',
      ratio: (b.pUseW * data.scenario.requirements.powerMargin) / b.pGenW,
      status: statusFromRatio((roundTo(b.pUseW, 1) * data.scenario.requirements.powerMargin) / roundTo(b.pGenW, 1)),
      text: `${fmt(b.pUseW, 2)} / ${fmt(b.pGenW, 1)} W`,
    },
    {
      name: 'Battery for eclipse',
      ratio: b.batteryHaveWh ? b.batteryNeedWh / b.batteryHaveWh : 9,
      status: b.batteryHaveWh ? statusFromRatio(roundTo(b.batteryNeedWh, 1) / b.batteryHaveWh) : 'VUOT',
      text: `need ${fmt(b.batteryNeedWh, 1)} / ${fmt(b.batteryHaveWh, 0)} Wh`,
    },
    {
      name: 'Data',
      ratio: b.dataDownlinkMB ? b.dataProducedMB / b.dataDownlinkMB : 9,
      status: m.reqs.find((r) => r.id === 'R2')!.status,
      text: `${fmt(b.dataProducedMB, 0)} / ${fmt(b.dataDownlinkMB, b.dataDownlinkMB < 10 ? 2 : 0)} MB/day`,
    },
    {
      name: `Cost (estimate, ${est} sats)`,
      ratio: m.totalCostKusd / m.budgetKusd,
      status: statusMax(m.totalCostKusd, m.budgetKusd, 0),
      text: `${b.costPerSatKusd}k × ${est} + launch = ${fmt(m.totalCostKusd, 0)}k`,
    },
    {
      name: 'Schedule',
      ratio: b.devMonths / data.scenario.requirements.devMonthsMax,
      status: statusMax(b.devMonths, data.scenario.requirements.devMonthsMax, 0),
      text: `${b.devMonths} / ${data.scenario.requirements.devMonthsMax} months`,
    },
  ];

  // ---- bay cells ----
  const cells: { label: string; color: string }[] = [];
  for (const p of b.parts) for (let i = 0; i < p.cells; i++) cells.push({ label: PART_INFO[p.id]?.ab ?? p.id, color: CAT_COLOR[p.cat] });
  const empty = Math.max(0, b.cellsMax - cells.length);

  const errors = b.hardErrors;
  const statusLine = msg
    ? { text: msg, color: 'var(--warn)' }
    : errors.length
      ? { text: errors.map((e) => e.message).join(' ') + ' (R8)', color: 'var(--bad)' }
      : { text: 'All required parts fitted (R8 PASS)', color: 'var(--ok)' };

  const selPart = comp.parts.find((p) => p.id === sel) ?? comp.parts[0];
  const placed = resolveParts(comp, design.parts);
  const canGo = errors.length === 0;

  const hasS = hasPart('sband');
  const coach = state.coach.open;
  useEffect(() => {
    if (!coach) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dispatch({ type: 'setCoach', open: false });
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [coach, dispatch]);
  const rbpsOf = (id: string) => comp.parts.find((p) => p.id === id)?.rbps ?? 0;
  const sosMB = fmt(comp.parts.find((p) => p.id === 'sos')?.mbPerDay ?? 0, 0);

  return (
    <div className="screen">
      <TopBar
        subtitle={state.tutorial ? 'Tutorial · Sea Eye' : data.scenario.name}
        step="build"
        right={
          <span className="turn">
            Turn: <strong>Spacecraft Engineer</strong>
            <button className="tab accent" onClick={() => dispatch({ type: 'setCoach', open: true })}>
              {t('help')}
            </button>
          </span>
        }
      />
      <Hud bars={bars} />
      <main className="body build-body">
        <section className={`panel col ${coach ? 'coach-target' : ''}`} style={{ padding: 12, gap: 8 }} aria-label="Parts">
          <span className="lbl">Parts</span>
          <div className="row" style={{ gap: 5, flexWrap: 'wrap' }} role="group" aria-label="Part groups">
            {CAT_TABS.map((t) => (
              <button key={t.id} className="tab" aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
                {t.name}
              </button>
            ))}
          </div>
          <div className="col" style={{ gap: 6, overflow: 'auto' }}>
            {comp.parts
              .filter((p) => p.cat === tab)
              .map((p) => {
                const full = used + p.cells > b.cellsMax;
                return (
                  <div key={p.id} className="part-item" style={{ borderLeftColor: CAT_COLOR[p.cat] }}>
                    <button className="info" aria-pressed={sel === p.id} onClick={() => setSel(p.id)}>
                      <div className="pname" style={{ fontSize: 'calc(13rem / 16)', fontWeight: 700 }}>
                        {p.name}
                      </div>
                      <div className="mono" style={{ fontSize: 'calc(11rem / 16)', color: 'var(--muted)' }}>
                        {partStats(p)}
                      </div>
                    </button>
                    <button
                      className="add"
                      aria-disabled={full}
                      aria-label={`Add ${p.name}`}
                      onClick={() => tryAdd(p)}
                    >
                      +
                    </button>
                  </div>
                );
              })}
          </div>
        </section>

        <section
          className="panel col"
          style={{ padding: '12px 16px', gap: 10, background: 'radial-gradient(500px 300px at 50% 45%, var(--panel-elevated), var(--panel))' }}
          aria-label="Satellite chassis"
        >
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <span className="lbl">Chassis · each cell = 0.5U</span>
            <div className="row" style={{ gap: 6 }} role="group" aria-label="Choose chassis">
              {comp.chassis.map((c) => (
                <button key={c.id} className="tab" aria-pressed={design.chassis === c.id} onClick={() => tryChassis(c.id)}>
                  {c.id}
                </button>
              ))}
            </div>
          </div>
          <div className="row" style={{ flex: 1, justifyContent: 'center', gap: 10, minHeight: 220 }}>
            {design.wings && (
              <svg width="70" height="160" viewBox="0 0 90 200" aria-hidden="true" style={{ flex: 'none' }}>
                <rect x="2" y="10" width="80" height="180" rx="4" fill="#1C2536" stroke="#8E9BAE" />
                <path d="M2 55 H82 M2 100 H82 M2 145 H82 M42 10 V190" stroke="#8E9BAE" strokeWidth="0.8" />
                <rect x="82" y="96" width="8" height="8" fill="#9AABC7" />
              </svg>
            )}
            <div
              className="bay"
              style={{ gridTemplateColumns: `repeat(${b.chassis.cols}, minmax(0, 1fr))`, width: BAY_WIDTH[design.chassis] }}
              role="img"
              aria-label={`Chassis ${design.chassis}: ${used}/${b.cellsMax} cells used`}
            >
              {cells.map((c, i) => (
                <div key={i} className="bay-cell" style={{ background: c.color, borderColor: c.color }}>
                  {c.label}
                </div>
              ))}
              {Array.from({ length: empty }, (_, i) => (
                <div key={`e${i}`} className="bay-cell empty" />
              ))}
            </div>
            {design.wings && (
              <svg width="70" height="160" viewBox="0 0 90 200" aria-hidden="true" style={{ flex: 'none' }}>
                <rect x="8" y="10" width="80" height="180" rx="4" fill="#1C2536" stroke="#8E9BAE" />
                <path d="M8 55 H88 M8 100 H88 M8 145 H88 M48 10 V190" stroke="#8E9BAE" strokeWidth="0.8" />
                <rect x="0" y="96" width="8" height="8" fill="#9AABC7" />
              </svg>
            )}
          </div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <button className="tg" aria-pressed={design.wings} onClick={tryWings}>
              Deployable solar wings{' '}
              {design.wings ? `· ON (+${fmt(wingPowerW(comp.wings.areaM2, comp.wings.orientation, m.fEcl), 1)} W)` : '· OFF'}
            </button>
            <button className="tg" aria-pressed={design.envTest} onClick={() => dispatch({ type: 'toggleEnvTest' })}>
              Environmental testing{' '}
              {design.envTest ? `· YES (+${comp.envTest.kusd}k, +${comp.envTest.months} mo)` : '· NO'}
            </button>
            <span role="status" style={{ flex: 1, minWidth: 180, fontSize: 'calc(12rem / 16)', color: statusLine.color, textAlign: 'right' }}>
              {statusLine.text}
            </span>
          </div>
        </section>

        <div className="col">
          <section className="panel" style={{ padding: '12px 14px' }} aria-live="polite">
            <span className="lbl" style={{ color: 'var(--amber)' }}>
              Details
            </span>
            <div style={{ fontSize: 'calc(17rem / 16)', fontWeight: 800, marginTop: 4 }}>{selPart.name}</div>
            <div className="mono" style={{ fontSize: 'calc(11rem / 16)', color: 'var(--muted)', marginTop: 2 }}>
              {partStats(selPart)}
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 'calc(13rem / 16)', lineHeight: 1.5, color: 'var(--soft)' }}>
              {partWhy(selPart, m.contactMinPerDay, m.orbit.hKm, data.scenario.requirements.elevationDeg)}
            </p>
          </section>
          <section className="panel col" style={{ padding: '10px 12px', gap: 4, flex: 1 }} aria-label="Installed">
            <span className="lbl">
              Installed · {used}/{b.cellsMax} cells
            </span>
            {placed.map((p, i) => (
              <div key={`${p.id}-${i}`} className="placed-row">
                <span className="dot" style={{ background: CAT_COLOR[p.cat] }} aria-hidden="true" />
                <span style={{ flex: 1 }}>{p.name}</span>
                <button
                  className="x"
                  aria-label={`Remove ${p.name}`}
                  onClick={() => {
                    setMsg('');
                    dispatch({ type: 'removePart', index: i });
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </section>
          <div className="row">
            <button className="btn-s" aria-label={t('back')} onClick={() => dispatch({ type: 'go', screen: 'brief' })}>
              ←
            </button>
            <button
              className="btn-p"
              style={{ flex: 1 }}
              aria-disabled={!canGo}
              onClick={() => {
                if (!canGo) return setMsg('Cannot choose the orbit yet: ' + errors.map((e) => e.message).join(' '));
                dispatch({ type: 'go', screen: 'orbit' });
              }}
            >
              {t('toOrbit')} →
            </button>
          </div>
        </div>
      </main>

      {coach && (
        <>
          <div className="coach-backdrop" aria-hidden="true" />
          <div className="coach" role="dialog" aria-labelledby="coach-title">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="lbl" style={{ color: 'var(--amber)' }}>
                Tutorial · step {hasS ? 3 : 2}/7
              </span>
              <span style={{ fontSize: 'calc(22rem / 16)' }} aria-hidden="true">
                ←
              </span>
            </div>
            <div id="coach-title" style={{ fontSize: 'calc(18rem / 16)', fontWeight: 800 }}>
              {hasS ? 'Nice! The Data bar is now PASS' : 'The Data bar is OVER'}
            </div>
            <p style={{ margin: 0, fontSize: 'calc(14rem / 16)', lineHeight: 1.55, color: 'var(--soft)' }}>
              {hasS
                ? `S-band sends down ${downlinkText(rbpsOf('sband'), m.contactMinPerDay)}, enough for ${sosMB} MB of SOS data. The radio only uses power during contact, so the Power bar barely changes. Next: press “Choose orbit”.`
                : `UHF only sends down ${downlinkText(rbpsOf('uhf'), m.contactMinPerDay)}, less than the ${sosMB} MB of SOS messages produced. Open the Radio tab and press + on “S-band 2.2 GHz”.`}
            </p>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button className="tab" onClick={() => dispatch({ type: 'setCoach', open: false })}>
                {t('skip')}
              </button>
              <button className="tab" aria-pressed={true} onClick={() => dispatch({ type: 'setCoach', open: false })}>
                {t('gotIt')}
              </button>
            </div>
          </div>
        </>
      )}

      {pass && (
        <PassScreen
          role="VT"
          count={state.players.count}
          names={state.players.names}
          text="Everyone else puts the device down. You choose the chassis, parts, solar wings and testing; the team HUD stays visible for everyone."
          onStart={() => setPass(false)}
        />
      )}
    </div>
  );
}
