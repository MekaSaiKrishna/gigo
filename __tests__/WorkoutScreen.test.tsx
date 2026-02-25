import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import WorkoutScreen from "../app/workout";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ sessionId: "1", vibe: "normal" }),
  useRouter: () => ({ replace: mockReplace }),
}));

const mockEndSession = jest.fn(() => Promise.resolve());
jest.mock("../src/lib/database", () => ({
  getAllExercises: jest.fn(() =>
    Promise.resolve([
      { id: 1, name: "Bench Press", muscle_group: "chest", category: "compound" },
      { id: 2, name: "Push-Up", muscle_group: "chest", category: "bodyweight" },
      { id: 3, name: "Barbell Squat", muscle_group: "legs", category: "compound" },
    ])
  ),
  getSetsForSession: jest.fn(() => Promise.resolve([])),
  getSessionVolume: jest.fn(() => Promise.resolve(0)),
  getGhostValues: jest.fn(() => Promise.resolve(null)),
  addSet: jest.fn(() => Promise.resolve(1)),
  deleteSet: jest.fn(() => Promise.resolve()),
  endSession: mockEndSession,
}));

jest.mock("../src/components/ExerciseDemo", () => {
  const { Text } = require("react-native");
  return function MockExerciseDemo({ exerciseName }: { exerciseName: string }) {
    return <Text testID="exercise-demo">{`Demo: ${exerciseName}`}</Text>;
  };
});

describe("WorkoutScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the workout header", async () => {
    render(<WorkoutScreen />);
    expect(screen.getByText("Workout")).toBeTruthy();
  });

  it("shows End Session button", () => {
    render(<WorkoutScreen />);
    expect(screen.getByText("End Session")).toBeTruthy();
  });

  it("shows empty state when no sets logged", async () => {
    render(<WorkoutScreen />);
    await waitFor(() => {
      expect(
        screen.getByText("No sets logged yet. Pick an exercise and start lifting!")
      ).toBeTruthy();
    });
  });

  it("opens exercise picker grouped by body part", async () => {
    render(<WorkoutScreen />);
    fireEvent.press(screen.getByText("Tap to select exercise"));
    await waitFor(() => {
      expect(screen.getByText("Pick Exercise")).toBeTruthy();
      // Section headers
      expect(screen.getByText("Chest")).toBeTruthy();
      expect(screen.getByText("Legs")).toBeTruthy();
      // Exercises under sections
      expect(screen.getByText("Bench Press")).toBeTruthy();
      expect(screen.getByText("Push-Up")).toBeTruthy();
      expect(screen.getByText("Barbell Squat")).toBeTruthy();
    });
  });

  it("selects an exercise and shows demo", async () => {
    render(<WorkoutScreen />);
    fireEvent.press(screen.getByText("Tap to select exercise"));
    await waitFor(() => {
      expect(screen.getByText("Bench Press")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("Bench Press"));
    await waitFor(() => {
      // Picker closes
      expect(screen.queryByText("Pick Exercise")).toBeNull();
      // Exercise name shown in selector
      expect(screen.getByText("Bench Press")).toBeTruthy();
      // Demo component rendered
      expect(screen.getByText("Demo: Bench Press")).toBeTruthy();
    });
  });

  it("does not show demo when no exercise is selected", () => {
    render(<WorkoutScreen />);
    expect(screen.queryByTestId("exercise-demo")).toBeNull();
  });

  it("displays vibe info", () => {
    render(<WorkoutScreen />);
    expect(screen.getByText(/Vibe: Normal/)).toBeTruthy();
  });

  it("shows error alert when endSession fails", async () => {
    const alertSpy = jest.spyOn(
      require("react-native").Alert,
      "alert"
    );
    mockEndSession.mockRejectedValueOnce(new Error("DB failure"));

    render(<WorkoutScreen />);
    fireEvent.press(screen.getByText("End Session"));

    // The first Alert.alert is the confirmation dialog
    expect(alertSpy).toHaveBeenCalledWith(
      "End Session",
      "Finish this workout?",
      expect.any(Array)
    );

    // Simulate pressing "End" in the confirmation dialog
    const confirmCall = alertSpy.mock.calls[0];
    const buttons = confirmCall[2] as any[];
    const endButton = buttons.find((b: any) => b.text === "End");
    await endButton.onPress();

    // The error alert should fire
    expect(alertSpy).toHaveBeenCalledWith(
      "Error",
      "Could not end the session. Please try again."
    );

    // Should NOT navigate
    expect(mockReplace).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });
});
