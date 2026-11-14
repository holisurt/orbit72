import { useState } from 'react';

const KEY = 'orbit72.rotateHintClosed';

/** "Turn your phone sideways" — visible only in portrait on phones (CSS), dismissible for the session. */
export function RotateHint() {
  const [closed, setClosed] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });
  if (closed) return null;
  return (
    <div className="rotate-hint" role="note">
      <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="7" y="2" width="10" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="2" transform="rotate(-90 12 12)" />
        <path d="M4 8 A9 9 0 0 1 12 3 M12 3 l-2 -1 M12 3 l-1 2" fill="none" stroke="#F5A524" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span style={{ flex: 1 }}>Turn your phone sideways for a better view</span>
      <button
        className="chip"
        aria-label="Hide the rotate hint"
        onClick={() => {
          setClosed(true);
          try {
            sessionStorage.setItem(KEY, '1');
          } catch {
            /* ignore */
          }
        }}
      >
        ✕
      </button>
    </div>
  );
}
