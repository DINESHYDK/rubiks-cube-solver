import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  Pressable,
  RefreshControl,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { getSolveHistory } from "@/lib/storage";
import { useTheme } from "@/lib/theme";
import type { SolveRecord } from "@/types/cube";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(ms?: number): string {
  if (!ms) return "--";
  const s = ms / 1000;
  return s < 60
    ? `${s.toFixed(1)}s`
    : `${Math.floor(s / 60)}m ${(s % 60).toFixed(0)}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });
}

// ── SolveCard ─────────────────────────────────────────────────────────────────

function SolveCard({
  item,
  index,
}: {
  item: SolveRecord;
  index: number;
}) {
  const t     = useTheme();
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);
  const anim    = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const solution = Array.isArray(item.solution)
    ? item.solution.join(" ")
    : String(item.solution ?? "");

  return (
    <Pressable
      onPressIn={() => {
        scale.value   = withTiming(0.97, { duration: 120 });
        opacity.value = withTiming(0.85, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value   = withTiming(1, { duration: 120 });
        opacity.value = withTiming(1, { duration: 120 });
      }}
    >
      <Animated.View
        style={[
          s.card,
          { backgroundColor: t.CARD, borderColor: t.BORDER },
          anim,
        ]}
      >
        {/* Rank circle */}
        <View style={[s.rankCircle, { backgroundColor: t.CARD_ALT }]}>
          <Text style={[s.rankTxt, { color: t.MUTED }]}>#{index + 1}</Text>
        </View>

        {/* Middle: scramble + solution + date */}
        <View style={s.cardBody}>
          <Text style={[s.scramble, { color: t.MUTED }]} numberOfLines={1}>
            {item.scramble}
          </Text>
          <Text style={[s.solution, { color: t.MUTED }]} numberOfLines={1}>
            {solution}
          </Text>
          <Text style={[s.cardDate, { color: t.MUTED }]}>
            {formatDate(item.createdAt)}
          </Text>
        </View>

        {/* Right: time + moves */}
        <View style={s.cardRight}>
          <Text style={[s.cardTime, { color: t.ACCENT }]}>
            {formatTime(item.solveTimeMs)}
          </Text>
          <Text style={[s.cardMoves, { color: t.MUTED }]}>
            {item.moveCount} moves
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function EmptyState() {
  const t      = useTheme();
  const router = useRouter();
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);
  const btnAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={s.emptyWrap}>
      <View style={[s.emptyCard, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
        <Text style={[s.emptyTitle, { color: t.TEXT }]}>No solves yet</Text>
        <Text style={[s.emptyDesc,  { color: t.MUTED }]}>
          Scan a cube to get started
        </Text>
        <Pressable
          onPressIn={() => {
            scale.value   = withTiming(0.96, { duration: 120 });
            opacity.value = withTiming(0.82, { duration: 120 });
          }}
          onPressOut={() => {
            scale.value   = withTiming(1, { duration: 120 });
            opacity.value = withTiming(1, { duration: 120 });
          }}
          onPress={() => router.push("/(tabs)/scan")}
        >
          <Animated.View
            style={[s.scanNowBtn, { backgroundColor: t.ACCENT }, btnAnim]}
          >
            <Text style={s.scanNowTxt}>Scan Now</Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

// ── HistoryScreen ─────────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const t = useTheme();
  const [records,    setRecords]    = useState<SolveRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    const data = await getSolveHistory();
    setRecords(data);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.BG }]}>

      {/* Header */}
      <View style={s.header}>
        <Text style={[s.title, { color: t.TEXT }]}>Solve History</Text>
        <Text style={[s.subtitle, { color: t.MUTED }]}>
          {records.length > 0
            ? `${records.length} solve${records.length !== 1 ? "s" : ""}`
            : "Your past solves appear here"}
        </Text>
      </View>

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={t.ACCENT}
          />
        }
        renderItem={({ item, index }) => (
          <SolveCard item={item} index={index} />
        )}
        ListEmptyComponent={<EmptyState />}
      />

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title:    { fontSize: 26, fontWeight: "700", marginBottom: 4 },
  subtitle: { fontSize: 13 },

  // List
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 12, paddingBottom: 100 },

  // Solve card
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  rankCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rankTxt:  { fontSize: 12, fontWeight: "700" },
  cardBody: { flex: 1, gap: 2 },
  scramble: { fontSize: 12, fontFamily: "SpaceMono" },
  solution: { fontSize: 11, fontFamily: "SpaceMono", opacity: 0.5 },
  cardDate: { fontSize: 11, marginTop: 2 },
  cardRight: { alignItems: "flex-end", gap: 4 },
  cardTime:  { fontSize: 18, fontWeight: "700" },
  cardMoves: { fontSize: 12 },

  // Empty state
  emptyWrap: {
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyDesc:  { fontSize: 14, textAlign: "center" },
  scanNowBtn: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  scanNowTxt: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000040",
  },
});
