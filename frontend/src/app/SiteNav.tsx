import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

const links = [["Product", "#product"], ["How it works", "#how"], ["Evidence", "#showcase"], ["Trust", "#trust"]] as const;

export function SiteNav() {
  return <header className="sticky top-0 z-30 border-b border-line/80 dark:border-dline/80 bg-canvas/80 dark:bg-dcanvas/80 backdrop-blur-xl">
    <div className="mx-auto max-w-shell px-5 h-[68px] flex items-center gap-6">
      <a href="#top" className="flex items-center gap-2.5 shrink-0" aria-label="signalScout home"><span className="grid place-items-center w-9 h-9 rounded-xl bg-forest text-lime font-display font-extrabold text-xs">SC</span><strong className="font-display tracking-tight hidden sm:block">signalScout</strong></a>
      <nav aria-label="Primary navigation" className="flex-1 flex items-center gap-6 overflow-x-auto no-scrollbar text-sm font-semibold text-muted dark:text-white/55">
        {links.map(([label, href]) => <a key={href} href={href} className="whitespace-nowrap hover:text-ink dark:hover:text-white transition-colors">{label}</a>)}
        <Link to="/dashboard" className="whitespace-nowrap hover:text-ink dark:hover:text-white transition-colors">Dashboard</Link>
      </nav>
      <ThemeToggle />
      <Link to="/chat" className="shrink-0 inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-forest text-white text-sm font-bold hover:bg-green2 cursor-pointer transition-colors">
        Open signalScout
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" /></svg>
      </Link>
    </div>
  </header>;
}
