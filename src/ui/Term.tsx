import { useEffect, useId, useState, type ReactNode } from 'react';
import { useStore } from '../state/store';
import { TERMS, type TermId } from './labels';

/**
 * A technical term with a "?" explainer: one sentence a 16-year-old understands, plus a link to the Guide card.
 * The "?" is a disclosure button (aria-expanded); Esc closes the explanation.
 */
export function Term({ id, children }: { id: TermId; children: ReactNode }) {
  const { dispatch } = useStore();
  const [open, setOpen] = useState(false);
  const pop = useId();
  const term = TERMS[id];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <span className="term">
      {children}
      <button
        type="button"
        className="term-q"
        aria-expanded={open}
        aria-controls={pop}
        aria-label={`Explain: ${typeof children === 'string' ? children : term.card}`}
        onClick={() => setOpen((v) => !v)}
      >
        ?
      </button>
      {open && (
        <span id={pop} className="term-pop" role="note">
          {term.text}{' '}
          <button type="button" className="link-btn term-link" onClick={() => dispatch({ type: 'openGuide', tab: term.tab, focus: term.card })}>
            See the Handbook →
          </button>
        </span>
      )}
    </span>
  );
}
