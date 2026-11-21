import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";
const STORAGE_KEY = "rdc-theme";
const THEME_COLOR: Record<Theme, string> = { dark: "#141210", light: "#f8f5ef" };

// Runs in <head> before the page paints, so the saved theme never flashes.
export const themeInitScript = `(function(){try{if(localStorage.getItem("${STORAGE_KEY}")==="light"){document.documentElement.classList.add("light");var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","${THEME_COLOR.light}")}}catch(e){}})();`;

const listeners = new Set<() => void>();

function readTheme(): Theme {
  return document.documentElement.classList.contains("light") ? "light" : "dark";
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle("light", theme === "light");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[theme]);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // storage unavailable (private mode): theme still applies for this visit
  }
  listeners.forEach((l) => l());
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readTheme,
    () => "dark",
  );
}
