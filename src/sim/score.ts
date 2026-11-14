// Scoring — SPEC §7 (five stars, outcome, why-chain), §8 (priority cards), §12 (CML badge).
import type { GameEvent } from '../data/types';
import type { MissionResult, Requirement } from './mission';
import { roundTo } from './mission';
import type { OptionOutcome, Rank } from './ops';

const vn = (x: number, d = 1) => roundTo(x, d).toFixed(d).replace('.', '.');

// ---------- outcome ----------

export type Outcome = 'THANH_CONG' | 'MOT_PHAN' | 'THAT_BAI';
export const OUTCOME_LABEL: Record<Outcome, string> = {
  THANH_CONG: 'MISSION SUCCESS',
  MOT_PHAN: 'PARTIAL SUCCESS',
  THAT_BAI: 'MISSION FAILED',
};

/** R passes unless VƯỢT (SÁT is a pass, near the limit). */
export function requirementsPassed(reqs: Requirement[]): number {
  return reqs.filter((r) => r.status !== 'VUOT').length;
}

/** THÀNH CÔNG (8/8) · MỘT PHẦN (≥ 6/8) · THẤT BẠI. (Launches cannot fail since v1.1.) */
export function outcome(passed: number): Outcome {
  if (passed === 8) return 'THANH_CONG';
  if (passed >= 6) return 'MOT_PHAN';
  return 'THAT_BAI';
}

// ---------- star tables ----------

/** Star 2 base from P1h_rain %: ≥70→5, ≥55→4, ≥40→3, ≥25→2, else 1. */
export function starsFromP1h(p: number): number {
  const v = roundTo(p, 1);
  return v >= 70 ? 5 : v >= 55 ? 4 : v >= 40 ? 3 : v >= 25 ? 2 : 1;
}

/** Star 3 from VFM = P1h_rain % / cost (million USD): ≥20→5, ≥17→4, ≥14→3, ≥10→2, else 1. */
export function starsFromVfm(vfm: number): number {
  const v = roundTo(vfm, 1);
  return v >= 20 ? 5 : v >= 17 ? 4 : v >= 14 ? 3 : v >= 10 ? 2 : 1;
}

export const RANK_PENALTY: Record<Rank, number> = { best: 0, middle: 10, worst: 20 };

// ---------- priority cards (SPEC §8) ----------

export type RoleId = 'FD' | 'VT' | 'KH' | 'QD';
export type CardSide = 'a' | 'b';

export interface CardResult {
  role: RoleId;
  side: CardSide;
  met: boolean;
  value: string;
}

export function powerMarginPct(m: MissionResult): number {
  return m.build.pUseW > 0 ? (m.build.pGenW / m.build.pUseW - 1) * 100 : Infinity;
}

export function budgetMarginPct(m: MissionResult): number {
  return ((m.budgetKusd - m.totalCostKusd) / m.budgetKusd) * 100;
}

export function priorityCards(cards: Record<RoleId, CardSide>, m: MissionResult): CardResult[] {
  // KH (a): data produced ≤ 50 % of the daily downlink capacity (displayed values, 1 decimal MB)
  const down = roundTo(m.build.dataDownlinkMB, 1);
  const dataRatio = down > 0 ? roundTo(m.build.dataProducedMB, 1) / down : Infinity;
  const dataPct = roundTo(100 * dataRatio, 0);
  const gap = m.coverage ? roundTo(m.coverage.longestGapH, 1) : Infinity;
  const p1h = m.coverage ? roundTo(m.coverage.p1h, 1) : 0;
  const minMargin = m.links.length ? Math.min(...m.links.map((l) => roundTo(l.margin10, 1))) : -Infinity;
  const pm = roundTo(powerMarginPct(m), 1);
  const check: Record<RoleId, Record<CardSide, () => [boolean, string]>> = {
    FD: {
      a: () => [m.totalCostKusd <= 0.9 * m.budgetKusd, `${Math.round((100 * m.totalCostKusd) / m.budgetKusd)}% of budget`],
      b: () => [m.budgetKusd - m.totalCostKusd >= 200, `reserve ${Math.round(m.budgetKusd - m.totalCostKusd)}k`],
    },
    VT: {
      a: () => [pm >= 20, `margin ${vn(pm)}%`],
      b: () => [m.envTest, m.envTest ? 'env testing done' : 'no env testing'],
    },
    KH: {
      a: () => [dataPct <= 50, Number.isFinite(dataPct) ? `data ${dataPct}% of downlink capacity` : 'nothing can be downlinked'],
      b: () => [p1h >= 55, `SOS ≤ 1 h ${vn(p1h, 0)}%`],
    },
    QD: {
      a: () => [gap <= 3.0, `${vn(gap)} h`],
      b: () => [minMargin >= 6, `smallest margin ${vn(minMargin)} dB`],
    },
  };
  return (Object.keys(cards) as RoleId[]).map((role) => {
    const [met, value] = check[role][cards[role]]();
    return { role, side: cards[role], met, value };
  });
}

