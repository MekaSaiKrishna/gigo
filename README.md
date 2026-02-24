# GiGoFit

**Minimalist Fitness. Maximum Ascent.**

GiGoFit is a zero-friction, privacy-first fitness tracker for iOS and Android. No accounts, no cloud, no ads — open the app and log your first set in under three seconds.

---

## Philosophy

> *"Spend more time lifting and less time scrolling."*

- **No Login** — sessions start instantly from the home screen
- **Local First** — all data lives on-device via SQLite, never leaves your phone
- **Zero Friction** — every tap goes somewhere useful

---

## Current Features

### Core Workout Flow
- **Vibe Check** — begin each session by selecting *Low Energy*, *Normal*, or *Crushing It*; the vibe is recorded alongside every set for coaching context
- **Exercise Picker** — sectioned list of 42 exercises grouped by muscle group (Chest, Back, Shoulders, Biceps, Triceps, Legs, Glutes, Core, Forearms, Full Body)
- **Set Logging** — log weight and reps per exercise; inputs validated with sensible limits (0–1000 lb / 1–999 reps)
- **Ghosting** — last used weight and reps auto-fill the input fields on each exercise, eliminating the need to remember your previous numbers
- **Live Timer** — HH:MM:SS session timer with pause/resume; state is persisted to SQLite every few seconds and recovered on session resume
- **Edit / Delete Sets** — swipe or tap to edit or remove any logged set with confirmation
- **Exercise GIF Demos** — each exercise shows a form demo GIF with a loading indicator and graceful fallback

### Session Recovery
- An interrupted or force-closed session resumes exactly where it left off, including elapsed time
- The home screen detects an active session and shows *Resume Session* automatically

### End-of-Session Experience
- **Coaching Message** — after ending a session the app compares your volume to your previous session and displays one of four outcomes: *Legendary Start*, *Outdid Yourself*, *Staying Consistent*, or *Encouragement*; a bonus line fires for low-energy consistency
- **Animated Affirmation** — word-by-word stagger animation for the coaching message
- **Confetti** — Lottie confetti burst fires when you beat your previous session
- **Summary Card** — a premium dark-themed card showing date, duration, vibe, total volume, and exercise breakdown; exported as a 1080×1080 PNG and shared via the native share sheet

### Analytics
- **Weekly Volume Chart** — line chart of the last 8 weeks of total training volume
- **Monthly Volume Chart** — bar chart of the last 12 months of total training volume
- **Exercise Strength Trend** — per-exercise weekly max weight line chart with dropdown selector
- **Estimated 1RM Trend** — Epley-formula weekly 1RM trend per exercise
- **PR Detection** — automatic detection of new heaviest weight, highest volume set, and highest estimated 1RM after each session
- **Monthly PR Summary** — list of all PRs achieved in the current calendar month
- **Personal Records Board** — current all-time max weight per exercise, sectioned by muscle group

### History
- **Calendar View** — minimalist dark calendar showing which days had completed workouts
- **Session List** — tap a date to see all sessions logged that day
- **History Detail Modal** — full workout report with exercise/set breakdown, duration, and vibe for any past session
- **Delete Workout** — permanently remove a session and all its sets with a confirmation prompt; PRs recalculate automatically

### Data Layer
- SQLite with WAL mode and indexed queries (`idx_sessions_start_time`, `idx_sets_session_id`, `idx_sets_exercise_id`)
- `PRAGMA user_version` migration runner — schema migrations execute only once and are versioned sequentially
- Atomic session-end transaction — timer and `end_time` are written together so a crash mid-operation cannot produce partial state
- All analytics derived from raw `sessions` + `sets` via SQL aggregation — no duplicate summary tables

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo (New Architecture) |
| Navigation | Expo Router v3 |
| Styling | NativeWind v4 + Tailwind CSS |
| Storage | `expo-sqlite` v16 (WAL mode) |
| Animations | `react-native-reanimated`, `lottie-react-native` |
| Charts | Custom SVG (`react-native-svg`) |
| Image Export | `react-native-view-shot` + `expo-sharing` |
| Testing | Jest + React Native Testing Library |

