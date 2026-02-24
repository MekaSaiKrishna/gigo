# README_CLAUDE.MD — GiGoFit (Current State)

> Last updated: 2026-02-23 | Branch: main

## Overview
GiGoFit is an Expo + React Native workout tracker with local SQLite persistence, session recovery, analytics, workout history, and a post-session shareable summary flow. All data is stored on-device — no backend, no accounts.

---

## Stack
- Expo Router v3 (file-based navigation)
- NativeWind v4 + Tailwind CSS
- `expo-sqlite` v16 (WAL mode, New Architecture)
- `react-native-reanimated` v3
- Custom SVG charts (`react-native-svg`) — victory-native not used
- `react-native-view-shot` + `expo-sharing`
- `lottie-react-native`
- Jest + React Native Testing Library

---

## Core Data Model

```sql
sessions (id, start_time INTEGER, end_time INTEGER, vibe INTEGER, elapsed_time INTEGER, is_paused INTEGER)
sets     (id, session_id INTEGER FK→sessions, exercise_id INTEGER FK→exercises, weight REAL, reps INTEGER, created_at TEXT)
exercises(id, name TEXT, muscle_group TEXT, category TEXT)
```

Required indexes created at DB init:
- `idx_sessions_start_time`
- `idx_sets_session_id`
- `idx_sets_exercise_id`

Vibe stored as integer: `low=0`, `normal=1`, `crushing=2`.

---

## Database Layer (`src/lib/database.ts`)

### Migration System
- Uses `PRAGMA user_version` for versioned sequential migrations.
- `CURRENT_DB_VERSION = 3`, `DB_MIGRATIONS` array maps version N→N+1.
- `runMigrations()` reads current version, runs only pending migrations, increments version after each.
- **NEVER modify existing migration entries — only append new ones.**

Current migration chain:
```
0→1  migrateLegacySessionsIfNeeded   (legacy schema with started_at/ended_at columns)
1→2  ensureSessionTimerColumns        (adds elapsed_time, is_paused)
2→3  ensureSetsCascadeDelete          (adds ON DELETE CASCADE to sets.session_id FK)
```

### Key APIs
- `startSession(vibe)` → `sessionId`
- `endSession(sessionId)` — single-statement end (use `endSessionWithTimer` for full end flow)
- `endSessionWithTimer(sessionId, elapsedTime)` — **atomic transaction**: saves elapsed time + sets end_time in one `withTransactionAsync` call
- `getActiveSession()` → active session or null
- `updateSessionTimer(sessionId, elapsedTime, isPaused)` — called periodically during workout
- `addSet(sessionId, exerciseId, weight, reps)` → setId
- `updateSet(setId, weight, reps)`
- `deleteSet(setId)`
- `getGhostValues(exerciseId)` → `{ weight, reps }` from most recent set for that exercise
- `getSessionVolume(sessionId)` → total volume for session
- `getTotalVolume()` → all-time volume
- `getSessionsForMonth(year, month)` → completed sessions in that calendar month
- `getSetDetailsForSession(sessionId)` → sets with exercise name joined
- `hardDeleteSession(sessionId)` — cascades to delete all sets via FK

---

## Analytics Layer (`src/lib/analytics.ts`)

SQL-only aggregation from raw `sessions` + `sets`. No summary tables.

| Function | Returns |
|---|---|
| `getWeeklyVolume(weeks = 8)` | `{ week, total_volume }[]` — chronological |
| `getMonthlyVolume(months = 12)` | `{ month, total_volume }[]` — chronological |
| `getExerciseWeeklyMax(exerciseId)` | `{ week, max_weight }[]` |
| `getExerciseWeeklyEstimated1RM(exerciseId)` | `{ week, max_estimated_1rm }[]` — Epley formula: `weight * (1 + reps/30.0)` |
| `detectNewPR(sessionId)` | `{ exerciseId, type, value }[]` — types: `weight`, `volume`, `1rm` |
| `getMonthlyPRSummary(referenceTimeMs?)` | `{ exerciseId, type, value, sessionId }[]` |
| `getPersonalRecords()` | `{ exercise_id, exercise_name, muscle_group, max_weight }[]` |
| `getCoachingComparisonToPreviousSession(volume, vibe)` | coaching outcome object |