// ---------- five stars ----------

export interface StarLine {
  n: 1 | 2 | 3 | 4 | 5;
  name: string;
  stars: number;
  formula: string;
}

export interface EventDecision {
  event: GameEvent;
  chosen: string;
  outcomes: OptionOutcome[];
}

export interface ScoreInput {
  mission: MissionResult; // nominal design at launch
  p1hRainOps: number; // after events (star 2)
  p1hRainNominal: number; // no events (star 3: events affect only stars 2 and 4)
  launchedWithVuot: boolean;
  launchedWithNoGo: boolean;
  decisions: EventDecision[];
  prevOverall: number | null;
  mode: 'solo' | 'coop';
  cards?: CardResult[];
  unanimousGo?: boolean;
}

export interface ScoreResult {
  passed: number;
  outcome: Outcome;
  stars: StarLine[];
  overall: number; // mean of 5 stars
  star4Score: number;
  star5Score: number;
}

export function computeScore(i: ScoreInput): ScoreResult {
  const m = i.mission;
  const passed = requirementsPassed(m.reqs);
  const out = outcome(passed);

  // Star 1
  const s1 = Math.round((5 * passed) / 8);
  const l1 = `R1–R8: ${passed}/8 pass → round(5 × ${passed}/8) = ${s1}`;

  // Star 2
  const s2 = starsFromP1h(i.p1hRainOps);
  const l2 = `SOS delivered within 1 h (weighted by NASA IMERG rain), after events = ${vn(i.p1hRainOps)}% → ${s2} stars`;

  // Star 3 (nominal, events excluded)
  const costM = m.totalCostKusd / 1000;
  const vfm = costM > 0 ? i.p1hRainNominal / costM : 0;
  const s3 = starsFromVfm(vfm);
  const l3 = `Cost efficiency = ${vn(i.p1hRainNominal)} / ${vn(costM, 2)} = ${vn(vfm)} → ${s3} stars`;

  // Star 5
  let s5: number;
  let score5: number;
  let l5: string;
  if (i.mode === 'coop') {
    const met = (i.cards ?? []).filter((c) => c.met).length;
    score5 = 20 * met + (i.unanimousGo ? 20 : 0);
    s5 = Math.max(1, Math.ceil(score5 / 20));
    l5 = `Priority cards ${met}/${(i.cards ?? []).length} × 20${i.unanimousGo ? ' + 20 consensus' : ''} = ${score5} → ${s5} stars`;
  } else {
    const env = m.envTest;
    const pm = roundTo(powerMarginPct(m), 1) >= 20;
    const bm = roundTo(budgetMarginPct(m), 1) >= 5;
    score5 = (env ? 40 : 0) + (pm ? 30 : 0) + (bm ? 30 : 0);
    s5 = Math.max(1, Math.ceil(score5 / 20));
    l5 = `Env testing ${env ? 40 : 0} + power margin ≥ 20% ${pm ? 30 : 0} + budget reserve ≥ 5% ${bm ? 30 : 0} = ${score5} → ${s5} stars`;
  }

  // Star 4
  let score4 = 100;
  const parts4: string[] = [];
  if (i.launchedWithVuot) {
    score4 -= 25;
    parts4.push('−25 launched with an OVER');
  }
  if (i.launchedWithNoGo) {
    score4 -= 10;
    parts4.push('−10 launched over a NO-GO');
  }
  for (const d of i.decisions) {
    const rank = d.outcomes.find((o) => o.key === d.chosen)?.rank ?? 'best';
    const pen = RANK_PENALTY[rank];
    if (pen) {
      score4 -= pen;
      parts4.push(`−${pen} ${d.event.id}-${d.chosen}`);
    }
  }
  const star4 = (s: number) => Math.max(1, Math.ceil(Math.max(0, Math.min(100, s)) / 20));
  const mean = (s4: number) => (s1 + s2 + s3 + s4 + s5) / 5;
  if (i.prevOverall !== null && mean(star4(score4)) > i.prevOverall) {
    score4 += 10;
    parts4.push('+10 better than last run');
  }
  score4 = Math.max(0, Math.min(100, score4));
  const s4 = star4(score4);
  const l4 = `${score4} points${parts4.length ? ': 100 ' + parts4.join(' ') : ': no deductions'} → ${s4} stars`;

  const stars: StarLine[] = [
    { n: 1, name: 'Mission effectiveness', stars: s1, formula: l1 },
    { n: 2, name: 'Rescue value', stars: s2, formula: l2 },
    { n: 3, name: 'Cost efficiency', stars: s3, formula: l3 },
    { n: 4, name: 'Decision quality', stars: s4, formula: l4 },
    { n: 5, name: i.mode === 'coop' ? 'Teamwork' : 'Careful engineering', stars: s5, formula: l5 },
  ];
  return { passed, outcome: out, stars, overall: roundTo(mean(s4), 1), star4Score: score4, star5Score: score5 };
}

