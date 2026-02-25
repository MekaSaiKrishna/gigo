import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { getSessionSummary } from "../src/lib/database";
import SummaryCard from "../src/components/SummaryCard";
import type { SessionSummary } from "../src/types";
import { formatDuration, formatSessionDate, formatVibeLabel } from "../src/utils/date-format";

export default function WorkoutCompleteScreen() {
  const { sessionId: rawId } = useLocalSearchParams<{ sessionId: string }>();
  const sessionId = Number(rawId);
  const router = useRouter();

  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId || isNaN(sessionId)) {
      setLoading(false);
      return;
    }

    getSessionSummary(sessionId)
      .then((data) => {
        setSummary(data);
      })
      .catch(() => {
        setSummary(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sessionId]);

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
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="flex-grow justify-center px-6 py-10"
    >
      <Animated.View
        entering={FadeIn.delay(150).duration(500)}
      >
        <SummaryCard
          sessionName={summary.session.display_name ?? "Workout"}
          totalVolume={summary.totalVolume}
          sessionDuration={formatDuration(summary.session.elapsed_time ?? summary.durationMinutes * 60)}
          sessionDate={formatSessionDate(summary.session.end_time ?? summary.session.start_time)}
          vibeLabel={formatVibeLabel(summary.session.vibe)}
          exercises={summary.exercises.map((exercise) => ({
            name: exercise.exercise_name,
            sets: exercise.set_count,
            reps: 1,
          }))}
          size={320}
        />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(400).duration(400)}>
        <Pressable
          className="bg-surface rounded-2xl px-10 py-4 mt-4 w-full items-center border border-accent"
          onPress={() => router.replace("/")}
        >
          <Text className="text-text text-base">Back to Home</Text>
        </Pressable>
      </Animated.View>
    </ScrollView>
  );
}
