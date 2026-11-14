import { useEffect, useRef } from 'react';
import { ROLES, ROLE_GROUPS, playerForRole } from '../state/roles';
import type { PlayerCount, RoleId } from '../state/store';
import { roleColor } from './roleColor';

interface Props {
  role: RoleId;
  count: PlayerCount;
  names: string[];
  text: string;
  onStart: () => void;
}

/** "Pass the device" screen before a role's turn (design/HF-Setup). */
export function PassScreen({ role, count, names, text, onStart }: Props) {
  const r = ROLES[role];
  const idx = playerForRole(count, role);
  const group = ROLE_GROUPS[count][idx] ?? [role];
  const ab = group.map((g) => ROLES[g].ab).join('+');
  const nick = names[idx]?.trim();
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    btn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onStart(); // Esc dismisses the pass-the-device gate
      if (e.key === 'Tab') {
        e.preventDefault(); // single action in this dialog: keep focus on it
        btn.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onStart]);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="pass-title">
      <span className="lbl" style={{ color: 'var(--amber)' }}>
        Chuyền máy
      </span>
      <div
        className="avatar"
        style={{ width: 96, height: 96, borderRadius: 48, fontSize: 'calc(28rem / 16)', background: roleColor(ROLES[group[0]].color) }}
        aria-hidden="true"
      >
        {ab}
      </div>
      <h2 id="pass-title">Đến lượt {r.name}</h2>
      {nick && (
        <div style={{ fontSize: 'calc(15rem / 16)', color: 'var(--muted)' }}>
          Người chơi {idx + 1} · {nick}
        </div>
      )}
      <div style={{ fontSize: 'calc(17rem / 16)', color: 'var(--soft)', maxWidth: 640, lineHeight: 1.6 }}>{text}</div>
      <button ref={btn} className="btn-p" style={{ minWidth: 'min(320px, 100%)' }} onClick={onStart}>
        Tôi là {r.name} — bắt đầu lượt
      </button>
    </div>
  );
}
