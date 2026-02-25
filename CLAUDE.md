# GiGoFit 🏔️
Minimalist Fitness. Maximum Ascent.

GiGoFit is a zero-friction, privacy-first fitness utility designed for those who want to spend more time lifting and less time scrolling. No accounts, no ads—just you and the mountain.

## The Philosophy: "Zero Friction"
In 2026, fitness apps have become bloated. GiGoFit strips away the noise:

- No Login: Open the app and start your first set in under 3 seconds.
- Local First: Your data never leaves your device. No cloud, no tracking.

## Key Features
- The Ascent: This is the place where your progress is tracked and summarized as visual charts and graphs that are easy to comprehend and at the top is a pixel character that is climbing a mountain resembling the progress that you are making in the workouts, Your total lifted volume is mapped to vertical meters of the pixel character and the vibe of the workout determines the weather of the mountain while climbing. Watch your pixel character climb as you progress.
- Vibe-Check Toggle: Start your session by selecting Low Energy, Normal, or Crushing It. The app dynamically adjusts your sets/reps based on how you feel right now.
- Micro-Guidance Library: 42 essential exercises with high-contrast muscle-highlighting animations categorized based on which body part they focus on.
- Ghosting: Automatic recall of your last weight and reps directly in the input fields. No more digging through history.
- Share the Peak: Generate 1:1 vertical downloadable image showing your current altitude and daily gains.
- Have a weekly summary chart image which is downloadable
- Have a monthly summary chart image which is downloadable
- Have a yearly summary chart image which is downloadable

## Tech Stack
- Framework: React Native + Expo (New Architecture)
- Animations: Lottie (JSON-based vector animations)
- Storage: expo-sqlite v16 (WAL mode, local-only persistence)
- Styling: Tailwind CSS (NativeWind v4)
- Visuals: Custom Pixel Art Assets

---

## Completed Phases

### Phase 2.1 — Local Analytics Engine ✅

All analytics queries live in `src/lib/analytics.ts` and derive from raw `sessions` + `sets` via SQL aggregation only. No summary tables.

- `getWeeklyVolume(weeks = 8)` — last N weeks, chronological
- `getMonthlyVolume(months = 12)` — last N months, chronological
- `getExerciseWeeklyMax(exerciseId)` — weekly max weight per exercise
- `getExerciseWeeklyEstimated1RM(exerciseId)` — Epley formula: `weight * (1 + reps/30.0)`
- `detectNewPR(sessionId)` — returns `{ exerciseId, type, value }[]` (types: `weight`, `volume`, `1rm`)
- `getMonthlyPRSummary(referenceTimeMs?)` — all PRs in the current calendar month with `sessionId` attached
- `getPersonalRecords()` — all-time max weight per exercise, grouped by muscle group

DB indexes created at init: `idx_sessions_start_time`, `idx_sets_session_id`, `idx_sets_exercise_id`

Analytics tests: `__tests__/analytics.test.ts` — 17 tests passing.

### Phase 2.4 — Workout History & Calendar ✅

- Calendar view in Analytics tab (`react-native-calendars`) with workout-day dots
- Session list on date tap
- History Detail Modal with full set breakdown, duration, vibe
- Session deletion with cascade (ON DELETE CASCADE) and automatic PR recalculation

### Phase 2.5 — Dynamic PR Engine ✅

- Real-time `MAX(weight)` queries — no static PR storage
- PRs auto-recalculate when a session is deleted
- Sectioned PR board grouped by muscle group

### Phase 2.6 — Code Quality & Stability ✅ (Feb 2026 Audit Fixes)

- `PRAGMA user_version` migration runner — migrations run only once, sequential, versioned
- `endSessionWithTimer()` — atomic `withTransactionAsync` for timer + end_time
- Root-level React error boundary (`RootErrorBoundary` in `app/_layout.tsx`)
- All formatting utilities consolidated into `src/utils/date-format.ts` (no duplication)
- Vibe URL param validated against allowed values before cast
- Input constraints: weight 0–1000, reps 1–999
- `useMemo` on all chart data computations in analytics screen
- Export resolution reduced to 1080×1080; export errors logged
- `app.json` — all required App Store / Play Store fields populated
- `eas.json` — build profiles for development, preview, production

---

## Phase 3 — Exercise Library

**Objective:** Replace the "Coming in Phase 3" placeholder with a full, browsable exercise library.

**File:** `app/exercises.tsx`

### Requirements

