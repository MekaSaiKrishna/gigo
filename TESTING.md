# TESTING.md — GiGoFit Test Plan (Current)

## Quick Run
```bash
npm run doctor:config
npm test
npm run test:watch
npm run test:coverage
```

## Install/Boot Recovery Checks
- Run `npm run doctor:config` before `npm install` if config corruption is suspected.
- Confirm `react-native-calendars` is pinned to `1.1313.0` (the previous `^1.1319.0` does not exist on npm and causes `ETARGET`).
- Ensure `babel.config.js` is non-empty and null-byte free. Current known-good config:
```js
module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel"
    ]
  };
};
```
- Clean install sequence:
```bash
rm -rf node_modules package-lock.json
npm cache verify
npm install
npx expo start -c
```
- If Expo reports missing plugins/deps, it usually means `npm install` failed earlier; resolve install errors first.
- If Metro reports syntax errors from core configs, validate there are no null bytes:
```bash
python3 - <<'PY'
import pathlib
for p in ['package.json','app.json','metro.config.js','tailwind.config.js','babel.config.js','global.css']:
    b=pathlib.Path(p).read_bytes()
    print(p, 'nul=', b.count(b'\\x00'))
PY
```

## Automated Coverage

### Analytics + Coaching Engine
File: `__tests__/analytics.test.ts`
- Weekly volume grouped and returned in chronological order.
- Monthly volume grouped and returned in chronological order.
- Exercise weekly max query behavior.
- Epley 1RM query behavior.
- PR detection:
  - detects all PR types (`weight`, `volume`, `1rm`)
  - deduplicates to highest value per type
  - returns empty for sessions with no sets
  - does not mark equal-to-history as PR
- Celebration coaching logic:
  - `legendary_start` when no previous session
  - `outdone` when `current > previous * 1.05`
  - `consistent` when `current >= previous * 0.9`
  - `encouragement` when below 90%
  - low-vibe discipline add-on text (`Elite discipline today.`)

### Date Formatting Utilities
File: `__tests__/date-format.test.ts`
- `formatWeekLabel('2026-08') -> 'Feb 2026'`
- `formatMonthLabel('2026-02') -> 'Feb 2026'`
- invalid key fallback behavior

### Home Session Persistence UX
File: `__tests__/HomeScreen.test.tsx`
- Renders home screen and nav actions.
- Shows `Start Session` when no active session.
- Shows `Resume Session` and elapsed timer when active session exists.
- Routes correctly for start and resume actions.

### Vibe Check Stability
File: `__tests__/VibeCheck.test.tsx`
- Renders all vibe options.
- Starts session and navigates only after DB call resolves.
- Shows failure alert when session creation fails.

### Workout Logger UX (Current)
File: `__tests__/WorkoutScreen.test.tsx`
- Rehydrates workout header/timer and volume metrics.
- Add-set validation alert on invalid input (`weight = 0`).
- Delete flow shows confirmation alert.
- Tapping set values enters edit mode.

## Manual Test Checklist (Latest Features)

### End Session Celebration Flow
- End Session stops timer and persists final `elapsed_time`.
- Coaching affirmation appears before SummaryCard.
- `OUTDONE` path shows confetti for ~2 seconds.
- Transition to SummaryCard occurs around 3 seconds.

### Summary Card + Export
- Date stamp format is `DD, MMMM, YYYY`.
- Duration matches final timer (`HH:MM:SS`) and excludes paused time.
- Card is fully captured in PNG export (including date).
- Share sheet opens from `Download Summary`.

### Session Persistence + Timer
- Start session, navigate away, return: session resumes.
- Home button changes to `Resume Session` for active session.
- Sets rehydrate when returning to workout.
- Timer resumes from persisted value and respects pause/play state.

### History Delete Workout
- Open Analytics -> History, tap a workout to open `HistoryDetailModal`.
- Tap `Delete Workout` and verify destructive confirmation alert text appears.
- Confirm delete and verify:
  - modal closes
  - workout no longer appears in selected date list
  - calendar activity dot updates immediately if it was the only workout that day
- Verify analytics integrity after deletion:
  - deleted workout volume no longer contributes to weekly/monthly totals
  - PR summaries reflect remaining sessions only (no stale records).

### Edit/Delete + Keyboard UX
- Weight/reps are editable from set rows.
- Delete set requires confirmation alert.
- Session/all-time volume updates immediately after edit/delete.
- Numeric inputs dismiss keyboard on `Done`.
- Tapping outside inputs dismisses keyboard.

## Verification Status
- Test files updated for latest Phase 2.2 + celebration flow.
- In this environment, automated test execution was **not possible** because `npm` is unavailable (`command not found`).
- Run the commands in **Quick Run** locally to confirm pass status.
