import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { getSessionSummary } from "../src/lib/database";
import SummaryCard from "../src/components/SummaryCard";
import type { SessionSummary } from "../src/types";

export default function WorkoutCompleteScreen() {
  const { sessionId: rawId } = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = Number(rawId);
  const router = useRouter();

  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Reanimated shared values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    getSessionSummary(sessionId).then((data) => {
      setSummary(data);
      setLoading(false);

      // Trigger entrance animation
      opacity.value = withDelay(
        150,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
      );
      scale.value = withDelay(
        150,
        withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
      );
    });
  }, [sessionId, opacity, scale]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#e94560" size="large" />
      </View>
    );
  }

  if (!summary) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-text text-lg">Session not found.</Text>
        <Pressable className="mt-6" onPress={() => router.replace("/")}>
          <Text className="text-primary text-base font-bold">Go Home</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-6 justify-center">
      <Animated.View style={animatedStyle}>
        <SummaryCard summary={summary} />
      </Animated.View>

      <Pressable
        className="bg-surface rounded-2xl px-10 py-4 mt-4 w-full items-center border border-accent"
        onPress={() => router.replace("/")}
      >
        <Text className="text-text text-base">Back to Home</Text>
      </Pressable>
    </View>
  );
}
