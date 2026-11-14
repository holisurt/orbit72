import { canJump, useStore, type ScreenId } from '../state/store';

const STEPS: { n: number; label: string; screen: ScreenId }[] = [
  { n: 1, label: 'Nhiệm vụ', screen: 'brief' },
  { n: 2, label: 'Ráp', screen: 'build' },
  { n: 3, label: 'Quỹ đạo', screen: 'orbit' },
  { n: 4, label: 'Go/No-Go', screen: 'review' },
  { n: 5, label: 'Vận hành', screen: 'ops' },
  { n: 6, label: 'Báo cáo', screen: 'debrief' },
];

/** Mission progress pills. Brief/Build/Orbit are clickable before launch (SPEC §1). */
export function Stepper({ current }: { current: ScreenId }) {
  const { state, dispatch } = useStore();
  return (
    <nav aria-label="Tiến trình sứ mệnh">
      <ol className="stepper">
        {STEPS.map((s) => {
          const active = s.screen === current;
          const text = `${s.n} ${s.label}`;
          const jumpable = !active && canJump(current, s.screen) && state.contract.accepted;
          return (
            <li key={s.n}>
              {jumpable ? (
                <button className="step" onClick={() => dispatch({ type: 'go', screen: s.screen })}>
                  {text}
                </button>
              ) : (
                <span className="step" aria-current={active ? 'step' : undefined}>
                  {text}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
