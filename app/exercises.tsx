import { View, Text } from "react-native";

export default function ExercisesScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-3xl font-bold text-text mb-2">Exercise Library</Text>
      <Text className="text-text-muted text-base text-center">
        42 essential exercises with muscle-highlighting animations.
      </Text>
      <Text className="text-text-muted text-sm mt-6">Coming in Phase 3</Text>
    </View>
  );
}
