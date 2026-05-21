export type ThemePreference = "dark" | "light" | "system";

export const THEME_STORAGE_KEY = "ip-theme";

export function resolveTheme(preference: ThemePreference): "dark" | "light" {
  if (preference === "dark" || preference === "light") return preference;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export const themeScript = `(function(){try{var k='${THEME_STORAGE_KEY}';var p=localStorage.getItem(k);var t=p==='light'||p==='dark'?p:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;
