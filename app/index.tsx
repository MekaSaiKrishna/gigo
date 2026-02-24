import { useCallback, useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { getActiveSession } from "../src/lib/database";
import type { Session } from "../src/types";

function formatElapsedTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safe / 3600)
    .toString()
    .padStart(2, "0");
  const mins = Math.floor((safe % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const loadActiveSession = async () => {
        setLoadingSession(true);
        try {
          const session = await getActiveSession();
          if (!mounted) return;
          setActiveSession(session);
        } finally {
          if (mounted) setLoadingSession(false);
        }
      };

      void loadActiveSession();

      return () => {
        mounted = false;
      };
    }, [])
  );

  const handleStartSession = () => {
    router.push("/vibe-check");
  };

  const handleResumeSession = () => {
    if (!activeSession) return;
    router.push(`/workout?sessionId=${activeSession.id}&vibe=${activeSession.vibe}`);
  };

  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-5xl font-bold text-primary mb-2">GiGoFit</Text>
      <Text className="text-lg text-text-muted mb-10">Minimalist Fitness. Maximum Ascent.</Text>

      <Pressable
        onPress={handleStartSession}
        disabled={loadingSession}
        className="bg-primary rounded-2xl px-10 py-4 mb-4 w-full items-center"
      >
        {loadingSession ? (
          <ActivityIndicator color="#eaeaea" />
        ) : (
          <Text className="text-text text-xl font-bold">Start Session</Text>
        )}
      </Pressable>

      {activeSession && !loadingSession ? (
        <Pressable
          onPress={handleResumeSession}
          className="bg-surface rounded-2xl px-10 py-4 mb-4 w-full items-center border border-accent"
        >
          <Text className="text-text text-lg font-semibold">Resume Session</Text>
          <Text className="text-text-muted text-xs mt-1">
            Elapsed: {formatElapsedTime(activeSession.elapsed_time)}
          </Text>
        </Pressable>
      ) : null}

      <Link href="/exercises" asChild>
        <Pressable className="bg-surface rounded-2xl px-10 py-4 mb-4 w-full items-center border border-accent">
          <Text className="text-text text-lg">Exercise Library</Text>
        </Pressable>
      </Link>

      <Link href="/analytics" asChild>
        <Pressable className="bg-surface rounded-2xl px-10 py-4 w-full items-center border border-accent">
          <Text className="text-text text-lg">Analytics</Text>
        </Pressable>
      </Link>
    </View>
  );
}