---

## Project Structure

```
app/
  _layout.tsx          Root layout with error boundary
  index.tsx            Home screen (session detection)
  vibe-check.tsx       Vibe selection before session start
  workout.tsx          Active workout screen
  analytics.tsx        Analytics + History tab
  exercises.tsx        Exercise library (placeholder)
  ascent.tsx           Mountain progress (placeholder)

src/
  lib/
    database.ts        SQLite layer — sessions, sets, exercises
    analytics.ts       SQL aggregation queries, PR detection
  components/
    ExerciseDemo.tsx   GIF demo with loading/error states
    HistoryDetailModal.tsx  Past workout detail popup
    SummaryCard.tsx    Post-session shareable card
  data/
    exercises.ts       42-exercise seed data
    exercise-meta.ts   Muscle group labels, demo GIF URLs
  utils/
    date-format.ts     Shared date/duration/vibe formatters
  constants/
    theme.ts           Design tokens (colors, spacing)
  types.ts             TypeScript types and constants

__tests__/
  analytics.test.ts   17 unit tests for analytics functions
  HomeScreen.test.tsx
  WorkoutScreen.test.tsx
  VibeCheck.test.tsx
  ExerciseDemo.test.tsx
```

---

## Running Locally

```bash
npm install
npm start          # Expo dev server
npm test           # Jest test suite
npm run test:watch # Watch mode
```

---

## FEATURES TO HAVE NEXT

### Phase 3 — Exercise Library
- Full browsable exercise library screen with all 42 exercises displayed
- Filterable by muscle group with a horizontal chip row
- Each exercise card shows name, muscle group badge, and a thumbnail
- Tap to expand a full-screen GIF demo with form cues
- Replace Tenor placeholder GIFs with bundled anatomical heatmap animations (Lottie JSON) showing muscle activation as a red-highlight overlay

### Phase 4 — The Ascent (Mountain Progress)
- Pixel art character that climbs a mountain as your total lifted volume increases
- Total volume mapped to vertical meters (configurable scale, e.g. 1 kg = 1 m altitude)
- Mountain weather reflects the current session vibe: clear sky for Normal, storm clouds for Low Energy, sunshine and wind for Crushing It
- Animated climbing steps when new sets are logged
- Altitude display with milestone markers (base camp, summit checkpoints)

### Phase 5 — Share the Peak
- Dedicated "Share the Peak" screen generating a 1:1 vertical image
- Shows pixel character at current altitude against the mountain background
- Includes daily volume gain and cumulative altitude label
- Shareable as PNG via native share sheet
- Weekly, monthly, and yearly summary chart images — each capturable and downloadable as PNG

### Phase 6 — Vibe-Adaptive Recommendations
- Actually apply the vibe multiplier to suggested set and rep counts
- Low Energy → reduce suggested reps by ~20%
- Crushing It → increase suggested sets by ~20%
- Show the adjusted target as a subtle hint label next to the weight/rep inputs

### Phase 7 — Accessibility & Polish
- `accessibilityLabel`, `accessibilityRole`, and `accessibilityHint` on all interactive elements (full VoiceOver support)
- Haptic feedback via `expo-haptics` on destructive actions (delete set, end session) and PR detection
- Dynamic Type support — respect iOS font scale settings
- App-wide dark/light theme toggle (currently dark-only)

### Phase 8 — App Store Launch Readiness
- Custom 1024×1024 app icon (no transparency, no Expo placeholder)
- Custom splash screen matching GiGoFit branding
- CI/CD pipeline (GitHub Actions + EAS Build) with automated test gate
- OTA update configuration (`expo-updates`)
- Crash reporting integration (Sentry or Bugsnag)
- Privacy Policy page (hosted, live URL)
- App Store Connect metadata: description, keywords, screenshots, age rating

### Phase 9 — Future / Cloud Optional
- Optional iCloud / local network sync between devices (zero-knowledge, user-opt-in only)
- CSV data export for power users
- Yearly summary screen with year-in-review stats
- Streak tracking (consecutive training days)
- Rest timer with configurable duration and haptic alert
