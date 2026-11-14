// Scoring — SPEC §7 (five stars, outcome, why-chain), §8 (priority cards), §12 (CML badge).
import type { GameEvent } from '../data/types';
import type { MissionResult, Requirement } from './mission';
import { roundTo } from './mission';
import type { ImagingResult, OptionOutcome, Rank } from './ops';

const vn = (x: number, d = 1) => roundTo(x, d).toFixed(d).replace('.', ',');

// ---------- outcome ----------

export type Outcome = 'THANH_CONG' | 'MOT_PHAN' | 'THAT_BAI';
export const OUTCOME_LABEL: Record<Outcome, string> = {
  THANH_CONG: 'THÀNH CÔNG',
  MOT_PHAN: 'MỘT PHẦN',
  THAT_BAI: 'THẤT BẠI',
};

/** R passes unless VƯỢT (SÁT is a pass, near the limit). */
export function requirementsPassed(reqs: Requirement[]): number {
  return reqs.filter((r) => r.status !== 'VUOT').length;
}

/** THÀNH CÔNG (8/8 and in orbit) · MỘT PHẦN (≥ 6/8) · THẤT BẠI. */
export function outcome(passed: number, inOrbit: boolean): Outcome {
  if (passed === 8 && inOrbit) return 'THANH_CONG';
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
export const MIN_IMAGING_PASSES = 3;

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
  const payloads = m.build.parts.filter((p) => p.cat === 'pay').length;
  const gap = m.coverage ? roundTo(m.coverage.longestGapH, 1) : Infinity;
  const p1h = m.coverage ? roundTo(m.coverage.p1h, 1) : 0;
  const minMargin = m.links.length ? Math.min(...m.links.map((l) => roundTo(l.margin10, 1))) : -Infinity;
  const pm = roundTo(powerMarginPct(m), 1);
  const check: Record<RoleId, Record<CardSide, () => [boolean, string]>> = {
    FD: {
      a: () => [m.totalCostKusd <= 0.9 * m.budgetKusd, `${Math.round((100 * m.totalCostKusd) / m.budgetKusd)}% ngân sách`],
      b: () => [m.budgetKusd - m.totalCostKusd >= 200, `dự phòng ${Math.round(m.budgetKusd - m.totalCostKusd)}k`],
    },
    VT: {
      a: () => [pm >= 20, `dư ${vn(pm)}%`],
      b: () => [m.envTest, m.envTest ? 'có thử nghiệm' : 'không thử nghiệm'],
    },
    KH: {
      a: () => [payloads >= 2, `${payloads} payload`],
      b: () => [p1h >= 55, `P1h ${vn(p1h, 0)}%`],
    },
    QD: {
      a: () => [gap <= 3.0, `${vn(gap)} h`],
      b: () => [minMargin >= 6, `biên nhỏ nhất ${vn(minMargin)} dB`],
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
  inOrbit: boolean;
  p1hRainOps: number; // after events (star 2)
  p1hRainNominal: number; // no events (star 3: events affect only stars 2 and 4)
  imaging: ImagingResult;
  launchedWithVuot: boolean;
  launchedWithNoGo: boolean;
  decisions: EventDecision[];
  decisionPenalty: number; // explicit penalties, e.g. E4-B
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
  const out = outcome(passed, i.inOrbit);

  // Star 1
  const s1 = Math.round((5 * passed) / 8);
  const l1 = `R1–R8: ${passed}/8 đạt → làm tròn(5 × ${passed}/8) = ${s1}`;

  // Star 2
  const base2 = starsFromP1h(i.p1hRainOps);
  const img = i.imaging.eligible && i.imaging.valid >= MIN_IMAGING_PASSES;
  const s2 = Math.min(5, base2 + (img ? 1 : 0));
  const l2 =
    `P1h_mưa sau sự cố = ${vn(i.p1hRainOps)}% → ${base2} sao` +
    (i.imaging.eligible ? ` · ảnh lũ hợp lệ ${i.imaging.valid}/${MIN_IMAGING_PASSES}${img ? ' → +1' : ''}` : '');

  // Star 3 (nominal, events excluded)
  const costM = m.totalCostKusd / 1000;
  const vfm = costM > 0 ? i.p1hRainNominal / costM : 0;
  const s3 = starsFromVfm(vfm);
  const l3 = `VFM = ${vn(i.p1hRainNominal)} / ${vn(costM, 2)} = ${vn(vfm)} → ${s3} sao`;

  // Star 5
  let s5: number;
  let score5: number;
  let l5: string;
  if (i.mode === 'coop') {
    const met = (i.cards ?? []).filter((c) => c.met).length;
    score5 = 20 * met + (i.unanimousGo ? 20 : 0);
    s5 = Math.max(1, Math.ceil(score5 / 20));
    l5 = `Thẻ ưu tiên ${met}/${(i.cards ?? []).length} × 20${i.unanimousGo ? ' + 20 đồng thuận' : ''} = ${score5} → ${s5} sao`;
  } else {
    const env = m.envTest;
    const pm = roundTo(powerMarginPct(m), 1) >= 20;
    const bm = roundTo(budgetMarginPct(m), 1) >= 5;
    score5 = (env ? 40 : 0) + (pm ? 30 : 0) + (bm ? 30 : 0);
    s5 = Math.max(1, Math.ceil(score5 / 20));
    l5 = `Thử nghiệm ${env ? 40 : 0} + dư công suất ≥ 20% ${pm ? 30 : 0} + dự phòng ngân sách ≥ 5% ${bm ? 30 : 0} = ${score5} → ${s5} sao`;
  }

  // Star 4
  let score4 = 100;
  const parts4: string[] = [];
  if (i.launchedWithVuot) {
    score4 -= 25;
    parts4.push('−25 phóng khi có VƯỢT');
  }
  if (i.launchedWithNoGo) {
    score4 -= 10;
    parts4.push('−10 phóng khi có NO-GO');
  }
  for (const d of i.decisions) {
    const rank = d.outcomes.find((o) => o.key === d.chosen)?.rank ?? 'best';
    const pen = d.event.options.find((o) => o.k === d.chosen)?.effect.decisionPenalty ? 0 : RANK_PENALTY[rank];
    if (pen) {
      score4 -= pen;
      parts4.push(`−${pen} ${d.event.id}-${d.chosen}`);
    }
  }
  if (i.decisionPenalty) {
    score4 -= i.decisionPenalty;
    parts4.push(`−${i.decisionPenalty} quyết định rủi ro`);
  }
  const star4 = (s: number) => Math.max(1, Math.ceil(Math.max(0, Math.min(100, s)) / 20));
  const mean = (s4: number) => (s1 + s2 + s3 + s4 + s5) / 5;
  if (i.prevOverall !== null && mean(star4(score4)) > i.prevOverall) {
    score4 += 10;
    parts4.push('+10 tốt hơn lần trước');
  }
  score4 = Math.max(0, Math.min(100, score4));
  const s4 = star4(score4);
  const l4 = `${score4} điểm${parts4.length ? ': 100 ' + parts4.join(' ') : ': không bị trừ'} → ${s4} sao`;

  const stars: StarLine[] = [
    { n: 1, name: 'Hiệu quả sứ mệnh', stars: s1, formula: l1 },
    { n: 2, name: 'Giá trị cứu hộ', stars: s2, formula: l2 },
    { n: 3, name: 'Hiệu quả chi phí', stars: s3, formula: l3 },
    { n: 4, name: 'Chất lượng quyết định', stars: s4, formula: l4 },
    { n: 5, name: i.mode === 'coop' ? 'Phối hợp đội' : 'Kỹ thuật cẩn trọng', stars: s5, formula: l5 },
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
  R1: 'có lúc nhiều giờ liền không ai nhận được tin SOS',
  R2: 'dữ liệu tồn đọng trên vệ tinh, tin SOS về muộn',
  R3: 'vệ tinh có thể sập nguồn khi vào bóng Trái Đất',
  R4: 'vệ tinh rơi trước khi hết nhiệm vụ hoặc thành rác vũ trụ quá lâu',
  R5: 'không còn dự phòng ngân sách cho sự cố',
  R6: 'không kịp sẵn sàng trước mùa bão',
  R7: 'đường truyền dễ rớt khi vệ tinh thấp trên chân trời',
  R8: 'vệ tinh thiếu hệ thống bắt buộc, không thể hoạt động',
};

const LEVER: Record<Requirement['id'], string> = {
  R1: 'thêm mặt phẳng quỹ đạo hoặc đổi độ nghiêng',
  R2: 'lắp S-band',
  R3: 'thêm cánh pin hoặc pin bổ sung',
  R4: 'đổi độ cao hoặc lắp cánh hãm khí quyển',
  R5: 'bớt số chuyến phóng',
  R6: 'chọn linh kiện đơn giản hơn',
  R7: 'đổi băng tần hoặc độ cao',
  R8: 'lắp đủ OBC, EPS, ADCS, máy phát và payload SOS',
};

export function whyChain(m: MissionResult, decisions: EventDecision[]): WhyItem[] {
  const items: WhyItem[] = [];
  for (const r of m.reqs) {
    if (r.status === 'DAT') continue;
    const cause = `${r.name} = ${r.value}, ngưỡng ${r.limit}`;
    const effect = (r.status === 'VUOT' ? 'Không đạt: ' : 'Sát ngưỡng: ') + CONSEQUENCE[r.id];
    const lever = LEVER[r.id];
    items.push({ cause, effect, lever, sentence: `${cause} → ${effect}. Thử: ${lever}` });
  }
  for (const d of decisions) {
    const chosen = d.outcomes.find((o) => o.key === d.chosen);
    const opt = d.event.options.find((o) => o.k === d.chosen);
    if (!chosen || !opt) continue;
    const best = d.outcomes.filter((o) => o.rank === 'best' && o.available);
    if (opt.effect.decisionPenalty) {
      const cause = `${d.event.id} ${d.event.title}: chọn ${d.chosen} — ${opt.text}`;
      const effect = `Không mất liên lạc nhưng chấp nhận rủi ro, trừ ${opt.effect.decisionPenalty} điểm sao 4`;
      const lever = 'lắp động cơ điện nhỏ để có thể né';
      items.push({ cause, effect, lever, sentence: `${cause} → ${effect}. Thử: ${lever}` });
    } else if (chosen.rank !== 'best' && best.length) {
      const cause = `${d.event.id} ${d.event.title}: chọn ${d.chosen} — ${opt.text}`;
      const effect = `P1h ${chosen.p1hDisplay}% thay vì ${best[0].p1hDisplay}%, khoảng trống ${vn(chosen.longestGapH)} h`;
      const lever = `phương án ${best.map((b) => b.key).join('/')} giữ P1h cao nhất`;
      items.push({ cause, effect, lever, sentence: `${cause} → ${effect}. Thử: ${lever}` });
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
  1: 'Đã nhận hợp đồng',
  2: 'Mọi ràng buộc cứng đạt (R8, ngân sách khi ký)',
  3: 'Đã đổi ≥ 1 quyết định thiết kế sau khi xem HUD, hoặc chạy lại ≥ 1 lần',
  4: 'Phóng với R1–R8 đều đạt và đã xuất spec sheet',
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
