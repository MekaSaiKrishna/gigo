import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { getSessionTheme } from "../utils/session-theme";

export interface SummaryExerciseItem {
  name: string;
  sets: number;
  reps: number;
}

interface SummaryCardProps {
  sessionName?: string;
  totalVolume: number;
  sessionDuration: string;
  sessionDate: string;
  sessionTimestampMs?: number;
  vibeLabel: string;
  exercises: SummaryExerciseItem[];
  size: number;
}

export default function SummaryCard({
  sessionName,
  totalVolume,
  sessionDuration,
  sessionDate,
  sessionTimestampMs,
  vibeLabel,
  exercises,
  size,
}: SummaryCardProps) {
  const compactExercises = exercises.slice(0, 6);
  const remainingCount = Math.max(exercises.length - compactExercises.length, 0);
  const theme = getSessionTheme(sessionTimestampMs ?? Date.now());

  return (
    <View
      className="rounded-3xl overflow-hidden"
      style={{ width: size, height: size, borderWidth: 1, borderColor: theme.cardBorder }}
    >
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 p-5">
          <View>
            <Text className="text-slate-400 text-[11px] tracking-widest uppercase text-right opacity-80">
              {sessionDate}
            </Text>
            <Text className="text-white text-2xl font-bold">{sessionName ?? "GiGoFit"}</Text>
            <View className="flex-row items-center mt-1.5">
              <Feather name={theme.icon} size={12} color={theme.chipText} />
              <Text className="ml-1 text-[10px] uppercase tracking-widest" style={{ color: theme.chipText }}>
                {theme.label}
              </Text>
            </View>
          </View>

          <View className="mt-3">
            <Text className="text-slate-400 text-xs uppercase tracking-widest">Total Volume</Text>
            <Text className="text-white text-3xl font-bold mt-0.5">{totalVolume.toLocaleString()} lb</Text>

            <View className="flex-row mt-3">
              <View className="flex-1">
                <Text className="text-slate-400 text-xs uppercase tracking-widest">Duration</Text>
                <Text className="text-white text-sm font-semibold mt-0.5">{sessionDuration}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-400 text-xs uppercase tracking-widest">Vibe</Text>
                <Text className="text-white text-sm font-semibold mt-0.5">{vibeLabel}</Text>
              </View>
            </View>
          </View>

          <View className="mt-3 flex-1">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-400 text-xs uppercase tracking-widest">Exercises</Text>
              <Text className="text-slate-500 text-[10px] uppercase tracking-widest">{exercises.length} Total</Text>
            </View>
            {exercises.length === 0 ? (
              <Text className="text-slate-300 text-sm">No sets logged</Text>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {compactExercises.map((item) => (
                  <View
                    key={item.name}
                    className="rounded-lg px-2 py-1.5 mb-1.5"
                    style={{ width: "48%", backgroundColor: theme.chipBg, borderWidth: 1, borderColor: theme.chipBorder }}
                  >
                    <Text className="text-slate-100 text-[11px] font-semibold" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-slate-400 text-[10px] mt-0.5">
                      {item.sets} sets x {item.reps} reps
                    </Text>
                  </View>
                ))}
                {remainingCount > 0 ? (
                  <View
                    className="rounded-lg px-2 py-1.5 mb-1.5 items-center justify-center"
                    style={{
                      width: "48%",
                      backgroundColor: theme.chipBg,
                      borderWidth: 1,
                      borderColor: theme.chipBorder,
                    }}
                  >
                    <Text className="text-slate-300 text-[11px] font-semibold">+{remainingCount} more</Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