// ---------- why-chain (SPEC §7) ----------

export interface WhyItem {
  cause: string;
  effect: string;
  lever: string;
  sentence: string; // "[quantity] = X, threshold Y → consequence. Try: [lever]"
}

const CONSEQUENCE: Record<Requirement['id'], string> = {
  R1: 'for hours at a time nobody receives the SOS messages',
  R2: 'data piles up on the satellite and SOS messages arrive late',
  R3: 'the satellite may shut down during eclipse',
  R4: 'the satellite falls before the mission ends, or stays as space debris too long',
  R5: 'no budget left for incidents',
  R6: 'not ready before typhoon season',
  R7: 'the link drops easily when the satellite is low in the sky',
  R8: 'the satellite is missing required systems and cannot work',
};

const LEVER: Record<Requirement['id'], string> = {
  R1: 'add an orbital plane or change the inclination',
  R2: 'fit the S-band radio',
  R3: 'add solar wings or an extra battery',
  R4: 'change the altitude or fit a drag sail',
  R5: 'use fewer launches',
  R6: 'choose simpler parts',
  R7: 'change the radio band or the altitude',
  R8: 'fit OBC, EPS, ADCS, a transmitter and the SOS relay payload',
};

export function whyChain(m: MissionResult, decisions: EventDecision[]): WhyItem[] {
  const items: WhyItem[] = [];
  for (const r of m.reqs) {
    if (r.status === 'DAT') continue;
    const cause = `${r.name} = ${r.value}, limit ${r.limit}`;
    const effect = (r.status === 'VUOT' ? 'Not met: ' : 'Near the limit: ') + CONSEQUENCE[r.id];
    const lever = LEVER[r.id];
    items.push({ cause, effect, lever, sentence: `${cause} → ${effect}. Try: ${lever}` });
  }
  for (const d of decisions) {
    const chosen = d.outcomes.find((o) => o.key === d.chosen);
    const opt = d.event.options.find((o) => o.k === d.chosen);
    if (!chosen || !opt) continue;
    const best = d.outcomes.filter((o) => o.rank === 'best' && o.available);
    if (chosen.rank !== 'best' && best.length) {
      const cause = `${d.event.id} ${d.event.title}: chose ${d.chosen} — ${opt.text}`;
      const effect = `SOS delivered within 1 h: ${chosen.p1hDisplay}% instead of ${best[0].p1hDisplay}%, longest gap ${vn(chosen.longestGapH)} h`;
      const lever = `option ${best.map((b) => b.key).join('/')} gets the most SOS messages through`;
      items.push({ cause, effect, lever, sentence: `${cause} → ${effect}. Try: ${lever}` });
    }
  }
  return items;
}

// ---------- CML badge (SPEC §12) ----------

export interface CmlInput {
  contractAccepted: boolean;
  hardOk: boolean; // R8 and R5 (budget at signing) pass
  designChanges: number; // part/chassis/orbit decisions changed with the HUD visible
  reruns: number;
  launched: boolean;
  allPassed: boolean; // R1–R8 none VƯỢT (SÁT passes)
  specExported: boolean;
}

export const CML_TEXT: Record<1 | 2 | 3 | 4, string> = {
  1: 'Contract accepted',
  2: 'All hard limits pass (R8, budget at signing)',
  3: 'Changed ≥ 1 design decision after seeing the HUD, or reran ≥ 1 time',
  4: 'Launched with R1–R8 all passing and exported the spec sheet',
};

/** Highest Concept Maturity Level reached (0 = none). Cumulative: each level needs all lower ones (SPEC §12). */
export function cmlLevel(c: CmlInput): 0 | 1 | 2 | 3 | 4 {
  const met = [
    c.contractAccepted,
    c.hardOk,
    c.designChanges >= 1 || c.reruns >= 1,
    c.launched && c.allPassed && c.specExported,
  ];
  const n = met.findIndex((ok) => !ok);
  return (n === -1 ? 4 : n) as 0 | 1 | 2 | 3 | 4;
}
