import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import WorkoutScreen from "../app/workout";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ sessionId: "1", vibe: "normal" }),
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("../src/lib/database", () => ({
  getAllExercises: jest.fn(() =>
    Promise.resolve([
      { id: 1, name: "Bench Press", muscle_group: "chest", category: "compound" },
      { id: 2, name: "Barbell Squat", muscle_group: "legs", category: "compound" },
    ])
  ),
  getSetsForSession: jest.fn(() => Promise.resolve([])),
  getSessionVolume: jest.fn(() => Promise.resolve(0)),
  getGhostValues: jest.fn(() => Promise.resolve(null)),
  addSet: jest.fn(() => Promise.resolve(1)),
  deleteSet: jest.fn(() => Promise.resolve()),
  endSession: jest.fn(() => Promise.resolve()),
}));

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

  it("opens exercise picker on tap", async () => {
    render(<WorkoutScreen />);
    fireEvent.press(screen.getByText("Tap to select exercise"));
    await waitFor(() => {
      expect(screen.getByText("Pick Exercise")).toBeTruthy();
      expect(screen.getByText("Bench Press")).toBeTruthy();
      expect(screen.getByText("Barbell Squat")).toBeTruthy();
    });
  });

  it("selects an exercise from the picker", async () => {
    render(<WorkoutScreen />);
    fireEvent.press(screen.getByText("Tap to select exercise"));
    await waitFor(() => {
      expect(screen.getByText("Bench Press")).toBeTruthy();
    });
    fireEvent.press(screen.getByText("Bench Press"));
    await waitFor(() => {
      expect(screen.getByText("Bench Press")).toBeTruthy();
      expect(screen.queryByText("Pick Exercise")).toBeNull();
    });
  });

  it("displays vibe info", () => {
    render(<WorkoutScreen />);
    expect(screen.getByText(/Vibe: Normal/)).toBeTruthy();
  });
});
