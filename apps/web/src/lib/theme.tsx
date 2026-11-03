import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";
export type Tone = "mint" | "azure" | "ember" | "ocean" | "slate";

export const TONES: Array<{ value: Tone; label: string; swatch: string }> = [
  { value: "mint", label: "Mint", swatch: "#2ee59d" },
  { value: "azure", label: "Azure", swatch: "#7aa2ff" },
  { value: "ember", label: "Ember", swatch: "#ffb45a" },
  { value: "ocean", label: "Ocean", swatch: "#2ec4b6" },
  { value: "slate", label: "Slate", swatch: "#94a3b8" },
];

const THEME_KEY = "auzy-theme";
const TONE_KEY = "auzy-tone";

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  tone: Tone;
  setTheme: (theme: Theme) => void;
  setTone: (tone: Tone) => void;
  cycleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function readStoredTone(): Tone {
  if (typeof window === "undefined") return "mint";
  const stored = window.localStorage.getItem(TONE_KEY);
  if (TONES.some((tone) => tone.value === stored)) return stored as Tone;
  return "mint";
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyAppearance(resolved: ResolvedTheme, tone: Tone) {
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  root.dataset.tone = tone;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());
  const [tone, setToneState] = useState<Tone>(() => readStoredTone());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(readStoredTheme()),
  );

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      window.localStorage.setItem(THEME_KEY, next);
      const resolved = resolveTheme(next);
      setResolvedTheme(resolved);
      applyAppearance(resolved, tone);
    },
    [tone],
  );

  const setTone = useCallback(
    (next: Tone) => {
      setToneState(next);
      window.localStorage.setItem(TONE_KEY, next);
      applyAppearance(resolveTheme(theme), next);
    },
    [theme],
  );

  const cycleTheme = useCallback(() => {
    const order: Theme[] = ["light", "dark", "system"];
    const index = order.indexOf(theme);
    setTheme(order[(index + 1) % order.length] ?? "system");
  }, [setTheme, theme]);

  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyAppearance(resolved, tone);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (theme !== "system") return;
      const next = getSystemTheme();
      setResolvedTheme(next);
      applyAppearance(next, tone);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme, tone]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, tone, setTheme, setTone, cycleTheme }),
    [theme, resolvedTheme, tone, setTheme, setTone, cycleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
