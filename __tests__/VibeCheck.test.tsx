import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import VibeCheckScreen from "../app/vibe-check";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("VibeCheckScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders the vibe check header", () => {
    render(<VibeCheckScreen />);
    expect(screen.getByText("Vibe Check")).toBeTruthy();
  });

  it("renders all three vibe options", () => {
    render(<VibeCheckScreen />);
    expect(screen.getByText("Low Energy")).toBeTruthy();
    expect(screen.getByText("Normal")).toBeTruthy();
    expect(screen.getByText("Crushing It")).toBeTruthy();
  });

  it("navigates to workout on vibe selection", () => {
    render(<VibeCheckScreen />);
    fireEvent.press(screen.getByText("Normal"));
    expect(mockPush).toHaveBeenCalledWith("/workout");
  });
});
