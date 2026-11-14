import { canJump, useStore, type ScreenId } from '../state/store';
import { useT, type TKey } from './i18n';

const STEPS: { n: number; label: TKey; screen: ScreenId }[] = [
  { n: 1, label: 'stepBrief', screen: 'brief' },
  { n: 2, label: 'stepBuild', screen: 'build' },
  { n: 3, label: 'stepOrbit', screen: 'orbit' },
  { n: 4, label: 'stepReview', screen: 'review' },
  { n: 5, label: 'stepOps', screen: 'ops' },
  { n: 6, label: 'stepDebrief', screen: 'debrief' },
];

/** Mission progress pills. Brief/Build/Orbit are clickable before launch (SPEC §1). */
export function Stepper({ current }: { current: ScreenId }) {
  const { state, dispatch } = useStore();
  const t = useT();
  return (
    <nav aria-label="Tiến trình sứ mệnh">
      <ol className="stepper">
        {STEPS.map((s) => {
          const active = s.screen === current;
          const text = `${s.n} ${t(s.label)}`;
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
