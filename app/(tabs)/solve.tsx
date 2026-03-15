import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  ScrollView,
  Pressable,
  Text,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Cube3D from "@/components/cube/Cube3D";
import { solveFromScramble, generateScramble } from "@/lib/solver";

const BG = "#0D1117",
  CARD = "#161B22",
  BORDER = "#30363D";
const TEXT = "#E6EDF3",
  MUTED = "#8B949E",
  BLUE = "#0046AD",
  GREEN = "#009B48";
const SPEED = 700;

export default function SolveScreen() {
  const [scramble, setScramble] = useState("");
  const [moves, setMoves] = useState<string[]>([]);
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [solving, setSolving] = useState(false);
  const [ticks, setTicks] = useState(0);

  // ── animation loop ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing || moves.length === 0) return;
    const id = setInterval(() => {
      setStep((prev) => {
        const next = prev + 1;
        if (next >= moves.length) {
          setPlaying(false);
          return prev;
        }
        return next;
      });
    }, SPEED);
    return () => clearInterval(id);
  }, [playing, moves.length]);

  // ── elapsed timer ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTicks((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [playing]);

  // ── handlers ────────────────────────────────────────────────────────────────
  const handleNewScramble = () => {
    setScramble(generateScramble(20));
    setMoves([]);
    setStep(-1);
    setPlaying(false);
    setTicks(0);
  };

  const handleSolve = () => {
    if (!scramble) {
      handleNewScramble();
      return;
    }
    setSolving(true);
    setTimeout(() => {
      try {
        setMoves(solveFromScramble(scramble));
        setStep(-1);
        setTicks(0);
        setPlaying(false);
      } catch (e) {
        console.error(e);
      } finally {
        setSolving(false);
      }
    }, 50);
  };

  const handlePlay = () => {
    if (step >= moves.length - 1) setStep(-1);
    setPlaying(true);
  };
  const handlePause = () => setPlaying(false);
  const handlePrev = () => {
    setPlaying(false);
    setStep((s) => Math.max(-1, s - 1));
  };
  const handleNext = () => {
    setPlaying(false);
    setStep((s) => Math.min(moves.length - 1, s + 1));
  };

  const pct =
    moves.length > 0 && step >= 0
      ? Math.round(((step + 1) / moves.length) * 100)
      : 0;
  const elapsed = `${Math.floor(ticks / 10)}.${ticks % 10}s`;
  const solved = moves.length > 0 && step >= moves.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>3D Solver</Text>
          <Text style={styles.subtitle}>
            Kociemba Two-Phase Algorithm · ≤20 Moves
          </Text>
        </View>

        {/* Cube card */}
        <View style={styles.cubeCard}>
          <Cube3D height={260} />
          <View style={styles.cubeFooter}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: solved
                      ? GREEN
                      : moves.length > 0
                        ? BLUE
                        : GREEN,
                  },
                ]}
              />
              <Text style={styles.badgeText}>
                {solved
                  ? "SOLVED ✓"
                  : moves.length > 0
                    ? `${moves.length} MOVES`
                    : "SOLVED STATE"}
              </Text>
            </View>
            {moves.length > 0 && step >= 0 && (
              <Text style={styles.stepText}>
                {step + 1} / {moves.length}
              </Text>
            )}
          </View>
          {moves.length > 0 && (
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${pct}%` as any }]}
              />
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.row3}>
          {[
            {
              label: "Moves",
              val: moves.length > 0 ? String(moves.length) : "--",
            },
            { label: "Elapsed", val: ticks > 0 ? elapsed : "--" },
            { label: "Progress", val: pct > 0 ? `${pct}%` : "--" },
          ].map((s) => (
            <View key={s.label} style={styles.statBox}>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Scramble */}
        <View style={styles.card}>
          <Text style={styles.cardLbl}>SCRAMBLE</Text>
          <Text style={styles.monoText}>
            {scramble || "— tap 'New Scramble' to begin"}
          </Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <Pressable
            style={styles.ctrlBtn}
            onPress={handlePrev}
            disabled={step < 0}
          >
            <Text style={[styles.ctrlIcon, step < 0 && styles.dim]}>⏮</Text>
          </Pressable>
          <Pressable
            style={[styles.ctrlBtn, styles.playBtn]}
            onPress={playing ? handlePause : handlePlay}
            disabled={moves.length === 0}
          >
            {solving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.ctrlIcon, { fontSize: 24 }]}>
                {playing ? "⏸" : "▶"}
              </Text>
            )}
          </Pressable>
          <Pressable
            style={styles.ctrlBtn}
            onPress={handleNext}
            disabled={step >= moves.length - 1}
          >
            <Text
              style={[styles.ctrlIcon, step >= moves.length - 1 && styles.dim]}
            >
              ⏭
            </Text>
          </Pressable>
        </View>

        {/* Move chips */}
        {moves.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardLbl}>SOLUTION · {moves.length} MOVES</Text>
            <View style={styles.chips}>
              {moves.map((m, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    setPlaying(false);
                    setStep(i);
                  }}
                  style={[
                    styles.chip,
                    i === step && styles.chipActive,
                    i < step && styles.chipDone,
                  ]}
                >
                  <Text
                    style={[styles.chipTxt, i === step && styles.chipActiveTxt]}
                  >
                    {m}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Action row */}
        <View style={styles.row2}>
          <Pressable style={styles.actionBtn} onPress={handleNewScramble}>
            <Text style={styles.actionTxt}>� New Scramble</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.solveBtn]}
            onPress={handleSolve}
            disabled={solving}
          >
            {solving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.actionTxt}>🧩 Solve It</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
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
  cubeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
    letterSpacing: 0.8,
  },
  stepText: { fontSize: 13, fontWeight: "700", color: TEXT },
  progressBar: { height: 3, backgroundColor: BORDER },
  progressFill: { height: 3, backgroundColor: BLUE },

  row3: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statBox: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    alignItems: "center",
  },
  statVal: { fontSize: 20, fontWeight: "700", color: TEXT },
  statLbl: { fontSize: 11, color: MUTED, marginTop: 2, letterSpacing: 0.5 },

  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 14,
  },
  cardLbl: {
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
    letterSpacing: 1,
    marginBottom: 10,
  },
  monoText: {
    fontSize: 14,
    color: TEXT,
    fontFamily: "SpaceMono",
    lineHeight: 22,
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
  dim: { opacity: 0.25 },

  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: "#1C2128",
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActive: { backgroundColor: BLUE, borderColor: BLUE },
  chipDone: { opacity: 0.3 },
  chipTxt: { fontSize: 12, color: TEXT, fontFamily: "SpaceMono" },
  chipActiveTxt: { color: "#fff", fontWeight: "700" },

  row2: { flexDirection: "row", gap: 12 },
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
  actionTxt: { fontSize: 14, fontWeight: "600", color: TEXT },
});
