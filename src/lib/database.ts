import * as SQLite from "expo-sqlite";

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
}
