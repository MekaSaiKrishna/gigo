import { View, Text, Pressable } from "react-native";
import { Link } from "expo-router";

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-5xl font-bold text-primary mb-2">GiGoFit</Text>
      <Text className="text-lg text-text-muted mb-10">
        Minimalist Fitness. Maximum Ascent.
      </Text>

      <Link href="/vibe-check" asChild>
        <Pressable className="bg-primary rounded-2xl px-10 py-4 mb-4 w-full items-center">
          <Text className="text-text text-xl font-bold">Start Session</Text>
        </Pressable>
      </Link>

      <Link href="/history" asChild>
        <Pressable className="bg-surface rounded-2xl px-10 py-4 mb-4 w-full items-center border border-accent">
          <Text className="text-text text-lg">Workout History</Text>
        </Pressable>
      </Link>

      <Link href="/exercises" asChild>
        <Pressable className="bg-surface rounded-2xl px-10 py-4 mb-4 w-full items-center border border-accent">
          <Text className="text-text text-lg">Exercise Library</Text>
        </Pressable>
      </Link>

      <Link href="/ascent" asChild>
        <Pressable className="bg-surface rounded-2xl px-10 py-4 w-full items-center border border-accent">
          <Text className="text-text text-lg">The Ascent</Text>
        </Pressable>
      </Link>
    </View>
  );
}
