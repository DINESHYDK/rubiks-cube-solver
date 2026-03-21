import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/lib/theme";
import { useSettings, getBestTime, getSessionStats } from "@/lib/storage";
import { useCubeStore } from "@/stores/cubeStore";
import Cube3D from "@/components/cube/Cube3D";
import type { SessionStats } from "@/types/cube";

// ── Shared shadow ─────────────────────────────────────────────────────────────
const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  android: { elevation: 4 },
  default: {},
}) as object;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(ms: number | null | undefined): string {
  if (!ms) return "--";
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(2)}s`;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(0).padStart(2, "0")}`;
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const t = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      style={s.statCardOuter}
      onPressIn={() => { scale.value = withTiming(0.95, { duration: 120 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 120 }); }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          s.statCard,
          shadow,
          { backgroundColor: t.CARD, borderColor: t.BORDER },
          animStyle,
        ]}
      >
        <Text style={[s.statLabel, { color: t.MUTED }]}>{label}</Text>
        <Text style={[s.statValue, { color: t.TEXT }]}>{value}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ── ActionCard ────────────────────────────────────────────────────────────────
function ActionCard({
  color,
  icon,
  title,
  desc,
  onPress,
}: {
  color: string;
  icon: string;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      style={s.actionCardOuter}
      onPressIn={() => {
        scale.value   = withTiming(0.96, { duration: 120 });
        opacity.value = withTiming(0.85, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value   = withTiming(1, { duration: 120 });
        opacity.value = withTiming(1, { duration: 120 });
      }}
      onPress={onPress}
    >
      <Animated.View
        style={[s.actionCard, shadow, { backgroundColor: color }, animStyle]}
      >
        <View style={s.iconWrap}>
          <Ionicons name={icon as any} size={24} color="#fff" />
        </View>
        <Text style={s.actionTitle}>{title}</Text>
        <Text style={s.actionDesc}>{desc}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ── CubeCard ──────────────────────────────────────────────────────────────────
const CubeCard = React.memo(({ onPress }: { onPress: () => void }) => {
  const t         = useTheme();
  const cubeState = useCubeStore((state) => state.cubeState);
  const cubeScale = useSharedValue(1);
  const cubeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cubeScale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => { cubeScale.value = withTiming(0.97, { duration: 120 }); }}
      onPressOut={() => { cubeScale.value = withTiming(1, { duration: 120 }); }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          s.cubeCard,
          shadow,
          { backgroundColor: t.CARD, borderColor: t.BORDER },
          cubeAnimStyle,
        ]}
      >
        <Cube3D height={242} cubeState={cubeState} autoRotate={false} />
        <View style={[s.cubeFooter, { borderTopColor: t.BORDER }]}>
          <Text style={[s.cubeFooterLabel, { color: t.MUTED }]}>
            Your last cube · tap to solve
          </Text>
          <Ionicons name="chevron-forward" size={14} color={t.MUTED} />
        </View>
      </Animated.View>
    </Pressable>
  );
});

// ── HomeScreen ────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router    = useRouter();
  const t         = useTheme();
  const { settings, loadSettings } = useSettings();

  const [bestTime, setBestTime] = useState<number | null>(null);
  const [stats, setStats]       = useState<SessionStats | null>(null);

  // Reload data every time this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
      getBestTime().then(setBestTime);
      getSessionStats().then(setStats);
    }, [])
  );

  const username = settings.username || "Cuber";

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.BG }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── 1. HEADER ROW ──────────────────────────────────────── */}
        <View style={s.header}>
          <Text style={[s.greeting, { color: t.TEXT }]}>
            Hello,{" "}
            <Text style={[s.username, { color: t.ACCENT }]}>{username}</Text>
          </Text>
          <Pressable
            onPress={() => router.push("/settings" as any)}
            hitSlop={12}
          >
            <Ionicons name="settings-outline" size={24} color={t.MUTED} />
          </Pressable>
        </View>

        {/* ── 2. INTERACTIVE CUBE CARD ────────────────────────────── */}
        <CubeCard onPress={() => router.push("/(tabs)/solve")} />

        {/* ── 3. STATS ROW ───────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionLabel, { color: t.MUTED }]}>YOUR STATS</Text>
        </View>
        <View style={s.statsRow}>
          <StatCard
            label="BEST TIME"
            value={formatTime(bestTime)}
            onPress={() => router.push("/(tabs)/history")}
          />
          <StatCard
            label="TOTAL SOLVES"
            value={stats ? String(stats.totalSolves) : "--"}
            onPress={() => router.push("/(tabs)/history")}
          />
          <StatCard
            label="AO5"
            value={formatTime(stats?.ao5)}
            onPress={() => router.push("/(tabs)/history")}
          />
        </View>

        {/* ── 4. ACTION GRID ─────────────────────────────────────── */}
        <View style={s.sectionHeader}>
          <Text style={[s.sectionLabel, { color: t.MUTED }]}>QUICK ACTIONS</Text>
        </View>
        <View style={s.grid}>
          <ActionCard
            color={t.ACCENT}
            icon="scan-outline"
            title="Scan Cube"
            desc="Camera color detection"
            onPress={() => router.push("/(tabs)/scan")}
          />
          <ActionCard
            color="#534AB7"
            icon="book-outline"
            title="Tutorial"
            desc="Learn moves & tips"
            onPress={() => Alert.alert("Coming soon!", "Tutorial is on its way.")}
          />
          <ActionCard
            color={t.GREEN}
            icon="stopwatch-outline"
            title="Timer"
            desc="Track your solve times"
            onPress={() => router.push("/(tabs)/timer")}
          />
          <ActionCard
            color={t.ORANGE}
            icon="time-outline"
            title="History"
            desc="View past solves"
            onPress={() => router.push("/(tabs)/history")}
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700",
  },
  username: {
    fontWeight: "800",
  },

  // Cube Card
  cubeCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  cubeFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 4,
  },
  cubeFooterLabel: {
    fontSize: 13,
  },

  // Section headers
  sectionHeader: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCardOuter: {
    flex: 1,
  },
  statCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },

  // Action Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  actionCardOuter: {
    width: "47.5%",
  },
  actionCard: {
    borderRadius: 16,
    padding: 18,
    gap: 8,
    minHeight: 130,
    justifyContent: "flex-end",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  actionDesc: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 15,
  },
});
