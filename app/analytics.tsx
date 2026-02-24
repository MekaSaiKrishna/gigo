import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Line, Polyline, Rect } from "react-native-svg";
import Animated, { FadeIn, FadeInUp, FadeOut, Layout } from "react-native-reanimated";
import { Calendar, type DateData } from "react-native-calendars";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "../src/constants/theme";
import { MUSCLE_GROUP_LABELS, MUSCLE_GROUP_ORDER } from "../src/data/exercise-meta";
import {
  getAllExercises,
  hardDeleteSession,
  getSetDetailsForSession,
  getSessionsForMonth,
  type HistorySession,
  type SessionSetDetail,
} from "../src/lib/database";
import {
  getExerciseWeeklyEstimated1RM,
  getExerciseWeeklyMax,
  getMonthlyVolume,
  getPersonalRecords,
  getWeeklyVolume,
  type PersonalRecord,
} from "../src/lib/analytics";
import HistoryDetailModal from "../src/components/HistoryDetailModal";
import {
  formatMonthLabel,
  formatWeekLabel,
  formatDuration,
  formatVibeLabel,
  formatSessionTime,
} from "../src/utils/date-format";
import type { Exercise, MuscleGroup } from "../src/types";

interface ChartPoint {
  label: string;
  value: number;
}

function toDateKey(timestampMs: number): string {
  const date = new Date(timestampMs);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}


function valueToY(value: number, maxValue: number, height: number, padding: number) {
  const innerHeight = Math.max(height - padding * 2, 1);
  if (maxValue <= 0) return height - padding;
  return height - padding - (value / maxValue) * innerHeight;
}

function LineChart({
  data,
  width,
  height = 220,
}: {
  data: ChartPoint[];
  width: number;
  height?: number;
}) {
  const padding = 24;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const innerWidth = Math.max(width - padding * 2, 1);
  const stepX = data.length > 1 ? innerWidth / (data.length - 1) : innerWidth;

  const points = data
    .map((point, index) => {
      const x = padding + index * stepX;
      const y = valueToY(point.value, maxValue, height, padding);
      return `${x},${y}`;
    })
    .join(" ");

  const gridLines = [0.25, 0.5, 0.75].map((ratio) => {
    const y = padding + ratio * (height - padding * 2);
    return { y, key: ratio };
  });

  return (
    <View>
      <Svg width={width} height={height}>
        {gridLines.map((gridLine) => (
          <Line
            key={`grid-${gridLine.key}`}
            x1={padding}
            y1={gridLine.y}
            x2={width - padding}
            y2={gridLine.y}
            stroke={COLORS.chartGrid}
            strokeWidth={1}
          />
        ))}
        <Line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke={COLORS.chartAxis}
          strokeWidth={1}
        />
        {data.length > 1 ? (
          <Polyline points={points} fill="none" stroke={COLORS.chartLine} strokeWidth={3} />
        ) : null}
      </Svg>
      <View className="flex-row justify-between mt-2">
        {data.map((point, index) => (
          <Text key={`${point.label}-${index}`} className="text-text-muted text-xs">
            {point.label.split(" ")[0]}
          </Text>
        ))}
      </View>
    </View>
  );
}

