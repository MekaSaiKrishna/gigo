import { useMemo } from "react";
import { Alert, Modal, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import type { HistorySession, SessionSetDetail } from "../lib/database";
import { formatDuration, formatVibeLabel, formatSessionDateTime } from "../utils/date-format";

interface HistoryDetailModalProps {
  visible: boolean;
  session: HistorySession | null;
  sets: SessionSetDetail[];
  deleting?: boolean;
  onDeleteWorkout: (sessionId: number) => Promise<void> | void;
  onClose: () => void;
}

export default function HistoryDetailModal({
  visible,
  session,
  sets,
  deleting = false,
  onDeleteWorkout,
  onClose,
}: HistoryDetailModalProps) {
  const groupedSets = useMemo(() => {
    const map = new Map<string, SessionSetDetail[]>();
    for (const set of sets) {
      const list = map.get(set.exercise_name) ?? [];
      list.push(set);
      map.set(set.exercise_name, list);
    }
    return [...map.entries()];
  }, [sets]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View
        entering={FadeIn.duration(180)}
        exiting={FadeOut.duration(180)}
        className="flex-1 bg-black/70 items-center justify-center px-5"
      >
        <Pressable className="absolute inset-0" onPress={onClose} />
        <Animated.View entering={ZoomIn.duration(220)} exiting={ZoomOut.duration(180)} className="w-full">
          <View className="rounded-3xl overflow-hidden border border-slate-700/60">
            <LinearGradient colors={["#020617", "#0f172a", "#1e293b"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View className="p-5">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-white text-2xl font-bold">Workout Report</Text>
                    <Text className="text-slate-400 text-xs mt-1 tracking-widest uppercase">
                      {session ? formatSessionDateTime(session.start_time) : "Session"}
                    </Text>
                  </View>
                  <Pressable onPress={onClose} className="rounded-lg bg-slate-800/70 px-3 py-2">
                    <Text className="text-slate-200 text-xs font-semibold">Close</Text>
                  </Pressable>
                </View>

                <View className="mt-5 flex-row">
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Feather name="bar-chart-2" size={14} color="#94a3b8" />
                      <Text className="ml-2 text-slate-400 text-xs uppercase tracking-widest">Volume</Text>
                    </View>
                    <Text className="text-white text-xl font-bold mt-1">
                      {session ? `${session.total_volume.toLocaleString()} lb` : "0 lb"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Feather name="clock" size={14} color="#94a3b8" />
                      <Text className="ml-2 text-slate-400 text-xs uppercase tracking-widest">Duration</Text>
                    </View>
                    <Text className="text-white text-xl font-bold mt-1">
                      {session ? formatDuration(session.elapsed_time) : "00:00:00"}
                    </Text>
                  </View>
                </View>

                <View className="mt-4 flex-row items-center">
                  <Feather name="zap" size={14} color="#94a3b8" />
                  <Text className="ml-2 text-slate-400 text-xs uppercase tracking-widest">Vibe</Text>
                  <Text className="ml-2 text-slate-100 text-sm font-semibold">{session ? formatVibeLabel(session.vibe) : "-"}</Text>
                </View>

                <View className="mt-5 border-t border-slate-700/60 pt-4">
                  <Text className="text-slate-300 text-xs uppercase tracking-widest mb-2">Set Breakdown</Text>
                  <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
                    {groupedSets.length === 0 ? (
                      <Text className="text-slate-400 text-sm">No sets logged.</Text>
                    ) : (
                      groupedSets.map(([exerciseName, exerciseSets]) => (
                        <View key={exerciseName} className="mb-3">
                          <Text className="text-white text-sm font-semibold mb-1">{exerciseName}</Text>
                          {exerciseSets.map((set, index) => (
                            <Text key={set.id} className="text-slate-300 text-sm">
                              Set {index + 1}: {set.weight} x {set.reps}
                            </Text>
                          ))}
                        </View>
                      ))
                    )}
                  </ScrollView>
                </View>

                <Pressable
                  className="mt-3 border border-red-500/70 rounded-xl px-4 py-3 items-center"
                  disabled={!session || deleting}
                  onPress={() => {
                    if (!session) return;
                    Alert.alert(
                      "Delete this workout?",
                      "This action cannot be undone and will remove all associated PRs and stats.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => {
                            void onDeleteWorkout(session.id);
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Text className="text-red-500 font-semibold">
                    {deleting ? "Deleting..." : "Delete Workout"}
                  </Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