Coaching categories:
- `legendary_start` — no prior completed session
- `outdone` — current > previous × 1.05
- `consistent` — current ≥ previous × 0.9
- `encouragement` — otherwise
- Low-energy consistency bonus: appends `"Elite discipline today."` to consistent outcome

---

## Utility Layer (`src/utils/date-format.ts`)

All formatting lives here — do not duplicate in screen files:

| Export | Description |
|---|---|
| `formatDuration(seconds)` | `"01:23:45"` |
| `formatVibeLabel(vibe)` | `"Low Energy"` / `"Normal"` / `"Crushing It"` |
| `formatSessionDate(ms)` | `"23, February, 2026"` |
| `formatSessionDateTime(ms)` | `"23 February, 2026 • 09:41 AM"` |
| `formatSessionTime(ms)` | `"09:41 AM"` |
| `formatWeekLabel(weekKey)` | `"2026-08"` → `"Feb 2026"` |
| `formatMonthLabel(monthKey)` | `"2026-02"` → `"Feb 2026"` |

---

## App Flows

### Home (`app/index.tsx`)
- `useFocusEffect` calls `getActiveSession()` wrapped in `try/finally` — loading state always resolves.
- Shows `Resume Session` (with elapsed time) or `Start Session`.
- Buttons to navigate to Exercise Library, Analytics, and The Ascent.

### Vibe Check (`app/vibe-check.tsx`)
- Three vibe cards. Session creation in DB before navigating to workout.
- Navigation to `/workout?sessionId=X&vibe=Y` only after `startSession()` succeeds.

### Workout (`app/workout.tsx`)
- URL params: `sessionId` (validated as finite number), `vibe` (validated against `VALID_VIBES = ["low", "normal", "crushing"]`, defaults to `"normal"`).
- Input limits: weight 0–1000, reps 1–999.
- Exercise picker is a `SectionList` grouped by muscle group.
- Ghosting: `getGhostValues(exerciseId)` auto-fills weight/reps on exercise select.
- Timer: `Interval` ticks every second. Throttled persist every 5 s via `updateSessionTimer`. Immediate persist on pause/unmount. **Session end uses `endSessionWithTimer` (atomic transaction).**
- Timer persist catch logs with `console.warn` (no silent swallowing).
- Export: 1080×1080 PNG captured via `captureRef`, shared via `expo-sharing`. Export errors are logged with `console.warn`.

### Analytics (`app/analytics.tsx`)
- Four sections: Weekly Volume, Monthly Volume, Exercise Trend, PR Summary.
- History calendar below charts using `react-native-calendars`.
- Chart data (`weeklyData`, `monthlyData`, `maxData`, `current1RM`) wrapped in `useMemo`.
- Analytics queries wrapped in `try/catch`; chart areas render empty on error.
- Vibe labels and duration formatting imported from `src/utils/date-format.ts`.

---

## Root Layout (`app/_layout.tsx`)
- `RootErrorBoundary` class component wraps entire navigator.
- On unhandled render error: shows branded recovery screen with "Try again" button.
- Logs error + component stack to console.

---

## Components

### `ExerciseDemo.tsx`
- Props: `exerciseName: string`
- Looks up URL in `EXERCISE_DEMO_GIFS` map.
- Shows `ActivityIndicator` while loading, emoji fallback on error or unknown exercise.

### `SummaryCard.tsx`
- Rendered into `ViewShot` ref for PNG export.
- Shows: date, duration, vibe, total volume, per-exercise set summary.

