import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import VibeCheckScreen from "../app/vibe-check";

const mockPush = jest.fn();
const mockStartSession = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("../src/lib/database", () => ({
  startSessionWithName: (vibe: string, sessionName?: string) => mockStartSession(vibe, sessionName),
}));

describe("VibeCheckScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockStartSession.mockReset();
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
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
    mockStartSession.mockResolvedValue(42);
    render(<VibeCheckScreen />);
    fireEvent.press(screen.getByText("Normal"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/workout?sessionId=42&vibe=normal");
      expect(mockStartSession).toHaveBeenCalledWith("normal", "");
    });
  });

  it("passes optional session name when provided", async () => {
    mockStartSession.mockResolvedValue(77);
    render(<VibeCheckScreen />);
    fireEvent.changeText(screen.getByPlaceholderText("Workout - #"), "Push Day");
    fireEvent.press(screen.getByText("Crushing It"));
    await waitFor(() => {
      expect(mockStartSession).toHaveBeenCalledWith("crushing", "Push Day");
      expect(mockPush).toHaveBeenCalledWith("/workout?sessionId=77&vibe=crushing");
    });
  });

  it("shows an alert and does not navigate when session creation fails", async () => {
    mockStartSession.mockRejectedValue(new Error("db down"));
    render(<VibeCheckScreen />);

    fireEvent.press(screen.getByText("Low Energy"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Error",
        "Unable to start a session right now. Please try again."
      );
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
