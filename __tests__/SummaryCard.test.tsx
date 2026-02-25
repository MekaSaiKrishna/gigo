import React from "react";
import { render, screen } from "@testing-library/react-native";
import SummaryCard from "../src/components/SummaryCard";
import type { SessionSummary } from "../src/types";

jest.mock("expo-linear-gradient", () => {
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children, style }: any) => (
      <View style={style}>{children}</View>
    ),
  };
});

jest.mock("react-native-view-shot", () => {
  const React = require("react");
  const { View } = require("react-native");
  const ViewShot = React.forwardRef(({ children }: any, ref: any) => (
    <View ref={ref}>{children}</View>
  ));
  ViewShot.displayName = "ViewShot";
  return {
    __esModule: true,
    default: ViewShot,
    captureRef: jest.fn(() => Promise.resolve("/tmp/card.png")),
  };
});

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve()),
}));

const mockSummary: SessionSummary = {
  session: {
    id: 1,
    started_at: "2026-02-23 10:00:00",
    ended_at: "2026-02-23 10:45:00",
    vibe: "crushing",
  },
  totalVolume: 12500,
  totalSets: 18,
  durationMinutes: 45,
  exercises: [
    { exercise_name: "Bench Press", set_count: 4, total_volume: 4800 },
    { exercise_name: "Incline Dumbbell Press", set_count: 3, total_volume: 2700 },
    { exercise_name: "Dumbbell Fly", set_count: 3, total_volume: 1800 },
    { exercise_name: "Tricep Pushdown", set_count: 4, total_volume: 1600 },
    { exercise_name: "Skull Crusher", set_count: 4, total_volume: 1600 },
  ],
};

describe("SummaryCard", () => {
  it("renders the total volume", () => {
    render(<SummaryCard summary={mockSummary} />);
    expect(screen.getByText("12.5t")).toBeTruthy();
  });

  it("renders TOTAL VOLUME label with tight tracking", () => {
    render(<SummaryCard summary={mockSummary} />);
    expect(screen.getByText("TOTAL VOLUME")).toBeTruthy();
  });

  it("renders duration", () => {
    render(<SummaryCard summary={mockSummary} />);
    expect(screen.getByText("45m")).toBeTruthy();
  });

  it("renders total sets", () => {
    render(<SummaryCard summary={mockSummary} />);
    expect(screen.getByText("18")).toBeTruthy();
  });

  it("renders the vibe indicator", () => {
    render(<SummaryCard summary={mockSummary} />);
    expect(screen.getByText("CRUSHING IT")).toBeTruthy();
  });

  it("renders exercise breakdown", () => {
    render(<SummaryCard summary={mockSummary} />);
    expect(screen.getByText("Bench Press")).toBeTruthy();
    expect(screen.getByText("Dumbbell Fly")).toBeTruthy();
    // Multiple exercises have 4 sets and 3 sets
    expect(screen.getAllByText("4 sets").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("3 sets").length).toBeGreaterThanOrEqual(1);
  });

  it("renders GiGoFit branding", () => {
    render(<SummaryCard summary={mockSummary} />);
    expect(screen.getByText("GIGOFIT")).toBeTruthy();
  });

  it("renders the Download Image button", () => {
    render(<SummaryCard summary={mockSummary} />);
    expect(screen.getByText("Download Image")).toBeTruthy();
  });

  it("shows +N more when exercises exceed 5", () => {
    const summary: SessionSummary = {
      ...mockSummary,
      exercises: [
        ...mockSummary.exercises,
        { exercise_name: "Barbell Curl", set_count: 3, total_volume: 900 },
        { exercise_name: "Hammer Curl", set_count: 3, total_volume: 720 },
      ],
    };
    render(<SummaryCard summary={summary} />);
    expect(screen.getByText("+2 more")).toBeTruthy();
  });

  it("formats volume under 1000 as kg", () => {
    const summary: SessionSummary = {
      ...mockSummary,
      totalVolume: 850,
    };
    render(<SummaryCard summary={summary} />);
    expect(screen.getByText("850kg")).toBeTruthy();
  });

  it("formats duration over 60m as hours", () => {
    const summary: SessionSummary = {
      ...mockSummary,
      durationMinutes: 90,
    };
    render(<SummaryCard summary={summary} />);
    expect(screen.getByText("1h 30m")).toBeTruthy();
  });

  it("renders empty-session guard when totalSets is 0", () => {
    const summary: SessionSummary = {
      ...mockSummary,
      totalVolume: 0,
      totalSets: 0,
      exercises: [],
    };
    render(<SummaryCard summary={summary} />);
    expect(screen.getByText("No Sets Logged")).toBeTruthy();
    expect(
      screen.getByText(
        /You showed up — that's the hardest part/
      )
    ).toBeTruthy();
    // Should NOT show the normal card elements
    expect(screen.queryByText("TOTAL VOLUME")).toBeNull();
    expect(screen.queryByText("Download Image")).toBeNull();
  });
});
