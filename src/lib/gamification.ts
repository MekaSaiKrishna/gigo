import { getDatabase } from "./database";

// ── Tier Types ──────────────────────────────────────────────

export type StrengthTier = "Iron Fist" | "Steel Grip" | "Mountain Hands" | "Titan";
export type AgilityTier = "Crawler" | "Strider" | "Sprinter" | "Ghost";
export type EnduranceTier = "Spark" | "Ember" | "Blaze" | "Inferno";

export interface StatResult<T extends string = string> {
  /** Raw computed value (kg, sessions/week, or minutes) */
  value: number;
  /** Human-readable tier label */
  tier: T;
  /** 0-based index — used for character appearance lookup */
  tierIndex: number;
}

export interface AllStats {
  strength: StatResult<StrengthTier>;
  agility: StatResult<AgilityTier>;
  endurance: StatResult<EnduranceTier>;
  /** Count of Low Energy sessions that held ≥ 90% of prior session volume */
  focusCount: number;
  /** Count of completed "Crushing It" sessions */
  furyCount: number;
}

// ── Tier Thresholds ─────────────────────────────────────────

const STRENGTH_TIERS: Array<{ label: StrengthTier; min: number }> = [
  { label: "Iron Fist", min: 0 },
  { label: "Steel Grip", min: 10_000 },
  { label: "Mountain Hands", min: 50_000 },
  { label: "Titan", min: 150_000 },
];

const AGILITY_TIERS: Array<{ label: AgilityTier; min: number }> = [
  { label: "Crawler", min: 0 },
  { label: "Strider", min: 2 },
  { label: "Sprinter", min: 4 },
  { label: "Ghost", min: 6 },
];

const ENDURANCE_TIERS: Array<{ label: EnduranceTier; min: number }> = [
  { label: "Spark", min: 0 },
  { label: "Ember", min: 30 },
  { label: "Blaze", min: 45 },
  { label: "Inferno", min: 75 },
];

// ── Internal Helpers ────────────────────────────────────────

function resolveTier<T extends string>(
  value: number,
  tiers: Array<{ label: T; min: number }>
): { tier: T; tierIndex: number } {
  let tierIndex = 0;
  for (let i = tiers.length - 1; i >= 0; i--) {
    if (value >= tiers[i].min) {
      tierIndex = i;
      break;
    }
  }
  return { tier: tiers[tierIndex].label, tierIndex };
}

// ── Stat Functions ──────────────────────────────────────────

/**
 * STRENGTH — derived from all-time total volume (kg) lifted
 * across completed sessions.
 *
 * Tiers: Iron Fist → Steel Grip → Mountain Hands → Titan
 */
export async function computeStrengthStat(): Promise<StatResult<StrengthTier>> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total_volume: number }>(
    `SELECT COALESCE(SUM(sets.weight * sets.reps), 0) AS total_volume
     FROM sets
     JOIN sessions ON sessions.id = sets.session_id
     WHERE sessions.end_time IS NOT NULL`
  );
  const value = row?.total_volume ?? 0;
  const { tier, tierIndex } = resolveTier(value, STRENGTH_TIERS);
  return { value, tier, tierIndex };
}

/**
 * AGILITY — derived from average sessions per active week
 * over the trailing 8 weeks. Only weeks that contain at least
 * one session count toward the average (sparse weeks ignored).
 *
 * Tiers: Crawler → Strider → Sprinter → Ghost
 */
export async function computeAgilityStat(): Promise<StatResult<AgilityTier>> {
  const db = await getDatabase();
  const eightWeeksAgo = Date.now() - 8 * 7 * 24 * 60 * 60 * 1000;
  const rows = await db.getAllAsync<{ week: string; session_count: number }>(
    `SELECT
       strftime('%Y-%W', datetime(start_time / 1000, 'unixepoch')) AS week,
       COUNT(*) AS session_count
     FROM sessions
     WHERE end_time IS NOT NULL AND start_time >= ?
     GROUP BY week`,
    [eightWeeksAgo]
  );

  if (rows.length === 0) {
    return { value: 0, tier: "Crawler", tierIndex: 0 };
  }

  const total = rows.reduce((sum, r) => sum + r.session_count, 0);
  const avgPerWeek = total / rows.length;

  const { tier, tierIndex } = resolveTier(avgPerWeek, AGILITY_TIERS);
  return { value: avgPerWeek, tier, tierIndex };
}

/**
 * ENDURANCE — derived from the average completed session
 * duration in minutes (uses the persisted elapsed_time column,
 * which stores seconds).
 *
 * Tiers: Spark → Ember → Blaze → Inferno
 */
export async function computeEnduranceStat(): Promise<StatResult<EnduranceTier>> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ avg_minutes: number | null }>(
    `SELECT AVG(elapsed_time / 60.0) AS avg_minutes
     FROM sessions
     WHERE end_time IS NOT NULL AND elapsed_time > 0`
  );
  const value = row?.avg_minutes ?? 0;
  const { tier, tierIndex } = resolveTier(value, ENDURANCE_TIERS);
  return { value, tier, tierIndex };
}

/**
 * FOCUS — counts completed Low Energy sessions (vibe = 0) where
 * the session volume was ≥ 90% of the immediately prior session's
 * volume. Computed in JS after a single SQL query.
 */
export async function computeFocusCount(): Promise<number> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ id: number; vibe: number; volume: number }>(
    `SELECT s.id, s.vibe, COALESCE(SUM(sets.weight * sets.reps), 0) AS volume
     FROM sessions s
     LEFT JOIN sets ON sets.session_id = s.id
     WHERE s.end_time IS NOT NULL
     GROUP BY s.id
     ORDER BY s.start_time ASC`
  );

  let count = 0;
  for (let i = 1; i < rows.length; i++) {
    const current = rows[i];
    const previous = rows[i - 1];
    if (
      current.vibe === 0 &&
      previous.volume > 0 &&
      current.volume >= previous.volume * 0.9
    ) {
      count++;
    }
  }
  return count;
}

/**
 * FURY — counts completed "Crushing It" sessions (vibe = 2).
 */
export async function computeFuryCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count
     FROM sessions
     WHERE end_time IS NOT NULL AND vibe = 2`
  );
  return row?.count ?? 0;
}

/**
 * getAllStats — returns all five stats in a single parallel call.
 * Safe to call after every session end.
 */
export async function getAllStats(): Promise<AllStats> {
  const [strength, agility, endurance, focusCount, furyCount] = await Promise.all([
    computeStrengthStat(),
    computeAgilityStat(),
    computeEnduranceStat(),
    computeFocusCount(),
    computeFuryCount(),
  ]);
  return { strength, agility, endurance, focusCount, furyCount };
}

// ── Tier Metadata (for UI / appearance lookups) ─────────────

export const STRENGTH_TIER_LABELS: StrengthTier[] = [
  "Iron Fist",
  "Steel Grip",
  "Mountain Hands",
  "Titan",
];

export const AGILITY_TIER_LABELS: AgilityTier[] = [
  "Crawler",
  "Strider",
  "Sprinter",
  "Ghost",
];

export const ENDURANCE_TIER_LABELS: EnduranceTier[] = [
  "Spark",
  "Ember",
  "Blaze",
  "Inferno",
];
