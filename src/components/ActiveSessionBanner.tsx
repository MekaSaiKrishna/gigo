import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { endSessionWithTimer, getActiveSession, updateSessionTimer } from "../lib/database";
import { notifySessionEnded, syncSessionNotification } from "../lib/session-notifications";
import { formatDuration } from "../utils/date-format";
import type { Session } from "../types";

export default function ActiveSessionBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [liveElapsed, setLiveElapsed] = useState(0);

  const refreshActiveSession = useCallback(async () => {
    const session = await getActiveSession();
    setActiveSession(session);
    setLiveElapsed(session?.elapsed_time ?? 0);
  }, []);

  useEffect(() => {
    void refreshActiveSession();
  }, [refreshActiveSession]);

  useEffect(() => {
    const poll = setInterval(() => {
      void refreshActiveSession();
    }, 4000);
    return () => clearInterval(poll);
  }, [refreshActiveSession]);

  useEffect(() => {
    if (!activeSession || activeSession.is_paused) return;
    const timer = setInterval(() => {
      setLiveElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  useEffect(() => {
    void syncSessionNotification(
      activeSession
        ? {
            ...activeSession,
            elapsed_time: liveElapsed,
          }
        : null
    );
  }, [activeSession, liveElapsed]);

  const handleOpenSession = () => {
    if (!activeSession) return;
    router.push(`/workout?sessionId=${activeSession.id}&vibe=${activeSession.vibe}`);
  };

  const handleTogglePause = async () => {
    if (!activeSession) return;
    const nextPaused = !activeSession.is_paused;
    await updateSessionTimer(activeSession.id, liveElapsed, nextPaused);
    setActiveSession((prev) => (prev ? { ...prev, is_paused: nextPaused } : prev));
  };

  const handleEndFromBanner = () => {
    if (!activeSession) return;
    Alert.alert("End Session", "Finish this workout now?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End",
        style: "destructive",
        onPress: async () => {
          const endedName = activeSession.display_name ?? "Workout";
          await endSessionWithTimer(activeSession.id, liveElapsed);
          await notifySessionEnded(endedName);
          setActiveSession(null);
          setLiveElapsed(0);
          if (pathname?.startsWith("/workout")) {
            router.replace("/");
          }
        },
      },
    ]);
  };

  if (!activeSession) return null;

  return (
    <Pressable className="bg-surface border-b border-accent px-4 py-3" onPress={handleOpenSession}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-primary text-xs uppercase tracking-widest">Active Session</Text>
          <Text className="text-text text-lg font-bold">{activeSession.display_name ?? "Workout"}</Text>
        </View>
        <Text className="text-text text-xl font-bold">{formatDuration(liveElapsed)}</Text>
      </View>
      <View className="flex-row justify-end mt-2 gap-2">
        <Pressable onPress={handleTogglePause} className="bg-background border border-accent rounded-lg px-3 py-2">
          <Text className="text-text text-xs font-semibold">{activeSession.is_paused ? "Play" : "Pause"}</Text>
        </Pressable>
        <Pressable onPress={handleEndFromBanner} className="bg-background border border-red-500/70 rounded-lg px-3 py-2">
          <Text className="text-red-400 text-xs font-semibold">End</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}
