import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  FlatList,
  SectionList,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  Keyboard,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, {
  FadeInUp,
} from "react-native-reanimated";
import LottieView from "lottie-react-native";
import * as Sharing from "expo-sharing";
import ViewShot, { captureRef } from "react-native-view-shot";
import {
  getAllExercises,
  addSet,
  deleteSet,
  updateSet,
  getActiveSession,
  getSetsForSession,
  getGhostValues,
  endSessionWithTimer,
  getSession,
  getSessionVolume,
  getTotalVolume,
  renameSession,
  updateSessionTimer,
} from "../src/lib/database";
import { VIBE_MULTIPLIERS } from "../src/types";
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ORDER } from "../src/data/exercise-meta";
import SummaryCard, { type SummaryExerciseItem } from "../src/components/SummaryCard";
import {
  formatDuration,
  formatVibeLabel,
  formatSessionDate,
} from "../src/utils/date-format";
import { notifySessionEnded } from "../src/lib/session-notifications";
import type { Exercise, VibeLevel, WorkoutSet, MuscleGroup } from "../src/types";

type SetWithName = WorkoutSet & { exercise_name: string };

interface ExerciseSection {
  title: string;
  data: Exercise[];
}

interface SessionSummary {
  sessionName: string;
  totalVolume: number;
  sessionDuration: string;
  sessionDate: string;
  sessionTimestampMs: number;
  vibeLabel: string;
  exercises: SummaryExerciseItem[];
}

const CONFETTI_URI = "https://assets2.lottiefiles.com/packages/lf20_obhph3sh.json";
const CHIBI_SPRITE = require("../assets/maheshsprite.png");
const SPRITE_FRAMES = 11;
const SPRITE_FRAME_WIDTH = 121;
const SPRITE_FRAME_HEIGHT = 158;
const SPRITE_DISPLAY_HEIGHT = 220;
const SPRITE_FRAME_DURATION_MS = 55;
const SPRITE_SCALE = SPRITE_DISPLAY_HEIGHT / SPRITE_FRAME_HEIGHT;
const SPRITE_DISPLAY_WIDTH = Math.round(SPRITE_FRAME_WIDTH * SPRITE_SCALE);
const SAFE_MUSCLE_GROUP_ORDER: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "legs",
  "glutes",
  "core",
  "forearms",
  "full_body",
];
const SAFE_MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  legs: "Legs",
  glutes: "Glutes",
  core: "Core",
  forearms: "Forearms",
  full_body: "Full Body",
};


