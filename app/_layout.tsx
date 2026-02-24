import "../global.css";
import { Component, type ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[GiGoFit] Unhandled render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: "#1a1a2e",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Text style={{ color: "#e94560", fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
            Something went wrong
          </Text>
          <Text style={{ color: "#9a9ab0", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
            GiGoFit ran into an unexpected error. Your workout data is safe.
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{
              backgroundColor: "#e94560",
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
          >
            <Text style={{ color: "#eaeaea", fontWeight: "bold" }}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function RootLayout() {
  return (
    <RootErrorBoundary>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1a1a2e" },
          headerTintColor: "#eaeaea",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#1a1a2e" },
        }}
      />
    </RootErrorBoundary>
  );
}
