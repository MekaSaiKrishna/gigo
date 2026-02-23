# GiGoFit 🏔️
Minimalist Fitness. Maximum Ascent.

GiGoFit is a zero-friction, privacy-first fitness utility designed for those who want to spend more time lifting and less time scrolling. No accounts, no ads—just you and the mountain.

## The Philosophy: "Zero Friction"
In 2026, fitness apps have become bloated. GiGoFit strips away the noise:

- No Login: Open the app and start your first set in under 3 seconds.
- Local First: Your data never leaves your device. No cloud, no tracking.
- Anatomical Intelligence: 3D-style "Red-Heatmap" animations show you exactly what muscle to target without the fluff.

## Key Features
- The Ascent: This is the place where your progress is tracked and summarized as visual charts and graphs that are easy to comprehend and at the top is a pixel character that is climbing a mountain resembling the progress that you are making in the workouts, Your total lifted volume is mapped to vertical meters of the pixel character and the vibe of the workout determines the weather of the mountain while climbing. Watch your pixel character climb as you progress.
- Vibe-Check Toggle: Start your session by selecting Low Energy, Normal, or Crushing It. The app dynamically adjusts your sets/reps based on how you feel right now.
- Micro-Guidance Library: 42 essential exercises with high-contrast muscle-highlighting animations categorized based on which body part they focus on.
- Ghosting: Automatic recall of your last weight and reps directly in the input fields. No more digging through history.
- Share the Peak: Generate 1:1 vertical downloadable image showing your current altitude and daily gains.
- Have a weekly summary chart image which is downloadable
- Have a monthly summary chart image which is downloadable
- Have a yearly summary chart image which is downlodable

## Tech Stack
- Framework: React Native + Expo
- Animations: Lottie (JSON-based vector animations)
- Storage: SQLite / AsyncStorage (Local-only persistence)
- Styling: Tailwind CSS (NativeWind)
- Visuals: Custom Pixel Art Assets

___
## Phase 2.1 Local Analytics Engine

**Objective**
Implement a performant, fully local, SQLite-powered analytics engine that provides:
Weekly volume charts
Monthly volume charts
Exercise-specific weekly strength trends
PR detection and monthly PR summary
Indexed time-based aggregation
Zero redundant storage
Deterministic chart rendering
All analytics must derive from raw sessions and sets tables using SQL aggregation only.
No summary tables allowed.

1️⃣ Database Requirements

**Sessions Table**

Ensure schema:
```
sessions (
  id INTEGER PRIMARY KEY,
  start_time INTEGER NOT NULL, -- Unix ms timestamp
  end_time INTEGER,
  vibe INTEGER NOT NULL
)
```

**Sets Table**

Must include:
```
sets (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL,
  exercise_id INTEGER NOT NULL,
  weight REAL NOT NULL,
  reps INTEGER NOT NULL,
  FOREIGN KEY(session_id) REFERENCES sessions(id)
)
```

**Indexing (Mandatory)**

On DB initialization:
```
CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_sets_session_id ON sets(session_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise_id ON sets(exercise_id);
```
Indexes must be created during initDatabase().

2️⃣ Analytics Query Layer

All analytics functions must live in:

src/lib/analytics.ts

This file must not contain UI logic.

### 2.1 Weekly Volume

Return last N weeks of total training volume.

export async function getWeeklyVolume(weeks: number = 8)

SQL:
```
SELECT
  strftime('%Y-%W', datetime(s.start_time / 1000, 'unixepoch')) AS week,
  SUM(sets.weight * sets.reps) AS total_volume
FROM sessions s
JOIN sets ON sets.session_id = s.id
GROUP BY week
ORDER BY week DESC
LIMIT ?
```
Return chronological order.

### 2.2 Monthly Volume

export async function getMonthlyVolume(months: number = 12)

SQL:
```
SELECT
  strftime('%Y-%m', datetime(s.start_time / 1000, 'unixepoch')) AS month,
  SUM(sets.weight * sets.reps) AS total_volume
FROM sessions s
JOIN sets ON sets.session_id = s.id
GROUP BY month
ORDER BY month DESC
LIMIT ?
```

### 2.3 Exercise Weekly PR Trend

export async function getExerciseWeeklyMax(exerciseId: number)

SQL:
```
SELECT
  strftime('%Y-%W', datetime(s.start_time / 1000, 'unixepoch')) AS week,
  MAX(sets.weight) AS max_weight
FROM sessions s
JOIN sets ON sets.session_id = s.id
WHERE sets.exercise_id = ?
GROUP BY week
ORDER BY week ASC
```

### 2.4 Estimated 1RM Weekly Trend

Use Epley formula: 1RM = weight * (1 + reps / 30)

SQL:
```
MAX(sets.weight * (1 + sets.reps / 30.0))
```

3️⃣ PR Detection Engine

Create: export async function detectNewPR(sessionId: number)

Logic:

- Compare each set in session
- Against historical max weight for that exercise
- Return array of new PR events

PR Types:

- Heaviest weight ever
- Highest volume set
- Highest estimated 1RM

Return:
```
{
  exerciseId: number,
  type: 'weight' | 'volume' | '1rm',
  value: number
}[]
```

4️⃣ Analytics Screen

Create: app/analytics.tsx

Sections:

**Section 1 — Weekly Volume**

- Line chart
- Last 8 weeks

**Section 2 — Monthly Volume**

- Bar chart
- Last 12 months

**Section 3 — Exercise Strength Trend**

- Dropdown selector
- Line chart of weekly max

**Section 4 — Monthly PR Summary**
- List of PRs achieved this month

5️⃣ Charting Library

Use:

victory-native
react-native-svg

Must:

- Use dark theme colors from src/constants/theme.ts
- No inline color definitions
- Charts must be responsive
- X-axis labels formatted cleanly

6️⃣ Date Formatting Utilities

Create: src/utils/date-format.ts

Functions:
```
formatWeekLabel('2026-08') -> 'Feb 2026'
formatMonthLabel('2026-02') -> 'Feb 2026'
```
No raw SQL strings displayed to user.

7️⃣ Testing Requirements

Add: __tests__/analytics.test.ts

Must test:

- Weekly grouping correctness
- Monthly grouping correctness
- PR detection logic
- 1RM formula accuracy
- Chronological ordering
- Minimum 8 tests.

8️⃣ Performance Requirements

- Queries must execute under 50ms with 5 years of data
- No redundant summary tables
- No data duplication
- All grouping must occur in SQL, not JS

9️⃣ Future Extensibility

Prepare for:

- Cloud sync later
- Data export (CSV)
- Multi-device aggregation
- Do not hardcode limits in SQL beyond function parameters.

1️⃣0️⃣ Completion Criteria

Phase 2.1 complete when:

- Weekly and monthly charts render correctly
- PR detection triggers correctly
- Analytics screen passes all tests
- No performance degradation after 10,000 sets
- All tests pass












































