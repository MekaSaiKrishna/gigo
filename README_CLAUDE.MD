# README_CLAUDE.MD — GiGoFit (Synced)

Last updated: 2026-02-25

## Snapshot
GiGoFit is a local-first Expo workout app with reliable session persistence, dynamic analytics, history management, notification controls, and shareable summary output.

## Core Flows
1. `Start Session` -> `Vibe Check` -> Workout starts.
2. If an unfinished session exists, Home shows `Resume Session` with elapsed time.
3. Ending a session triggers celebration stage (sprite + confetti).
4. User taps `Checkout Summary` to open summary card.
5. Summary can be exported as PNG using native share sheet.

## Session Naming Rules
- User can name session at start/end.
- If not named: fallback `Workout - #`.
- `#` = count of completed sessions that have at least one set, plus one.
- If history is fully cleared, next fallback becomes `Workout - 1`.

## Timer & Persistence
- Session timer persists via `elapsed_time` + `is_paused`.
- Timer resumes correctly across navigation and app restarts.
- `endSessionWithTimer()` finalizes elapsed time and end timestamp atomically.

## Notifications (Idea 1)
- Exactly one active session notification at a time (no per-second spam).
- Actions: Pause, Play, End.
- Tapping notification opens app to active workout.
- Completion notification: `Kudos! Your '<Workout name>' has ended`.

## Data / Analytics Rules
- Source of truth: raw `sessions` and `sets` only.
- No cached summary tables.
- PRs are computed dynamically from existing sets.
- Deleting sessions removes derived PRs naturally.

## History
- Calendar marks dates with completed workouts.
- Tapping a date shows that day's sessions.
- Detail modal shows session report, themed by session time.
- Deleting a workout removes session + sets (cascade) and refreshes UI immediately.

## Celebration Stage
- Uses `assets/maheshsprite.png` sprite sheet.
- Loops continuously until user taps `Checkout Summary`.
- Confetti overlays celebration stage.

## Testing Focus
- Home start/resume routing
- Vibe selection stability
- Workout add/edit/delete validation
- Session naming edge cases
- Dynamic PR recalculation after deletion
- Notification action behavior and single-notification guarantee
