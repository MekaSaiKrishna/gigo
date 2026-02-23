import { useRef } from "react";
import { View, Text, Pressable, Alert, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import type { SessionSummary, VibeLevel } from "../types";

const VIBE_CONFIG: Record<VibeLevel, { label: string; icon: string }> = {
  low: { label: "LOW ENERGY", icon: "🔋" },
  normal: { label: "NORMAL", icon: "💪" },
  crushing: { label: "CRUSHING IT", icon: "🔥" },
};

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg.toLocaleString()}kg`;
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

interface SummaryCardProps {
  summary: SessionSummary;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const { width: screenWidth } = useWindowDimensions();
  const cardSize = Math.min(screenWidth - 48, 380);
  const vibeInfo = VIBE_CONFIG[summary.session.vibe];

  const handleShare = async () => {
    try {
      const uri = await captureRef(viewShotRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share your workout",
        });
      } else {
        Alert.alert("Sharing unavailable", "Sharing is not supported on this device.");
      }
    } catch {
      Alert.alert("Error", "Could not capture the summary card.");
    }
  };

  return (
    <View className="items-center">
      <ViewShot
        ref={viewShotRef}
        options={{ format: "png", quality: 1 }}
      >
        <View
          style={{ width: cardSize, height: cardSize }}
          className="overflow-hidden rounded-3xl"
        >
          <LinearGradient
            colors={["#0f172a", "#1e293b", "#0f172a"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, padding: 24, justifyContent: "space-between" }}
          >
            {/* ── Top: Vibe indicator ── */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-lg mr-1">{vibeInfo.icon}</Text>
                <Text
                  className="text-slate-400 text-xs font-bold uppercase"
                  style={{ letterSpacing: 3 }}
                >
                  {vibeInfo.label}
                </Text>
              </View>
              <Text className="text-slate-500 text-xs" style={{ letterSpacing: 1 }}>
                WORKOUT COMPLETE
              </Text>
            </View>

            {/* ── Center: Big numbers ── */}
            <View className="items-center">
              <Text
                className="text-white font-bold"
                style={{ fontSize: 52, letterSpacing: -2, lineHeight: 56 }}
              >
                {formatVolume(summary.totalVolume)}
              </Text>
              <Text
                className="text-slate-400 text-xs uppercase mt-1"
                style={{ letterSpacing: 4 }}
              >
                TOTAL VOLUME
              </Text>

              <View className="flex-row items-center mt-5 gap-8">
                <View className="items-center">
                  <Text
                    className="text-white font-bold text-2xl"
                    style={{ letterSpacing: -1 }}
                  >
                    {formatDuration(summary.durationMinutes)}
                  </Text>
                  <Text
                    className="text-slate-500 text-xs uppercase mt-1"
                    style={{ letterSpacing: 2 }}
                  >
                    DURATION
                  </Text>
                </View>
                <View className="w-px h-8 bg-slate-700" />
                <View className="items-center">
                  <Text
                    className="text-white font-bold text-2xl"
                    style={{ letterSpacing: -1 }}
                  >
                    {summary.totalSets}
                  </Text>
                  <Text
                    className="text-slate-500 text-xs uppercase mt-1"
                    style={{ letterSpacing: 2 }}
                  >
                    SETS
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Exercise breakdown ── */}
            <View className="bg-white/5 rounded-2xl px-4 py-3">
              {summary.exercises.slice(0, 5).map((ex, i) => (
                <View
                  key={ex.exercise_name}
                  className={`flex-row justify-between items-center ${
                    i < Math.min(summary.exercises.length, 5) - 1 ? "mb-2" : ""
                  }`}
                >
                  <Text
                    className="text-slate-300 text-sm flex-1"
                    numberOfLines={1}
                  >
                    {ex.exercise_name}
                  </Text>
                  <Text className="text-slate-500 text-sm ml-3">
                    {ex.set_count} {ex.set_count === 1 ? "set" : "sets"}
                  </Text>
                </View>
              ))}
              {summary.exercises.length > 5 && (
                <Text className="text-slate-600 text-xs mt-1">
                  +{summary.exercises.length - 5} more
                </Text>
              )}
            </View>

            {/* ── Branding ── */}
            <View className="items-center mt-1">
              <Text
                className="text-slate-600 font-bold text-sm"
                style={{ letterSpacing: 6 }}
              >
                GIGOFIT
              </Text>
            </View>
          </LinearGradient>
        </View>
      </ViewShot>

      {/* ── Share button (outside the captured card) ── */}
      <Pressable
        className="bg-primary rounded-2xl px-10 py-4 mt-6 w-full items-center"
        onPress={handleShare}
      >
        <Text className="text-text text-base font-bold">Download Image</Text>
      </Pressable>
    </View>
  );
}
