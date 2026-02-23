import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import VibeCheckScreen from "../app/vibe-check";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("../src/lib/database", () => ({
  startSession: jest.fn(() => Promise.resolve(42)),
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

  it("creates a session and navigates to workout on vibe selection", async () => {
    render(<VibeCheckScreen />);
    fireEvent.press(screen.getByText("Normal"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/workout?sessionId=42&vibe=normal");
    });
  });
});
