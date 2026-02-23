import { View, Text } from "react-native";

export default function AscentScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-3xl font-bold text-text mb-2">The Ascent</Text>
      <Text className="text-text-muted text-base text-center">
        Your total lifted volume mapped to vertical meters.{"\n"}
        Watch your character climb the peak!
      </Text>
      <Text className="text-4xl mt-6">0m / 8,000m</Text>
      <Text className="text-text-muted text-sm mt-6">Coming in Phase 4</Text>
    </View>
  );
}
