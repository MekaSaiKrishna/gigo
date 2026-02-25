import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react-native";
import HistoryScreen from "../app/history";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (cb: () => void) => {
    const React = require("react");
    React.useEffect(cb, []);
  },
}));

const mockGetSessionHistory = jest.fn();
jest.mock("../src/lib/database", () => ({
  getSessionHistory: (...args: any[]) => mockGetSessionHistory(...args),
}));

describe("HistoryScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading indicator initially", () => {
    mockGetSessionHistory.mockReturnValue(new Promise(() => {}));
    render(<HistoryScreen />);
    expect(screen.queryByText("Workout History")).toBeNull();
  });

  it("renders empty state when no sessions exist", async () => {
    mockGetSessionHistory.mockResolvedValue([]);
    render(<HistoryScreen />);
    await waitFor(() => {
      expect(screen.getByText("No Workouts Yet")).toBeTruthy();
      expect(
        screen.getByText("Complete your first session to see it here.")
      ).toBeTruthy();
    });
  });

  it("renders session list with volume, sets, and duration", async () => {
    mockGetSessionHistory.mockResolvedValue([
      {
        id: 1,
        started_at: "2026-02-20 10:00:00",
        ended_at: "2026-02-20 10:45:00",
        vibe: "crushing",
        total_volume: 12500,
        total_sets: 18,
        duration_minutes: 45,
      },
      {
        id: 2,
        started_at: "2026-02-18 08:00:00",
        ended_at: "2026-02-18 08:30:00",
        vibe: "low",
        total_volume: 5000,
        total_sets: 10,
        duration_minutes: 30,
      },
    ]);

    render(<HistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("Workout History")).toBeTruthy();
      // Session 1
      expect(screen.getByText("12.5t")).toBeTruthy();
      expect(screen.getByText("18")).toBeTruthy();
      expect(screen.getByText("45m")).toBeTruthy();
      // Session 2
      expect(screen.getByText("5.0t")).toBeTruthy();
      expect(screen.getByText("10")).toBeTruthy();
      expect(screen.getByText("30m")).toBeTruthy();
    });
  });

  it("navigates to workout-complete when a session is tapped", async () => {
    mockGetSessionHistory.mockResolvedValue([
      {
        id: 42,
        started_at: "2026-02-20 10:00:00",
        ended_at: "2026-02-20 10:45:00",
        vibe: "normal",
        total_volume: 8000,
        total_sets: 12,
        duration_minutes: 45,
      },
    ]);

    render(<HistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("8.0t")).toBeTruthy();
    });

    // Tap the session card — find the volume text and press its parent
    fireEvent.press(screen.getByText("8.0t"));
    expect(mockPush).toHaveBeenCalledWith("/workout-complete?sessionId=42");
  });

  it("formats volume over 1000 as tons", async () => {
    mockGetSessionHistory.mockResolvedValue([
      {
        id: 1,
        started_at: "2026-02-20 10:00:00",
        ended_at: "2026-02-20 10:45:00",
        vibe: "normal",
        total_volume: 2500,
        total_sets: 8,
        duration_minutes: 30,
      },
    ]);

    render(<HistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("2.5t")).toBeTruthy();
    });
  });

  it("formats duration over 60m as hours", async () => {
    mockGetSessionHistory.mockResolvedValue([
      {
        id: 1,
        started_at: "2026-02-20 10:00:00",
        ended_at: "2026-02-20 11:30:00",
        vibe: "crushing",
        total_volume: 15000,
        total_sets: 24,
        duration_minutes: 90,
      },
    ]);

    render(<HistoryScreen />);

    await waitFor(() => {
      expect(screen.getByText("1h 30m")).toBeTruthy();
    });
  });
});
