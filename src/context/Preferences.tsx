import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { readStorage, writeStorage } from '../lib/storage';

type Theme = 'light' | 'dark' | 'system';
interface Values { theme: Theme; mascot: boolean; reducedMotion: boolean; fontSize: number; focus: boolean }
interface Preferences extends Values {
  resolvedTheme: 'light' | 'dark';
  update: (value: Partial<Values>) => void;
  toggleTheme: () => void;
}
const defaults: Values = { theme: 'system', mascot: true, reducedMotion: false, fontSize: 17, focus: false };
const Context = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<Values>(defaults);
  const [systemDark, setSystemDark] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const candidate = readStorage<Partial<Values> | null>('haven-preferences', {});
    const stored = candidate && typeof candidate === 'object' ? candidate : {};
    setValues({
      theme: ['system', 'light', 'dark'].includes(stored.theme || '') ? stored.theme! : 'system',
      mascot: stored.mascot !== false, reducedMotion: stored.reducedMotion === true,
      fontSize: Math.max(15, Math.min(22, Number(stored.fontSize) || 17)), focus: false,
    });
    const media = matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(media.matches);
    const change = () => setSystemDark(media.matches);
    media.addEventListener('change', change);
    setReady(true);
    return () => media.removeEventListener('change', change);
  }, []);
  const resolvedTheme = values.theme === 'system' ? (systemDark ? 'dark' : 'light') : values.theme;
  useEffect(() => {
    if (!ready) return;
    writeStorage('haven-preferences', values);
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.motion = values.reducedMotion ? 'reduce' : 'normal';
    document.documentElement.style.setProperty('--reading-size', `${values.fontSize}px`);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolvedTheme === 'dark' ? '#182127' : '#f7f5ef');
  }, [values, ready, resolvedTheme]);
  const update = useCallback((part: Partial<Values>) => { setValues(current => ({ ...current, ...part })); }, []);
  return <Context.Provider value={{ ...values, resolvedTheme, update, toggleTheme: () => update({ theme: resolvedTheme === 'dark' ? 'light' : 'dark' }) }}>{children}</Context.Provider>;
}
export function usePreferences() {
  const context = useContext(Context);
  if (!context) throw new Error('PreferencesProvider missing');
  return context;
}
