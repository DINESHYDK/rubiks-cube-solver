import React, { useState } from "react";
import { StyleSheet, ScrollView, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Cube3D from "@/components/cube/Cube3D";

const SAMPLE_MOVES = [
  "R",
  "U",
  "R'",
  "U'",
  "R'",
  "F",
  "R2",
  "U'",
  "R'",
  "U'",
  "R",
  "U",
  "R'",
  "F'",
];

const BG = "#0D1117";
const CARD = "#161B22";
const BORDER = "#30363D";
const TEXT = "#E6EDF3";
const MUTED = "#8B949E";
const BLUE = "#0046AD";
const GREEN = "#009B48";

export default function SolveScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMove, setCurrentMove] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        bounces={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>3D Solver</Text>
          <Text style={styles.subtitle}>
            Auto-rotating · Day 3 adds move animation
          </Text>
        </View>

        {/* 3D Cube Card */}
        <View style={styles.cubeCard}>
          <Cube3D height={280} />
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>SOLVED STATE · AUTO-ROTATING</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[
            { label: "Moves", value: String(SAMPLE_MOVES.length) },
            { label: "Time", value: "--" },
            { label: "Score", value: "--" },
          ].map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Scramble Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>SCRAMBLE</Text>
          <Text style={styles.scrambleText}>{SAMPLE_MOVES.join("  ")}</Text>
        </View>

        {/* Playback Controls */}
        <View style={styles.controls}>
          <Pressable style={styles.ctrlBtn}>
            <Text style={styles.ctrlIcon}>⏮</Text>
          </Pressable>
          <Pressable
            style={[styles.ctrlBtn, styles.playBtn]}
            onPress={() => setIsPlaying((p) => !p)}
          >
            <Text style={[styles.ctrlIcon, { fontSize: 22 }]}>
              {isPlaying ? "⏸" : "▶"}
            </Text>
          </Pressable>
          <Pressable style={styles.ctrlBtn}>
            <Text style={styles.ctrlIcon}>⏭</Text>
          </Pressable>
        </View>

        {/* Move Chips */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>SOLUTION MOVES</Text>
          <View style={styles.chipRow}>
            {SAMPLE_MOVES.map((move, i) => (
              <View
                key={i}
                style={[
                  styles.chip,
                  currentMove === i && styles.chipActive,
                  currentMove !== null && i < currentMove && styles.chipDone,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    currentMove === i && styles.chipTextActive,
                  ]}
                >
                  {move}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>📷 Scan Cube</Text>
          </Pressable>
          <Pressable style={[styles.actionBtn, styles.solveBtn]}>
            <Text style={styles.actionBtnText}>🧩 Solve It</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },

  header: { marginBottom: 18 },
  title: { fontSize: 28, fontWeight: "700", color: TEXT, marginBottom: 4 },
  subtitle: { fontSize: 13, color: MUTED },

  cubeCard: {
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
    marginBottom: 14,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  badgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
    letterSpacing: 0.8,
  },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statBox: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    alignItems: "center",
  },
  statValue: { fontSize: 22, fontWeight: "700", color: TEXT },
  statLabel: { fontSize: 11, color: MUTED, marginTop: 2, letterSpacing: 0.5 },

  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
    letterSpacing: 1,
    marginBottom: 10,
  },
  scrambleText: {
    fontSize: 15,
    color: TEXT,
    fontFamily: "SpaceMono",
    lineHeight: 24,
  },

  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    marginBottom: 14,
  },
  ctrlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  ctrlIcon: { fontSize: 20, color: TEXT },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1C2128",
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActive: { backgroundColor: BLUE, borderColor: BLUE },
  chipDone: { opacity: 0.35 },
  chipText: { fontSize: 13, color: TEXT, fontFamily: "SpaceMono" },
  chipTextActive: { color: "#fff", fontWeight: "700" },

  actionRow: { flexDirection: "row", gap: 12 },
  actionBtn: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    alignItems: "center",
  },
  solveBtn: { backgroundColor: BLUE, borderColor: BLUE },
  actionBtnText: { fontSize: 14, fontWeight: "600", color: TEXT },
});
