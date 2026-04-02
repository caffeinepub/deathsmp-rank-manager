import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY";

export const ACCENT_COLORS = [
  {
    label: "Red",
    value: "red",
    primary: "oklch(0.47 0.195 27.3)",
    foreground: "oklch(0.97 0 0)",
  },
  {
    label: "Blue",
    value: "blue",
    primary: "oklch(0.50 0.20 250)",
    foreground: "oklch(0.97 0 0)",
  },
  {
    label: "Green",
    value: "green",
    primary: "oklch(0.55 0.20 145)",
    foreground: "oklch(0.97 0 0)",
  },
  {
    label: "Orange",
    value: "orange",
    primary: "oklch(0.60 0.20 60)",
    foreground: "oklch(0.97 0 0)",
  },
  {
    label: "Purple",
    value: "purple",
    primary: "oklch(0.50 0.22 300)",
    foreground: "oklch(0.97 0 0)",
  },
  {
    label: "Teal",
    value: "teal",
    primary: "oklch(0.55 0.18 195)",
    foreground: "oklch(0.97 0 0)",
  },
] as const;

export type AccentColor = (typeof ACCENT_COLORS)[number]["value"];

const SWATCH_HEX: Record<AccentColor, string> = {
  red: "#cc2200",
  blue: "#0055cc",
  green: "#009933",
  orange: "#cc6600",
  purple: "#8800cc",
  teal: "#007788",
};

export { SWATCH_HEX };

interface PreferencesContextValue {
  dateFormat: DateFormat;
  setDateFormat: (f: DateFormat) => void;
  compactView: boolean;
  setCompactView: (v: boolean) => void;
  accentColor: AccentColor;
  setAccentColor: (c: AccentColor) => void;
  formatDate: (ms: bigint | number) => string;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function applyAccentColor(color: AccentColor) {
  const entry = ACCENT_COLORS.find((c) => c.value === color);
  if (!entry) return;
  const root = document.documentElement;
  // Extract oklch L C H components and set as space-separated values
  // e.g. "oklch(0.47 0.195 27.3)" -> "0.47 0.195 27.3"
  const extractOklch = (v: string) => v.replace(/^oklch\((.+)\)$/, "$1");
  root.style.setProperty("--primary", extractOklch(entry.primary));
  root.style.setProperty(
    "--primary-foreground",
    extractOklch(entry.foreground),
  );
  root.style.setProperty(
    "--accent",
    extractOklch(entry.primary).replace(
      /([\d.]+)\s+([\d.]+)\s+([\d.]+)/,
      (_, l, c, h) => `${Math.max(0, Number(l) - 0.08)} ${c} ${h}`,
    ),
  );
  root.style.setProperty("--ring", extractOklch(entry.primary));
  root.style.setProperty("--sidebar-primary", extractOklch(entry.primary));
  root.style.setProperty("--sidebar-ring", extractOklch(entry.primary));
  root.style.setProperty("--chart-1", extractOklch(entry.primary));
  root.style.setProperty("--destructive", extractOklch(entry.primary));
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [dateFormat, setDateFormatState] = useState<DateFormat>(() => {
    return (
      (localStorage.getItem("deathsmp_date_format") as DateFormat) ??
      "DD/MM/YYYY"
    );
  });

  const [compactView, setCompactViewState] = useState<boolean>(() => {
    return localStorage.getItem("deathsmp_compact_view") === "true";
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    return (
      (localStorage.getItem("deathsmp_accent_color") as AccentColor) ?? "red"
    );
  });

  // Apply accent color on mount and when it changes
  useEffect(() => {
    applyAccentColor(accentColor);
  }, [accentColor]);

  const setDateFormat = (f: DateFormat) => {
    localStorage.setItem("deathsmp_date_format", f);
    setDateFormatState(f);
  };

  const setCompactView = (v: boolean) => {
    localStorage.setItem("deathsmp_compact_view", v ? "true" : "false");
    setCompactViewState(v);
  };

  const setAccentColor = (c: AccentColor) => {
    localStorage.setItem("deathsmp_accent_color", c);
    setAccentColorState(c);
  };

  const formatDate = (ms: bigint | number): string => {
    const d = new Date(Number(ms));
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    if (dateFormat === "MM/DD/YYYY") return `${month}/${day}/${year}`;
    return `${day}/${month}/${year}`;
  };

  return (
    <PreferencesContext.Provider
      value={{
        dateFormat,
        setDateFormat,
        compactView,
        setCompactView,
        accentColor,
        setAccentColor,
        formatDate,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx)
    throw new Error("usePreferences must be used inside PreferencesProvider");
  return ctx;
}
