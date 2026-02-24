import { getDatabase } from "./database";
import type { MuscleGroup, VibeLevel } from "../types";

export interface ExerciseWeeklyMaxPoint {
  week: string;
  max_weight: number;
}

export interface ExerciseWeekly1RMPoint {
  week: string;
  max_estimated_1rm: number;
}

export interface PREvent {
  exerciseId: number;
  type: "weight" | "volume" | "1rm";
  value: number;
}

interface SessionSetMetricRow {
  exercise_id: number;
  weight: number;
  reps: number;
  set_volume: number;
  estimated_1rm: number;
}

interface HistoricalMaxRow {
  exercise_id: number;
  max_weight: number | null;
  max_volume: number | null;
  max_1rm: number | null;
}

interface MonthSessionRow {
  id: number;
}

export interface PersonalRecord {
  exercise_id: number;
  exercise_name: string;
  muscle_group: MuscleGroup;
  max_weight: number;
}

export type SessionComparisonCategory = "surpassed" | "consistent" | "encouragement";

export interface SessionComparisonResult {
  category: SessionComparisonCategory;
  affirmation: string;
  previousVolume: number;
}

export interface CoachingComparisonResult {
  category: "legendary_start" | "outdone" | "consistent" | "encouragement";
  affirmation: string;
  previousVolume: number | null;
  isOutdone: boolean;
}

export async function getWeeklyVolume(weeks: number = 8): Promise<Array<{ week: string; total_volume: number }>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ week: string; total_volume: number }>(
    `SELECT
      strftime('%Y-%W', datetime(s.start_time / 1000, 'unixepoch')) AS week,
      SUM(sets.weight * sets.reps) AS total_volume
    FROM sessions s
    JOIN sets ON sets.session_id = s.id
    GROUP BY week
    ORDER BY week DESC
    LIMIT ?`,
    [weeks]
  );

  return [...rows].reverse();
}

export async function getMonthlyVolume(
  months: number = 12
): Promise<Array<{ month: string; total_volume: number }>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ month: string; total_volume: number }>(
    `SELECT
      strftime('%Y-%m', datetime(s.start_time / 1000, 'unixepoch')) AS month,
      SUM(sets.weight * sets.reps) AS total_volume
    FROM sessions s
    JOIN sets ON sets.session_id = s.id
    GROUP BY month
    ORDER BY month DESC
    LIMIT ?`,
    [months]
  );

  return [...rows].reverse();
}

export async function getExerciseWeeklyMax(exerciseId: number): Promise<ExerciseWeeklyMaxPoint[]> {
  const db = await getDatabase();
  return db.getAllAsync<ExerciseWeeklyMaxPoint>(
    `SELECT
      strftime('%Y-%W', datetime(s.start_time / 1000, 'unixepoch')) AS week,
      MAX(sets.weight) AS max_weight
    FROM sessions s
    JOIN sets ON sets.session_id = s.id
    WHERE sets.exercise_id = ?
    GROUP BY week
    ORDER BY week ASC`,
    [exerciseId]
  );
}

export async function getExerciseWeeklyEstimated1RM(
  exerciseId: number
): Promise<ExerciseWeekly1RMPoint[]> {
  const db = await getDatabase();
  return db.getAllAsync<ExerciseWeekly1RMPoint>(
    `SELECT
      strftime('%Y-%W', datetime(s.start_time / 1000, 'unixepoch')) AS week,
      MAX(sets.weight * (1 + sets.reps / 30.0)) AS max_estimated_1rm
    FROM sessions s
    JOIN sets ON sets.session_id = s.id
    WHERE sets.exercise_id = ?
    GROUP BY week
    ORDER BY week ASC`,
    [exerciseId]
  );
}

export async function detectNewPR(sessionId: number): Promise<PREvent[]> {
  const db = await getDatabase();

  const sessionSets = await db.getAllAsync<SessionSetMetricRow>(
    `SELECT
      exercise_id,
      weight,
      reps,
      (weight * reps) AS set_volume,
      (weight * (1 + reps / 30.0)) AS estimated_1rm
    FROM sets
    WHERE session_id = ?`,
    [sessionId]
  );

  if (sessionSets.length === 0) return [];

  const exerciseIds = [...new Set(sessionSets.map((row) => row.exercise_id))];
  const placeholders = exerciseIds.map(() => "?").join(",");

  const historicalRows = await db.getAllAsync<HistoricalMaxRow>(
    `SELECT
      sets.exercise_id AS exercise_id,
      MAX(sets.weight) AS max_weight,
      MAX(sets.weight * sets.reps) AS max_volume,
      MAX(sets.weight * (1 + sets.reps / 30.0)) AS max_1rm
    FROM sets
    JOIN sessions ON sessions.id = sets.session_id
    WHERE sets.exercise_id IN (${placeholders})
      AND sets.session_id != ?
      AND sessions.end_time IS NOT NULL
    GROUP BY sets.exercise_id`,
    [...exerciseIds, sessionId]
  );

  const historicalMap = new Map<number, HistoricalMaxRow>();
  for (const row of historicalRows) {
    historicalMap.set(row.exercise_id, row);
  }

  const prMap = new Map<string, PREvent>();

  for (const setRow of sessionSets) {
    const historical = historicalMap.get(setRow.exercise_id);
    const historicalWeight = historical?.max_weight ?? Number.NEGATIVE_INFINITY;
    const historicalVolume = historical?.max_volume ?? Number.NEGATIVE_INFINITY;
    const historical1RM = historical?.max_1rm ?? Number.NEGATIVE_INFINITY;

    if (setRow.weight > historicalWeight) {
      const key = `${setRow.exercise_id}:weight`;
      const current = prMap.get(key);
      if (!current || setRow.weight > current.value) {
        prMap.set(key, {
          exerciseId: setRow.exercise_id,
          type: "weight",
          value: setRow.weight,
        });
      }
    }

    if (setRow.set_volume > historicalVolume) {
      const key = `${setRow.exercise_id}:volume`;
      const current = prMap.get(key);
      if (!current || setRow.set_volume > current.value) {
        prMap.set(key, {
          exerciseId: setRow.exercise_id,
          type: "volume",
          value: setRow.set_volume,
        });
      }
    }

    if (setRow.estimated_1rm > historical1RM) {
      const key = `${setRow.exercise_id}:1rm`;
      const current = prMap.get(key);
      if (!current || setRow.estimated_1rm > current.value) {
        prMap.set(key, {
          exerciseId: setRow.exercise_id,
          type: "1rm",
          value: setRow.estimated_1rm,
        });
      }
    }
  }

  return [...prMap.values()].sort((a, b) => {
    if (a.exerciseId !== b.exerciseId) return a.exerciseId - b.exerciseId;
    return a.type.localeCompare(b.type);
  });
}

