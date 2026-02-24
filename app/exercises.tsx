import { useEffect, useMemo, useState } from "react";
import {
  SectionList,
  Text,
  View,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import { getAllExercises } from "@/lib/database";
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ORDER } from "@/data/exercise-meta";
import ExerciseDemo from "@/components/ExerciseDemo";
import type { Exercise, MuscleGroup } from "@/types";

interface ExerciseSection {
  title: string;
  data: Exercise[];
}

export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    let mounted = true;
    getAllExercises()
      .then((list) => {
        if (mounted) {
          setExercises(list);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const sections: ExerciseSection[] = useMemo(() => {
    const grouped = new Map<MuscleGroup, Exercise[]>();
    for (const ex of exercises) {
      const list = grouped.get(ex.muscle_group) ?? [];
      list.push(ex);
      grouped.set(ex.muscle_group, list);
    }
    return MUSCLE_GROUP_ORDER.filter((mg) => grouped.has(mg)).map((mg) => ({
      title: MUSCLE_GROUP_LABELS[mg],
      data: grouped.get(mg)!,
    }));
  }, [exercises]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#34d399" size="large" />
      </View>
    );
  }

  return (
    <>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled
        contentContainerStyle={{ paddingBottom: 32 }}
        ListHeaderComponent={
          <View className="px-6 pt-6 pb-2">
            <Text className="text-3xl font-bold text-text">Exercise Library</Text>
            <Text className="text-text-muted text-sm mt-1">
              {exercises.length} exercises · tap for demo
            </Text>
          </View>
        }
        renderSectionHeader={({ section: { title } }) => (
          <View className="bg-background px-6 py-3 border-b border-accent">
            <Text className="text-primary text-sm font-bold uppercase tracking-widest">
              {title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            className="px-6 py-4 border-b border-accent/30"
            onPress={() => setSelectedExercise(item)}
          >
            <Text className="text-text text-base font-bold">{item.name}</Text>
            <Text className="text-text-muted text-xs capitalize">{item.category}</Text>
          </Pressable>
        )}
        style={{ flex: 1, backgroundColor: "#0f172a" }}
      />

      <Modal
        visible={selectedExercise !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedExercise(null)}
      >
        <View className="flex-1 bg-background px-6 pt-8">
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-1 mr-4">
              <Text className="text-2xl font-bold text-text">{selectedExercise?.name}</Text>
              <Text className="text-text-muted text-sm capitalize mt-1">
                {selectedExercise?.category} ·{" "}
                {selectedExercise ? MUSCLE_GROUP_LABELS[selectedExercise.muscle_group] : ""}
              </Text>
            </View>
            <Pressable onPress={() => setSelectedExercise(null)}>
              <Text className="text-primary text-base font-semibold">Done</Text>
            </Pressable>
          </View>

          {selectedExercise && (
            <ExerciseDemo exerciseName={selectedExercise.name} />
          )}
        </View>
      </Modal>
    </>
  );
}
