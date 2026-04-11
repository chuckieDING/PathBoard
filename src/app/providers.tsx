'use client';

import { createContext, useContext, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';

const STORAGE_KEY = 'pathboard-theme';

const ThemeContext = createContext<{
  theme: Theme;
  toggle: () => void;
}>({ theme: 'dark', toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    // Update DOM immediately (synchronous, before React re-render)
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    // Update React state (async, triggers re-render)
    setTheme(next);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
