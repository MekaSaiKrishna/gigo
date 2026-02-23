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

