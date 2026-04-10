/**
 * Theme initialization script that runs BEFORE React hydration.
 * This prevents the flash of wrong theme and avoids useEffect timing issues.
 * Must be a module script that exports the init function.
 */
export function initTheme() {
  const STORAGE_KEY = 'pathboard-theme';
  const VALID_THEMES = ['dark', 'light'];

  function applyTheme(theme: string) {
    if (!VALID_THEMES.includes(theme)) theme = 'dark';
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      // localStorage may not be available
    }
  }

  // Read saved theme — default dark
  let saved = 'dark';
  try {
    saved = localStorage.getItem(STORAGE_KEY) || 'dark';
  } catch (e) {}

  applyTheme(saved);
}
