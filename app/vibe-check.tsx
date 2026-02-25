import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, Alert, TextInput, Keyboard } from "react-native";
import { useRouter } from "expo-router";
import { getSession, startSessionWithName } from "../src/lib/database";
import { syncSessionNotification } from "../src/lib/session-notifications";
import type { VibeLevel } from "../src/types";

const vibes: { level: VibeLevel; label: string; emoji: string; description: string }[] = [
  { level: "low", label: "Low Energy", emoji: "🪫", description: "Lighter load, fewer sets" },
  { level: "normal", label: "Normal", emoji: "🔋", description: "Standard programming" },
  { level: "crushing", label: "Crushing It", emoji: "💥", description: "Push the limits" },
];

export default function VibeCheckScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sessionName, setSessionName] = useState("");

  const selectVibe = async (level: VibeLevel) => {
    if (loading) return;
    setLoading(true);
    try {
      const sessionId = await startSessionWithName(level, sessionName);
      const createdSession = await getSession(sessionId);
      await syncSessionNotification(createdSession);
      Keyboard.dismiss();
      router.push(`/workout?sessionId=${sessionId}&vibe=${level}`);
    } catch {
      Alert.alert("Error", "Unable to start a session right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Text className="text-3xl font-bold text-text mb-2">Vibe Check</Text>
      <Text className="text-text-muted text-base mb-10">How are you feeling today?</Text>

      <View className="w-full mb-4">
        <Text className="text-text-muted text-xs mb-1 uppercase tracking-widest">Workout Name (Optional)</Text>
        <TextInput
          className="bg-surface border border-accent rounded-2xl px-4 py-3 text-text text-base"
          value={sessionName}
          onChangeText={setSessionName}
          placeholder="Workout - #"
          placeholderTextColor="#8a8a9a"
          returnKeyType="done"
          onSubmitEditing={() => Keyboard.dismiss()}
          maxLength={48}
        />
      </View>

      {vibes.map((vibe) => (
        <Pressable
          key={vibe.level}
          className="bg-surface rounded-2xl px-8 py-5 mb-4 w-full flex-row items-center border border-accent"
          onPress={() => selectVibe(vibe.level)}
          disabled={loading}
        >
          <Text className="text-3xl mr-4">{vibe.emoji}</Text>
          <View className="flex-1">
            <Text className="text-text text-lg font-bold">{vibe.label}</Text>
            <Text className="text-text-muted text-sm">{vibe.description}</Text>
          </View>
          {loading && <ActivityIndicator color="#e94560" />}
        </Pressable>
      ))}
    </View>
  );
}