export async function getMonthlyPRSummary(
  referenceTimeMs: number = Date.now()
): Promise<Array<PREvent & { sessionId: number }>> {
  const db = await getDatabase();

  const reference = new Date(referenceTimeMs);
  const monthStart = new Date(reference.getFullYear(), reference.getMonth(), 1).getTime();
  const monthEnd = new Date(reference.getFullYear(), reference.getMonth() + 1, 1).getTime();

  const sessionRows = await db.getAllAsync<MonthSessionRow>(
    `SELECT id
     FROM sessions
     WHERE start_time >= ? AND start_time < ?
       AND end_time IS NOT NULL
     ORDER BY start_time ASC`,
    [monthStart, monthEnd]
  );

  const results: Array<PREvent & { sessionId: number }> = [];
  for (const row of sessionRows) {
    const sessionPRs = await detectNewPR(row.id);
    results.push(...sessionPRs.map((pr) => ({ ...pr, sessionId: row.id })));
  }

  return results;
}

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  const db = await getDatabase();
  return db.getAllAsync<PersonalRecord>(
    `SELECT
      sets.exercise_id AS exercise_id,
      exercises.name AS exercise_name,
      exercises.muscle_group AS muscle_group,
      MAX(sets.weight) AS max_weight
    FROM sets
    JOIN sessions ON sessions.id = sets.session_id
    JOIN exercises ON exercises.id = sets.exercise_id
    WHERE sessions.end_time IS NOT NULL
    GROUP BY sets.exercise_id, exercises.name, exercises.muscle_group
    ORDER BY exercises.muscle_group ASC, exercises.name ASC`
  );
}

export async function getComparisonToPreviousSession(
  currentVolume: number
): Promise<SessionComparisonResult> {
  const db = await getDatabase();

  const previous = await db.getFirstAsync<{ total_volume: number }>(
    `SELECT COALESCE(SUM(sets.weight * sets.reps), 0) AS total_volume
     FROM sessions s
     JOIN sets ON sets.session_id = s.id
     WHERE s.end_time IS NOT NULL
     GROUP BY s.id
     ORDER BY s.start_time DESC
     LIMIT 1 OFFSET 1`
  );

  const previousVolume = Number(previous?.total_volume ?? 0);

  if (previousVolume <= 0 || currentVolume > previousVolume) {
    return {
      category: "surpassed",
      affirmation: "You outdid yourself! 🏔️",
      previousVolume,
    };
  }

  const ratio = currentVolume / previousVolume;
  if (ratio >= 0.9) {
    return {
      category: "consistent",
      affirmation: "Great job, you are staying consistent! 🔥",
      previousVolume,
    };
  }

  return {
    category: "encouragement",
    affirmation: "Solid effort. Every rep counts—let's push harder next time! 💪",
    previousVolume,
  };
}

export async function getCoachingComparisonToPreviousSession(
  currentVolume: number,
  vibe: VibeLevel
): Promise<CoachingComparisonResult> {
  const db = await getDatabase();

  const previous = await db.getFirstAsync<{ total_volume: number }>(
    `SELECT COALESCE(SUM(sets.weight * sets.reps), 0) AS total_volume
     FROM sessions s
     JOIN sets ON sets.session_id = s.id
     WHERE s.end_time IS NOT NULL
     GROUP BY s.id
     ORDER BY s.start_time DESC
     LIMIT 1 OFFSET 1`
  );

  if (!previous) {
    return {
      category: "legendary_start",
      affirmation: "Legendary start. The mountain just met you. 🏔️",
      previousVolume: null,
      isOutdone: false,
    };
  }

  const previousVolume = Number(previous.total_volume ?? 0);
  const outdone = currentVolume > previousVolume * 1.05;

  let category: CoachingComparisonResult["category"];
  let affirmation: string;

  if (outdone) {
    category = "outdone";
    affirmation = "You outdid yourself! 🏔️";
  } else if (currentVolume >= previousVolume * 0.9) {
    category = "consistent";
    affirmation = "Great job, you are staying consistent! 🔥";
  } else {
    category = "encouragement";
    affirmation = "Solid effort. Every rep counts—let's push harder next time! 💪";
  }

  if (vibe === "low" && currentVolume >= previousVolume * 0.9) {
    affirmation = `${affirmation} Elite discipline today.`;
  }

  return {
    category,
    affirmation,
    previousVolume,
    isOutdone: outdone,
  };
}