function buildExerciseSummary(sets: SetWithName[]): SummaryExerciseItem[] {
  const grouped = new Map<string, { sets: number; repsTotal: number }>();

  for (const set of sets) {
    const current = grouped.get(set.exercise_name) ?? { sets: 0, repsTotal: 0 };
    current.sets += 1;
    current.repsTotal += set.reps;
    grouped.set(set.exercise_name, current);
  }

  return [...grouped.entries()]
    .map(([name, value]) => ({
      name,
      sets: value.sets,
      reps: Math.max(Math.round(value.repsTotal / value.sets), 1),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function WorkoutScreen() {
  const { sessionId: rawId, vibe: rawVibe } = useLocalSearchParams<{
    sessionId: string;
    vibe: string;
  }>();
  const sessionId = Number(rawId);
  const VALID_VIBES: VibeLevel[] = ["low", "normal", "crushing"];
  const vibe: VibeLevel = VALID_VIBES.includes(rawVibe as VibeLevel)
    ? (rawVibe as VibeLevel)
    : "normal";
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sets, setSets] = useState<SetWithName[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [volume, setVolume] = useState(0);
  const [totalVolume, setTotalVolume] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [pendingSummary, setPendingSummary] = useState<SessionSummary | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [spriteFrame, setSpriteFrame] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [editingSetId, setEditingSetId] = useState<number | null>(null);
  const [editingWeight, setEditingWeight] = useState("");
  const [editingReps, setEditingReps] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [sessionName, setSessionName] = useState("Workout");
  const [summarySessionName, setSummarySessionName] = useState("");

  const summaryCardRef = useRef<ViewShot | null>(null);
  const confettiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spriteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSavedElapsedRef = useRef(0);
  const elapsedSecondsRef = useRef(0);
  const isTimerPausedRef = useRef(false);

  useEffect(() => {
    if (Number.isFinite(sessionId) && sessionId > 0) return;

    let mounted = true;
    const recoverSession = async () => {
      const active = await getActiveSession();
      if (!mounted) return;
      if (active) {
        router.replace(`/workout?sessionId=${active.id}&vibe=${active.vibe}`);
      } else {
        router.replace("/");
      }
    };

    void recoverSession();
    return () => {
      mounted = false;
    };
  }, [sessionId, router]);

  const sections: ExerciseSection[] = useMemo(() => {
    const order = Array.isArray(MUSCLE_GROUP_ORDER) ? MUSCLE_GROUP_ORDER : SAFE_MUSCLE_GROUP_ORDER;
    const labels = MUSCLE_GROUP_LABELS ?? SAFE_MUSCLE_GROUP_LABELS;
    const grouped = new Map<MuscleGroup, Exercise[]>();
    for (const ex of exercises) {
      const list = grouped.get(ex.muscle_group) ?? [];
      list.push(ex);
      grouped.set(ex.muscle_group, list);
    }
    return order
      .filter((mg) => grouped.has(mg))
      .map((mg) => ({
        title: labels[mg] ?? SAFE_MUSCLE_GROUP_LABELS[mg],
        data: grouped.get(mg)!,
      }));
  }, [exercises]);

  useEffect(() => {
    getAllExercises().then(setExercises);
  }, []);

  const refreshSets = useCallback(async () => {
    if (!Number.isFinite(sessionId) || sessionId <= 0) return;
    const [s, v, tv] = await Promise.all([
      getSetsForSession(sessionId),
      getSessionVolume(sessionId),
      getTotalVolume(),
    ]);
    setSets(s);
    setVolume(v);
    setTotalVolume(tv);
  }, [sessionId]);

  useEffect(() => {
    void refreshSets();
  }, [refreshSets]);

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  useEffect(() => {
    isTimerPausedRef.current = isTimerPaused;
  }, [isTimerPaused]);

  const persistTimerState = useCallback(
    async (seconds: number, paused: boolean) => {
      if (!Number.isFinite(sessionId) || sessionId <= 0) return;
      try {
        await updateSessionTimer(sessionId, seconds, paused);
        lastSavedElapsedRef.current = seconds;
      } catch (err) {
        // Keep UI responsive even if timer persistence temporarily fails.
        console.warn("[GiGoFit] Timer persistence failed:", err);
      }
    },
    [sessionId]
  );

  useEffect(() => {
    if (!Number.isFinite(sessionId) || sessionId <= 0) return;

    let mounted = true;

    const loadSessionTimer = async () => {
      const session = await getSession(sessionId);
      if (!mounted || !session) return;
      const initialElapsed = Math.max(0, Math.floor(session.elapsed_time));
      setElapsedSeconds(initialElapsed);
      setIsTimerPaused(session.is_paused);
      setSessionName(session.display_name ?? "Workout");
      lastSavedElapsedRef.current = initialElapsed;
    };

    void loadSessionTimer();

    return () => {
      mounted = false;
    };
  }, [sessionId]);

  useEffect(() => {
    if (isTimerPaused || summary || showCelebration) return;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerPaused, summary, showCelebration]);

  useEffect(() => {
    if (isTimerPaused || summary || showCelebration) return;

    const diff = elapsedSeconds - lastSavedElapsedRef.current;
    if (diff >= 5) {
      void persistTimerState(elapsedSeconds, false);
    }
  }, [elapsedSeconds, isTimerPaused, summary, showCelebration, persistTimerState]);

  useEffect(() => {
    return () => {
      void persistTimerState(elapsedSecondsRef.current, isTimerPausedRef.current);
      if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
      if (spriteTimerRef.current) clearInterval(spriteTimerRef.current);
    };
  }, [persistTimerState]);

  useEffect(() => {
    if (!showCelebration) return;

    setShowConfetti(true);
    setSpriteFrame(0);

    let frame = 0;
    spriteTimerRef.current = setInterval(() => {
      frame = (frame + 1) % SPRITE_FRAMES;
      setSpriteFrame(frame);
    }, SPRITE_FRAME_DURATION_MS);

    return () => {
      if (spriteTimerRef.current) {
        clearInterval(spriteTimerRef.current);
        spriteTimerRef.current = null;
      }
      if (confettiTimerRef.current) {
        clearTimeout(confettiTimerRef.current);
        confettiTimerRef.current = null;
      }
    };
  }, [showCelebration]);

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
    if (!Number.isFinite(sessionId) || sessionId <= 0) return;
    const hasWeightInput = weight.trim() !== "";
    const hasRepsInput = reps.trim() !== "";
    if (!selectedExercise) {
      if (hasWeightInput && hasRepsInput) {
        Alert.alert("Select Exercise", "Choose an exercise before logging a set.");
      }
      return;
    }
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);

    if (!hasWeightInput || !hasRepsInput) {
      Alert.alert("Invalid Input", "Enter a valid weight and rep count");
      return;
    }
    if (isNaN(w) || isNaN(r) || w < 0 || r <= 0 || w > 1000 || r > 999) {
      Alert.alert("Invalid Input", "Weight must be 0–1000 and reps must be 1–999");
      return;
    }

    await addSet(sessionId, selectedExercise.id, w, r);
    await refreshSets();
    setReps("");
    Keyboard.dismiss();
  };

  const handleDeleteSet = async (setId: number) => {
    try {
      await deleteSet(setId);
      await refreshSets();
    } catch {
      Alert.alert("Error", "Unable to delete this set right now.");
    }
  };

  const handleStartEditSet = (setItem: SetWithName) => {
    setEditingSetId(setItem.id);
    setEditingWeight(String(setItem.weight));
    setEditingReps(String(setItem.reps));
  };

  const handleCancelEditSet = () => {
    setEditingSetId(null);
    setEditingWeight("");
    setEditingReps("");
  };

  const handleSaveEditSet = async () => {
    if (!editingSetId) return;

    const w = parseFloat(editingWeight);
    const r = parseInt(editingReps, 10);

    if (editingWeight.trim() === "" || editingReps.trim() === "" || w < 0 || isNaN(w) || isNaN(r) || r <= 0 || w > 1000 || r > 999) {
      Alert.alert("Invalid Input", "Weight must be 0–1000 and reps must be 1–999");
      return;
    }

    try {
      await updateSet(editingSetId, w, r);
      await refreshSets();
      handleCancelEditSet();
      Keyboard.dismiss();
    } catch {
      Alert.alert("Error", "Unable to update this set right now.");
    }
  };

  const confirmDeleteSet = (setId: number) => {
    Alert.alert("Delete Set?", "Are you sure you want to permanently remove this set?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void handleDeleteSet(setId);
        },
      },
    ]);
  };

  const handleToggleTimerPause = async () => {
    const nextPaused = !isTimerPaused;
    setIsTimerPaused(nextPaused);
    await persistTimerState(elapsedSeconds, nextPaused);
  };

  const handleRestartTimer = () => {
    Alert.alert("Restart Timer", "Reset the session timer to 00:00:00?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restart",
        style: "destructive",
        onPress: () => {
          setElapsedSeconds(0);
          setIsTimerPaused(false);
          void persistTimerState(0, false);
        },
      },
    ]);
  };

  const handleDownloadSummary = async () => {
    if (!summaryCardRef.current) return;

    try {
      setIsSharing(true);
      const uri = await captureRef(summaryCardRef.current, {
        format: "png",
        quality: 1,
        width: 1080,
        height: 1080,
        result: "tmpfile",
      });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("Unavailable", "Sharing is not available on this device.");
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: "Download Summary",
        UTI: "public.png",
      });
    } catch (err) {
      console.warn("[GiGoFit] Export failed:", err);
      Alert.alert("Export Failed", "Could not generate workout summary image.");
    } finally {
      setIsSharing(false);
    }
  };

  const handleSaveSessionName = async () => {
    if (!Number.isFinite(sessionId) || sessionId <= 0) return;
    try {
      await renameSession(sessionId, summarySessionName);
      const updated = await getSession(sessionId);
      const trimmed = summarySessionName.trim();
      const displayName = updated?.display_name ?? (trimmed.length > 0 ? trimmed : "Workout");
      setSessionName(displayName);
      setSummarySessionName(displayName);
      setSummary((prev) => (prev ? { ...prev, sessionName: displayName } : prev));
      Alert.alert("Saved", "Workout name updated.");
    } catch {
      Alert.alert("Error", "Unable to update workout name.");
    }
  };

  const handleEndSession = () => {
    Alert.alert("End Session", "Finish this workout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End",
        style: "destructive",
        onPress: async () => {
          try {
            setIsTimerPaused(true);
            await endSessionWithTimer(sessionId, elapsedSecondsRef.current);

            const endedSession = await getSession(sessionId);
            const endedName = endedSession?.display_name ?? sessionName;
            await notifySessionEnded(endedName);
            const sessionLoggedTime = endedSession?.end_time ?? endedSession?.start_time ?? Date.now();

            const nextSummary: SessionSummary = {
              sessionName: endedName,
              totalVolume: volume,
              sessionDuration: formatDuration(elapsedSecondsRef.current),
              sessionDate: formatSessionDate(sessionLoggedTime),
              sessionTimestampMs: sessionLoggedTime,
              vibeLabel: formatVibeLabel(vibe),
              exercises: buildExerciseSummary(sets),
            };

            setPendingSummary(nextSummary);
            setSummarySessionName(nextSummary.sessionName);
            setShowCelebration(true);
          } catch {
            Alert.alert("Error", "Unable to end session.");
          }
        },
      },
    ]);
  };

  const handleCheckoutSummary = () => {
    if (!pendingSummary) return;
    if (confettiTimerRef.current) clearTimeout(confettiTimerRef.current);
    if (spriteTimerRef.current) clearInterval(spriteTimerRef.current);

    setShowCelebration(false);
    setShowConfetti(false);
    setSummary(pendingSummary);
    setPendingSummary(null);
  };

  const selectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setShowPicker(false);
  };

  const multiplier = VIBE_MULTIPLIERS[vibe];
  const vibeLabel = formatVibeLabel(vibe);

  if (summary) {
    const cardSize = Math.min(width - 32, 360);

    return (
      <View className="flex-1 bg-background px-4 pt-8">
        <Text className="text-2xl font-bold text-text text-center mb-4">Session Complete</Text>

        <View className="bg-surface rounded-2xl p-3 mb-4">
          <Text className="text-text-muted text-xs uppercase tracking-widest mb-1">Workout Name</Text>
          <TextInput
            className="bg-background rounded-xl px-4 py-3 text-text"
            value={summarySessionName}
            onChangeText={setSummarySessionName}
            placeholder={summary.sessionName}
            placeholderTextColor="#8a8a9a"
            maxLength={48}
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          <Pressable className="bg-accent rounded-xl px-4 py-2 mt-2 items-center" onPress={handleSaveSessionName}>
            <Text className="text-text font-semibold">Save Name</Text>
          </Pressable>
        </View>

        <View className="items-center">
          <ViewShot ref={summaryCardRef} options={{ format: "png", quality: 1 }}>
            <SummaryCard
              sessionName={summary.sessionName}
              totalVolume={summary.totalVolume}
              sessionDuration={summary.sessionDuration}
              sessionDate={summary.sessionDate}
              sessionTimestampMs={summary.sessionTimestampMs}
              vibeLabel={summary.vibeLabel}
              exercises={summary.exercises}
              size={cardSize}
            />
          </ViewShot>
        </View>

        <Pressable
          className="bg-primary rounded-2xl px-6 py-4 mt-6 items-center"
          onPress={handleDownloadSummary}
          disabled={isSharing}
        >
          {isSharing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-base font-bold">Download Summary</Text>
          )}
        </Pressable>

        <Pressable className="bg-surface rounded-2xl px-6 py-4 mt-3 items-center" onPress={() => router.replace("/")}>
          <Text className="text-text text-base font-semibold">Done</Text>
        </Pressable>
      </View>
    );
  }

  if (showCelebration && pendingSummary) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        {showConfetti ? (
          <View className="absolute inset-0">
            <LottieView
              source={{ uri: CONFETTI_URI }}
              autoPlay
              loop
              style={{ width: "100%", height: "100%" }}
            />
          </View>
        ) : null}

        <Animated.View className="items-center">
          <View
            className="overflow-hidden"
            style={{ width: SPRITE_DISPLAY_WIDTH, height: SPRITE_DISPLAY_HEIGHT }}
          >
            <Image
              source={CHIBI_SPRITE}
              style={{
                width: SPRITE_FRAME_WIDTH * SPRITE_FRAMES * SPRITE_SCALE,
                height: SPRITE_FRAME_HEIGHT * SPRITE_SCALE,
                transform: [{ translateX: -spriteFrame * SPRITE_FRAME_WIDTH * SPRITE_SCALE }],
              }}
              resizeMode="cover"
            />
          </View>
          <Pressable
            className="mt-6 bg-primary rounded-xl px-6 py-3"
            onPress={handleCheckoutSummary}
          >
            <Text className="text-white text-base font-bold">Checkout Summary</Text>
          </Pressable>
        </Animated.View>

      </View>
    );
  }

  if (showPicker) {
    return (
      <View className="flex-1 bg-background pt-4">
        <View className="flex-row items-center justify-between px-6 mb-4">
          <Text className="text-2xl font-bold text-text">Pick Exercise</Text>
          <Pressable onPress={() => setShowPicker(false)}>
            <Text className="text-primary text-base">Cancel</Text>
          </Pressable>
        </View>
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-background px-6 py-3 border-b border-accent">
              <Text className="text-primary text-sm font-bold uppercase tracking-widest">{title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <Pressable className="px-6 py-4 border-b border-accent/30" onPress={() => selectExercise(item)}>
              <Text className="text-text text-base font-bold">{item.name}</Text>
              <Text className="text-text-muted text-xs capitalize">{item.category}</Text>
            </Pressable>
          )}
        />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
        <View className="px-6 pt-5 pb-3">
          <View>
            <Text className="text-3xl font-bold text-text">{sessionName}</Text>
            <Text className="text-text text-5xl font-extrabold mt-2 tracking-wide">
              {formatDuration(elapsedSeconds)}
            </Text>
          </View>

          <View className="flex-row mt-3 items-center justify-between">
            <Pressable className="rounded-lg px-4 py-2 bg-white" onPress={handleRestartTimer}>
              <Text className="text-black text-sm font-semibold">Restart</Text>
            </Pressable>
            <Pressable
              className={`rounded-lg px-4 py-2 border border-accent ${
                isTimerPaused ? "bg-slate-700" : "bg-white"
              }`}
              onPress={() => {
                void handleToggleTimerPause();
              }}
            >
              <Text className={`text-sm font-semibold ${isTimerPaused ? "text-white" : "text-black"}`}>
                {isTimerPaused ? "Play" : "Pause"}
              </Text>
            </Pressable>
            <Pressable className="rounded-lg px-4 py-2 border border-accent bg-surface" onPress={handleEndSession}>
              <Text className="text-primary text-sm font-bold">End Session</Text>
            </Pressable>
          </View>

          <View className="flex-row justify-between mt-3">
            <Text className="text-text-muted text-base">
              Vibe: {vibeLabel} (x{multiplier.sets} sets, x{multiplier.reps} reps)
            </Text>
            <Text className="text-text-muted text-base">{volume.toLocaleString()} lb vol</Text>
          </View>
          <Text className="text-text-muted text-sm mt-1">All-time volume: {totalVolume.toLocaleString()} lb</Text>
        </View>

        <View className="px-6 py-4 bg-surface mx-4 rounded-2xl mt-2">
          <Pressable className="bg-accent rounded-xl px-4 py-3 mb-3" onPress={() => setShowPicker(true)}>
            <Text className="text-text text-base">
              {selectedExercise ? selectedExercise.name : "Tap to select exercise"}
            </Text>
          </Pressable>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-text-muted text-xs mb-1">Weight (lb)</Text>
              <TextInput
                className="bg-background text-text rounded-xl px-4 py-3 text-lg"
                keyboardType="decimal-pad"
                value={weight}
                onChangeText={setWeight}
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
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
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
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

        <View className="flex-1" style={{ minHeight: 0 }}>
          <FlatList
            data={sets}
            keyExtractor={(item) => String(item.id)}
            className="mt-4 px-4 flex-1"
            nestedScrollEnabled
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={
              <Text className="text-text-muted text-center mt-10">
                No sets logged yet. Pick an exercise and start lifting!
              </Text>
            }
            renderItem={({ item }) => (
              <View className="bg-surface rounded-xl px-4 py-3 mb-2">
                <View className="flex-row items-start">
                  <View className="flex-1 pr-3">
                    <Text className="text-text text-base font-bold">{item.exercise_name}</Text>

                    {editingSetId === item.id ? (
                      <View className="mt-2">
                        <View className="flex-row gap-2">
                          <TextInput
                            className="flex-1 bg-background text-text rounded-lg px-3 py-2"
                            keyboardType="decimal-pad"
                            value={editingWeight}
                            onChangeText={setEditingWeight}
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                            placeholder="Weight"
                            placeholderTextColor="#8a8a9a"
                          />
                          <TextInput
                            className="flex-1 bg-background text-text rounded-lg px-3 py-2"
                            keyboardType="number-pad"
                            value={editingReps}
                            onChangeText={setEditingReps}
                            returnKeyType="done"
                            onSubmitEditing={() => Keyboard.dismiss()}
                            placeholder="Reps"
                            placeholderTextColor="#8a8a9a"
                          />
                        </View>
                        <View className="flex-row mt-2 gap-2">
                          <Pressable className="bg-primary rounded-lg px-3 py-2" onPress={handleSaveEditSet}>
                            <Text className="text-white font-semibold">Save</Text>
                          </Pressable>
                          <Pressable className="bg-accent rounded-lg px-3 py-2" onPress={handleCancelEditSet}>
                            <Text className="text-text font-semibold">Cancel</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <>
                        <View className="flex-row items-center flex-wrap mt-1">
                          <Pressable onPress={() => handleStartEditSet(item)}>
                            <Text className="text-text-muted text-sm underline">{item.weight} lb</Text>
                          </Pressable>
                          <Text className="text-text-muted text-sm"> x </Text>
                          <Pressable onPress={() => handleStartEditSet(item)}>
                            <Text className="text-text-muted text-sm underline">{item.reps} reps</Text>
                          </Pressable>
                          <Text className="text-text-muted text-sm">
                            {" "}= {(item.weight * item.reps).toLocaleString()} lb
                          </Text>
                        </View>
                        <Text className="text-text-muted text-xs mt-1">Tap weight or reps to edit</Text>
                      </>
                    )}
                  </View>

                  <Pressable onPress={() => confirmDeleteSet(item.id)} className="pt-1">
                    <Text className="text-primary text-xl">🗑</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        </View>
    </View>
  );
}
