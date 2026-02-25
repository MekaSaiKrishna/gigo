import "../global.css";
import { Component, type ReactNode, useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  NOTIF_ACTION_END,
  NOTIF_ACTION_PAUSE,
  NOTIF_ACTION_PLAY,
  areSessionNotificationsAvailable,
  configureSessionNotifications,
  notifySessionEnded,
  syncSessionNotification,
} from "../src/lib/session-notifications";
import { endSessionWithTimer, getActiveSession, updateSessionTimer } from "../src/lib/database";

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
  const router = useRouter();

  useEffect(() => {
    if (!areSessionNotificationsAvailable()) return;

    const Notifications = require("expo-notifications");
    void configureSessionNotifications();

    const handleResponse = async (response: any) => {
      const action = response?.actionIdentifier;
      const target = response?.notification?.request?.content?.data?.target;
      const active = await getActiveSession();
      if (!active) {
        await syncSessionNotification(null);
        if (target === "home") {
          router.replace("/");
        }
        return;
      }

      if (action === NOTIF_ACTION_PAUSE) {
        await updateSessionTimer(active.id, active.elapsed_time, true);
      } else if (action === NOTIF_ACTION_PLAY) {
        await updateSessionTimer(active.id, active.elapsed_time, false);
      } else if (action === NOTIF_ACTION_END) {
        const endedName = active.display_name ?? "Workout";
        await endSessionWithTimer(active.id, active.elapsed_time);
        await notifySessionEnded(endedName);
        router.replace("/");
      } else {
        router.push(`/workout?sessionId=${active.id}&vibe=${active.vibe}`);
      }

      const refreshed = await getActiveSession();
      await syncSessionNotification(refreshed);
    };

    void Notifications.getLastNotificationResponseAsync?.().then((response: any) => {
      if (response) {
        void handleResponse(response);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
      void handleResponse(response);
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

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
