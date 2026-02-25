export type VibeLevel = "low" | "normal" | "crushing";

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "legs"
  | "core"
  | "glutes"
  | "forearms"
  | "full_body";

export type ExerciseCategory = "compound" | "isolation" | "bodyweight" | "cardio";

export interface Exercise {
  id: number;
  name: string;
  muscle_group: MuscleGroup;
  category: ExerciseCategory;
}

export interface Session {
  id: number;
  started_at: string;
  ended_at: string | null;
  vibe: VibeLevel;
}

export interface WorkoutSet {
  id: number;
  session_id: number;
  exercise_id: number;
  weight: number;
  reps: number;
  created_at: string;
}

/** Ghost values — last weight/reps for a given exercise */
export interface GhostValues {
  weight: number;
  reps: number;
}

/** Aggregated exercise stats for a session summary */
export interface ExerciseSummary {
  exercise_name: string;
  set_count: number;
  total_volume: number;
}

/** Full session summary for the completion card */
export interface SessionSummary {
  session: Session;
  totalVolume: number;
  totalSets: number;
  durationMinutes: number;
  exercises: ExerciseSummary[];
}

/** Lightweight row for the workout history list */
export interface SessionHistoryItem {
  id: number;
  started_at: string;
  ended_at: string | null;
  vibe: VibeLevel;
  total_volume: number;
  total_sets: number;
  duration_minutes: number;
}

/** Vibe-based rep/set multipliers */
export const VIBE_MULTIPLIERS: Record<VibeLevel, { sets: number; reps: number }> = {
  low: { sets: 0.75, reps: 0.8 },
  normal: { sets: 1, reps: 1 },
  crushing: { sets: 1.25, reps: 1.15 },
};
