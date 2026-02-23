import type { MuscleGroup, ExerciseCategory } from "../types";

interface SeedExercise {
  name: string;
  muscle_group: MuscleGroup;
  category: ExerciseCategory;
}

export const EXERCISE_SEED: SeedExercise[] = [
  // Chest (5)
  { name: "Bench Press", muscle_group: "chest", category: "compound" },
  { name: "Incline Dumbbell Press", muscle_group: "chest", category: "compound" },
  { name: "Dumbbell Fly", muscle_group: "chest", category: "isolation" },
  { name: "Cable Crossover", muscle_group: "chest", category: "isolation" },
  { name: "Push-Up", muscle_group: "chest", category: "bodyweight" },

  // Back (6)
  { name: "Deadlift", muscle_group: "back", category: "compound" },
  { name: "Barbell Row", muscle_group: "back", category: "compound" },
  { name: "Pull-Up", muscle_group: "back", category: "bodyweight" },
  { name: "Lat Pulldown", muscle_group: "back", category: "compound" },
  { name: "Seated Cable Row", muscle_group: "back", category: "compound" },
  { name: "Face Pull", muscle_group: "back", category: "isolation" },

  // Shoulders (5)
  { name: "Overhead Press", muscle_group: "shoulders", category: "compound" },
  { name: "Dumbbell Lateral Raise", muscle_group: "shoulders", category: "isolation" },
  { name: "Front Raise", muscle_group: "shoulders", category: "isolation" },
  { name: "Arnold Press", muscle_group: "shoulders", category: "compound" },
  { name: "Reverse Fly", muscle_group: "shoulders", category: "isolation" },

  // Biceps (4)
  { name: "Barbell Curl", muscle_group: "biceps", category: "isolation" },
  { name: "Dumbbell Curl", muscle_group: "biceps", category: "isolation" },
  { name: "Hammer Curl", muscle_group: "biceps", category: "isolation" },
  { name: "Preacher Curl", muscle_group: "biceps", category: "isolation" },

  // Triceps (4)
  { name: "Tricep Dip", muscle_group: "triceps", category: "bodyweight" },
  { name: "Skull Crusher", muscle_group: "triceps", category: "isolation" },
  { name: "Tricep Pushdown", muscle_group: "triceps", category: "isolation" },
  { name: "Overhead Tricep Extension", muscle_group: "triceps", category: "isolation" },

  // Legs (7)
  { name: "Barbell Squat", muscle_group: "legs", category: "compound" },
  { name: "Leg Press", muscle_group: "legs", category: "compound" },
  { name: "Romanian Deadlift", muscle_group: "legs", category: "compound" },
  { name: "Leg Extension", muscle_group: "legs", category: "isolation" },
  { name: "Leg Curl", muscle_group: "legs", category: "isolation" },
  { name: "Calf Raise", muscle_group: "legs", category: "isolation" },
  { name: "Bulgarian Split Squat", muscle_group: "legs", category: "compound" },

  // Glutes (3)
  { name: "Hip Thrust", muscle_group: "glutes", category: "compound" },
  { name: "Glute Bridge", muscle_group: "glutes", category: "bodyweight" },
  { name: "Cable Kickback", muscle_group: "glutes", category: "isolation" },

  // Core (5)
  { name: "Plank", muscle_group: "core", category: "bodyweight" },
  { name: "Hanging Leg Raise", muscle_group: "core", category: "bodyweight" },
  { name: "Cable Crunch", muscle_group: "core", category: "isolation" },
  { name: "Ab Wheel Rollout", muscle_group: "core", category: "bodyweight" },
  { name: "Russian Twist", muscle_group: "core", category: "bodyweight" },

  // Forearms (2)
  { name: "Wrist Curl", muscle_group: "forearms", category: "isolation" },
  { name: "Farmer's Walk", muscle_group: "forearms", category: "compound" },

  // Full Body (1)
  { name: "Burpee", muscle_group: "full_body", category: "cardio" },
];
