import * as SQLite from "expo-sqlite";
import { EXERCISE_SEED } from "../data/exercises";
import type { Exercise, Session, WorkoutSet, VibeLevel, GhostValues, ExerciseSummary, SessionSummary, SessionHistoryItem } from "../types";

const DB_NAME = "gigofit.db";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await initializeDatabase(db);
  }
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      ended_at TEXT,
      vibe TEXT NOT NULL CHECK (vibe IN ('low', 'normal', 'crushing'))
    );

    CREATE TABLE IF NOT EXISTS sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );
  `);

  await seedExercises(database);
}

async function seedExercises(database: SQLite.SQLiteDatabase) {
  const existing = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM exercises"
  );
  if (existing && existing.count > 0) return;

  const placeholders = EXERCISE_SEED.map(() => "(?, ?, ?)").join(", ");
  const values = EXERCISE_SEED.flatMap((e) => [e.name, e.muscle_group, e.category]);
  await database.runAsync(
    `INSERT INTO exercises (name, muscle_group, category) VALUES ${placeholders}`,
    values
  );
}

// ── Exercises ──────────────────────────────────────────────

export async function getAllExercises(): Promise<Exercise[]> {
  const db = await getDatabase();
  return db.getAllAsync<Exercise>(
    "SELECT * FROM exercises ORDER BY muscle_group, name"
  );
}

export async function getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
  const db = await getDatabase();
  return db.getAllAsync<Exercise>(
    "SELECT * FROM exercises WHERE muscle_group = ? ORDER BY name",
    [muscleGroup]
  );
}

// ── Sessions ───────────────────────────────────────────────

export async function startSession(vibe: VibeLevel): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    "INSERT INTO sessions (vibe) VALUES (?)",
    [vibe]
  );
  return result.lastInsertRowId;
}

export async function endSession(sessionId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE sessions SET ended_at = datetime('now') WHERE id = ?",
    [sessionId]
  );
}

export async function getSession(sessionId: number): Promise<Session | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Session>(
    "SELECT * FROM sessions WHERE id = ?",
    [sessionId]
  );
}

// ── Sets ───────────────────────────────────────────────────

export async function addSet(
  sessionId: number,
  exerciseId: number,
  weight: number,
  reps: number
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    "INSERT INTO sets (session_id, exercise_id, weight, reps) VALUES (?, ?, ?, ?)",
    [sessionId, exerciseId, weight, reps]
  );
  return result.lastInsertRowId;
}

export async function deleteSet(setId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM sets WHERE id = ?", [setId]);
}

export async function getSetsForSession(sessionId: number): Promise<(WorkoutSet & { exercise_name: string })[]> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT s.*, e.name as exercise_name
     FROM sets s JOIN exercises e ON s.exercise_id = e.id
     WHERE s.session_id = ?
     ORDER BY s.created_at DESC`,
    [sessionId]
  );
}

// ── Ghosting (last weight/reps recall) ─────────────────────

export async function getGhostValues(exerciseId: number): Promise<GhostValues | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ weight: number; reps: number }>(
    `SELECT weight, reps FROM sets
     WHERE exercise_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [exerciseId]
  );
  return row ?? null;
}

// ── Volume ─────────────────────────────────────────────────

export async function getSessionVolume(sessionId: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    "SELECT COALESCE(SUM(weight * reps), 0) as total FROM sets WHERE session_id = ?",
    [sessionId]
  );
  return row?.total ?? 0;
}

export async function getTotalVolume(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number }>(
    "SELECT COALESCE(SUM(weight * reps), 0) as total FROM sets"
  );
  return row?.total ?? 0;
}

// ── Session Summary ────────────────────────────────────────

export async function getSessionSummary(sessionId: number): Promise<SessionSummary | null> {
  const db = await getDatabase();

  const session = await db.getFirstAsync<Session>(
    "SELECT * FROM sessions WHERE id = ?",
    [sessionId]
  );
  if (!session) return null;

  const volumeRow = await db.getFirstAsync<{ total: number }>(
    "SELECT COALESCE(SUM(weight * reps), 0) as total FROM sets WHERE session_id = ?",
    [sessionId]
  );

  const setCountRow = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sets WHERE session_id = ?",
    [sessionId]
  );

  const exercises = await db.getAllAsync<ExerciseSummary>(
    `SELECT e.name as exercise_name,
            COUNT(s.id) as set_count,
            COALESCE(SUM(s.weight * s.reps), 0) as total_volume
     FROM sets s JOIN exercises e ON s.exercise_id = e.id
     WHERE s.session_id = ?
     GROUP BY s.exercise_id
     ORDER BY s.created_at ASC`,
    [sessionId]
  );

  // Calculate duration in minutes
  let durationMinutes = 0;
  if (session.started_at && session.ended_at) {
    const start = new Date(session.started_at + "Z").getTime();
    const end = new Date(session.ended_at + "Z").getTime();
    durationMinutes = Math.max(1, Math.round((end - start) / 60000));
  }

  return {
    session,
    totalVolume: volumeRow?.total ?? 0,
    totalSets: setCountRow?.count ?? 0,
    durationMinutes,
    exercises,
  };
}

// ── Session History ─────────────────────────────────────

export async function getSessionHistory(): Promise<SessionHistoryItem[]> {
  const db = await getDatabase();
  return db.getAllAsync<SessionHistoryItem>(
    `SELECT
       s.id,
       s.started_at,
       s.ended_at,
       s.vibe,
       COALESCE(SUM(st.weight * st.reps), 0) as total_volume,
       COUNT(st.id) as total_sets,
       CASE
         WHEN s.ended_at IS NOT NULL
         THEN MAX(1, ROUND((julianday(s.ended_at) - julianday(s.started_at)) * 1440))
         ELSE 0
       END as duration_minutes
     FROM sessions s
     LEFT JOIN sets st ON st.session_id = s.id
     WHERE s.ended_at IS NOT NULL
     GROUP BY s.id
     ORDER BY s.started_at DESC`
  );
}
