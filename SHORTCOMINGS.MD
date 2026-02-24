# GiGoFit — Shortcomings Audit

> Audited: 2026-02-23 | Branch: main | Scope: Code quality, App Store readiness

---

## Table of Contents

1. [Code Handling Shortcomings](#1-code-handling-shortcomings)
   - 1.1 [Critical Runtime Bugs](#11-critical-runtime-bugs)
   - 1.2 [Missing Implementations](#12-missing-implementations)
   - 1.3 [Type Safety & Correctness](#13-type-safety--correctness)
   - 1.4 [State Management Issues](#14-state-management-issues)
   - 1.5 [Database & Data Layer](#15-database--data-layer)
   - 1.6 [Code Duplication](#16-code-duplication)
   - 1.7 [Error Handling](#17-error-handling)
   - 1.8 [Test Coverage](#18-test-coverage)
   - 1.9 [Performance](#19-performance)
2. [App Store Readiness Shortcomings](#2-app-store-readiness-shortcomings)
   - 2.1 [Metadata & Configuration](#21-metadata--configuration)
   - 2.2 [Privacy & Compliance](#22-privacy--compliance)
   - 2.3 [Platform Requirements](#23-platform-requirements)
   - 2.4 [User Experience & Accessibility](#24-user-experience--accessibility)
   - 2.5 [Build & Distribution](#25-build--distribution)
   - 2.6 [Stability & Crash Risk](#26-stability--crash-risk)
3. [Feature Completeness vs. CLAUDE.md Spec](#3-feature-completeness-vs-claudemd-spec)
4. [Priority Matrix](#4-priority-matrix)

---

## 1. Code Handling Shortcomings

### 1.1 Critical Runtime Bugs

#### BUG-01 — `ExerciseDemo` component is imported but does not exist
**Severity:** CRITICAL | **File:** [app/workout.tsx](app/workout.tsx)

```ts
import ExerciseDemo from "../src/components/ExerciseDemo"; // file does not exist
```

The file `src/components/ExerciseDemo.tsx` is missing entirely. The import itself does not fail at compile time (Expo bundles lazily), but the app **will crash at runtime** the moment a user taps any exercise during a workout session. This is an immediate show-stopper for the core workout flow.

A test file (`__tests__/ExerciseDemo.test.tsx`) exists for this component, giving a false sense of coverage over code that does not exist.

**Fix required:** Create `src/components/ExerciseDemo.tsx` that reads the GIF URL from `EXERCISE_DEMO_GIFS` in `src/data/exercise-meta.ts` and renders it.

---

#### BUG-02 — Vibe multipliers are computed but never applied
**Severity:** HIGH | **File:** [app/workout.tsx](app/workout.tsx)

```ts
const multiplier = VIBE_MULTIPLIERS[vibe];
// multiplier is displayed in the UI label but never used to adjust sets/reps
```

CLAUDE.md explicitly states: *"The app dynamically adjusts your sets/reps based on how you feel right now."* The multiplier values are read and surfaced as a label, but the recommended set/rep counts are **never adjusted**. The feature is promised to the user but silently does nothing.

---

#### BUG-03 — Home screen loading state can hang indefinitely
**Severity:** MEDIUM | **File:** [app/index.tsx](app/index.tsx)

If `getActiveSession()` throws (e.g., database not yet initialised, disk full), there is no catch block. The `isLoading` state is never set to `false` and the spinner never dismisses. The user sees a blank loading screen with no recovery path.

---

### 1.2 Missing Implementations

#### MISS-01 — Exercise Library screen is a placeholder
**File:** [app/exercises.tsx](app/exercises.tsx)

The entire screen is a single `<Text>` that says "Coming in Phase 3". The 42-exercise dataset and all metadata are seeded in `src/data/` but are completely unused in the UI. Users navigating to this tab see nothing actionable.

---

#### MISS-02 — Ascent / Mountain Progress screen is a placeholder
**File:** [app/ascent.tsx](app/ascent.tsx)

The signature feature of the product ("Watch your pixel character climb as you progress") is described as the primary differentiator in CLAUDE.md. The screen renders a hard-coded "0m / 8,000m" label with no chart, no pixel character, no animation, and no data binding to actual workout volume.

---

#### MISS-03 — "Share the Peak" is not implemented
**File:** N/A (feature missing entirely)

CLAUDE.md requires: *"Generate 1:1 vertical downloadable image showing your current altitude and daily gains."* No screen, no export utility, and no shareable asset generation exists for this flow.

---

#### MISS-04 — Weekly / Monthly / Yearly summary chart images not downloadable
**File:** N/A

CLAUDE.md lists downloadable weekly, monthly, and yearly summary chart images as explicit requirements. The charts render on-screen in [app/analytics.tsx](app/analytics.tsx) but cannot be exported or downloaded. There is no `captureRef` / `ViewShot` or equivalent integration for the chart views.

---

#### MISS-05 — Red-Heatmap anatomical animations not implemented
**File:** N/A

The product philosophy centres on *"3D-style Red-Heatmap animations show you exactly what muscle to target."* No Lottie animations or heatmap overlays exist anywhere in the codebase. The `EXERCISE_DEMO_GIFS` data file contains Tenor GIF URLs as a placeholder, not anatomical heatmaps.

---

### 1.3 Type Safety & Correctness

#### TYPE-01 — Constants mixed into the types file
**File:** [src/types.ts](src/types.ts)

`VIBE_MULTIPLIERS` is a runtime constant but lives in `src/types.ts` alongside pure type definitions. This is an anti-pattern; TypeScript type files should not export runtime values. The constant should live in a dedicated `src/constants/` file.

---

#### TYPE-02 — `MuscleGroup` defined as an enum instead of a union type
**File:** [src/types.ts](src/types.ts)

TypeScript enums produce runtime JavaScript objects with reverse mappings, adding unnecessary bundle weight. A `type MuscleGroup = 'chest' | 'back' | ...` union is idiomatic in React Native projects and tree-shakes cleanly.

---

#### TYPE-03 — Unvalidated URL parameters
**File:** [app/workout.tsx](app/workout.tsx)

The `vibe` parameter is read from the query string and cast directly to `VibeLevel` without validation. If the URL is malformed (e.g., via a deep link or navigation error), the app silently uses an invalid vibe, causing downstream failures in multiplier lookups and database writes.

---

#### TYPE-04 — `parseInt` used without radix on session IDs
**File:** [app/workout.tsx](app/workout.tsx)

`parseInt(raw)` without an explicit base-10 radix argument is a lint violation and can parse `0x`-prefixed strings as hexadecimal — though unlikely for session IDs, it is still technically wrong.

---

### 1.4 State Management Issues

#### STATE-01 — Timer state is fragmented across multiple refs and state variables
**File:** [app/workout.tsx](app/workout.tsx)

Timer management uses `elapsedSecondsRef`, `isTimerPausedRef`, `lastSavedElapsedRef`, plus the React state `elapsedSeconds` and `isTimerPaused`. This six-variable coordination is error-prone. If one ref drifts from the corresponding state value, the displayed timer and persisted timer silently diverge.

---

#### STATE-02 — Timer persistence has a 5-second blind spot
**File:** [app/workout.tsx](app/workout.tsx)

Timer state is persisted to SQLite only every 5 seconds to reduce write pressure. If the app is force-quit or crashes in the interim, up to 5 seconds of elapsed time is lost on session recovery. For a session timer, this is acceptable, but it is not documented and has no user-facing indication.

---

#### STATE-03 — No global state layer
**File:** Entire app

Every screen queries the database independently. There is no shared in-memory store (Zustand, Jotai, or React Context) for active session state. This means if two screens need the same data (e.g., current session ID), they each issue a separate database round-trip. This becomes a problem as the app grows.

---

### 1.5 Database & Data Layer

#### DB-01 — No migration versioning system
**File:** [src/lib/database.ts](src/lib/database.ts)

Schema migrations are handled by a series of ad-hoc functions (`migrateLegacySessionsIfNeeded`, `ensureSessionTimerColumns`, `ensureSetsCascadeDelete`). There is no version number tracked in the database. Every app launch runs all migration checks regardless of whether they are needed. This pattern is unsustainable beyond a few migrations and risks data corruption if migrations conflict.

**Required fix:** Add a `PRAGMA user_version` check and a sequential migration runner (e.g., `runMigration(version, sql)`).

---

#### DB-02 — No transaction support for batch writes
**File:** [src/lib/database.ts](src/lib/database.ts)

When saving a set or ending a session, multiple sequential `runAsync` calls are made without wrapping them in a `BEGIN / COMMIT` transaction. If the device loses power mid-sequence, the database can be left in a partially written state (e.g., session marked ended but final sets not saved).

---

#### DB-03 — Silent failure on timer persistence
**File:** [src/lib/database.ts](src/lib/database.ts)

```ts
catch {
  // Keep UI responsive even if timer persistence temporarily fails.
}
```

Errors during timer persistence are silently swallowed with no logging. In production this makes diagnosing data loss impossible.

---

#### DB-04 — GIF URLs are third-party Tenor links (data integrity risk)
**File:** [src/data/exercise-meta.ts](src/data/exercise-meta.ts)

All 42 exercise demo GIFs point to `media.tenor.com` CDN URLs. These are publicly served URLs with no API key or content agreement. Tenor can change, rotate, or remove these assets at any time. If URLs break, the exercise demos go blank with no fallback, and since the app is local-first, there is no mechanism to push updated URLs without an app release.

---

#### DB-05 — No input constraints on numeric fields
**File:** [app/workout.tsx](app/workout.tsx)

While the UI blocks negative weights, there is no maximum constraint. A user can enter `999999 kg × 999999 reps`, which produces astronomically large volume figures that will distort all chart scales and the Ascent altitude calculation.

---

### 1.6 Code Duplication

#### DUP-01 — Date and time formatting duplicated in four places

| Function | File |
|---|---|
| `formatSessionDate()` | [app/workout.tsx](app/workout.tsx) |
| `formatDateTime()` | [src/components/HistoryDetailModal.tsx](src/components/HistoryDetailModal.tsx) |
| `formatSessionTime()` | [app/analytics.tsx](app/analytics.tsx) |
| `formatWeekLabel()` / `formatMonthLabel()` | [src/utils/date-format.ts](src/utils/date-format.ts) |

All formatting should be consolidated into `src/utils/date-format.ts`.

---

#### DUP-02 — Duration formatting function copied verbatim in three files

`formatDuration(seconds)` or equivalent logic exists in [app/workout.tsx](app/workout.tsx), [src/components/HistoryDetailModal.tsx](src/components/HistoryDetailModal.tsx), and [app/analytics.tsx](app/analytics.tsx). Any change to display format (e.g., showing hours) must be updated in all three locations.

---

#### DUP-03 — Vibe label mapping duplicated in three files

The mapping `{ low → "Low Energy", normal → "Normal", crushing → "Crushing It" }` is inlined in [app/workout.tsx](app/workout.tsx), [src/components/HistoryDetailModal.tsx](src/components/HistoryDetailModal.tsx), and [app/analytics.tsx](app/analytics.tsx). This should be a single exported constant.

---

### 1.7 Error Handling

#### ERR-01 — Export failure swallows the actual error
**File:** [app/workout.tsx](app/workout.tsx)

```ts
catch {
  Alert.alert("Export Failed", "Could not generate workout summary image.");
}
```

No logging of the actual exception. In production there is no way to know whether this is a permissions issue, out of memory, or a library bug.

---

#### ERR-02 — Analytics queries have no error boundaries
**File:** [app/analytics.tsx](app/analytics.tsx)

Analytics data-fetching functions are called in `useEffect` with `try/catch`, but on failure the charts simply render empty with no user-facing message. A user who encounters a DB error will see blank charts and not know why.

---

#### ERR-03 — No app-level error boundary
**File:** Entire app

There is no React error boundary at the root layout level. An unhandled render error in any screen will produce a blank white crash screen on production builds with no recovery option.

---

### 1.8 Test Coverage

#### TEST-01 — `ExerciseDemo.test.tsx` tests a component that doesn't exist
**File:** [__tests__/ExerciseDemo.test.tsx](__tests__/ExerciseDemo.test.tsx)

Running this test file imports a missing module. The test suite passes only because the tests are skipped or the test runner resolves the missing module to `undefined`. This provides false confidence in coverage.

---

#### TEST-02 — No tests for the database layer
**File:** `src/lib/database.ts` (untested)

Zero unit or integration tests cover `database.ts`. This is the most critical file in the app — it handles all persistence. Schema initialisation, migrations, session creation, set insertion, and deletion are all untested.

---

#### TEST-03 — No integration tests for the core workout flow
The sequence "start session → add sets → end session → verify data persisted" is never tested end-to-end. Database and UI layers are only tested in isolation.

---

#### TEST-04 — `getMonthlyPRSummary` is implemented but not tested
**File:** [src/lib/analytics.ts](src/lib/analytics.ts) | [__tests__/analytics.test.ts](__tests__/analytics.test.ts)

The function exists and is rendered in the UI but has zero test coverage.

---

### 1.9 Performance

#### PERF-01 — Analytics queries have no caching
**File:** [app/analytics.tsx](app/analytics.tsx)

Every time the analytics tab is opened, all queries re-run against SQLite. With 5 years of data this will be slow. The CLAUDE.md spec requires queries to execute under 50 ms with 5 years of data — this has not been benchmarked.

---

#### PERF-02 — Chart images not memoised
**File:** [app/analytics.tsx](app/analytics.tsx)

Custom SVG chart components re-render on every state change, including unrelated state updates (e.g., modal open/close). The charts should be wrapped in `React.memo` or computed values should be cached with `useMemo`.

---

#### PERF-03 — `2048×2048` PNG capture on export
**File:** [app/workout.tsx](app/workout.tsx)

The summary card export targets `2048×2048` resolution. On older iPhone SE or low-RAM Android devices this can exhaust the JS heap and cause the app to crash silently during export.

---

---

## 2. App Store Readiness Shortcomings

### 2.1 Metadata & Configuration

#### META-01 — `app.json` is missing required App Store fields
**File:** [app.json](app.json)

The following fields are absent and are **required** for App Store Connect submission:

| Field | Required by | Status |
|---|---|---|
| `ios.bundleIdentifier` | Apple | Missing (using Expo default placeholder) |
| `android.package` | Google Play | Missing |
| `ios.buildNumber` | Apple | Missing |
| `android.versionCode` | Google Play | Missing |
| `ios.infoPlist.NSPhotoLibraryAddUsageDescription` | Apple (saving images) | Missing |
| `ios.infoPlist.NSPhotoLibraryUsageDescription` | Apple (reading images) | Missing |
| `ios.privacyManifests` | Apple (required since iOS 17.4) | Missing |
| `owner` | Expo EAS | Missing |

Without these, the app **cannot be submitted** to either store.

---

#### META-02 — No `eas.json` build configuration exists
**File:** N/A (missing)

EAS Build is required for producing production `.ipa` and `.aab` binaries. Without `eas.json`, there is no configured build profile for `preview`, `staging`, or `production`. Running `eas build` will prompt for setup but produce an unconfigured build.

---

#### META-03 — App icon and splash screen are Expo defaults
**File:** [app.json](app.json)

`"icon": "./assets/icon.png"` and `"splash"` reference Expo placeholder assets. The App Store rejects submissions with default Expo icons. A custom 1024×1024 icon with no transparency and no rounded corners (Apple rounds them) is required.

---

#### META-04 — No app version management strategy
**File:** [app.json](app.json) | [package.json](package.json)

`version` in `app.json` is `"1.0.0"` and does not match the `version` in `package.json`. There is no automated process to synchronise build numbers across platforms during CI/CD. This will create confusion at submission time.

---

#### META-05 — No App Store description, keywords, or screenshots prepared
No marketing copy, App Store category, age rating, or screenshots exist in the repository. These are required for App Store Connect listing creation and review.

---

### 2.2 Privacy & Compliance

#### PRIV-01 — No Privacy Policy URL
Apple and Google both require a Privacy Policy URL for all apps, even apps that collect zero data. The URL must be live and accessible. No privacy policy document or URL is referenced anywhere in the project.

---

#### PRIV-02 — Apple Privacy Nutrition Labels not prepared
Since 2020, Apple requires all apps to submit a self-declared privacy "nutrition label" in App Store Connect covering data collection, data usage, and tracking practices. No documentation of what data the app collects exists in the project.

Even a fully local app like GiGoFit must declare:
- It does not collect user data
- It does not track users
- It does not link data to identity

---

#### PRIV-03 — Apple Privacy Manifest (`PrivacyInfo.xcprivacy`) is missing
Since **March 2024** (iOS 17.4+), Apple requires a `PrivacyInfo.xcprivacy` file for any app accessing certain device APIs. GiGoFit likely triggers the **File Timestamp APIs** and **User Defaults** reasons categories. Without this manifest, App Review will **reject the build**.

The manifest must be added via `app.json` → `ios.privacyManifests` in Expo.

---

#### PRIV-04 — No data deletion or export mechanism
While Apple and Google do not legally require this for apps that store data only locally, the App Store Review Guidelines (Guideline 5.1.1) expect users to be able to delete their data. There is no "Delete all my data" option in the app's settings.

---

### 2.3 Platform Requirements

#### PLAT-01 — Minimum iOS version not set
**File:** [app.json](app.json)

`deploymentTarget` is not set. Expo defaults to iOS 13, but `expo-sqlite` (with the new API used here) requires **iOS 14+**. If a user on iOS 13 downloads the app it will crash on first launch. Set `ios.deploymentTarget: "16.0"` to match the project's actual API usage.

---

#### PLAT-02 — No Android `minSdkVersion` defined
**File:** [app.json](app.json)

The minimum Android SDK version is not declared. `expo-sqlite` with WAL mode requires Android API 21+. Without an explicit `minSdkVersion`, the Play Store may serve the app to incompatible devices.

---

#### PLAT-03 — `expo-image` / `expo-sharing` permissions not declared in Android manifest
**File:** [app.json](app.json)

`expo-sharing` requires `WRITE_EXTERNAL_STORAGE` on Android < 10. On Android 10+ the API uses MediaStore but the permission still needs to be declared for backward compatibility. No permissions are declared in `app.json` under `android.permissions`.

---

#### PLAT-04 — iPad layout not considered
No `app.json` field restricts the app to iPhone-only (`ios.requireFullScreen`, `ios.supportsTablet`). If the app is submitted without iPad-specific layout handling, it will run in 2× iPhone emulation mode on iPads, which Apple may flag in review as a poor user experience.

---

#### PLAT-05 — No App Tracking Transparency (ATT) declaration
While GiGoFit does not track users, any third-party SDK embedded (via Expo itself, `expo-updates`, or Expo Go telemetry) may include tracking. Apple requires explicit ATT handling or a declaration that no tracking occurs. This is enforced at submission.

---

### 2.4 User Experience & Accessibility

#### A11Y-01 — No accessibility labels on interactive elements
None of the `TouchableOpacity`, `Pressable`, or custom button components in the app set `accessibilityLabel`, `accessibilityRole`, or `accessibilityHint`. Apple's App Store Review Guidelines (Guideline 4.0) and Google Play's Core App Quality guidelines both flag apps that fail basic accessibility checks. VoiceOver users cannot use this app at all.

---

#### A11Y-02 — No Dynamic Type support
Text sizes are hard-coded via NativeWind classes (e.g., `text-sm`, `text-2xl`). iOS Dynamic Type is not respected. Users who rely on larger text sizes (a significant portion of older users, the app's likely demographic) cannot use the app comfortably.

---

#### A11Y-03 — No haptic feedback on key interactions
iOS Human Interface Guidelines recommend haptic feedback for destructive actions (delete set, end session) and confirmations (PR detected). No `expo-haptics` integration exists.

---

#### A11Y-04 — Stub screens create dead navigation paths
Tapping "Exercises" or "Ascent" in the tab bar navigates to placeholder screens. This is a rejection risk under App Store Review Guideline 4.0 ("Minimum Functionality"): reviewers may flag placeholder content as an incomplete app.

---

### 2.5 Build & Distribution

#### BUILD-01 — No CI/CD pipeline
There is no GitHub Actions, Bitrise, or EAS CI configuration. All builds must be run manually. This means no automated testing before release and no protection against broken builds being submitted.

---

#### BUILD-02 — `node_modules` committed and then deleted via git history
Git log shows `node_modules` was added (`Add files via upload`) then deleted (`Delete node_modules directory`). This pollutes the git history and inflates clone size. A `.gitignore` should have prevented this from ever being committed.

---

#### BUILD-03 — No OTA update strategy
`expo-updates` is listed as a dependency but no update configuration exists in `app.json` (`updates.url`, `updates.enabled`). Without OTA update infrastructure, every bug fix requires a full App Store review cycle.

---

#### BUILD-04 — Dependencies are pinned loosely
**File:** [package.json](package.json)

Several dependencies use `^` (caret) version ranges. In a production app, dependencies should be pinned exactly (`"expo": "52.0.46"` not `"^52.x.x"`) and managed via lock file. The lock file (`package-lock.json`) is committed but the `package.json` ranges could allow accidental upgrades.

---

### 2.6 Stability & Crash Risk

#### CRASH-01 — No crash reporting integration
There is no Sentry, Bugsnag, or equivalent crash reporting. In production, crashes will be invisible to developers. Apple provides some crash logs via App Store Connect, but with no symbolication setup, they will be unreadable.

---

#### CRASH-02 — No graceful handling of SQLite failure on first launch
If the SQLite database fails to initialise on first launch (e.g., full storage, corrupted file system), the app will render a blank screen or crash with no user-facing guidance.

---

#### CRASH-03 — Memory leak risk in chart animations
Custom SVG components and `Animated` values in `analytics.tsx` are not cleaned up on unmount. Long sessions in the analytics tab may gradually increase memory pressure.

---

---

## 3. Feature Completeness vs. CLAUDE.md Spec

| Feature | Required by Spec | Status |
|---|---|---|
| Sessions + Sets SQLite persistence | Phase 2.1 | Done |
| Weekly volume chart | Phase 2.1 | Done |
| Monthly volume chart | Phase 2.1 | Done |
| Exercise weekly max trend | Phase 2.1 | Done |
| PR detection engine | Phase 2.1 | Done |
| DB indexes on startup | Phase 2.1 | Done |
| `src/lib/analytics.ts` isolated query layer | Phase 2.1 | Done |
| `src/utils/date-format.ts` utilities | Phase 2.1 | Partial (2 of needed functions) |
| `victory-native` charts | Phase 2.1 | Not used (custom SVG used instead) |
| Minimum 8 analytics unit tests | Phase 2.1 | Done (14 tests) |
| 50ms query performance target | Phase 2.1 | Not benchmarked |
| **Exercise library UI (42 exercises)** | Phase 3 | **Missing** |
| **Anatomical heatmap animations** | Phase 3 | **Missing** |
| **Ascent mountain visualisation** | Phase 4 | **Missing** |
| **Pixel character climbing animation** | Phase 4 | **Missing** |
| **"Share the Peak" export** | Phase 2+ | **Missing** |
| **Downloadable weekly summary image** | Phase 2+ | **Missing** |
| **Downloadable monthly summary image** | Phase 2+ | **Missing** |
| **Downloadable yearly summary image** | Phase 2+ | **Missing** |
| Vibe multiplier applied to recommendations | Core | **Not applied** |
| Ghosting (last weight/rep auto-fill) | Core | Done |

---

## 4. Priority Matrix

### P0 — Will cause rejection or crash (fix before any release)

| ID | Issue |
|---|---|
| BUG-01 | `ExerciseDemo` component missing — runtime crash |
| META-01 | `bundleIdentifier`, `buildNumber`, photo library permissions missing |
| META-02 | No `eas.json` — cannot produce a production build |
| META-03 | Default Expo icon — automatic App Store rejection |
| PRIV-03 | Missing `PrivacyInfo.xcprivacy` — Apple will reject build |
| PLAT-04 | Stub screens visible to App Store reviewer |

### P1 — Must fix before public launch

| ID | Issue |
|---|---|
| BUG-02 | Vibe multiplier feature advertised but does nothing |
| BUG-03 | Home screen loading state can hang |
| DB-01 | No migration versioning — fragile and unsustainable |
| DB-02 | No transactions — risk of partial writes on power loss |
| PRIV-01 | No Privacy Policy URL — required by both stores |
| PRIV-02 | No privacy nutrition label prepared |
| A11Y-01 | No accessibility labels — fails basic VoiceOver support |
| BUILD-01 | No CI/CD — no automated quality gate before release |
| CRASH-01 | No crash reporting — blind to production failures |

### P2 — Should fix before broad marketing

| ID | Issue |
|---|---|
| MISS-01 | Exercise library screen is empty |
| MISS-02 | Ascent screen is empty |
| MISS-03 | Share the Peak not implemented |
| DUP-01–03 | Date, duration, vibe label logic duplicated |
| TEST-02 | Database layer has zero test coverage |
| TEST-01 | ExerciseDemo tests cover missing code |
| ERR-03 | No root-level React error boundary |
| PLAT-01–02 | Deployment targets not pinned |
| BUILD-03 | No OTA update strategy |

### P3 — Quality improvements

| ID | Issue |
|---|---|
| PERF-01 | Analytics queries not cached |
| PERF-02 | Charts not memoised |
| PERF-03 | High-resolution export may crash low-RAM devices |
| TYPE-01–04 | Type safety and convention issues |
| STATE-01–03 | Timer ref fragmentation, no global state layer |
| DB-04 | Third-party Tenor GIF URLs can break without notice |
| DB-05 | No max constraint on numeric inputs |

---

*This document covers findings as of the February 2026 codebase audit. Issues should be tracked in the project issue tracker and resolved before any public App Store submission.*
