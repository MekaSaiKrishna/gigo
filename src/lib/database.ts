import * as SQLite from "expo-sqlite";
import { EXERCISE_SEED } from "../data/exercises";
import type { Exercise, Session, WorkoutSet, VibeLevel, GhostValues, ExerciseSummary, SessionSummary } from "../types";

const DB_NAME = "gigofit.db";

const VIBE_TO_INT: Record<VibeLevel, number> = {
  low: 0,
  normal: 1,
  crushing: 2,
};

const INT_TO_VIBE: Record<number, VibeLevel> = {
  0: "low",
  1: "normal",
  2: "crushing",
};

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;

interface TableInfoRow {
  name: string;
}

interface ForeignKeyRow {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
  match: string;
}

interface RawSessionRow {
  id: number;
  start_time: number;
  end_time: number | null;
  vibe: number;
  elapsed_time: number;
  is_paused: number;
}

interface RawHistorySessionRow extends RawSessionRow {
  total_volume: number;
  set_count: number;
}

export interface HistorySession {
  id: number;
  start_time: number;
  end_time: number | null;
  vibe: VibeLevel;
  elapsed_time: number;
  is_paused: boolean;
  total_volume: number;
  set_count: number;
}

export interface SessionSetDetail {
  id: number;
  session_id: number;
  exercise_id: number;
  exercise_name: string;
  weight: number;
  reps: number;
  created_at: string;
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync(DB_NAME);
  }

  if (!initPromise) {
    initPromise = initDatabase(db).catch((error) => {
      db = null;
      initPromise = null;
      throw error;
    });
  }

  await initPromise;
  return db as SQLite.SQLiteDatabase;
}

// Increment this when adding a new migration to DB_MIGRATIONS below.
const CURRENT_DB_VERSION = 3;

// Sequential migrations. Each entry takes the DB from version N to N+1.
// NEVER modify existing entries — only append new ones.
const DB_MIGRATIONS: Array<(db: SQLite.SQLiteDatabase) => Promise<void>> = [
  migrateLegacySessionsIfNeeded, // 0 → 1
  ensureSessionTimerColumns,      // 1 → 2
  ensureSetsCascadeDelete,        // 2 → 3
];

async function runMigrations(database: SQLite.SQLiteDatabase): Promise<void> {
  const row = await database.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const currentVersion = row?.user_version ?? 0;
  if (currentVersion >= CURRENT_DB_VERSION) return;

  for (let v = currentVersion; v < CURRENT_DB_VERSION; v++) {
    await DB_MIGRATIONS[v](database);
    await database.execAsync(`PRAGMA user_version = ${v + 1}`);
  }
}

export async function initDatabase(database: SQLite.SQLiteDatabase) {
  await database.execAsync(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      vibe INTEGER NOT NULL,
      elapsed_time INTEGER NOT NULL DEFAULT 0,
      is_paused INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sets (
      id INTEGER PRIMARY KEY,
      session_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );
  `);

  await runMigrations(database);

  await database.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
    CREATE INDEX IF NOT EXISTS idx_sets_session_id ON sets(session_id);
    CREATE INDEX IF NOT EXISTS idx_sets_exercise_id ON sets(exercise_id);
  `);

  await seedExercises(database);
}

async function hasColumn(database: SQLite.SQLiteDatabase, tableName: string, columnName: string) {
  const columns = await database.getAllAsync<TableInfoRow>(`PRAGMA table_info(${tableName})`);
  return columns.some((column) => column.name === columnName);
}

