import { View, Text, Image, ActivityIndicator } from "react-native";
import { useState } from "react";
import { EXERCISE_DEMO_GIFS } from "../data/exercise-meta";

interface ExerciseDemoProps {
  exerciseName: string;
}

export default function ExerciseDemo({ exerciseName }: ExerciseDemoProps) {
  const gifUrl = EXERCISE_DEMO_GIFS[exerciseName];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!gifUrl) {
    return (
      <View className="bg-surface rounded-xl mx-4 mt-3 p-4 items-center justify-center h-48">
        <Text className="text-text-muted text-4xl mb-2">🏋️</Text>
        <Text className="text-text-muted text-sm text-center">
          Demo coming soon for {exerciseName}
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-surface rounded-xl mx-4 mt-3 overflow-hidden">
      <View className="items-center justify-center h-48">
        {loading && !error && (
          <View className="absolute inset-0 items-center justify-center z-10">
            <ActivityIndicator color="#e94560" size="large" />
          </View>
        )}
        {error ? (
          <View className="items-center justify-center h-48">
            <Text className="text-text-muted text-4xl mb-2">🏋️</Text>
            <Text className="text-text-muted text-sm text-center px-4">
              Could not load demo for {exerciseName}
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: gifUrl }}
            className="w-full h-48"
            resizeMode="contain"
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
          />
        )}
      </View>
      <View className="px-4 py-2">
        <Text className="text-text-muted text-xs text-center">
          {exerciseName} — proper form demo
        </Text>
      </View>
    </View>
  );
}