1. **Browsable List**
   - Display all 42 exercises from the `exercises` SQLite table (seeded via `src/data/exercises.ts`)
   - Group by muscle group using `SectionList` with sticky headers
   - Each row: exercise name + muscle group badge
   - Use `MUSCLE_GROUP_LABELS` and `MUSCLE_GROUP_ORDER` from `src/data/exercise-meta.ts` for ordering and display

2. **Filter Chips**
   - Horizontal scrollable chip row above the list for each muscle group + "All"
   - Selecting a chip filters the list to that muscle group only
   - "All" shows every exercise

3. **Exercise Detail**
   - Tap any exercise to open a full-screen modal
   - Modal shows: exercise name, muscle group, GIF demo (reuse `ExerciseDemo` component), and brief form notes section

4. **Styling**
   - Dark theme consistent with the rest of the app (`bg-background`, `bg-surface`, `text-primary`)
   - Use theme colors from `src/constants/theme.ts` — no inline hex values

5. **No New DB Queries Needed**
   - Use `getAllExercises()` from `src/lib/database.ts` — already returns all 42 exercises ordered by `muscle_group, name`
   - Filter client-side in JS after fetch

6. **Testing**
   - Add `__tests__/ExerciseLibrary.test.tsx`
   - Test: renders all muscle group sections, filter chip reduces visible items, detail modal opens on tap

### Completion Criteria
- 42 exercises visible and browsable
- Filter chips work correctly
- Exercise demo modal opens with GIF and fallback
- Tests pass

---

## Phase 4 — The Ascent (Mountain Progress Screen)

**Objective:** Implement the signature product feature — a pixel character climbing a mountain that reflects real workout volume.

**File:** `app/ascent.tsx`

### Requirements

1. **Volume → Altitude Mapping**
   - Fetch `getTotalVolume()` from `src/lib/database.ts`
   - Map: `altitudeMeters = totalVolumeLb * 0.1` (1 lb = 0.1 m — adjustable constant)
   - Target summit: 8,848 m (Everest)
   - Display as `{altitude}m / 8,848m` with a progress percentage

2. **Pixel Character**
   - Custom pixel art character asset (PNG sprite sheet or Lottie)
   - Character position on screen maps linearly to altitude percentage
   - Animate character climbing (walking cycle) when new volume is detected

3. **Mountain Background**
   - Static layered mountain illustration
   - Weather layer (sky + clouds) changes based on most recent session vibe:
     - `low` → grey overcast clouds
     - `normal` → clear blue sky
     - `crushing` → dramatic golden-hour sky with wind lines

4. **Milestone Markers**
   - Base Camp: 5,364 m
   - Camp I: 6,065 m
   - Camp II: 6,500 m
   - Camp III: 7,162 m
   - Summit: 8,848 m
   - Show the next milestone name + meters remaining

5. **Data Refresh**
   - Use `useFocusEffect` to reload volume on tab focus

6. **Styling**
   - Full-screen immersive view; minimal UI chrome
   - Dark night/dusk palette for the mountain; accent colors for milestone text

### Completion Criteria
- Altitude updates after every completed session
- Character position reflects correct altitude percentage
- Weather changes with vibe
- Milestone label shows correct next checkpoint

---

## Standing Rules for All Phases

- All formatting (dates, duration, vibe labels) must be imported from `src/utils/date-format.ts` — never defined inline
- All chart colors must come from `src/constants/theme.ts` — no inline hex values
- All analytics queries live in `src/lib/analytics.ts` — no SQL in screen files
- All DB operations live in `src/lib/database.ts` — no raw SQLite calls in screens
- When adding a new DB migration: append to `DB_MIGRATIONS` in `database.ts` and increment `CURRENT_DB_VERSION`
- Input validation at screen boundary: sanitize and bound-check before any DB write
- New screens must be covered by at least basic render tests
- Do not create summary/cache tables — derive everything from `sessions` + `sets` via SQL

______
THESE MUST BE FOLLOWED AT ALL TIMES BY CLAUDE or CODEX! (NON-NEGOTIABLE)
## Workflow Orchestration
### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity
### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution
### 3. Self-Improvement Loop
- After ANY correction from the user: update 'tasks/lessons.md with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project
### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness
### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it
### 6. Autonomous Bug Fizing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how
## Task Management
1. **Plan First**: Write plan to 'tasks/todo.md' with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to 'tasks/todo.md*
6. **Capture Lessons**: Update 'tasks/lessons md after corrections
## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimat Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
______