async function migrateLegacySessionsIfNeeded(database: SQLite.SQLiteDatabase) {
  const hasStartTime = await hasColumn(database, "sessions", "start_time");
  if (hasStartTime) return;

  const hasStartedAt = await hasColumn(database, "sessions", "started_at");
  if (!hasStartedAt) return;

  await database.execAsync(`
    PRAGMA foreign_keys = OFF;

    ALTER TABLE sessions RENAME TO sessions_legacy;

    CREATE TABLE sessions (
      id INTEGER PRIMARY KEY,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      vibe INTEGER NOT NULL,
      elapsed_time INTEGER NOT NULL DEFAULT 0,
      is_paused INTEGER NOT NULL DEFAULT 0
    );

    INSERT INTO sessions (id, start_time, end_time, vibe, elapsed_time, is_paused)
    SELECT
      id,
      COALESCE(CAST(strftime('%s', started_at) AS INTEGER) * 1000, CAST(strftime('%s', 'now') AS INTEGER) * 1000),
      CASE
        WHEN ended_at IS NULL THEN NULL
        ELSE CAST(strftime('%s', ended_at) AS INTEGER) * 1000
      END,
      CASE
        WHEN vibe = 'low' THEN 0
        WHEN vibe = 'crushing' THEN 2
        ELSE 1
      END,
      0,
      0
    FROM sessions_legacy;

    ALTER TABLE sets RENAME TO sets_legacy;

    CREATE TABLE sets (
      id INTEGER PRIMARY KEY,
      session_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id),
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );

    INSERT INTO sets (id, session_id, exercise_id, weight, reps, created_at)
    SELECT
      id,
      session_id,
      exercise_id,
      weight,
      reps,
      COALESCE(created_at, datetime('now'))
    FROM sets_legacy;

    DROP TABLE sets_legacy;
    DROP TABLE sessions_legacy;

    PRAGMA foreign_keys = ON;
  `);
}

async function ensureSessionTimerColumns(database: SQLite.SQLiteDatabase) {
  const hasElapsedTime = await hasColumn(database, "sessions", "elapsed_time");
  if (!hasElapsedTime) {
    await database.execAsync(
      "ALTER TABLE sessions ADD COLUMN elapsed_time INTEGER NOT NULL DEFAULT 0"
    );
  }

  const hasIsPaused = await hasColumn(database, "sessions", "is_paused");
  if (!hasIsPaused) {
    await database.execAsync(
      "ALTER TABLE sessions ADD COLUMN is_paused INTEGER NOT NULL DEFAULT 0"
    );
  }
}

async function ensureSetsCascadeDelete(database: SQLite.SQLiteDatabase) {
  const foreignKeys = await database.getAllAsync<ForeignKeyRow>("PRAGMA foreign_key_list(sets)");
  const sessionFk = foreignKeys.find((key) => key.table === "sessions" && key.from === "session_id");
  const hasCascade = sessionFk?.on_delete?.toUpperCase?.() === "CASCADE";
  if (hasCascade) return;

  await database.execAsync(`
    PRAGMA foreign_keys = OFF;

    ALTER TABLE sets RENAME TO sets_legacy_cascade;

    CREATE TABLE sets (
      id INTEGER PRIMARY KEY,
      session_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises(id)
    );

    INSERT INTO sets (id, session_id, exercise_id, weight, reps, created_at)
    SELECT id, session_id, exercise_id, weight, reps, created_at
    FROM sets_legacy_cascade;

    DROP TABLE sets_legacy_cascade;

    PRAGMA foreign_keys = ON;
  `);
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
  return db.getAllAsync<Exercise>("SELECT * FROM exercises ORDER BY muscle_group, name");
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
    "INSERT INTO sessions (start_time, vibe, elapsed_time, is_paused) VALUES (?, ?, 0, 0)",
    [Date.now(), VIBE_TO_INT[vibe]]
  );
  return Number(result.lastInsertRowId);
}

export async function endSession(sessionId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE sessions SET end_time = ?, is_paused = 1 WHERE id = ?", [
    Date.now(),
    sessionId,
  ]);
}

/** Atomically persists the final timer value and marks the session as ended. */
export async function endSessionWithTimer(
  sessionId: number,
  elapsedTime: number
): Promise<void> {
  const db = await getDatabase();
  const now = Date.now();
  await db.withTransactionAsync(async () => {
    await db.runAsync("UPDATE sessions SET elapsed_time = ?, is_paused = 1 WHERE id = ?", [
      Math.max(0, Math.round(elapsedTime)),
      sessionId,
    ]);
    await db.runAsync("UPDATE sessions SET end_time = ? WHERE id = ?", [now, sessionId]);
  });
}

export async function hardDeleteSession(sessionId: number): Promise<void> {
  const db = await getDatabase();
  // With ON DELETE CASCADE on sets.session_id, deleting a session also removes its sets.
  await db.runAsync("DELETE FROM sessions WHERE id = ?", [sessionId]);
}

