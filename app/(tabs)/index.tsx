import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme } from "@/lib/theme";
import { useSettings, getBestTime, getSessionStats, getSolveHistory } from "@/lib/storage";
import { useCubeStore } from "@/stores/cubeStore";
import Cube3D from "@/components/cube/Cube3D";
import type { SessionStats, SolveRecord } from "@/types/cube";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  return "Good evening,";
}

function formatTime(ms: number | null | undefined): string {
  if (!ms) return "--";
  const totalCs = Math.floor(ms / 10);
  const cents   = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const secs    = totalSec % 60;
  const mins    = Math.floor(totalSec / 60);
  const cStr    = cents.toString().padStart(2, "0");
  if (mins > 0) return `${mins}:${secs.toString().padStart(2, "0")}.${cStr}`;
  return `${secs}.${cStr}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function hexOpacity(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── QuickPill ─────────────────────────────────────────────────────────────────

function QuickPill({
  icon,
  label,
  onPress,
  highlight,
  bgColor,
  borderColor,
  iconColor,
  labelColor,
  labelWeight,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  highlight?: boolean;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  labelColor: string;
  labelWeight: "600" | "700";
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      style={s.pillOuter}
      onPressIn={() => Animated.timing(scale, { toValue: 0.95, duration: 100, useNativeDriver: true }).start()}
      onPressOut={() => Animated.timing(scale, { toValue: 1,    duration: 100, useNativeDriver: true }).start()}
      onPress={onPress}
    >
      <Animated.View
        style={[s.pill, { backgroundColor: bgColor, borderColor }, { transform: [{ scale }] }]}
      >
        <Ionicons name={icon as any} size={18} color={iconColor} />
        <Text style={[s.pillLabel, { color: labelColor, fontWeight: labelWeight }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ── CubeCard ──────────────────────────────────────────────────────────────────

const CubeCard = React.memo(({ onPress }: { onPress: () => void }) => {
  const t         = useTheme();
  const cubeState = useCubeStore((s) => s.cubeState);
  const scale     = useRef(new Animated.Value(1)).current;
  const opacity   = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPressIn={() => {
        Animated.parallel([
          Animated.timing(scale,   { toValue: 0.98, duration: 100, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.9,  duration: 100, useNativeDriver: true }),
        ]).start();
      }}
      onPressOut={() => {
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
      }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          s.cubeCard,
          { backgroundColor: t.CARD, borderColor: t.BORDER },
          { transform: [{ scale }], opacity },
        ]}
      >
        <Cube3D height={220} cubeState={cubeState} autoRotate={false} />
        <View style={[s.cubeStrip, { borderTopColor: t.BORDER }]}>
          <Text style={[s.cubeStripLabel, { color: t.MUTED }]}>Your cube</Text>
          <Ionicons name="chevron-forward" size={16} color={t.MUTED} />
        </View>
      </Animated.View>
    </Pressable>
  );
});

// ── LastSolveCard ─────────────────────────────────────────────────────────────

function LastSolveCard({ record }: { record: SolveRecord }) {
  const t = useTheme();
  return (
    <View style={[s.lastCard, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
      {/* Top row */}
      <View style={s.lastTop}>
        <Text style={[s.lastTopLabel, { color: t.MUTED }]}>LAST SOLVE</Text>
        <Text style={[s.lastTopDate,  { color: t.MUTED }]}>{formatDate(record.createdAt)}</Text>
      </View>
      {/* Middle row */}
      <View style={s.lastMid}>
        <Text style={[s.lastTime, { color: t.TEXT }]}>{formatTime(record.solveTimeMs)}</Text>
        <Text style={[s.lastMoves, { color: t.MUTED }]}>{record.moveCount} moves</Text>
      </View>
      {/* Scramble */}
      <Text style={[s.lastScramble, { color: t.MUTED }]} numberOfLines={1} ellipsizeMode="tail">
        {record.scramble}
      </Text>
    </View>
  );
}

// ── StatBox ───────────────────────────────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={[s.statBox, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
      <Text style={[s.statLabel, { color: t.MUTED }]}>{label}</Text>
      <Text style={[s.statValue, { color: t.TEXT }]}>{value}</Text>
    </View>
  );
}

// ── HomeScreen ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router  = useRouter();
  const t       = useTheme();
  const { settings, loadSettings } = useSettings();

  const [bestTime,   setBestTime]   = useState<number | null>(null);
  const [stats,      setStats]      = useState<SessionStats | null>(null);
  const [lastSolve,  setLastSolve]  = useState<SolveRecord | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadSettings();
      getBestTime().then(setBestTime);
      getSessionStats().then(setStats);
      getSolveHistory().then((h) => setLastSolve(h.length > 0 ? h[0] : null));
    }, [])
  );

  const username    = settings.username || "Cuber";
  const scanBg      = hexOpacity(t.HIGHLIGHT, 0.12);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.BG }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── 1. HEADER ──────────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={[s.greeting, { color: t.MUTED }]}>{getGreeting()}</Text>
            <Text style={[s.username, { color: t.TEXT }]}>{username}</Text>
          </View>
          <Pressable
            onPress={() => router.push("/settings" as any)}
            style={[s.gearBtn, { backgroundColor: t.CARD, borderColor: t.BORDER }]}
            hitSlop={8}
          >
            <Ionicons name="settings-outline" size={22} color={t.MUTED} />
          </Pressable>
        </View>

        {/* ── 2. CUBE CARD ───────────────────────────────────────────── */}
        <CubeCard onPress={() => router.push("/(tabs)/solve")} />

        {/* ── 3. QUICK ACTIONS ───────────────────────────────────────── */}
        <View style={s.pillRow}>
          <QuickPill
            icon="scan-outline"
            label="Scan"
            bgColor={scanBg}
            borderColor={t.HIGHLIGHT}
            iconColor={t.HIGHLIGHT}
            labelColor={t.HIGHLIGHT}
            labelWeight="700"
            onPress={() => router.push("/(tabs)/scan")}
          />
          <QuickPill
            icon="cube-outline"
            label="Solve"
            bgColor={t.CARD}
            borderColor={t.BORDER}
            iconColor={t.TEXT}
            labelColor={t.TEXT}
            labelWeight="600"
            onPress={() => router.push("/(tabs)/solve")}
          />
          <QuickPill
            icon="stopwatch-outline"
            label="Timer"
            bgColor={t.CARD}
            borderColor={t.BORDER}
            iconColor={t.TEXT}
            labelColor={t.TEXT}
            labelWeight="600"
            onPress={() => router.push("/(tabs)/timer")}
          />
        </View>

        {/* ── 4. LAST SOLVE ──────────────────────────────────────────── */}
        {lastSolve && <LastSolveCard record={lastSolve} />}

        {/* ── 5. STATS ROW ───────────────────────────────────────────── */}
        <View style={s.statsRow}>
          <StatBox label="BEST"   value={formatTime(bestTime)} />
          <StatBox label="AVG"    value={formatTime(stats?.ao5)} />
          <StatBox label="SOLVES" value={stats ? String(stats.totalSolves) : "--"} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
    gap: 16,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 13,
    fontWeight: "400",
  },
  username: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  gearBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Cube card
  cubeCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  cubeStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cubeStripLabel: { fontSize: 13 },

  // Quick action pills
  pillRow: {
    flexDirection: "row",
    gap: 10,
  },
  pillOuter: { flex: 1 },
  pill: {
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  pillLabel: { fontSize: 14 },

  // Last solve card
  lastCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  lastTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lastTopLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  lastTopDate: { fontSize: 11 },
  lastMid: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  lastTime: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: -1,
  },
  lastMoves: { fontSize: 12 },
  lastScramble: {
    fontSize: 11,
    fontFamily: "monospace",
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
  },
});
