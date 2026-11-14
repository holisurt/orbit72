import { useState } from 'react';
import { useSettings, type TextScale } from '../state/settings';
import { useStore } from '../state/store';
import { useT } from './i18n';
import { Modal } from './Modal';

const SCALES: TextScale[] = [100, 125, 150];

/** Settings (gear in the header): VI/EN menus, text size, high contrast, reduced motion, reset progress. */
export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { settings, update } = useSettings();
  const { dispatch } = useStore();
  const t = useT();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <Modal labelledBy="settings-title" onClose={onClose} className="settings-card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 id="settings-title" style={{ margin: 0, fontSize: 'calc(20rem / 16)', fontWeight: 800 }}>
          {t('settings')}
        </h2>
        <button className="chip" onClick={onClose}>
          {t('close')} ✕
        </button>
      </div>

      <div className="settings-row" role="group" aria-labelledby="set-lang">
        <span id="set-lang" className="lbl">
          {t('language')}
        </span>
        <div className="row" style={{ gap: 6 }}>
          {(['vi', 'en'] as const).map((l) => (
            <button key={l} className="seg" lang={l} aria-pressed={settings.lang === l} onClick={() => update({ lang: l })}>
              {l === 'vi' ? 'Tiếng Việt' : 'English'}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-row" role="group" aria-labelledby="set-size">
        <span id="set-size" className="lbl">
          {t('textSize')}
        </span>
        <div className="row" style={{ gap: 6 }}>
          {SCALES.map((s) => (
            <button key={s} className="seg" aria-pressed={settings.textScale === s} onClick={() => update({ textScale: s })}>
              {s}%
            </button>
          ))}
        </div>
      </div>

      <div className="settings-row">
        <span id="set-contrast" className="lbl">
          {t('highContrast')}
        </span>
        <button className="seg" role="switch" aria-checked={settings.highContrast} aria-labelledby="set-contrast" onClick={() => update({ highContrast: !settings.highContrast })}>
          {settings.highContrast ? t('on') : t('off')}
        </button>
      </div>

      <div className="settings-row">
        <span id="set-motion" className="lbl">
          {t('reduceMotion')}
        </span>
        <button className="seg" role="switch" aria-checked={settings.reduceMotion} aria-labelledby="set-motion" onClick={() => update({ reduceMotion: !settings.reduceMotion })}>
          {settings.reduceMotion ? t('on') : t('off')}
        </button>
      </div>
      <span style={{ fontSize: 'calc(12rem / 16)', color: 'var(--dim)' }}>Tự giảm chuyển động khi thiết bị đã bật “giảm chuyển động”.</span>

      <div className="settings-row" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
        <span className="lbl" style={{ color: 'var(--bad)' }}>
          {t('resetProgress')}
        </span>
        {!confirming ? (
          <button className="btn-s" onClick={() => setConfirming(true)}>
            {t('resetProgress')}…
          </button>
        ) : (
          <div className="col" style={{ gap: 8 }} role="alertdialog" aria-labelledby="reset-q">
            <span id="reset-q" style={{ fontSize: 'calc(13rem / 16)' }}>
              Xóa thiết kế, kết quả các lần chạy và quiz trên máy này? Không thể hoàn tác. Cài đặt hiển thị được giữ lại.
            </span>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn-s" onClick={() => setConfirming(false)} autoFocus>
                {t('cancel')}
              </button>
              <button
                className="btn-p danger"
                onClick={() => {
                  dispatch({ type: 'reset' });
                  setConfirming(false);
                  setDone(true);
                }}
              >
                {t('resetConfirm')}
              </button>
            </div>
          </div>
        )}
      </div>
      <span role="status" style={{ fontSize: 'calc(12rem / 16)', color: 'var(--muted)' }}>
        {done ? 'Đã xóa tiến trình.' : ''}
      </span>
    </Modal>
  );
}
