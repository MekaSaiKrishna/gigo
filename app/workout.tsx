import { View, Text } from "react-native";

export default function WorkoutScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-3xl font-bold text-text mb-2">Workout</Text>
      <Text className="text-text-muted text-base">
        Select exercises, log sets, and track your session.
      </Text>
      <Text className="text-text-muted text-sm mt-6">Coming in Phase 2 & 3</Text>
    </View>
  );
}
