# TESTING.md

## Automated
```bash
npm run doctor:config
npm test -- --runInBand
```

## Targeted Suites
```bash
npm test -- --runInBand __tests__/VibeCheck.test.tsx __tests__/HomeScreen.test.tsx __tests__/WorkoutScreen.test.tsx
npm test -- --runInBand __tests__/analytics.test.ts __tests__/session-naming.test.ts __tests__/gamification.test.ts
```

## Manual Regression Checklist

### Session Start/Resume
- No active session: Home shows `Start Session`.
- Active session: Home shows `Resume Session` + elapsed timer.
- Start path is always `Start Session -> Vibe Check -> Workout`.

### Timer
- Timer increments only while not paused.
- Pause/Play toggles correctly.
- Restart resets timer as expected.
- Returning to Home and back rehydrates timer value.

### Workout Logging
- `weight = 0` is accepted.
- `reps <= 0` is rejected.
- Missing exercise with valid weight/reps shows choose-exercise prompt.
- Edit set updates session volume immediately.
- Delete set requires confirmation and updates volume immediately.
- Numeric inputs dismiss keyboard on Done / submit.

### Notification Idea 1
- Starting a session creates one active notification.
- Notification center does not fill with one notification per second.
- Pause/Play/End actions work.
- Tapping notification opens app.
- Ending session posts completion notification with workout name.

### End Session & Summary
- Celebration screen appears after end.
- `maheshsprite` loops continuously until `Checkout Summary` is pressed.
- Confetti renders over celebration stage.
- Summary card opens only after button press.
- Duration matches final elapsed timer.
- Date stamp is correct for session date.
- PNG export includes all summary content.

### History / Analytics Integrity
- Deleting a workout removes it from day list and calendar dot updates.
- After deleting all workouts:
  - history is empty
  - all-time volume is zero
  - PR board shows empty state
- PRs are recalculated dynamically from current sets only.

## Known Caveats
- Notification action reliability must be validated on a dev build/device (not Expo Go-only assumptions).
