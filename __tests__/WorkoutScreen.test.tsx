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
const mockEndSessionWithTimer = jest.fn();
const mockGetSession = jest.fn();
const mockUpdateSessionTimer = jest.fn();
const mockRenameSession = jest.fn();

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ sessionId: "1", vibe: "normal" }),
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View: MockView, Text: MockText } = require("react-native");
  return {
    __esModule: true,
    default: {
      View: MockView,
      Text: MockText,
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
  endSessionWithTimer: (...args: unknown[]) => mockEndSessionWithTimer(...args),
  getSession: (...args: unknown[]) => mockGetSession(...args),
  getSessionVolume: (...args: unknown[]) => mockGetSessionVolume(...args),
  getTotalVolume: () => mockGetTotalVolume(),
  updateSessionTimer: (...args: unknown[]) => mockUpdateSessionTimer(...args),
  renameSession: (...args: unknown[]) => mockRenameSession(...args),
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
  const React = require("react");
  const { Text: MockText } = require("react-native");
  return function MockExerciseDemo({ exerciseName }: { exerciseName: string }) {
    return <MockText testID="exercise-demo">{`Demo: ${exerciseName}`}</MockText>;
  };
});

jest.mock("../src/components/SummaryCard", () => {
  const React = require("react");
  const { Text: MockText } = require("react-native");
  return function MockSummaryCard() {
    return <MockText>Summary Card</MockText>;
  };
});

describe("WorkoutScreen", () => {
  const renderHydratedWorkout = async () => {
    render(<WorkoutScreen />);
    await waitFor(() => {
      expect(mockGetSession).toHaveBeenCalled();
      expect(mockGetSetsForSession).toHaveBeenCalledWith(1);
      expect(screen.getByText("End Session")).toBeTruthy();
    });
  };

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
    mockEndSessionWithTimer.mockResolvedValue(undefined);
    mockGetSession.mockResolvedValue({
      id: 1,
      start_time: 1700000000000,
      end_time: null,
      vibe: "normal",
      elapsed_time: 65,
      is_paused: false,
      display_name: "Workout - 1",
    });
    mockUpdateSessionTimer.mockResolvedValue(undefined);
    mockRenameSession.mockResolvedValue(undefined);
    mockAddSet.mockResolvedValue(1);
    mockDeleteSet.mockResolvedValue(undefined);
    mockUpdateSet.mockResolvedValue(undefined);
  });

  it("renders workout UI with hydrated timer", async () => {
    await renderHydratedWorkout();

    expect(screen.getByText("End Session")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText(/^00:01:0[5-9]$/)).toBeTruthy();
      expect(screen.getByText("640 lb vol")).toBeTruthy();
    });
  });

  it("allows weight 0 when reps are valid", async () => {
    await renderHydratedWorkout();

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
      expect(mockAddSet).toHaveBeenCalledWith(1, 1, 0, 8);
    });
  });

  it("shows invalid input when reps are zero", async () => {
    await renderHydratedWorkout();

    fireEvent.press(screen.getByText("Tap to select exercise"));
    await waitFor(() => {
      expect(screen.getByText("Bench Press")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("Bench Press"));

    const zeroInputs = screen.getAllByPlaceholderText("0");
    fireEvent.changeText(zeroInputs[0], "50");
    fireEvent.changeText(zeroInputs[1], "0");
    fireEvent.press(screen.getByText("+"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Invalid Input", "Weight must be 0–1000 and reps must be 1–999");
      expect(mockAddSet).not.toHaveBeenCalled();
    });
  });

  it("opens delete confirmation when tapping set trash action", async () => {
    mockGetSetsForSession.mockResolvedValue([
      { id: 101, session_id: 1, exercise_id: 1, weight: 80, reps: 8, exercise_name: "Bench Press" },
    ]);
    await renderHydratedWorkout();

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
    await renderHydratedWorkout();

    await waitFor(() => {
      expect(screen.getByText("80 lb")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("80 lb"));

    await waitFor(() => {
      expect(screen.getByText("Save")).toBeTruthy();
      expect(screen.getByText("Cancel")).toBeTruthy();
    });
  });
});
