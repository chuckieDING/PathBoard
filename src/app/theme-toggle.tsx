'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'pathboard-theme';

function getTheme(): 'dark' | 'light' {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function applyTheme(theme: 'dark' | 'light') {
  document.documentElement.classList.remove('dark', 'light');
  document.documentElement.classList.add(theme);
  try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
}

export function ThemeToggle() {
  const [label, setLabel] = useState('☀️ 浅色');

  useEffect(() => {
    // Init label from current theme (set by inline script in <head>)
    setLabel(getTheme() === 'dark' ? '☀️ 浅色' : '🌙 深色');

    // Bind a persistent onclick using addEventListener on the button itself
    // This avoids React's event delegation system entirely
    const btn = document.getElementById('theme-toggle-btn') as HTMLButtonElement | null;
    if (!btn) return;

    const handler = () => {
      const next: 'dark' | 'light' = getTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      setLabel(next === 'dark' ? '☀️ 浅色' : '🌙 深色');
    };

    btn.addEventListener('click', handler);
    return () => btn.removeEventListener('click', handler);
  }, []);

  return (
    <button
      id="theme-toggle-btn"
      className="ml-4 text-xs px-3 py-1.5 rounded-full border transition-colors"
      style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
    >
      {label}
    </button>
  );
}
