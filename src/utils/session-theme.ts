export type SessionDayPart = "morning" | "afternoon" | "evening" | "night";

export interface SessionTheme {
  part: SessionDayPart;
  label: string;
  icon: "sunrise" | "sun" | "sunset" | "moon";
  gradient: [string, string, string];
  cardBorder: string;
  chipBg: string;
  chipBorder: string;
  chipText: string;
}

const THEMES: Record<SessionDayPart, SessionTheme> = {
  morning: {
    part: "morning",
    label: "Morning Lift",
    icon: "sunrise",
    gradient: ["#1e293b", "#0f3460", "#38bdf8"],
    cardBorder: "#38bdf8",
    chipBg: "#0f3460",
    chipBorder: "#38bdf8",
    chipText: "#e0f2fe",
  },
  afternoon: {
    part: "afternoon",
    label: "Sunny Session",
    icon: "sun",
    gradient: ["#422006", "#9a3412", "#f59e0b"],
    cardBorder: "#f59e0b",
    chipBg: "#7c2d12",
    chipBorder: "#f59e0b",
    chipText: "#ffedd5",
  },
  evening: {
    part: "evening",
    label: "Relaxed Grind",
    icon: "sunset",
    gradient: ["#312e81", "#4c1d95", "#be185d"],
    cardBorder: "#c084fc",
    chipBg: "#4c1d95",
    chipBorder: "#c084fc",
    chipText: "#f3e8ff",
  },
  night: {
    part: "night",
    label: "Late Night Ascent",
    icon: "moon",
    gradient: ["#020617", "#0f172a", "#1e293b"],
    cardBorder: "#64748b",
    chipBg: "#111827",
    chipBorder: "#334155",
    chipText: "#e2e8f0",
  },
};

export function getSessionTheme(timestampMs: number): SessionTheme {
  const hour = new Date(timestampMs).getHours();
  if (hour >= 5 && hour < 12) return THEMES.morning;
  if (hour >= 12 && hour < 17) return THEMES.afternoon;
  if (hour >= 17 && hour < 21) return THEMES.evening;
  return THEMES.night;
}

