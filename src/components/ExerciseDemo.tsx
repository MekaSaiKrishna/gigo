import { View, Text, Image, ActivityIndicator } from "react-native";
import { useState } from "react";
import { EXERCISE_DEMO_GIFS } from "../data/exercise-meta";

interface ExerciseDemoProps {
  exerciseName: string;
}

export default function ExerciseDemo({ exerciseName }: ExerciseDemoProps) {
  const gifMap = EXERCISE_DEMO_GIFS ?? {};
  const demoSource = gifMap[exerciseName];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!demoSource) {
    return (
      <View className="bg-slate-900/70 border border-slate-700 rounded-3xl mx-4 mt-3 p-4 items-center justify-center aspect-square max-w-[360px] self-center w-[92%]">
        <Text className="text-text-muted text-4xl mb-2">🏋️</Text>
        <Text className="text-text-muted text-sm text-center">
          Demo coming soon for {exerciseName}
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-slate-900/70 border border-slate-700 rounded-3xl mx-4 mt-3 p-3 self-center w-[92%] max-w-[360px]">
      <View className="items-center justify-center aspect-square rounded-2xl overflow-hidden bg-slate-950">
        {loading && !error && (
          <View className="absolute inset-0 items-center justify-center z-10">
            <ActivityIndicator color="#e94560" size="large" />
          </View>
        )}
        {error ? (
          <View className="items-center justify-center h-full w-full">
            <Text className="text-text-muted text-4xl mb-2">🏋️</Text>
            <Text className="text-text-muted text-sm text-center px-4">
              Could not load demo for {exerciseName}
            </Text>
          </View>
        ) : (
          <Image
            source={typeof demoSource === "string" ? { uri: demoSource } : demoSource}
            className="w-full h-full"
            resizeMode="contain"
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        )}
      </View>
      <View className="px-2 py-3">
        <Text className="text-text-muted text-xs text-center">
          {exerciseName} — proper form demo
        </Text>
      </View>
    </View>
  );
}
