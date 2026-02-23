# README_CLAUDE.MD — Build Log

## Phase 1 — Project Scaffold

Scaffolded the entire GiGoFit Expo project from an empty repo into a runnable, testable React Native app.

### Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Navigation | Expo Router v6 | File-based routing — each file in `app/` is a screen |
| Styling | NativeWind v4 + Tailwind 3.4 | Utility-first CSS via `className` props in React Native |
| Database | expo-sqlite | Local-only persistence for exercises, sessions, and sets |
| Key-value store | AsyncStorage | Lightweight local storage for preferences |
| Animations | lottie-react-native | For future muscle-highlighting animations |
| Testing | Jest + React Native Testing Library | Component and unit tests |

### Key Decisions

1. **Expo Router over React Navigation** — file-based routing is simpler, each screen is just a file in `app/`.
2. **NativeWind disabled in test env** — `babel-preset-expo@54` + NativeWind's Babel plugin triggers a `.plugins` validation error in `@babel/core`. Solved by conditionally loading NativeWind plugins only outside of `NODE_ENV=test`.
3. **SQLite schema designed upfront** — three tables (`exercises`, `sessions`, `sets`) with foreign keys and a `vibe` constraint.
4. **Dark-first theme** — all colors defined once in `tailwind.config.js` and mirrored in `src/constants/theme.ts`.

---

## Phase 2 — Data Layer, Workout CRUD, Ghosting, Sectioned Picker, and Demo GIFs

Built the core data engine, full workout logging flow, grouped exercise picker, and exercise demo previews.

### Data Layer

**Exercise Seed Data** (`src/data/exercises.ts`)
- 42 exercises across 10 muscle groups seeded into SQLite on first launch.

**Data Access Layer** (`src/lib/database.ts`)
- `startSession(vibe)` / `endSession(id)` — create and close workout sessions.
- `addSet()` / `deleteSet()` — log and remove individual sets.
- `getGhostValues(exerciseId)` — fetch last weight/reps for any exercise.
- `getSessionVolume()` / `getTotalVolume()` — real-time volume tracking.

**Shared Types** (`src/types.ts`)
- `VibeLevel`, `Exercise`, `Session`, `WorkoutSet`, `GhostValues`, `VIBE_MULTIPLIERS`.

### Workout Screen

Full workout UI in `app/workout.tsx` — exercise picker, weight/rep inputs, live set list with delete, running volume counter, vibe multiplier display, and "End Session" confirmation dialog.

**Ghosting** — Selecting an exercise auto-fills the weight and rep fields with the last values used. Zero friction.

### Exercise Picker — Grouped by Body Part

The exercise picker uses a `SectionList` with sticky headers grouped by muscle group:

| Section | Exercises |
|---|---|
| **Chest** | Bench Press, Incline Dumbbell Press, Dumbbell Fly, Cable Crossover, Push-Up |
| **Back** | Deadlift, Barbell Row, Pull-Up, Lat Pulldown, Seated Cable Row, Face Pull |
| **Shoulders** | Overhead Press, Dumbbell Lateral Raise, Front Raise, Arnold Press, Reverse Fly |
| **Biceps** | Barbell Curl, Dumbbell Curl, Hammer Curl, Preacher Curl |
| **Triceps** | Tricep Dip, Skull Crusher, Tricep Pushdown, Overhead Tricep Extension |
| **Legs** | Barbell Squat, Leg Press, Romanian Deadlift, Leg Extension, Leg Curl, Calf Raise, Bulgarian Split Squat |
| **Glutes** | Hip Thrust, Glute Bridge, Cable Kickback |
| **Core** | Plank, Hanging Leg Raise, Cable Crunch, Ab Wheel Rollout, Russian Twist |
| **Forearms** | Wrist Curl, Farmer's Walk |
| **Full Body** | Burpee |

Key files:
- `src/data/exercise-meta.ts` — `MUSCLE_GROUP_LABELS`, `MUSCLE_GROUP_ORDER`, and `EXERCISE_DEMO_GIFS` mapping.
- Section headers render as sticky uppercase labels in the primary color.
- Exercises within each section show name + category (compound/isolation/bodyweight).

### Exercise Demo GIFs

When you select an exercise from the picker, a **placeholder demo GIF** appears below the weight/rep inputs showing proper form.

**How it works:**
- `src/data/exercise-meta.ts` maps every exercise name to a placeholder GIF URL.
- `src/components/ExerciseDemo.tsx` renders the GIF with a loading spinner and error fallback.
- If the GIF fails to load or no URL exists, a graceful fallback shows "Demo coming soon for [exercise]".
- The demo only appears when an exercise is selected — otherwise the space is given to the set list.

**To replace with real assets later:**
1. Drop your own GIFs into `assets/demos/` or host them on a CDN.
2. Update the URLs in `EXERCISE_DEMO_GIFS` in `src/data/exercise-meta.ts`.
3. For offline support, switch `Image` source from `{ uri }` to `require()` with local files.

---

## Current File Structure

```
app/
  _layout.tsx               Root layout — dark theme, Stack navigator
  index.tsx                 Home screen — Start Session, Exercises, Ascent
  vibe-check.tsx            Energy selector -> creates DB session -> navigates
  workout.tsx               Workout screen with sectioned picker + demo GIFs
  exercises.tsx             Exercise library placeholder
  ascent.tsx                Altitude tracker placeholder

src/
  types.ts                  Shared types + vibe multipliers
  data/exercises.ts         42-exercise seed data
  data/exercise-meta.ts     Muscle group labels, ordering, demo GIF URLs
  components/ExerciseDemo.tsx   GIF demo viewer with loading/error states
  lib/database.ts           SQLite init, seeding, and all CRUD functions
  constants/theme.ts        Color palette + peak height constant

__tests__/
  HomeScreen.test.tsx       4 tests
  VibeCheck.test.tsx        3 tests
  WorkoutScreen.test.tsx    7 tests — picker sections, demo rendering, vibe
  ExerciseDemo.test.tsx     2 tests — known exercise, fallback for unknown
  exercises.test.ts         4 tests — seed count, fields, groups, no duplicates
  exercise-meta.test.ts     4 tests — labels, ordering, GIF coverage, URL validity
  types.test.ts             3 tests — vibe multiplier checks
```

## How to Run

```bash
npm start              # Dev server — scan QR with Expo Go
npm test               # Run all 27 tests
npm run test:watch     # Re-run on save
npm run test:coverage  # Coverage report
```

## Test Results

```
Test Suites: 7 passed, 7 total
Tests:       27 passed, 27 total
```
