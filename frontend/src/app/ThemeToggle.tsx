import { useTheme } from "./useTheme";

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return <button onClick={toggle} aria-label="Toggle color theme" className="shrink-0 grid place-items-center w-9 h-9 rounded-xl border border-line dark:border-dline text-muted dark:text-white/60 hover:text-ink dark:hover:text-white cursor-pointer transition-colors">
    {dark
      ? <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path strokeLinecap="round" d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" /></svg>}
  </button>;
}