export async function getSession(sessionId: number): Promise<Session | null> {
  const db = await getDatabase();
  const session = await db.getFirstAsync<RawSessionRow>("SELECT * FROM sessions WHERE id = ?", [
    sessionId,
  ]);
  if (!session) return null;

  return {
    id: session.id,
    start_time: session.start_time,
    end_time: session.end_time,
    vibe: INT_TO_VIBE[session.vibe] ?? "normal",
    elapsed_time: session.elapsed_time ?? 0,
    is_paused: Boolean(session.is_paused),
  };
}

export async function getSessionsForMonth(year: number, month: number): Promise<HistorySession[]> {
  const safeMonth = Math.min(Math.max(month, 1), 12);
  const monthStartMs = new Date(year, safeMonth - 1, 1).getTime();
  const monthEndMs = new Date(year, safeMonth, 1).getTime();
  const db = await getDatabase();

  const rows = await db.getAllAsync<RawHistorySessionRow>(
    `SELECT
      s.id,
      s.start_time,
      s.end_time,
      s.vibe,
      s.elapsed_time,
      s.is_paused,
      COALESCE(SUM(st.weight * st.reps), 0) AS total_volume,
      COUNT(st.id) AS set_count
    FROM sessions s
    LEFT JOIN sets st ON st.session_id = s.id
    WHERE s.end_time IS NOT NULL
      AND s.start_time >= ?
      AND s.start_time < ?
    GROUP BY s.id
    ORDER BY s.start_time DESC`,
    [monthStartMs, monthEndMs]
  );

  return rows.map((session) => ({
    id: session.id,
    start_time: session.start_time,
    end_time: session.end_time,
    vibe: INT_TO_VIBE[session.vibe] ?? "normal",
    elapsed_time: session.elapsed_time ?? 0,
    is_paused: Boolean(session.is_paused),
    total_volume: Number(session.total_volume ?? 0),
    set_count: Number(session.set_count ?? 0),
  }));
}

export async function getActiveSession(): Promise<Session | null> {
  const db = await getDatabase();
  const session = await db.getFirstAsync<RawSessionRow>(
    "SELECT * FROM sessions WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1"
  );
  if (!session) return null;

  return {
    id: session.id,
    start_time: session.start_time,
    end_time: session.end_time,
    vibe: INT_TO_VIBE[session.vibe] ?? "normal",
    elapsed_time: session.elapsed_time ?? 0,
    is_paused: Boolean(session.is_paused),
  };
}

export async function updateSessionTimer(
  sessionId: number,
  elapsedTime: number,
  isPaused: boolean
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE sessions SET elapsed_time = ?, is_paused = ? WHERE id = ?", [
    Math.max(0, Math.round(elapsedTime)),
    isPaused ? 1 : 0,
    sessionId,
  ]);
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
  return Number(result.lastInsertRowId);
}

export async function deleteSet(setId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM sets WHERE id = ?", [setId]);
}

export async function updateSet(setId: number, weight: number, reps: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("UPDATE sets SET weight = ?, reps = ? WHERE id = ?", [weight, reps, setId]);
}

export async function getSetsForSession(
  sessionId: number
): Promise<(WorkoutSet & { exercise_name: string })[]> {
  const db = await getDatabase();
  return db.getAllAsync(
    `SELECT s.*, e.name as exercise_name
     FROM sets s JOIN exercises e ON s.exercise_id = e.id
     WHERE s.session_id = ?
     ORDER BY s.created_at DESC`,
    [sessionId]
  );
}

export async function getSetDetailsForSession(sessionId: number): Promise<SessionSetDetail[]> {
  const db = await getDatabase();
  return db.getAllAsync<SessionSetDetail>(
    `SELECT
      s.id,
      s.session_id,
      s.exercise_id,
      e.name as exercise_name,
      s.weight,
      s.reps,
      s.created_at
     FROM sets s
     JOIN exercises e ON s.exercise_id = e.id
     WHERE s.session_id = ?
     ORDER BY s.created_at ASC, s.id ASC`,
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
