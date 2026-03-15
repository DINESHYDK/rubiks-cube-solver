import React, { useCallback, useEffect, useState } from "react";
import {
  StyleSheet,
  FlatList,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getHistory } from "@/lib/api";
import type { SolveRecord } from "@/types/cube";

const BG = "#0D1117",
  CARD = "#161B22",
  BORDER = "#30363D";
const TEXT = "#E6EDF3",
  MUTED = "#8B949E",
  GREEN = "#009B48";

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
    day: "numeric",
    year: "numeric",
  });
}

export default function HistoryScreen() {
  const [records, setRecords] = useState<SolveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const data = await getHistory();
      setRecords(data);
    } catch {
      setError("Could not load history — is the server running?");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Solve History</Text>
        <Text style={styles.subtitle}>
          {records.length > 0
            ? `${records.length} solve${records.length !== 1 ? "s" : ""}`
            : "Your past solves appear here"}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={GREEN} style={{ marginTop: 60 }} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTxt}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => load()}>
            <Text style={styles.retryTxt}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={GREEN}
            />
          }
          renderItem={({ item, index }) => (
            <View style={styles.card}>
              <View style={styles.rank}>
                <Text style={styles.rankTxt}>#{index + 1}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.scramble} numberOfLines={1}>
                  {item.scramble}
                </Text>
                <Text style={styles.solution} numberOfLines={1}>
                  {item.solution.join(" ")}
                </Text>
                <Text style={styles.cardDate}>
                  {formatDate(item.createdAt)}
                </Text>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardTime}>
                  {formatTime(item.solveTimeMs)}
                </Text>
                <Text style={styles.cardMoves}>{item.moveCount} moves</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📊</Text>
              <Text style={styles.emptyTxt}>
                No solves yet.{"\n"}Scan a cube to get started!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 26, fontWeight: "700", color: TEXT, marginBottom: 4 },
  subtitle: { fontSize: 13, color: MUTED },
  list: { padding: 20, gap: 12, paddingBottom: 48 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  rank: { width: 32, alignItems: "center" },
  rankTxt: { fontSize: 12, fontWeight: "700", color: MUTED },
  cardBody: { flex: 1, gap: 2 },
  scramble: { fontSize: 12, color: MUTED, fontFamily: "monospace" },
  solution: {
    fontSize: 11,
    color: MUTED,
    opacity: 0.6,
    fontFamily: "monospace",
  },
  cardDate: { fontSize: 11, color: MUTED, marginTop: 2 },
  cardRight: { alignItems: "flex-end", gap: 4 },
  cardTime: { fontSize: 18, fontWeight: "700", color: GREEN },
  cardMoves: { fontSize: 12, color: MUTED },

  errorBox: { alignItems: "center", marginTop: 60, paddingHorizontal: 40 },
  errorEmoji: { fontSize: 40, marginBottom: 12 },
  errorTxt: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    marginBottom: 20,
  },
  retryBtn: {
    backgroundColor: CARD,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  retryTxt: { fontSize: 14, fontWeight: "600", color: TEXT },

  empty: { alignItems: "center", marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTxt: { fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 22 },
});
