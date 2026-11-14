// Display settings (language of menus/buttons, text size, contrast, motion), saved separately from game
// progress (key orbit72.settings) so "Xóa tiến trình" keeps them. No personal data.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Lang } from '../ui/i18n';

export const SETTINGS_KEY = 'orbit72.settings';
export type TextScale = 100 | 125 | 150;

export interface Settings {
  lang: Lang;
  textScale: TextScale;
  highContrast: boolean;
  reduceMotion: boolean;
}

export const DEFAULT_SETTINGS: Settings = { lang: 'vi', textScale: 100, highContrast: false, reduceMotion: false };

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const p = JSON.parse(raw) as Partial<Settings>;
    return {
      lang: p.lang === 'en' ? 'en' : 'vi',
      textScale: p.textScale === 125 || p.textScale === 150 ? p.textScale : 100,
      highContrast: !!p.highContrast,
      reduceMotion: !!p.reduceMotion,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Reflect settings on <html>: root font size (all text uses rem), data-contrast, data-motion, data-lang.
 * <html lang> stays "vi" because body text is always Vietnamese (only menus/buttons switch).
 */
export function applySettings(s: Settings, root: HTMLElement = document.documentElement): void {
  root.dataset.lang = s.lang;
  root.style.fontSize = `${s.textScale}%`;
  root.dataset.text = String(s.textScale); // lets CSS widen fixed side columns for enlarged text
  if (s.highContrast) root.dataset.contrast = 'high';
  else delete root.dataset.contrast;
  if (s.reduceMotion) root.dataset.motion = 'reduce';
  else delete root.dataset.motion;
}

interface Ctx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<Ctx>({ settings: DEFAULT_SETTINGS, update: () => {} });

export function SettingsProvider({ children, initial }: { children: ReactNode; initial?: Settings }) {
  const [settings, setSettings] = useState<Settings>(() => initial ?? loadSettings());
  useEffect(() => {
    applySettings(settings);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      /* storage unavailable */
    }
  }, [settings]);
  return (
    <SettingsContext.Provider value={{ settings, update: (patch) => setSettings((s) => ({ ...s, ...patch })) }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): Ctx {
  return useContext(SettingsContext);
}

/** True when the player turned motion off or the device asks for reduced motion. */
export function useReducedMotion(): boolean {
  const { settings } = useSettings();
  const [prefers, setPrefers] = useState(false);
  useEffect(() => {
    const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    if (!mq) return;
    setPrefers(mq.matches);
    const on = (e: MediaQueryListEvent) => setPrefers(e.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return settings.reduceMotion || prefers;
}
