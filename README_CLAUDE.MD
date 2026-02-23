# README_CLAUDE.MD — Phase 1 Build Log

## What Was Done

Phase 1 scaffolded the entire GiGoFit Expo project from an empty repo into a runnable, testable React Native app.

### Project Initialization

Created an **Expo SDK 54 + TypeScript** project using the blank template, then layered on the full tech stack:

| Layer | Tool | Why |
|---|---|---|
| Navigation | Expo Router v6 | File-based routing — each file in `app/` is a screen |
| Styling | NativeWind v4 + Tailwind 3.4 | Utility-first CSS via `className` props in React Native |
| Database | expo-sqlite | Local-only persistence for exercises, sessions, and sets |
| Key-value store | AsyncStorage | Lightweight local storage for preferences |
| Animations | lottie-react-native | For future muscle-highlighting animations |
| Testing | Jest + React Native Testing Library | Component and unit tests |

### Files Created

```
app/
  _layout.tsx         Root layout — dark theme, Stack navigator
  index.tsx           Home screen — 3 buttons: Start Session, Exercises, Ascent
  vibe-check.tsx      Energy selector (Low / Normal / Crushing It)
  workout.tsx         Placeholder for workout logging
  exercises.tsx       Placeholder for exercise library
  ascent.tsx          Placeholder for altitude tracker

src/
  lib/database.ts     SQLite init + schema (exercises, sessions, sets tables)
  constants/theme.ts  Color palette + 8000m peak constant

__tests__/
  HomeScreen.test.tsx  4 tests — renders title, tagline, buttons
  VibeCheck.test.tsx   3 tests — renders options, navigates on tap

Config files:
  babel.config.js      NativeWind JSX + Reanimated (disabled in test env)
  metro.config.js      NativeWind metro integration
  tailwind.config.js   Dark palette: background, surface, primary, accent, text
  tsconfig.json        Strict mode + @/* path alias
  app.json             Expo config with dark splash, SQLite plugin
  global.css           Tailwind directives
  .gitignore           node_modules, .expo, ios/, android/, coverage/, .env
  TESTING.md           Full testing guide with checklists
```

### Key Decisions

1. **Expo Router over React Navigation** — file-based routing is simpler, each screen is just a file in `app/`.
2. **NativeWind disabled in test env** — `babel-preset-expo@54` + NativeWind's Babel plugin triggers a `.plugins` validation error in `@babel/core`. Solved by conditionally loading NativeWind plugins only outside of `NODE_ENV=test`.
3. **SQLite schema designed upfront** — three tables (`exercises`, `sessions`, `sets`) with foreign keys and a `vibe` constraint, ready for Phase 2 CRUD.
4. **Dark-first theme** — all colors defined once in `tailwind.config.js` and mirrored in `src/constants/theme.ts`.

### How to Run

```bash
npm start          # Dev server — scan QR with Expo Go
npm test           # Run all 7 tests
npm run test:watch # Re-run tests on save
```

### Test Results

```
PASS __tests__/VibeCheck.test.tsx
PASS __tests__/HomeScreen.test.tsx

Test Suites: 2 passed, 2 total
Tests:       7 passed, 7 total
```

### What's Next (Phase 2)

- Seed the exercise database with 42 exercises
- Build workout session CRUD (start, log sets, end)
- Implement "Ghosting" — auto-recall last weight/reps into input fields
