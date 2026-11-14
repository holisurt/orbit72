// Share card logic (pure): phase squares, header, run line.
import type { DifficultyId } from '../data/types';
import { worst, type MissionResult, type Status } from '../sim/mission';
import type { Outcome } from '../sim/score';
import type { LaunchRecord } from '../state/store';
import { fmt } from './format';

export const LEVEL_NAME: Record<DifficultyId, string> = { hoc_vien: 'HỌC VIÊN', ky_su: 'KỸ SƯ', giam_doc: 'GIÁM ĐỐC' };
export const PHASES = ['Nhiệm vụ', 'Ráp', 'Quỹ đạo', 'Go/No-Go', 'Vận hành', 'Báo cáo'] as const;

/** Star rating → colour class: ≥ 4 green (ĐẠT), 3 yellow (SÁT), ≤ 2 red (VƯỢT). */
export function starStatus(stars: number): Status {
  return stars >= 4 ? 'DAT' : stars >= 3 ? 'SAT' : 'VUOT';
}

export function outcomeStatus(o: Outcome): Status {
  return o === 'THANH_CONG' ? 'DAT' : o === 'MOT_PHAN' ? 'SAT' : 'VUOT';
}

/**
 * Six phase squares, each coloured by that phase's own result:
 * Nhiệm vụ = hard constraints at signing (R5, R8) · Ráp = R2, R3, R6, R8 · Quỹ đạo = R1, R4, R5, R7 ·
 * Go/No-Go = vote (4/4 GO green, launched over a NO-GO red, else yellow) · Vận hành = Star 2 · Báo cáo = outcome.
 */
export function phaseSquares(m: MissionResult, launch: LaunchRecord | null, star2: number, out: Outcome): Status[] {
  const st = (ids: string[]) => worst(...m.reqs.filter((r) => ids.includes(r.id)).map((r) => r.status));
  return [
    st(['R5', 'R8']),
    st(['R2', 'R3', 'R6', 'R8']),
    st(['R1', 'R4', 'R5', 'R7']),
    launch?.unanimousGo ? 'DAT' : launch?.launchedWithNoGo ? 'VUOT' : 'SAT',
    starStatus(star2),
    outcomeStatus(out),
  ];
}

/** Card header: mission number only in Daily mode, otherwise scenario · difficulty. */
export function cardHeader(daily: boolean, missionNo: string, scenarioName: string, difficulty: DifficultyId): string {
  return daily ? `NHIỆM VỤ HÔM NAY #${missionNo}` : `${scenarioName.toUpperCase()} · ${LEVEL_NAME[difficulty]}`;
}

/** One line from the run, e.g. "4 mặt phẳng → khoảng trống 3,0 h" (nominal design, R1). */
export function runLine(m: MissionResult): string {
  const o = m.orbit;
  const planes = `${o.planes} mặt phẳng${o.perPlane > 1 ? ` × ${o.perPlane}` : ''}`;
  return m.coverage ? `${planes} → khoảng trống ${fmt(m.coverage.longestGapH, 1)} h` : `${planes} · ${m.satCount} vệ tinh`;
}
