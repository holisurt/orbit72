import { useState } from 'react';
import { useStore } from '../state/store';
import { useT } from './i18n';
import { useEnglishGate } from '../i18n';
import { SettingsDialog } from './SettingsDialog';

/** "? Sổ tay" and "⚙ Cài đặt" buttons shown in every screen header. */
export function HeaderTools() {
  const { dispatch } = useStore();
  const t = useT();
  useEnglishGate();
  const [open, setOpen] = useState(false);
  return (
    <div className="row header-tools">
      <button className="tool-btn" onClick={() => dispatch({ type: 'openGuide' })} aria-label={t('guide')}>
        <span aria-hidden="true" className="tool-q">
          ?
        </span>
        <span className="tool-label">{t('guide')}</span>
      </button>
      <button className="tool-btn" onClick={() => setOpen(true)} aria-label={t('settings')} aria-haspopup="dialog">
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5ZM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"
            transform="translate(-1 0)"
          />
        </svg>
        <span className="tool-label">{t('settings')}</span>
      </button>
      {open && <SettingsDialog onClose={() => setOpen(false)} />}
    </div>
  );
}
