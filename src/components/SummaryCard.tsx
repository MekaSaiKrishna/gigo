import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export interface SummaryExerciseItem {
  name: string;
  sets: number;
  reps: number;
}

interface SummaryCardProps {
  totalVolume: number;
  sessionDuration: string;
  sessionDate: string;
  vibeLabel: string;
  exercises: SummaryExerciseItem[];
  size: number;
}

export default function SummaryCard({
  totalVolume,
  sessionDuration,
  sessionDate,
  vibeLabel,
  exercises,
  size,
}: SummaryCardProps) {
  return (
    <View className="rounded-3xl overflow-hidden" style={{ width: size, height: size }}>
      <LinearGradient
        colors={["#020617", "#0f172a", "#1e293b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <View className="flex-1 p-6 justify-between">
          <View>
            <Text className="text-slate-400 text-[11px] tracking-widest uppercase text-right opacity-80">
              {sessionDate}
            </Text>
            <Text className="text-white text-2xl font-bold">Workout Summary</Text>
            <Text className="text-slate-400 text-sm mt-1">GiGoFit</Text>
          </View>

          <View className="mt-4">
            <Text className="text-slate-400 text-xs uppercase tracking-widest">Total Volume</Text>
            <Text className="text-white text-3xl font-bold mt-1">{totalVolume.toLocaleString()} lb</Text>

            <View className="flex-row mt-4">
              <View className="flex-1">
                <Text className="text-slate-400 text-xs uppercase tracking-widest">Duration</Text>
                <Text className="text-white text-base font-semibold mt-1">{sessionDuration}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-slate-400 text-xs uppercase tracking-widest">Vibe</Text>
                <Text className="text-white text-base font-semibold mt-1">{vibeLabel}</Text>
              </View>
            </View>
          </View>

          <View className="mt-5 flex-1">
            <Text className="text-slate-400 text-xs uppercase tracking-widest mb-2">Exercises</Text>
            {exercises.length === 0 ? (
              <Text className="text-slate-300 text-sm">No sets logged</Text>
            ) : (
              exercises.slice(0, 8).map((item) => (
                <Text key={item.name} className="text-slate-100 text-sm mb-1">
                  {item.name}: {item.sets} x {item.reps}
                </Text>
              ))
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}
