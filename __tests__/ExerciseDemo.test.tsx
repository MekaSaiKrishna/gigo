import React from "react";
import { render, screen } from "@testing-library/react-native";
import ExerciseDemo from "../src/components/ExerciseDemo";

jest.mock("../src/data/exercise-meta", () => ({
  EXERCISE_DEMO_GIFS: {
    "Bench Press": "https://example.com/bench-press.gif",
  },
}));

describe("ExerciseDemo", () => {
  it("renders the form label for a known exercise", () => {
    render(<ExerciseDemo exerciseName="Bench Press" />);
    expect(screen.getByText("Bench Press — proper form demo")).toBeTruthy();
  });

  it("renders fallback for unknown exercise", () => {
    render(<ExerciseDemo exerciseName="Unknown Move" />);
    expect(screen.getByText(/Demo coming soon for Unknown Move/)).toBeTruthy();
  });
});
