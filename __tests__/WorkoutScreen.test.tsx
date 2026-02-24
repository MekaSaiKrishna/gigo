import React from "react";
import { Alert, Text, View } from "react-native";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import WorkoutScreen from "../app/workout";

const mockReplace = jest.fn();
const mockGetAllExercises = jest.fn();
const mockGetSetsForSession = jest.fn();
const mockGetSessionVolume = jest.fn();
const mockGetTotalVolume = jest.fn();
const mockGetGhostValues = jest.fn();
const mockAddSet = jest.fn();
const mockDeleteSet = jest.fn();
const mockUpdateSet = jest.fn();
const mockGetActiveSession = jest.fn();
const mockEndSession = jest.fn();
const mockGetSession = jest.fn();
const mockUpdateSessionTimer = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ sessionId: "1", vibe: "normal" }),
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("react-native-reanimated", () => {
  return {
    __esModule: true,
    default: {
      View,
      Text,
    },
    Easing: {
      out: (value: unknown) => value,
      cubic: "cubic",
    },
    FadeInUp: {
      delay: () => ({
        duration: () => ({}),
      }),
    },
    useAnimatedStyle: () => ({}),
    useSharedValue: (value: number) => ({ value }),
    withTiming: (value: number) => value,
  };
});

jest.mock("lottie-react-native", () => "LottieView");
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("react-native-view-shot", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: React.forwardRef((props: { children?: React.ReactNode }, _ref) => (
      <View>{props.children}</View>
    )),
    captureRef: jest.fn(() => Promise.resolve("file://summary.png")),
  };
});

jest.mock("../src/lib/database", () => ({
  getAllExercises: () => mockGetAllExercises(),
  addSet: (...args: unknown[]) => mockAddSet(...args),
  deleteSet: (...args: unknown[]) => mockDeleteSet(...args),
  updateSet: (...args: unknown[]) => mockUpdateSet(...args),
  getActiveSession: () => mockGetActiveSession(),
  getSetsForSession: (...args: unknown[]) => mockGetSetsForSession(...args),
  getGhostValues: (...args: unknown[]) => mockGetGhostValues(...args),
  endSession: (...args: unknown[]) => mockEndSession(...args),
  getSession: (...args: unknown[]) => mockGetSession(...args),
  getSessionVolume: (...args: unknown[]) => mockGetSessionVolume(...args),
  getTotalVolume: () => mockGetTotalVolume(),
  updateSessionTimer: (...args: unknown[]) => mockUpdateSessionTimer(...args),
}));

jest.mock("../src/lib/analytics", () => ({
  getCoachingComparisonToPreviousSession: jest.fn(() =>
    Promise.resolve({
      category: "consistent",
      affirmation: "Great job, you are staying consistent! 🔥",
      previousVolume: 1000,
      isOutdone: false,
    })
  ),
}));

jest.mock("../src/components/ExerciseDemo", () => {
  return function MockExerciseDemo({ exerciseName }: { exerciseName: string }) {
    return <Text testID="exercise-demo">{`Demo: ${exerciseName}`}</Text>;
  };
});

jest.mock("../src/components/SummaryCard", () => {
  return function MockSummaryCard() {
    return <Text>Summary Card</Text>;
  };
});

describe("WorkoutScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

    mockGetAllExercises.mockResolvedValue([
      { id: 1, name: "Bench Press", muscle_group: "chest", category: "compound" },
      { id: 2, name: "Barbell Squat", muscle_group: "legs", category: "compound" },
    ]);
    mockGetSetsForSession.mockResolvedValue([]);
    mockGetSessionVolume.mockResolvedValue(640);
    mockGetTotalVolume.mockResolvedValue(10000);
    mockGetGhostValues.mockResolvedValue(null);
    mockGetActiveSession.mockResolvedValue(null);
    mockEndSession.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({
      id: 1,
      start_time: 1700000000000,
      end_time: null,
      vibe: "normal",
      elapsed_time: 65,
      is_paused: false,
    });
    mockUpdateSessionTimer.mockResolvedValue(undefined);
    mockAddSet.mockResolvedValue(1);
    mockDeleteSet.mockResolvedValue(undefined);
    mockUpdateSet.mockResolvedValue(undefined);
  });

  it("renders workout UI with hydrated timer", async () => {
    render(<WorkoutScreen />);

    expect(screen.getByText("Workout")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText(/^00:01:0[5-9]$/)).toBeTruthy();
      expect(screen.getByText("640 kg vol")).toBeTruthy();
    });
  });

  it("shows invalid input alert when weight is 0", async () => {
    render(<WorkoutScreen />);

    fireEvent.press(screen.getByText("Tap to select exercise"));
    await waitFor(() => {
      expect(screen.getByText("Bench Press")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("Bench Press"));

    const zeroInputs = screen.getAllByPlaceholderText("0");
    fireEvent.changeText(zeroInputs[0], "0");
    fireEvent.changeText(zeroInputs[1], "8");
    fireEvent.press(screen.getByText("+"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Invalid Input", "Enter a valid weight and rep count");
      expect(mockAddSet).not.toHaveBeenCalled();
    });
  });

  it("opens delete confirmation when tapping set trash action", async () => {
    mockGetSetsForSession.mockResolvedValue([
      { id: 101, session_id: 1, exercise_id: 1, weight: 80, reps: 8, exercise_name: "Bench Press" },
    ]);
    render(<WorkoutScreen />);

    await waitFor(() => {
      expect(screen.getByText("Bench Press")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("🗑"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "Delete Set?",
      "Are you sure you want to permanently remove this set?",
      expect.any(Array)
    );
  });

  it("enters edit mode when tapping set values", async () => {
    mockGetSetsForSession.mockResolvedValue([
      { id: 101, session_id: 1, exercise_id: 1, weight: 80, reps: 8, exercise_name: "Bench Press" },
    ]);
    render(<WorkoutScreen />);

    await waitFor(() => {
      expect(screen.getByText("80 kg")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("80 kg"));

    await waitFor(() => {
      expect(screen.getByText("Save")).toBeTruthy();
      expect(screen.getByText("Cancel")).toBeTruthy();
    });
  });
});
