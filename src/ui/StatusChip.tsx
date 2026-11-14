import { STATUS_LABEL, type Status } from '../sim/mission';

/** Status as text + colour (CLAUDE.md rule 5): ĐẠT / SÁT / VƯỢT. */
export function StatusChip({ status, label }: { status: Status; label?: string }) {
  return <span className={`status ${status}`}>{label ?? STATUS_LABEL[status]}</span>;
}

export const STATUS_COLOR: Record<Status, string> = {
  DAT: 'var(--ok)',
  SAT: 'var(--warn)',
  VUOT: 'var(--bad)',
};
