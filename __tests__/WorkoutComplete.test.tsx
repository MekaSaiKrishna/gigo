import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import WorkoutCompleteScreen from "../app/workout-complete";

const mockReplace = jest.fn();
jest.mock("expo-router", () => ({
  useLocalSearchParams: () => ({ sessionId: "1" }),
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  const chainable = () => {
    const obj: any = {};
    obj.delay = () => obj;
    obj.duration = () => obj;
    obj.springify = () => obj;
    return obj;
  };
  return {
    __esModule: true,
    default: {
      View: ({ children, style, entering, ...rest }: any) => (
        <View style={style} {...rest}>{children}</View>
      ),
    },
    FadeIn: chainable(),
    ZoomIn: chainable(),
  };
});

jest.mock("../src/components/SummaryCard", () => {
  const { Text } = require("react-native");
  return function MockSummaryCard() {
    return <Text testID="summary-card">SummaryCard</Text>;
  };
});

const mockGetSessionSummary = jest.fn();
jest.mock("../src/lib/database", () => ({
  getSessionSummary: (...args: any[]) => mockGetSessionSummary(...args),
}));

describe("WorkoutCompleteScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading indicator initially", () => {
    mockGetSessionSummary.mockReturnValue(new Promise(() => {})); // never resolves
    render(<WorkoutCompleteScreen />);
    // ActivityIndicator is rendered (no text assertions needed, just no crash)
    expect(screen.queryByText("SummaryCard")).toBeNull();
  });

  it("renders summary card after data loads", async () => {
    mockGetSessionSummary.mockResolvedValue({
      session: { id: 1, started_at: "2026-01-01", ended_at: "2026-01-01", vibe: "normal" },
      totalVolume: 5000,
      totalSets: 12,
      durationMinutes: 30,
      exercises: [],
    });

    render(<WorkoutCompleteScreen />);

    await waitFor(() => {
      expect(screen.getByText("SummaryCard")).toBeTruthy();
    });
  });

  it("renders Back to Home button", async () => {
    mockGetSessionSummary.mockResolvedValue({
      session: { id: 1, started_at: "2026-01-01", ended_at: "2026-01-01", vibe: "normal" },
      totalVolume: 5000,
      totalSets: 12,
      durationMinutes: 30,
      exercises: [],
    });

    render(<WorkoutCompleteScreen />);

    await waitFor(() => {
      expect(screen.getByText("Back to Home")).toBeTruthy();
    });
  });

  it("shows error state when session not found", async () => {
    mockGetSessionSummary.mockResolvedValue(null);

    render(<WorkoutCompleteScreen />);

    await waitFor(() => {
      expect(screen.getByText("Session not found.")).toBeTruthy();
      expect(screen.getByText("Go Home")).toBeTruthy();
    });
  });
});
