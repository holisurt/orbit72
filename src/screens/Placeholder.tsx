import { useStore } from '../state/store';
import { TopBar } from '../ui/TopBar';

/** Screens not built yet (later checkpoints). */
export function Placeholder({ title, back }: { title: string; back: () => void }) {
  const { dispatch } = useStore();
  return (
    <div className="screen">
      <TopBar subtitle={title} />
      <main className="center-msg" style={{ minHeight: 0, flex: 1 }}>
        <div className="col" style={{ alignItems: 'center', gap: 16 }}>
          <h1 style={{ margin: 0 }}>{title}</h1>
          <p style={{ margin: 0 }}>This screen is under construction.</p>
          <div className="row">
            <button className="btn-s" onClick={back}>
              ← Back
            </button>
            <button className="btn-s" onClick={() => dispatch({ type: 'go', screen: 'home' })}>
              Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
