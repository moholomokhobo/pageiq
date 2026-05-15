export const THEME_STORAGE_KEY = "pageiq-theme";

export type Theme = "light" | "dark";

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
}