function BarChart({
  data,
  width,
  height = 220,
}: {
  data: ChartPoint[];
  width: number;
  height?: number;
}) {
  const padding = 24;
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const innerWidth = Math.max(width - padding * 2, 1);
  const gap = 6;
  const barCount = Math.max(data.length, 1);
  const barWidth = Math.max((innerWidth - gap * (barCount - 1)) / barCount, 3);

  return (
    <View>
      <Svg width={width} height={height}>
        <Line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke={COLORS.chartAxis}
          strokeWidth={1}
        />
        {data.map((point, index) => {
          const x = padding + index * (barWidth + gap);
          const y = valueToY(point.value, maxValue, height, padding);
          const barHeight = Math.max(height - padding - y, 1);
          return (
            <Rect
              key={`${point.label}-${index}`}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={COLORS.chartBar}
              rx={3}
            />
          );
        })}
      </Svg>
      <View className="flex-row justify-between mt-2">
        {data.map((point, index) => (
          <Text key={`${point.label}-${index}`} className="text-text-muted text-xs">
            {point.label.split(" ")[0]}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(width - 40, 280);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const [weeklyVolume, setWeeklyVolume] = useState<Array<{ week: string; total_volume: number }>>([]);
  const [monthlyVolume, setMonthlyVolume] = useState<Array<{ month: string; total_volume: number }>>([]);
  const [exerciseWeeklyMax, setExerciseWeeklyMax] = useState<Array<{ week: string; max_weight: number }>>([]);
  const [exerciseWeekly1RM, setExerciseWeekly1RM] = useState<
    Array<{ week: string; max_estimated_1rm: number }>
  >([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);

  const [historyMonth, setHistoryMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [monthSessions, setMonthSessions] = useState<HistorySession[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<HistorySession | null>(null);
  const [detailSets, setDetailSets] = useState<SessionSetDetail[]>([]);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  const selectedExercise = exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null;

  const loadMonthHistory = useCallback(async (year: number, month: number) => {
    setHistoryLoading(true);
    try {
      const sessions = await getSessionsForMonth(year, month);
      setMonthSessions(sessions);

      const firstDateWithWorkout = sessions[0] ? toDateKey(sessions[0].start_time) : null;
      setSelectedDate((prev) => {
        if (prev && sessions.some((session) => toDateKey(session.start_time) === prev)) {
          return prev;
        }
        return firstDateWithWorkout;
      });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadPersonalRecords = useCallback(async () => {
    const records = await getPersonalRecords();
    setPersonalRecords(records);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const [allExercises, weekly, monthly, prs] = await Promise.all([
          getAllExercises(),
          getWeeklyVolume(8),
          getMonthlyVolume(12),
          getPersonalRecords(),
        ]);

        if (!active) return;

        setExercises(allExercises);
        setWeeklyVolume(weekly);
        setMonthlyVolume(monthly);
        setPersonalRecords(prs);

        const firstExerciseId = allExercises[0]?.id ?? null;
        setSelectedExerciseId(firstExerciseId);

        if (firstExerciseId) {
          const [weeklyMax, weekly1rm] = await Promise.all([
            getExerciseWeeklyMax(firstExerciseId),
            getExerciseWeeklyEstimated1RM(firstExerciseId),
          ]);
          if (!active) return;
          setExerciseWeeklyMax(weeklyMax);
          setExerciseWeekly1RM(weekly1rm);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    void loadMonthHistory(historyMonth.year, historyMonth.month);
  }, [historyMonth, loadMonthHistory]);

  useEffect(() => {
    let active = true;

    const loadExerciseTrend = async () => {
      if (!selectedExerciseId) {
        setExerciseWeeklyMax([]);
        setExerciseWeekly1RM([]);
        return;
      }

      const [weeklyMax, weekly1rm] = await Promise.all([
        getExerciseWeeklyMax(selectedExerciseId),
        getExerciseWeeklyEstimated1RM(selectedExerciseId),
      ]);

      if (!active) return;
      setExerciseWeeklyMax(weeklyMax);
      setExerciseWeekly1RM(weekly1rm);
    };

    void loadExerciseTrend();

    return () => {
      active = false;
    };
  }, [selectedExerciseId]);

  const weeklyData = useMemo<ChartPoint[]>(
    () => weeklyVolume.map((item) => ({
      label: formatWeekLabel(item.week),
      value: Number(item.total_volume ?? 0),
    })),
    [weeklyVolume]
  );

  const monthlyData = useMemo<ChartPoint[]>(
    () => monthlyVolume.map((item) => ({
      label: formatMonthLabel(item.month),
      value: Number(item.total_volume ?? 0),
    })),
    [monthlyVolume]
  );

  const maxData = useMemo<ChartPoint[]>(
    () => exerciseWeeklyMax.map((item) => ({
      label: formatWeekLabel(item.week),
      value: Number(item.max_weight ?? 0),
    })),
    [exerciseWeeklyMax]
  );

  const current1RM = useMemo(
    () => exerciseWeekly1RM[exerciseWeekly1RM.length - 1]?.max_estimated_1rm,
    [exerciseWeekly1RM]
  );

  const markedDates = useMemo(() => {
    const map: Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }> =
      {};

    for (const session of monthSessions) {
      const key = toDateKey(session.start_time);
      map[key] = {
        ...(map[key] ?? {}),
        marked: true,
        dotColor: COLORS.primary,
      };
    }

    if (selectedDate) {
      map[selectedDate] = {
        ...(map[selectedDate] ?? {}),
        selected: true,
        selectedColor: COLORS.accent,
      };
    }

    return map;
  }, [monthSessions, selectedDate]);

  const selectedDateSessions = useMemo(() => {
    if (!selectedDate) return [];
    return monthSessions.filter((session) => toDateKey(session.start_time) === selectedDate);
  }, [monthSessions, selectedDate]);

  const groupedRecords = useMemo(() => {
    const grouped = new Map<MuscleGroup, PersonalRecord[]>();
    for (const record of personalRecords) {
      const list = grouped.get(record.muscle_group) ?? [];
      list.push(record);
      grouped.set(record.muscle_group, list);
    }

    return MUSCLE_GROUP_ORDER.filter((group) => grouped.has(group)).map((group) => ({
      group,
      title: MUSCLE_GROUP_LABELS[group],
      data: grouped.get(group) ?? [],
    }));
  }, [personalRecords]);

  const handleOpenHistoryDetail = async (session: HistorySession) => {
    setSelectedSession(session);
    const sets = await getSetDetailsForSession(session.id);
    setDetailSets(sets);
    setIsDetailVisible(true);
  };

  const handleDeleteWorkout = async (sessionId: number) => {
    setIsDeletingSession(true);
    try {
      await hardDeleteSession(sessionId);
      setIsDetailVisible(false);
      setSelectedSession(null);
      setDetailSets([]);
      await loadMonthHistory(historyMonth.year, historyMonth.month);
      await loadPersonalRecords();
    } catch {
      Alert.alert("Delete Failed", "Unable to delete this workout right now.");
    } finally {
      setIsDeletingSession(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={COLORS.primary} />
        <Text className="text-text-muted mt-3">Loading analytics...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-5 pt-5">
          <Text className="text-3xl font-bold text-text">Analytics</Text>
          <Text className="text-text-muted mt-1">Local, SQL-powered training trends</Text>
        </View>

        <View className="mx-5 mt-5 rounded-2xl bg-surface p-4">
          <Text className="text-text text-lg font-bold">Weekly Volume</Text>
          <Text className="text-text-muted text-sm mt-1">Last 8 weeks</Text>
          {weeklyData.length === 0 ? (
            <Text className="text-text-muted mt-4">No weekly volume yet.</Text>
          ) : (
            <LineChart data={weeklyData} width={chartWidth} />
          )}
        </View>

        <View className="mx-5 mt-5 rounded-2xl bg-surface p-4">
          <Text className="text-text text-lg font-bold">Monthly Volume</Text>
          <Text className="text-text-muted text-sm mt-1">Last 12 months</Text>
          {monthlyData.length === 0 ? (
            <Text className="text-text-muted mt-4">No monthly volume yet.</Text>
          ) : (
            <BarChart data={monthlyData} width={chartWidth} />
          )}
        </View>

        <View className="mx-5 mt-5 rounded-2xl bg-surface p-4">
          <Text className="text-text text-lg font-bold">Exercise Strength Trend</Text>
          <Text className="text-text-muted text-sm mt-1">Weekly max by exercise</Text>

          <Pressable
            className="mt-3 rounded-xl border border-accent px-4 py-3"
            onPress={() => setSelectorOpen((open) => !open)}
          >
            <Text className="text-text">{selectedExercise ? selectedExercise.name : "Select exercise"}</Text>
          </Pressable>

          {selectorOpen && (
            <View className="mt-2 max-h-52 rounded-xl border border-accent bg-background">
              <ScrollView>
                {exercises.map((exercise) => (
                  <Pressable
                    key={exercise.id}
                    className="px-4 py-3 border-b border-accent"
                    onPress={() => {
                      setSelectedExerciseId(exercise.id);
                      setSelectorOpen(false);
                    }}
                  >
                    <Text className="text-text">{exercise.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {maxData.length === 0 ? (
            <Text className="text-text-muted mt-4">No strength data yet for this exercise.</Text>
          ) : (
            <LineChart data={maxData} width={chartWidth} />
          )}

          <Text className="text-text-muted text-sm mt-1">
            Estimated 1RM (latest): {current1RM ? `${Math.round(current1RM)} lb` : "N/A"}
          </Text>
        </View>

        <View className="mx-5 mt-5 rounded-2xl bg-surface p-4">
          <Text className="text-text text-lg font-bold">Personal Records</Text>
          <Text className="text-text-muted text-sm mt-1">Best lift per exercise, grouped by body part</Text>

          <Animated.View
            key={`prs-${groupedRecords.length}`}
            entering={FadeInUp.duration(180)}
            exiting={FadeOut.duration(120)}
            layout={Layout.springify().damping(16)}
          >
            {groupedRecords.length === 0 ? (
              <Text className="text-text-muted mt-3">No records yet</Text>
            ) : (
              groupedRecords.map((section) => (
                <View key={section.group} className="mt-4">
                  <Text className="text-text font-bold text-base tracking-wide mb-2">{section.title}</Text>
                  {section.data.map((record) => {
                    const formattedWeight = Number.isInteger(record.max_weight)
                      ? `${record.max_weight}`
                      : record.max_weight.toFixed(1);
                    return (
                      <Text key={`${section.group}-${record.exercise_id}`} className="text-text-muted text-sm mb-1">
                        {record.exercise_name}: {formattedWeight}lb
                      </Text>
                    );
                  })}
                </View>
              ))
            )}
          </Animated.View>
        </View>

        <View className="mx-5 mt-5 rounded-2xl bg-surface p-4">
          <Text className="text-text text-lg font-bold">History</Text>
          <Text className="text-text-muted text-sm mt-1">Tap a date to view completed workouts</Text>

          <Calendar
            current={`${historyMonth.year}-${String(historyMonth.month).padStart(2, "0")}-01`}
            markedDates={markedDates}
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            onMonthChange={(month) => {
              setHistoryMonth({ year: month.year, month: month.month });
            }}
            theme={{
              calendarBackground: COLORS.surface,
              dayTextColor: COLORS.text,
              monthTextColor: COLORS.text,
              textDisabledColor: COLORS.textMuted,
              arrowColor: COLORS.primary,
              selectedDayBackgroundColor: COLORS.accent,
              selectedDayTextColor: COLORS.text,
              todayTextColor: COLORS.primary,
              dotColor: COLORS.primary,
            }}
            style={{ marginTop: 12, borderRadius: 12, overflow: "hidden" }}
          />

          <Animated.View
            key={`${historyMonth.year}-${historyMonth.month}-${selectedDate ?? "none"}`}
            entering={FadeInUp.duration(180)}
            exiting={FadeOut.duration(140)}
            layout={Layout.springify().damping(16)}
            className="mt-4"
          >
            {historyLoading ? (
              <View className="py-6 items-center">
                <ActivityIndicator color={COLORS.primary} />
              </View>
            ) : selectedDateSessions.length === 0 ? (
              <Text className="text-text-muted">No completed workouts for this date.</Text>
            ) : (
              selectedDateSessions.map((session) => (
                <Pressable
                  key={session.id}
                  className="rounded-xl bg-background border border-accent px-4 py-3 mb-2"
                  onPress={() => {
                    void handleOpenHistoryDetail(session);
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-text font-semibold">Workout • {formatSessionTime(session.start_time)}</Text>
                    <Feather name="chevron-right" size={16} color={COLORS.textMuted} />
                  </View>
                  <View className="flex-row mt-2 items-center">
                    <Feather name="bar-chart-2" size={12} color={COLORS.textMuted} />
                    <Text className="text-text-muted text-xs ml-2">{session.total_volume.toLocaleString()} lb</Text>
                    <Text className="text-text-muted text-xs ml-3">•</Text>
                    <Feather name="clock" size={12} color={COLORS.textMuted} style={{ marginLeft: 12 }} />
                    <Text className="text-text-muted text-xs ml-2">{formatDuration(session.elapsed_time)}</Text>
                    <Text className="text-text-muted text-xs ml-3">• {formatVibeLabel(session.vibe)}</Text>
                  </View>
                </Pressable>
              ))
            )}
          </Animated.View>
        </View>
      </ScrollView>

      <Animated.View entering={FadeIn.duration(140)}>
        <HistoryDetailModal
          visible={isDetailVisible}
          session={selectedSession}
          sets={detailSets}
          deleting={isDeletingSession}
          onDeleteWorkout={handleDeleteWorkout}
          onClose={() => {
            setIsDetailVisible(false);
            setSelectedSession(null);
            setDetailSets([]);
          }}
        />
      </Animated.View>
    </>
  );
}
