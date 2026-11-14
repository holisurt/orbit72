import { useStore } from '../state/store';
import { useT } from './i18n';

/** "? Sổ tay" button shown in every screen header. */
export function HeaderTools() {
  const { dispatch } = useStore();
  const t = useT();
  return (
    <div className="row header-tools">
      <button className="tool-btn" onClick={() => dispatch({ type: 'openGuide' })} aria-label={t('guide')}>
        <span aria-hidden="true" className="tool-q">
          ?
        </span>
        <span className="tool-label">{t('guide')}</span>
      </button>
    </div>
  );
}
