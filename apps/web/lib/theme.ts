export type ThemePreference = "dark" | "light" | "system";

export const THEME_STORAGE_KEY = "ip-theme";

export function resolveTheme(preference: ThemePreference): "dark" | "light" {
  if (preference === "dark" || preference === "light") return preference;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** First visit defaults to light (Luminous marketing); explicit Auto still follows OS. */
export const themeScript = `(function(){try{var k='${THEME_STORAGE_KEY}';var p=localStorage.getItem(k);var t=p==='light'||p==='dark'?p:(p==='system'?((window.matchMedia('(prefers-color-scheme: light)').matches)?'light':'dark'):'light');document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;
