import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

type VibeLevel = "low" | "normal" | "crushing";

const vibes: { level: VibeLevel; label: string; emoji: string; description: string }[] = [
  { level: "low", label: "Low Energy", emoji: "🔋", description: "Lighter load, fewer sets" },
  { level: "normal", label: "Normal", emoji: "💪", description: "Standard programming" },
  { level: "crushing", label: "Crushing It", emoji: "🔥", description: "Push the limits" },
];

export default function VibeCheckScreen() {
  const router = useRouter();

  const selectVibe = (level: VibeLevel) => {
    // TODO: store vibe in session context
    router.push("/workout");
  };

  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-3xl font-bold text-text mb-2">Vibe Check</Text>
      <Text className="text-text-muted text-base mb-10">How are you feeling today?</Text>

      {vibes.map((vibe) => (
        <Pressable
          key={vibe.level}
          className="bg-surface rounded-2xl px-8 py-5 mb-4 w-full flex-row items-center border border-accent"
          onPress={() => selectVibe(vibe.level)}
        >
          <Text className="text-3xl mr-4">{vibe.emoji}</Text>
          <View>
            <Text className="text-text text-lg font-bold">{vibe.label}</Text>
            <Text className="text-text-muted text-sm">{vibe.description}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
