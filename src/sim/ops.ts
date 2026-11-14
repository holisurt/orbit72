// 72-h operations with events — SPEC §6. Pure functions, no React.
// Model: an SOS message created at minute m is picked up at the next minute a usable satellite
// sees Hanoi (bent-pipe; Hoa Lac ≈ same point) and is delivered then, unless an event defers it.
// ok[m] = delivery − m ≤ 60 min. Event numbers come from public/data/events.json.
import type { GameEvent, Imerg } from '../data/types';
import { buildConstellation, longestGapH, satVisibility, SIM_MINUTES, type ConstellationInput } from './coverage';
import type { LatLon } from './orbit';

export interface OpsContext {
  minutes: number;
  perSat: Uint8Array[]; // nominal visibility of the target (Hanoi)
  perSatPartner: Uint8Array[]; // visibility of the partner station (HCMC), for E2-C relay
  planeOf: number[];
}

export function buildOpsContext(
  orbit: ConstellationInput,
  target: LatLon,
  partner: LatLon,
  minutes = SIM_MINUTES,
): OpsContext {
  const sats = buildConstellation(orbit);
  const k = orbit.perPlane; // ISS keeps k, forces P = 1
  return {
    minutes,
    perSat: sats.map((s) => satVisibility(s, target, minutes)),
    perSatPartner: sats.map((s) => satVisibility(s, partner, minutes)),
    planeOf: sats.map((_, i) => Math.floor(i / k)),
  };
}

export type Choices = Record<string, string>; // event id → option key

export interface OpsConfig {
  events: GameEvent[]; // events active in this run (already filtered by difficulty / onlyIf)
  choices: Choices;
  hasShield: boolean;
  noSatellites?: boolean; // R6 > 18 months → ops run with no satellites (P1h = 0)
  hourlyWeights?: number[] | null; // IMERG weights w(h); null → w = 1
}

export interface OpsResult {
  vis: Uint8Array; // effective union visibility
  satEff: Uint8Array[]; // effective per-satellite visibility
  satLost: boolean[];
  globalMask: Uint8Array; // minutes masked for every satellite (safe mode, lost window)
  delivery: Float64Array; // delivery minute per message minute (Infinity = never)
  ok: Uint8Array;
  p1h: number; // %
  p1hRain: number; // % (IMERG-weighted; = p1h when w = 1)
  longestGapH: number;
  eventCostKusd: number;
}

type Effect = {
  sat?: number;
  maskH?: [number, number];
  lost?: boolean;
  loseNextWindowUnless?: string;
  costKusd?: number;
  deferDeliveryToH?: number;
  windowH?: [number, number];
  relayVia?: string;
};

function effectOf(ev: GameEvent, key: string | undefined): Effect | null {
  if (!key) return null;
  const opt = ev.options.find((o) => o.k === key);
  return opt ? (opt.effect as Effect) : null;
}

function fillRange(a: Uint8Array, fromMin: number, toMin: number) {
  for (let m = Math.max(0, fromMin); m < Math.min(a.length, toMin); m++) a[m] = 1;
}

function union(perSat: Uint8Array[], satMask: Uint8Array[], global: Uint8Array, minutes: number): Uint8Array {
  const v = new Uint8Array(minutes);
  for (let i = 0; i < perSat.length; i++) {
    const p = perSat[i];
    const sm = satMask[i];
    for (let m = 0; m < minutes; m++) if (p[m] && !sm[m] && !global[m]) v[m] = 1;
  }
  return v;
}

/** Index of the next set minute ≥ m (Infinity if none), computed by a reverse scan. */
function nextIndex(v: Uint8Array): Float64Array {
  const n = new Float64Array(v.length);
  let next = Infinity;
  for (let m = v.length - 1; m >= 0; m--) {
    if (v[m]) next = m;
    n[m] = next;
  }
  return n;
}

