import { useEffect, useState } from 'react';
import { ROLES, ROLE_GROUPS, dealCards } from '../state/roles';
import { useStore, type PlayerCount } from '../state/store';
import { PassScreen } from '../ui/PassScreen';
import { TopBar } from '../ui/TopBar';
import { useT } from '../ui/i18n';
import { roleColor } from '../ui/roleColor';

const COUNTS: PlayerCount[] = [2, 3, 4];

export function Setup() {
  const { state, dispatch } = useStore();
  const t = useT();
  const { count, names, cards } = state.players;
  const groups = ROLE_GROUPS[count];
  const [open, setOpen] = useState<boolean[]>([false, false, false, false]);
  const [pass, setPass] = useState(false);

  // Deal secret priority cards (random a/b per role, SPEC §8) once per player count.
  useEffect(() => {
    if (!cards) dispatch({ type: 'dealCards', cards: dealCards() });
  }, [cards, dispatch]);

  return (
    <div className="screen">
      <TopBar
        subtitle="Mission control setup"
        right={
          <button className="link-btn" onClick={() => dispatch({ type: 'go', screen: 'home' })}>
            ← {t('home')}
          </button>
        }
      />
      <main className="body setup-body">
        <div className="col" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }} role="group" aria-label="Number of players">
            <span className="lbl">Number of players</span>
            {COUNTS.map((n) => (
              <button
                key={n}
                className="seg"
                style={{ minWidth: 56, fontSize: 'calc(15rem / 16)', fontWeight: 800 }}
                aria-pressed={count === n}
                onClick={() => {
                  setOpen([false, false, false, false]);
                  dispatch({ type: 'setPlayerCount', count: n });
                }}
              >
                {n}
              </button>
            ))}
            <span style={{ fontSize: 'calc(13rem / 16)', color: 'var(--muted)' }}>One shared device, passed around in turns</span>
          </div>
          <div className="players" style={{ gridTemplateColumns: `repeat(${groups.length}, minmax(0, 1fr))` }}>
            {groups.map((g, q) => {
              const col = roleColor(ROLES[g[0]].color);
              return (
                <section key={q} className="panel player" style={{ borderTop: `3px solid ${col}`, position: 'relative' }} aria-label={`Player ${q + 1}`}>
                  <div className="row" style={{ gap: 10 }}>
                    <div className="avatar" style={{ background: col, color: 'var(--bg)', fontWeight: 800, fontSize: 'calc(13rem / 16)' }} aria-hidden="true">
                      {g.map((k) => ROLES[k].ab).join('+')}
                    </div>
                    <div>
                      <div className="lbl" style={{ color: 'var(--muted)' }}>Player {q + 1}</div>
                      <div style={{ fontSize: 'calc(15rem / 16)', fontWeight: 800, lineHeight: 1.25, color: 'var(--text)' }}>
                        {g.map((k) => ROLES[k].name).join(' + ')}
                      </div>
                    </div>
                  </div>
                  <label className="lbl" htmlFor={`p${q}`}>
                    Nickname (no real names needed)
                  </label>
                  <input
                    id={`p${q}`}
                    type="text"
                    placeholder="e.g. Morning Star"
                    value={names[q] ?? ''}
                    autoComplete="off"
                    onChange={(e) => dispatch({ type: 'setPlayerName', index: q, name: e.target.value })}
                  />
                  <div style={{ fontSize: 'calc(13rem / 16)', lineHeight: 1.5, color: 'var(--soft)' }}>
                    {g.map((k) => ROLES[k].duty).join(' ')}
                  </div>
                  <div className="subtle col" style={{ marginTop: 'auto', gap: 6 }}>
                    <span className="lbl" style={{ color: 'var(--amber)' }}>
                      Secret priority card
                    </span>
                    <span style={{ fontSize: 'calc(13rem / 16)', lineHeight: 1.45 }} aria-live="polite">
                      {open[q] && cards ? g.map((k) => ROLES[k].cards[cards[k]]).join(' · ') : '▒▒▒▒▒▒▒▒ (face down)'}
                    </span>
                    <button
                      className="flip"
                      aria-pressed={open[q]}
                      onClick={() => setOpen((o) => o.map((v, i) => (i === q ? !v : v)))}
                    >
                      {open[q] ? 'Turn face down' : 'Flip card (only you look)'}
                    </button>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
        <aside className="panel col" style={{ padding: 16, gap: 12 }}>
          <span className="lbl">Shared-device rules</span>
          <ol style={{ margin: 0, paddingLeft: 18, fontSize: 'calc(13rem / 16)', lineHeight: 1.6, color: 'var(--soft)' }}>
            <li>Each player flips their priority card when nobody is looking, then turns it face down.</li>
            <li>When the screen says “Your turn …”, pass the device to the player with that role.</li>
            <li>Only that role’s player touches the controls; everyone watches the HUD.</li>
            <li>Before launch: Go/No-Go, every role answers GO or NO-GO.</li>
            <li>Argue about the numbers, not about people.</li>
          </ol>
          <div className="subtle" style={{ fontSize: 'calc(12rem / 16)', lineHeight: 1.5, color: 'var(--muted)' }}>
            Each priority card met: +20 on star 5 · unanimous Go/No-Go: +20.
          </div>
          <button className="btn-p ghost" onClick={() => setPass(true)}>
            {t('passScreen')}
          </button>
          <button className="btn-p" style={{ marginTop: 'auto' }} onClick={() => dispatch({ type: 'go', screen: state.quiz.pre === null ? 'quiz_pre' : 'brief' })}>
            {t('acceptContract')} →
          </button>
        </aside>
      </main>
      {pass && (
        <PassScreen
          role="QD"
          count={count}
          names={names}
          text="Everyone else puts the device down. You choose the inclination, altitude, number of planes and the launcher; the team HUD stays visible for everyone."
          onStart={() => setPass(false)}
        />
      )}
    </div>
  );
}
