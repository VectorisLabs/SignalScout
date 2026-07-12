import { useEffect, useState } from "react";

const STORAGE_KEY = "signalscout-theme";

/** Shared light/dark control. Initialises from <html class> / localStorage so it
 *  stays in sync as the user moves between the landing and chat routes. */
export function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof document === "undefined") return false;
    if (document.documentElement.classList.contains("dark")) return true;
    try { return localStorage.getItem(STORAGE_KEY) === "dark"; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light"); } catch { /* ignore */ }
  }, [dark]);
  return { dark, toggle: () => setDark((value) => !value) };
}
