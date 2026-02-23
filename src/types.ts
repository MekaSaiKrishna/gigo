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

/** Vibe-based rep/set multipliers */
export const VIBE_MULTIPLIERS: Record<VibeLevel, { sets: number; reps: number }> = {
  low: { sets: 0.75, reps: 0.8 },
  normal: { sets: 1, reps: 1 },
  crushing: { sets: 1.25, reps: 1.15 },
};
