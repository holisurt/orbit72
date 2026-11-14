import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameData } from '../data/context';
import { useStore } from '../state/store';
import { guideTabs, type GuideItem } from '../ui/guide';
import { Mascot } from '../ui/Mascot';
import { useT } from '../ui/i18n';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

/** Sổ tay (design/HF-Guide): Thuật ngữ · Công thức · Science · Hồ sơ Rồng · Nguồn, with search across all tabs. */
export function Guide({ initialTab = 0, focus = null }: { initialTab?: number; focus?: string | null }) {
  const data = useGameData();
  const { dispatch } = useStore();
  const t = useT();
  const tabs = useMemo(() => guideTabs(data), [data]);
  const [tab, setTab] = useState(initialTab);
  const [q, setQ] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const close = () => dispatch({ type: 'closeGuide' });

  useEffect(() => {
    // From a "?" explainer: jump to that card; otherwise start on the close button.
    const card = focus ? document.querySelector<HTMLElement>(`[data-card="${CSS.escape(focus)}"]`) : null;
    if (card) {
      card.scrollIntoView({ block: 'center' });
      card.focus();
    } else closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dispatch({ type: 'closeGuide' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dispatch, focus]);

  const query = norm(q.trim());
  const cur = tabs[tab];
  const items: (GuideItem & { tab?: string })[] = query
    ? tabs.flatMap((tb) => tb.items.filter((it) => norm(`${it.t} ${it.d} ${it.s}`).includes(query)).map((it) => ({ ...it, tab: tb.n })))
    : cur.items;

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const n = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!n) return;
    e.preventDefault();
    const next = (i + n + tabs.length) % tabs.length;
    setTab(next);
    document.getElementById(`guide-tab-${next}`)?.focus();
  };

  return (
    <div className="screen">
      <header className="topbar">
        <span className="brand">
          ORBIT <span className="amber">72</span> <span className="sub">· Sổ tay Đội Rồng Con</span>
        </span>
        <button ref={closeRef} className="link-btn" onClick={close}>
          {t('close')} ✕
        </button>
      </header>
      <main className="body guide-body">
        <div className="col guide-side">
          <label htmlFor="guide-q" className="lbl">
            Tìm trong sổ tay
          </label>
          <input id="guide-q" type="text" value={q} placeholder="bóng tối, mặt phẳng, link budget…" onChange={(e) => setQ(e.target.value)} />
          <div className="guide-tabs" role="tablist" aria-label="Mục sổ tay" aria-orientation="vertical">
            {tabs.map((tb, i) => (
              <button
                key={tb.id}
                id={`guide-tab-${i}`}
                role="tab"
                aria-selected={!query && tab === i}
                aria-controls="guide-panel"
                tabIndex={tab === i ? 0 : -1}
                className="guide-tab"
                onClick={() => {
                  setTab(i);
                  setQ('');
                }}
                onKeyDown={(e) => onTabKey(e, i)}
              >
                {t(`tab_${tb.id}`)}
              </button>
            ))}
          </div>
          <div className="row guide-tip">
            <Mascot size={70} title="Rồng Con" />
            <span style={{ fontSize: 'calc(12rem / 16)', color: 'var(--muted)', lineHeight: 1.4 }}>{cur.tip}</span>
          </div>
        </div>
        <section id="guide-panel" role="tabpanel" aria-labelledby={query ? undefined : `guide-tab-${tab}`} aria-label={query ? 'Kết quả tìm' : undefined} className="col" style={{ gap: 10 }}>
          <span className="lbl" style={{ color: 'var(--amber)' }} aria-live="polite">
            {query ? `${items.length} kết quả cho “${q.trim()}”` : cur.head}
          </span>
          <div className="guide-grid">
            {items.map((it) => (
              <article
                key={`${it.tab ?? ''}${it.t}`}
                data-card={it.t}
                tabIndex={it.t === focus ? -1 : undefined}
                className={`panel col${it.t === focus ? ' guide-focus' : ''}`}
                style={{ padding: '12px 14px', gap: 5 }}
              >
                <h2 style={{ margin: 0, fontSize: 'calc(15rem / 16)', fontWeight: 800 }}>{it.t}</h2>
                <p className={it.mono ? 'mono' : undefined} style={{ margin: 0, fontSize: 'calc(13rem / 16)', lineHeight: 1.5, color: 'var(--soft)' }}>
                  {it.d}
                </p>
                {it.link && (
                  <span className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
                    {it.link.map((l) => (
                      <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="guide-link">
                        {l.text} ↗
                      </a>
                    ))}
                  </span>
                )}
                <span style={{ fontSize: 'calc(11rem / 16)', color: 'var(--dim)' }}>
                  {it.tab ? `${it.tab} · ` : ''}
                  {it.s}
                </span>
              </article>
            ))}
            {query && items.length === 0 && <p style={{ color: 'var(--muted)' }}>Không tìm thấy. Thử “pin”, “SSO”, “IMERG”…</p>}
          </div>
        </section>
      </main>
    </div>
  );
}
