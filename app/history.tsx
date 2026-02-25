import { useCallback, useState } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { getSessionHistory } from "../src/lib/database";
import type { SessionHistoryItem, VibeLevel } from "../src/types";

const VIBE_EMOJI: Record<VibeLevel, string> = {
  low: "🔋",
  normal: "💪",
  crushing: "🔥",
};

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg).toLocaleString()}kg`;
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

function formatDate(isoString: string): string {
  const d = new Date(isoString + "Z");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function HistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getSessionHistory().then((data) => {
        setSessions(data);
        setLoading(false);
      });
    }, [])
  );

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#e94560" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-4 pb-2">
        <Text className="text-2xl font-bold text-text">Workout History</Text>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => String(item.id)}
        className="px-4"
        contentContainerStyle={sessions.length === 0 ? { flex: 1 } : undefined}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-4xl mb-4">🏔️</Text>
            <Text className="text-text text-lg font-bold text-center mb-2">
              No Workouts Yet
            </Text>
            <Text className="text-text-muted text-sm text-center">
              Complete your first session to see it here.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            className="bg-surface rounded-2xl px-5 py-4 mb-3 border border-accent"
            onPress={() =>
              router.push(`/workout-complete?sessionId=${item.id}`)
            }
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-text font-bold text-base">
                {formatDate(item.started_at)}
              </Text>
              <Text className="text-lg">{VIBE_EMOJI[item.vibe]}</Text>
            </View>
            <View className="flex-row items-center gap-4">
              <View>
                <Text className="text-primary font-bold text-lg">
                  {formatVolume(item.total_volume)}
                </Text>
                <Text className="text-text-muted text-xs">Volume</Text>
              </View>
              <View className="w-px h-8 bg-accent" />
              <View>
                <Text className="text-text font-bold text-lg">
                  {item.total_sets}
                </Text>
                <Text className="text-text-muted text-xs">Sets</Text>
              </View>
              <View className="w-px h-8 bg-accent" />
              <View>
                <Text className="text-text font-bold text-lg">
                  {formatDuration(item.duration_minutes)}
                </Text>
                <Text className="text-text-muted text-xs">Duration</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
