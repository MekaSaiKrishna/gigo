import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  getAllExercises,
  addSet,
  deleteSet,
  getSetsForSession,
  getGhostValues,
  endSession,
  getSessionVolume,
} from "../src/lib/database";
import { VIBE_MULTIPLIERS } from "../src/types";
import type { Exercise, VibeLevel, WorkoutSet } from "../src/types";

type SetWithName = WorkoutSet & { exercise_name: string };

export default function WorkoutScreen() {
  const { sessionId: rawId, vibe: rawVibe } = useLocalSearchParams<{
    sessionId: string;
    vibe: string;
  }>();
  const sessionId = Number(rawId);
  const vibe = (rawVibe ?? "normal") as VibeLevel;
  const router = useRouter();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<SetWithName[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [volume, setVolume] = useState(0);
  const [showPicker, setShowPicker] = useState(false);

  // Load exercises on mount
  useEffect(() => {
    getAllExercises().then(setExercises);
  }, []);

  // Refresh sets + volume
  const refreshSets = useCallback(async () => {
    if (!sessionId) return;
    const [s, v] = await Promise.all([
      getSetsForSession(sessionId),
      getSessionVolume(sessionId),
    ]);
    setSets(s);
    setVolume(v);
  }, [sessionId]);

  useEffect(() => {
    refreshSets();
  }, [refreshSets]);

  // Ghosting — load last weight/reps when exercise changes
  useEffect(() => {
    if (!selectedExercise) return;
    getGhostValues(selectedExercise.id).then((ghost) => {
      if (ghost) {
        setWeight(String(ghost.weight));
        setReps(String(ghost.reps));
      } else {
        setWeight("");
        setReps("");
      }
    });
  }, [selectedExercise]);

  const handleAddSet = async () => {
    if (!selectedExercise) return;
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (isNaN(w) || isNaN(r) || w < 0 || r <= 0) {
      Alert.alert("Invalid input", "Enter a valid weight and rep count.");
      return;
    }
    await addSet(sessionId, selectedExercise.id, w, r);
    await refreshSets();
    // Keep weight, clear reps for next set
    setReps("");
  };

  const handleDeleteSet = async (setId: number) => {
    await deleteSet(setId);
    await refreshSets();
  };

  const handleEndSession = () => {
    Alert.alert("End Session", "Finish this workout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End",
        style: "destructive",
        onPress: async () => {
          await endSession(sessionId);
          router.replace("/");
        },
      },
    ]);
  };

  const selectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowPicker(false);
  };

  const multiplier = VIBE_MULTIPLIERS[vibe];
  const vibeLabel = vibe === "low" ? "Low Energy" : vibe === "crushing" ? "Crushing It" : "Normal";

  // ── Exercise Picker ────────────────────────────────────
  if (showPicker) {
    return (
      <View className="flex-1 bg-background pt-4">
        <View className="flex-row items-center justify-between px-6 mb-4">
          <Text className="text-2xl font-bold text-text">Pick Exercise</Text>
          <Pressable onPress={() => setShowPicker(false)}>
            <Text className="text-primary text-base">Cancel</Text>
          </Pressable>
        </View>
        <FlatList
          data={exercises}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <Pressable
              className="px-6 py-4 border-b border-accent"
              onPress={() => selectExercise(item)}
            >
              <Text className="text-text text-base font-bold">{item.name}</Text>
              <Text className="text-text-muted text-xs capitalize">
                {item.muscle_group.replace("_", " ")} · {item.category}
              </Text>
            </Pressable>
          )}
        />
      </View>
    );
  }

  // ── Main Workout UI ────────────────────────────────────
  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-text">Workout</Text>
          <Pressable onPress={handleEndSession}>
            <Text className="text-primary text-base font-bold">End Session</Text>
          </Pressable>
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-text-muted text-sm">Vibe: {vibeLabel} (x{multiplier.sets} sets, x{multiplier.reps} reps)</Text>
          <Text className="text-text-muted text-sm">{volume.toLocaleString()} kg vol</Text>
        </View>
      </View>

      {/* Input Area */}
      <View className="px-6 py-4 bg-surface mx-4 rounded-2xl mt-2">
        <Pressable
          className="bg-accent rounded-xl px-4 py-3 mb-3"
          onPress={() => setShowPicker(true)}
        >
          <Text className="text-text text-base">
            {selectedExercise ? selectedExercise.name : "Tap to select exercise"}
          </Text>
        </Pressable>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-text-muted text-xs mb-1">Weight (kg)</Text>
            <TextInput
              className="bg-background text-text rounded-xl px-4 py-3 text-lg"
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
              placeholder="0"
              placeholderTextColor="#8a8a9a"
            />
          </View>
          <View className="flex-1">
            <Text className="text-text-muted text-xs mb-1">Reps</Text>
            <TextInput
              className="bg-background text-text rounded-xl px-4 py-3 text-lg"
              keyboardType="number-pad"
              value={reps}
              onChangeText={setReps}
              placeholder="0"
              placeholderTextColor="#8a8a9a"
            />
          </View>
          <Pressable
            className="bg-primary rounded-xl px-5 justify-center self-end"
            style={{ paddingVertical: 14 }}
            onPress={handleAddSet}
          >
            <Text className="text-text text-lg font-bold">+</Text>
          </Pressable>
        </View>
      </View>

      {/* Sets List */}
      <FlatList
        data={sets}
        keyExtractor={(item) => String(item.id)}
        className="mt-4 px-4"
        ListEmptyComponent={
          <Text className="text-text-muted text-center mt-10">
            No sets logged yet. Pick an exercise and start lifting!
          </Text>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 mb-2">
            <View className="flex-1">
              <Text className="text-text text-base font-bold">{item.exercise_name}</Text>
              <Text className="text-text-muted text-sm">
                {item.weight} kg x {item.reps} reps ={" "}
                {(item.weight * item.reps).toLocaleString()} kg
              </Text>
            </View>
            <Pressable onPress={() => handleDeleteSet(item.id)}>
              <Text className="text-primary text-xl">✕</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}
