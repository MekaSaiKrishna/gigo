import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import HomeScreen from "../app/index";

const mockPush = jest.fn();
const mockGetActiveSession = jest.fn();

jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: mockPush }),
  useFocusEffect: (effect: () => void | (() => void)) => {
    const React = require("react");
    React.useEffect(() => effect(), [effect]);
  },
}));

jest.mock("../src/lib/database", () => ({
  getActiveSession: () => mockGetActiveSession(),
}));

describe("HomeScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders app title and base navigation links", async () => {
    mockGetActiveSession.mockResolvedValue(null);
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText("GiGoFit")).toBeTruthy();
      expect(screen.getByText("Exercise Library")).toBeTruthy();
      expect(screen.getByText("Analytics")).toBeTruthy();
      expect(screen.getByText("Start Session")).toBeTruthy();
    });
  });

  it("shows Start Session when there is no active session", async () => {
    mockGetActiveSession.mockResolvedValue(null);
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText("Start Session")).toBeTruthy();
    });
  });

  it("shows Resume Session CTA and elapsed timer when an active session exists", async () => {
    mockGetActiveSession.mockResolvedValue({
      id: 11,
      start_time: 1700000000000,
      end_time: null,
      vibe: "normal",
      elapsed_time: 125,
      is_paused: false,
      display_name: "Workout - 3",
    });
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText("Resume Session")).toBeTruthy();
      expect(screen.getByText("Workout - 3")).toBeTruthy();
      expect(screen.getByText("Elapsed: 00:02:05")).toBeTruthy();
    });
  });

  it("navigates to vibe check when starting a new session", async () => {
    mockGetActiveSession.mockResolvedValue(null);
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText("Start Session")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Start Session"));
    expect(mockPush).toHaveBeenCalledWith("/vibe-check");
  });

  it("navigates to workout when resuming an active session", async () => {
    mockGetActiveSession.mockResolvedValue({
      id: 42,
      start_time: 1700000000000,
      end_time: null,
      vibe: "low",
      elapsed_time: 22,
      is_paused: true,
      display_name: "Workout - 1",
    });
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText("Resume Session")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Resume Session"));
    expect(mockPush).toHaveBeenCalledWith("/workout?sessionId=42&vibe=low");
  });
});
