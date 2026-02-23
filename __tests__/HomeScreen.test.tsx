import React from "react";
import { render, screen } from "@testing-library/react-native";
import HomeScreen from "../app/index";

// Mock expo-router
jest.mock("expo-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  useRouter: () => ({ push: jest.fn() }),
}));

describe("HomeScreen", () => {
  it("renders the app title", () => {
    render(<HomeScreen />);
    expect(screen.getByText("GiGoFit")).toBeTruthy();
  });

  it("renders the tagline", () => {
    render(<HomeScreen />);
    expect(
      screen.getByText("Minimalist Fitness. Maximum Ascent.")
    ).toBeTruthy();
  });

  it("renders the Start Session button", () => {
    render(<HomeScreen />);
    expect(screen.getByText("Start Session")).toBeTruthy();
  });

  it("renders navigation links", () => {
    render(<HomeScreen />);
    expect(screen.getByText("Exercise Library")).toBeTruthy();
    expect(screen.getByText("The Ascent")).toBeTruthy();
  });
});
