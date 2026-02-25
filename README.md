# GiGoFit

Minimalist, local-first workout tracking built with Expo + React Native.

## Current Product State
- Start flow: `Start Session -> Vibe Check -> Workout`
- Resume flow: Home auto-detects active session and shows `Resume Session`
- Timer: persisted (`elapsed_time`, `is_paused`) and restored on resume
- Session naming: optional custom name; fallback `Workout - #`
- Fallback numbering: based on remaining completed workouts with sets; resets to `Workout - 1` when history is empty
- Workout logging: sectioned exercise picker, ghost values, add/edit/delete sets
- Validation: weight can be `0`; reps must be `>= 1`; exercise selection is required
- Notifications (Idea 1): single active session notification with pause/play/end actions
- End flow: celebration sprite stage (looping) + confetti, then summary on `Checkout Summary`
- Summary export: square premium card, downloadable PNG via native share sheet
- Analytics: weekly/monthly volume, exercise trends, dynamic PR board
- History: calendar dots, day session list, session detail modal, hard delete with cascade

## Tech Stack
- Expo Router
- NativeWind v4
- expo-sqlite (WAL)
- react-native-reanimated
- react-native-svg
- react-native-view-shot + expo-sharing
- react-native-calendars
- Jest + React Native Testing Library

## Data Model (SQLite)
- `sessions(id, start_time, end_time, vibe, elapsed_time, is_paused, session_name, ...)`
- `sets(id, session_id, exercise_id, weight, reps, ...)`
- `exercises(id, name, muscle_group, category)`

Indexes:
- `idx_sessions_start_time`
- `idx_sets_session_id`
- `idx_sets_exercise_id`

## Run
```bash
npm install
npm start
npm test
```

## Notes
- All analytics derive from raw `sessions + sets` SQL aggregation (no summary tables).
- PRs are dynamic; deleting sessions removes corresponding PRs automatically.