export function runOps(ctx: OpsContext, cfg: OpsConfig): OpsResult {
  const M = ctx.minutes;
  const N = ctx.perSat.length;
  const satMask = ctx.perSat.map(() => new Uint8Array(M));
  const global = new Uint8Array(M);
  const satLost = ctx.perSat.map(() => false);
  let eventCostKusd = 0;

  const loseSat = (i: number) => {
    if (i < 0 || i >= N) return;
    satLost[i] = true;
    satMask[i].fill(1);
  };
  if (cfg.noSatellites) for (let i = 0; i < N; i++) loseSat(i);

  // Masking effects, applied in time order (E0 at −1 h first).
  const ordered = [...cfg.events].sort((a, b) => a.atH - b.atH);
  let deferral: { from: number; to: number; deliverAt: number } | null = null;
  let relay: { from: number; to: number } | null = null;

  for (const ev of ordered) {
    const e = effectOf(ev, cfg.choices[ev.id]);
    if (!e) continue;
    const at = Math.max(0, ev.atH * 60);
    if (e.costKusd) eventCostKusd += e.costKusd;
    if (e.sat !== undefined) {
      if (e.lost) loseSat(e.sat);
      else if (e.maskH && e.sat < N) fillRange(satMask[e.sat], e.maskH[0] * 60, e.maskH[1] * 60);
    } else if (e.maskH) {
      fillRange(global, e.maskH[0] * 60, e.maskH[1] * 60);
    } else if (e.loseNextWindowUnless) {
      if (!(e.loseNextWindowUnless === 'shield' && cfg.hasShield)) {
        // lose the next constellation-wide visibility window after the event (HF-Ops model)
        const v = union(ctx.perSat, satMask, global, M);
        let m = at;
        while (m < M && !v[m]) m++;
        while (m < M && v[m]) global[m++] = 1;
      }
    }
    if (e.deferDeliveryToH !== undefined && e.windowH)
      deferral = { from: e.windowH[0] * 60, to: e.windowH[1] * 60, deliverAt: e.deferDeliveryToH * 60 };
    if (e.relayVia && e.windowH) relay = { from: e.windowH[0] * 60, to: e.windowH[1] * 60 };
  }

  const satEff = ctx.perSat.map((p, i) => {
    const v = new Uint8Array(M);
    for (let m = 0; m < M; m++) if (p[m] && !satMask[i][m] && !global[m]) v[m] = 1;
    return v;
  });
  const vis = new Uint8Array(M);
  for (const s of satEff) for (let m = 0; m < M; m++) if (s[m]) vis[m] = 1;

  const nextVis = nextIndex(vis);
  const nextPartner = relay
    ? ctx.perSatPartner.map((p, i) => {
        const v = new Uint8Array(M);
        for (let m = 0; m < M; m++) if (p[m] && !satMask[i][m] && !global[m]) v[m] = 1;
        return nextIndex(v);
      })
    : null;

  const delivery = new Float64Array(M);
  const ok = new Uint8Array(M);
  for (let m = 0; m < M; m++) {
    const r = nextVis[m]; // pickup minute
    let d = r;
    if (Number.isFinite(r)) {
      if (deferral && r >= deferral.from && r < deferral.to) {
        // E2-B: delivered at first Hanoi visibility after the outage ends
        d = deferral.deliverAt < M ? nextVis[deferral.deliverAt] : Infinity;
      } else if (relay && nextPartner && r >= relay.from && r < relay.to) {
        // E2-C: store-and-forward, delivered at the first partner-station visibility after reception
        d = Infinity;
        for (let i = 0; i < N; i++) if (satEff[i][r]) d = Math.min(d, nextPartner[i][r]);
      }
    }
    delivery[m] = d;
    ok[m] = d - m <= 60 ? 1 : 0;
  }

  let num = 0;
  let wNum = 0;
  let wDen = 0;
  const w = cfg.hourlyWeights;
  for (let m = 0; m < M; m++) {
    num += ok[m];
    const wm = w ? (w[Math.floor(m / 60)] ?? 1) : 1;
    wNum += wm * ok[m];
    wDen += wm;
  }

  return {
    vis,
    satEff,
    satLost,
    globalMask: global,
    delivery,
    ok,
    p1h: (100 * num) / M,
    p1hRain: wDen ? (100 * wNum) / wDen : 0,
    longestGapH: longestGapH(vis),
    eventCostKusd,
  };
}

// ---------- Event option ranking (SPEC §6: by resulting P1h, ties = best) ----------

export type Rank = 'best' | 'middle' | 'worst';

export interface OptionOutcome {
  key: string;
  available: boolean; // false when the option is locked (e.g. not enough budget)
  p1h: number;
  p1hDisplay: number; // integer %, as shown on the event card
  longestGapH: number;
  rank: Rank;
}

/** Evaluate each option of one event on its own (nominal timeline + this option). */
export function evaluateEventOptions(
  ctx: OpsContext,
  base: Omit<OpsConfig, 'choices'>,
  ev: GameEvent,
  available: (key: string) => boolean = () => true,
): OptionOutcome[] {
  const res = ev.options.map((o) => {
    const r = runOps(ctx, { ...base, events: [ev], choices: { [ev.id]: o.k } });
    return { key: o.k, available: available(o.k), p1h: r.p1h, p1hDisplay: Math.round(r.p1h), longestGapH: r.longestGapH };
  });
  const levels = [...new Set(res.filter((r) => r.available).map((r) => r.p1hDisplay))].sort((a, b) => b - a);
  return res.map((r) => {
    const idx = levels.indexOf(r.p1hDisplay);
    const rank: Rank = !r.available || levels.length < 2 ? (r.available ? 'best' : 'worst') : idx === 0 ? 'best' : idx === levels.length - 1 ? 'worst' : 'middle';
    return { ...r, rank };
  });
}

// ---------- NASA data helpers ----------

/** IMERG weights per hour: w(h) = 1 + R(h)/mean(R), R = box-mean rain (SPEC §6). */
export function imergWeights(imerg: Imerg | null | undefined, hours = 72): number[] | null {
  if (!imerg || !imerg.box_mean_mmh?.length) return null;
  const R = imerg.box_mean_mmh.slice(0, hours);
  const mean = R.reduce((a, b) => a + b, 0) / R.length;
  if (!(mean > 0)) return null;
  return R.map((r) => 1 + r / mean);
}