### `HistoryDetailModal.tsx`
- Modal for past session detail.
- Imports `formatDuration`, `formatVibeLabel`, `formatSessionDateTime` from `src/utils/date-format.ts`.

---

## Constants & Types (`src/types.ts`, `src/constants/theme.ts`)

```ts
type VibeLevel = "low" | "normal" | "crushing";
// VIBE_MULTIPLIERS exported from src/types.ts (runtime constant — move to src/constants/ in Phase 3)
```

Theme colors live in `src/constants/theme.ts`. Charts must use these — no inline hex values.

---

## Testing

```bash
~/.nvm/versions/node/v20.20.0/bin/node node_modules/.bin/jest --no-coverage
```

Current test files:
- `__tests__/analytics.test.ts` — 17 tests covering weekly/monthly grouping, PR detection, 1RM formula, coaching engine, `getMonthlyPRSummary`
- `__tests__/HomeScreen.test.tsx`
- `__tests__/WorkoutScreen.test.tsx`
- `__tests__/VibeCheck.test.tsx`
- `__tests__/ExerciseDemo.test.tsx`

---

## App Configuration (`app.json`)

Key fields set:
- `ios.bundleIdentifier: "com.gigofit.app"`
- `ios.buildNumber: "1"`
- `ios.deploymentTarget: "16.0"`
- `ios.supportsTablet: false`
- `ios.infoPlist`: photo library usage descriptions
- `ios.privacyManifests`: FileTimestamp + UserDefaults reasons
- `android.package: "com.gigofit.app"`
- `android.versionCode: 1`
- `android.minSdkVersion: 21`
- `android.permissions`: WRITE_EXTERNAL_STORAGE, READ_EXTERNAL_STORAGE

EAS build configured in `eas.json` with `development`, `preview`, `production` profiles.

---

## What Is NOT Implemented (Stub Screens)

| Screen | File | Status |
|---|---|---|
| Exercise Library | `app/exercises.tsx` | Placeholder text |
| The Ascent | `app/ascent.tsx` | Hard-coded 0m display |
| Share the Peak | — | Not implemented |
| Anatomical heatmaps | — | GIF URLs only (Tenor CDN) |
| Vibe multiplier applied | `app/workout.tsx` | Multiplier read but not applied |

---

## Run

```bash
npm install
npm start
npm test
npm run test:watch
npm run test:coverage
```

_________
## Phase 2.6 — The Ascent Visualization

### Visual Gamification
- **The Mountain:** Implemented a smooth, mathematical hill using a quadratic Bezier curve (`react-native-svg`).
- **The "Soul" Orb:** A glowing, animated circle representing the current workout's "Vibe" height.
- **The Ghost Orb:** A semi-transparent "Ghost" orb representing the peak height of the previous session, providing a direct visual benchmark.
- **Dynamic Mapping:** Orb height is calculated as a percentage of the mountain slope based on the `vibe` multiplier (1-5).

### Key Files
- `app/ascent.tsx` — Visualization logic and Reanimated sequences.

## Phase 2.7 — The Ascent (Vector Implementation)

### Visual Architecture
- **Zero-Asset Visualization:** Switched to code-defined SVG geometry using `react-native-svg` for maximum performance and zero storage footprint.
- **Mathematical Hill:** A smooth quadratic Bezier curve path represents the workout "climb."
- **Dual-Orb Logic:** - **Active Soul:** A glowing Emerald orb representing the current session's Vibe.
    - **Previous Ghost:** A faint Slate orb fixed at the last session's Vibe peak for direct comparison.
- **Bezier Mapping:** Implemented a parametric equation to ensure orbs sit precisely on the curve's edge regardless of the climb height.

### Key Logic
- `vibeToProgress(vibe)`: Maps 1–5 scale to 0.1–1.0 progress on the Bezier path.
- `getPreviousSessionVibe()`: New SQL helper to retrieve the ghost orb's coordinates.