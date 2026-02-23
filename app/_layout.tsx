import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1a1a2e" },
          headerTintColor: "#eaeaea",
          headerTitleStyle: { fontWeight: "bold" },
          contentStyle: { backgroundColor: "#1a1a2e" },
        }}
      >
        <Stack.Screen name="workout-complete" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
