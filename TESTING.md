# GiGoFit Testing Guide

This document covers how to test GiGoFit at every stage of development — from running unit tests to manually verifying features on a real device.

---

## 1. Running the App (Manual Testing)

### Prerequisites
- Node.js 18+
- Expo Go app installed on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- Or: Android Emulator / iOS Simulator

### Start the dev server
```bash
npm start
```
This launches Expo's dev server. You'll see a QR code in the terminal.

### On a physical device
1. Open Expo Go on your phone
2. Scan the QR code from the terminal
3. The app loads and hot-reloads on every save

### On an emulator/simulator
```bash
npm run android   # Launches Android emulator
npm run ios       # Launches iOS simulator (macOS only)
```

### On the web (quick preview)
```bash
npm run web
```
Opens the app in your browser. Useful for layout checks, but native features (SQLite, Lottie) won't work here.

---

## 2. Automated Tests

### Unit & Component Tests (Jest + React Native Testing Library)

```bash
npm test              # Run all tests once
npm run test:watch    # Re-run on file changes (great during development)
npm run test:coverage # Generate a coverage report
```

### What to test

| Layer | What | Example |
|-------|------|---------|
| **Screens** | Renders correct content, responds to presses | "Start Session button appears", "Vibe selection navigates to /workout" |
| **Components** | Props render correctly, callbacks fire | "ExerciseCard shows exercise name", "onPress fires with exercise id" |
| **Data/Lib** | Database queries return correct results | "insertSet stores weight and reps", "getLastSet returns ghost values" |
| **Utils** | Pure functions return correct output | "volumeToAltitude converts 10000kg to 125m" |

### Writing a test

Tests live in `__tests__/`. Name them `<Thing>.test.tsx`.

```tsx
import { render, screen, fireEvent } from "@testing-library/react-native";
import MyComponent from "../app/my-component";

describe("MyComponent", () => {
  it("renders the title", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected Title")).toBeTruthy();
  });

  it("calls onPress when tapped", () => {
    const onPress = jest.fn();
    render(<MyComponent onPress={onPress} />);
    fireEvent.press(screen.getByText("Tap Me"));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### Mocking Expo modules

Many Expo modules need mocks in tests (they don't run outside a device). Common patterns:

```tsx
// Mock expo-router
jest.mock("expo-router", () => ({
  Link: ({ children }) => children,
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
}));

// Mock expo-sqlite
jest.mock("expo-sqlite", () => ({
  openDatabaseAsync: jest.fn(() => ({
    execAsync: jest.fn(),
    getAllAsync: jest.fn(() => []),
    runAsync: jest.fn(),
  })),
}));

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
```

---

## 3. Testing Checklist Per Feature

Use this checklist as you build each feature.

### Home Screen
- [ ] App title "GiGoFit" is visible
- [ ] Tagline is visible
- [ ] "Start Session" button navigates to Vibe Check
- [ ] "Exercise Library" button navigates to exercises
- [ ] "The Ascent" button navigates to ascent view
- [ ] Dark theme renders correctly (dark background, light text)

### Vibe Check
- [ ] All three vibe options are displayed
- [ ] Tapping any option navigates to the workout screen
- [ ] Selected vibe is stored for the session
- [ ] Descriptions match energy levels

### Workout Screen (Phase 2-3)
- [ ] Exercises can be selected from the library
- [ ] Weight and rep inputs accept numbers
- [ ] Ghost values (last weight/reps) pre-fill inputs
- [ ] Adding a set updates the session total
- [ ] Session can be ended / saved
- [ ] Vibe-based adjustments reflect in suggested reps

### Exercise Library (Phase 3)
- [ ] All 42 exercises are listed
- [ ] Exercises grouped by muscle group
- [ ] Tapping an exercise shows detail/animation
- [ ] Muscle-highlighting animation plays correctly
- [ ] Search/filter works

### The Ascent (Phase 4)
- [ ] Current altitude displays correctly
- [ ] Altitude updates after logging sets
- [ ] Pixel character is visible on the mountain
- [ ] Progress persists across app restarts
- [ ] 8,000m peak is the cap

### Share the Peak (Phase 5)
- [ ] Generated image is 9:16 aspect ratio
- [ ] Shows current altitude and daily volume
- [ ] Share/download works on iOS and Android

---

## 4. Database Testing

SQLite operations can be tested by mocking `expo-sqlite`:

```tsx
import { getDatabase } from "../src/lib/database";

jest.mock("expo-sqlite", () => {
  const mockDb = {
    execAsync: jest.fn(),
    getAllAsync: jest.fn(),
    runAsync: jest.fn(),
  };
  return {
    openDatabaseAsync: jest.fn(() => Promise.resolve(mockDb)),
  };
});

describe("Database", () => {
  it("initializes tables on first open", async () => {
    const db = await getDatabase();
    expect(db.execAsync).toHaveBeenCalledWith(
      expect.stringContaining("CREATE TABLE IF NOT EXISTS exercises")
    );
  });
});
```

For integration tests with real SQLite, run them on a device/emulator since SQLite requires native bindings.

---

## 5. Manual Testing Scenarios

These are things that automated tests can't easily cover:

### Performance
- [ ] App launches in under 3 seconds (the "zero friction" goal)
- [ ] Scrolling through exercise list is smooth (60fps)
- [ ] Lottie animations play without frame drops
- [ ] No memory leaks during long workout sessions

### Persistence
- [ ] Kill the app mid-session, reopen — data is still there
- [ ] Workout history survives app updates
- [ ] Ghost values persist across sessions

### Edge Cases
- [ ] Enter 0 weight or 0 reps — handled gracefully
- [ ] Very large numbers (e.g., 999kg x 999reps) — no UI overflow
- [ ] Rotate device — layout doesn't break (or is locked to portrait)
- [ ] Low disk space — SQLite handles gracefully

### Device Testing
- [ ] Test on a small screen phone (iPhone SE / similar)
- [ ] Test on a large screen phone (iPhone 15 Pro Max / similar)
- [ ] Test on a tablet (if `supportsTablet: true`)
- [ ] Test on Android and iOS

---

## 6. Debugging Tips

### Expo DevTools
- Shake the device (or press `m` in terminal) to open the dev menu
- Enable "Fast Refresh" for instant feedback
- Use "Debug Remote JS" to use Chrome DevTools

### React Native Debugger
```bash
npx react-devtools
```
Inspect component tree, props, and state visually.

### Database Inspection
To inspect your SQLite database on-device:
1. Use Expo's `expo-file-system` to export the `.db` file
2. Open with [DB Browser for SQLite](https://sqlitebrowser.org/)

### Common Issues
| Issue | Fix |
|-------|-----|
| NativeWind styles not applying | Clear Metro cache: `npx expo start -c` |
| SQLite not found | Ensure `expo-sqlite` plugin is in `app.json` |
| Tests failing with module errors | Check `transformIgnorePatterns` in jest config |
| Lottie animation not playing | Verify JSON file path and `lottie-react-native` version |
