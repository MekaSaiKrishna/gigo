import type { MuscleGroup } from "../types";

/** Display labels for muscle group headings */
export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  legs: "Legs",
  glutes: "Glutes",
  core: "Core",
  forearms: "Forearms",
  full_body: "Full Body",
};

/** Ordered list of muscle groups for the section list */
export const MUSCLE_GROUP_ORDER: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "legs",
  "glutes",
  "core",
  "forearms",
  "full_body",
];

/**
 * Placeholder demo GIF URLs for each exercise.
 * These use free, publicly-available exercise illustration GIFs.
 * Replace with your own assets or a CDN as the app matures.
 */
export const EXERCISE_DEMO_GIFS: Record<string, string> = {
  // Chest
  "Bench Press": "https://media.tenor.com/bRE0x0z3IlMAAAAM/exercise-fitness.gif",
  "Incline Dumbbell Press": "https://media.tenor.com/EY3vUUMFoYMAAAAM/incline-press.gif",
  "Dumbbell Fly": "https://media.tenor.com/ZRuvfmq-M3EAAAAM/dumbbell-fly.gif",
  "Cable Crossover": "https://media.tenor.com/oSFIM0Xs5BMAAAAM/cable-crossover.gif",
  "Push-Up": "https://media.tenor.com/a-E3jRqkq1EAAAAM/push-up.gif",

  // Back
  "Deadlift": "https://media.tenor.com/re8RM_5LjJkAAAAM/deadlift.gif",
  "Barbell Row": "https://media.tenor.com/5YWCY4G0TDkAAAAM/barbell-row.gif",
  "Pull-Up": "https://media.tenor.com/UvYO3JuE8rkAAAAM/pull-up.gif",
  "Lat Pulldown": "https://media.tenor.com/F5H-a-R3KdEAAAAM/lat-pulldown.gif",
  "Seated Cable Row": "https://media.tenor.com/Wr14GVhXcvQAAAAM/seated-cable-row.gif",
  "Face Pull": "https://media.tenor.com/cFAhHCM4i_UAAAAM/face-pull.gif",

  // Shoulders
  "Overhead Press": "https://media.tenor.com/XJhT3-LI544AAAAM/overhead-press.gif",
  "Dumbbell Lateral Raise": "https://media.tenor.com/d3mWJhTaZLoAAAAM/lateral-raise.gif",
  "Front Raise": "https://media.tenor.com/L5mfR1NRUZIAAAAM/front-raise.gif",
  "Arnold Press": "https://media.tenor.com/vZoaJ1vBfkcAAAAM/arnold-press.gif",
  "Reverse Fly": "https://media.tenor.com/QDUlH3m6r-cAAAAM/reverse-fly.gif",

  // Biceps
  "Barbell Curl": "https://media.tenor.com/kK4Y4bPDBqUAAAAM/barbell-curl.gif",
  "Dumbbell Curl": "https://media.tenor.com/NVUQ3gGxeVkAAAAM/dumbbell-curl.gif",
  "Hammer Curl": "https://media.tenor.com/WgKlwFC-3v0AAAAM/hammer-curl.gif",
  "Preacher Curl": "https://media.tenor.com/2l5QVxAjyK4AAAAM/preacher-curl.gif",

  // Triceps
  "Tricep Dip": "https://media.tenor.com/YWrYB_j3D8EAAAAM/tricep-dip.gif",
  "Skull Crusher": "https://media.tenor.com/uX8XQPPpJWcAAAAM/skull-crusher.gif",
  "Tricep Pushdown": "https://media.tenor.com/I4VwSqW1MfcAAAAM/tricep-pushdown.gif",
  "Overhead Tricep Extension": "https://media.tenor.com/mwHyBcIvvYcAAAAM/tricep-extension.gif",

  // Legs
  "Barbell Squat": "https://media.tenor.com/Re3JY0YQUfEAAAAM/squat.gif",
  "Leg Press": "https://media.tenor.com/IUomfv1FJBAAAAAM/leg-press.gif",
  "Romanian Deadlift": "https://media.tenor.com/cuvTpLZvnN4AAAAM/romanian-deadlift.gif",
  "Leg Extension": "https://media.tenor.com/LYcZ0fJqKR0AAAAM/leg-extension.gif",
  "Leg Curl": "https://media.tenor.com/LpJYOUV3kzQAAAAM/leg-curl.gif",
  "Calf Raise": "https://media.tenor.com/0Dc5FnMM1zoAAAAM/calf-raise.gif",
  "Bulgarian Split Squat": "https://media.tenor.com/gvSnPMpnYHIAAAAM/bulgarian-split-squat.gif",

  // Glutes
  "Hip Thrust": "https://media.tenor.com/0Yf-RZxn1xoAAAAM/hip-thrust.gif",
  "Glute Bridge": "https://media.tenor.com/wQp7_s1-VqAAAAAM/glute-bridge.gif",
  "Cable Kickback": "https://media.tenor.com/hCxRVhv5gf8AAAAM/cable-kickback.gif",

  // Core
  "Plank": "https://media.tenor.com/kJFz8s-bN7kAAAAM/plank.gif",
  "Hanging Leg Raise": "https://media.tenor.com/fRFzVfCnCY8AAAAM/hanging-leg-raise.gif",
  "Cable Crunch": "https://media.tenor.com/8p5PJC5MU3IAAAAM/cable-crunch.gif",
  "Ab Wheel Rollout": "https://media.tenor.com/A7Da0WnHqQYAAAAM/ab-wheel.gif",
  "Russian Twist": "https://media.tenor.com/JHkpHMk6ECUAAAAM/russian-twist.gif",

  // Forearms
  "Wrist Curl": "https://media.tenor.com/4fJ9FXaR1h8AAAAM/wrist-curl.gif",
  "Farmer's Walk": "https://media.tenor.com/2kp3uU-LsWgAAAAM/farmers-walk.gif",

  // Full Body
  "Burpee": "https://media.tenor.com/heh_FRgHbOIAAAAM/burpee.gif",
};
