'use client';

import Link from 'next/link';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/', label: '看板' },
  { href: '/knowledge', label: '知识库' },
  { href: '/guidelines', label: '指南' },
  { href: '/literature', label: '文献' },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--nav-bg)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Desktop / Mobile shared row */}
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>🧬 PathBoard</span>

          {/* Desktop nav — hidden on mobile */}
          <div className="hidden sm:flex items-center gap-6 text-sm">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                style={{ color: 'var(--muted)' }}
                className="nav-link"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger — shown only on small screens */}
            <button
              className="sm:hidden flex flex-col justify-center items-center w-9 h-9 gap-1.5 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', backgroundColor: 'transparent' }}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="菜单"
            >
              <span
                className="block w-5 h-0.5 rounded-full transition-all"
                style={{ backgroundColor: 'var(--foreground)', transform: menuOpen ? 'rotate(45deg) translateY(4px)' : 'none' }}
              />
              <span
                className="block w-5 h-0.5 rounded-full transition-all"
                style={{ backgroundColor: 'var(--foreground)', opacity: menuOpen ? 0 : 1 }}
              />
              <span
                className="block w-5 h-0.5 rounded-full transition-all"
                style={{ backgroundColor: 'var(--foreground)', transform: menuOpen ? 'rotate(-45deg) translateY(-4px)' : 'none' }}
              />
            </button>

            {/* Theme toggle */}
            <label htmlFor="theme-toggle" className="theme-toggle-label" title="切换亮/暗模式">
              <svg className="theme-icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
              <svg className="theme-icon-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </label>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div
            className="sm:hidden border-t py-3 space-y-1"
            style={{ borderColor: 'var(--border)' }}
          >
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="block px-2 py-3 text-sm rounded-lg transition-colors"
                style={{ color: 'var(--muted)' }}
                onClick={() => setMenuOpen(false)}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
              >
                {label}
              </Link>
            ))}
            <div className="pt-2 px-2 text-xs" style={{ color: 'var(--muted)' }}>
              病理科 AI 学习系统
            </div>
          </div>
        )}
      </div>

      <style>{`
        .nav-link {
          transition: color 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .nav-link:hover {
          color: var(--foreground) !important;
        }
      `}</style>
    </nav>
  );
}
