import type { VibeLevel } from "../types";

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safe / 3600).toString().padStart(2, "0");
  const mins = Math.floor((safe % 3600) / 60).toString().padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

export function formatVibeLabel(vibe: VibeLevel): string {
  if (vibe === "low") return "Low Energy";
  if (vibe === "crushing") return "Crushing It";
  return "Normal";
}

export function formatSessionDate(timestampMs: number): string {
  const date = new Date(timestampMs);
  const day = date.getDate().toString().padStart(2, "0");
  const month = new Intl.DateTimeFormat("en-US", { month: "long" }).format(date);
  const year = date.getFullYear();
  return `${day}, ${month}, ${year}`;
}

export function formatSessionDateTime(timestampMs: number): string {
  const value = new Date(timestampMs);
  const date = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(value);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
  return `${date} • ${time}`;
}

export function formatSessionTime(timestampMs: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestampMs));
}

function shortMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatWeekLabel(weekKey: string): string {
  const [yearText, weekText] = weekKey.split("-");
  const year = Number(yearText);
  const week = Number(weekText);

  if (!Number.isFinite(year) || !Number.isFinite(week)) return weekKey;

  // %W week keys use Monday as first weekday, with week 00 at start of year.
  const janFirstUtc = Date.UTC(year, 0, 1);
  const approxWeekDate = new Date(janFirstUtc + week * 7 * 24 * 60 * 60 * 1000);
  return shortMonthYear(approxWeekDate);
}

export function formatMonthLabel(monthKey: string): string {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return monthKey;
  }

  return shortMonthYear(new Date(Date.UTC(year, month - 1, 1)));
}
