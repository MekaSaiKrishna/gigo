# GiGoFit 🏔️
Minimalist Fitness. Maximum Ascent.

GiGoFit is a zero-friction, privacy-first fitness utility designed for those who want to spend more time lifting and less time scrolling. No accounts, no ads—just you and the mountain.

## The Philosophy: "Zero Friction"
In 2026, fitness apps have become bloated. GiGoFit strips away the noise:

- No Login: Open the app and start your first set in under 3 seconds.
- Local First: Your data never leaves your device. No cloud, no tracking.
- Anatomical Intelligence: 3D-style "Red-Heatmap" animations show you exactly what muscle to target without the fluff.

## Key Features
- The Ascent: Your total lifted volume is mapped to vertical meters. Watch your pixel character climb a massive 8,000m peak as you progress.
- Vibe-Check Toggle: Start your session by selecting Low Energy, Normal, or Crushing It. The app dynamically adjusts your sets/reps based on how you feel right now.
- Micro-Guidance Library: 42 essential exercises with high-contrast muscle-highlighting animations.
- Ghosting: Automatic recall of your last weight and reps directly in the input fields. No more digging through history.
- Share the Peak: Generate 9:16 vertical downloadable image showing your current altitude and daily gains.

## Tech Stack
- Framework: React Native + Expo
- Animations: Lottie (JSON-based vector animations)
- Storage: SQLite / AsyncStorage (Local-only persistence)
- Styling: Tailwind CSS (NativeWind)
- Visuals: Custom Pixel Art Assets
- 
| Image Capture | react-native-view-shot | Captures the summary card as a high-res PNG |
| Sharing | expo-sharing | Triggers native "Save Image" or Social sharing |


______________
## Phase 2 — Data Layer, Workout CRUD, and Shareable Insights

### Shareable Summary Card (The "Sleek Look")

Implemented a high-fidelity summary card in `src/components/SummaryCard.tsx` that appears after "End Session".

**Card Design Specs:**
- **Rounded Square:** `border-radius: 32px`.
- **Minimalist Aesthetic:** Dark slate background (`#1A1A1A`), primary accent for volume, and "Silver" (`#A1A1A1`) for subtext.
- **Data Points:** Workout Duration, Total Volume, Vibe Level, and a list of exercises with `Sets x Reps`.

**Capture Logic:**
- Uses a `useRef` pointing to a `ViewShot` component.
- `onCapture` function:
    1. Triggers `captureRef(viewRef)`.
    2. Receives a local `uri`.
    3. Calls `Sharing.shareAsync(uri)` to allow the user to save the PNG to their camera roll.

### Key Files (New)
- `src/components/SummaryCard.tsx` — The sexy, shareable UI.
- `src/hooks/useShareSummary.ts` — Logic for capturing and sharing.
