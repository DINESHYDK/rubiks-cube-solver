import React, { useState, useRef } from "react";
import { StyleSheet, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { generateScramble } from "@/lib/solver";

const BG = "#0D1117",
  CARD = "#161B22",
  BORDER = "#30363D";
const TEXT = "#E6EDF3",
  MUTED = "#8B949E",
  GREEN = "#009B48";

export default function TimerScreen() {
  const [scramble, setScramble] = useState(() => generateScramble(20));
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const millis = ms % 1000;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (minutes > 0) {
      return `${minutes}:${secs.toString().padStart(2, "0")}.${Math.floor(
        millis / 10,
      )
        .toString()
        .padStart(2, "0")}`;
    }
    return `${secs}.${Math.floor(millis / 10)
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    if (isRunning) {
      // Stop
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRunning(false);
    } else {
      // Start
      const startTime = Date.now() - time;
      intervalRef.current = setInterval(() => {
        setTime(Date.now() - startTime);
      }, 10);
      setIsRunning(true);
    }
  };

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setTime(0);
  };

  const newScramble = () => {
    resetTimer();
    setScramble(generateScramble(20));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.scrambleCard}>
          <Text style={styles.scrambleLabel}>SCRAMBLE</Text>
          <Text style={styles.scramble}>{scramble}</Text>
          <Pressable style={styles.newScrambleBtn} onPress={newScramble}>
            <Text style={styles.newScrambleTxt}>New Scramble</Text>
          </Pressable>
        </View>

        <Pressable style={styles.timerArea} onPress={toggleTimer}>
          <Text style={styles.time}>{formatTime(time)}</Text>
          <Text style={styles.tapHint}>
            {isRunning
              ? "Tap to stop"
              : time > 0
                ? "Tap to resume"
                : "Tap to start"}
          </Text>
        </Pressable>

        {time > 0 && !isRunning && (
          <View style={styles.actions}>
            <Pressable style={styles.resetButton} onPress={resetTimer}>
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Best</Text>
            <Text style={styles.statValue}>--</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Ao5</Text>
            <Text style={styles.statValue}>--</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Ao12</Text>
            <Text style={styles.statValue}>--</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: BG,
  },
  scrambleCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    width: "100%",
    alignItems: "center",
    marginBottom: 36,
  },
  scrambleLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
    letterSpacing: 1,
    marginBottom: 8,
  },
  scramble: {
    fontSize: 14,
    textAlign: "center",
    color: TEXT,
    fontFamily: "SpaceMono",
    lineHeight: 22,
    marginBottom: 12,
  },
  newScrambleBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: "#1C2128",
    borderWidth: 1,
    borderColor: BORDER,
  },
  newScrambleTxt: { fontSize: 12, color: MUTED, fontWeight: "600" },
  timerArea: {
    alignItems: "center",
    marginBottom: 30,
  },
  time: {
    fontSize: 80,
    fontWeight: "200",
    color: TEXT,
    fontVariant: ["tabular-nums"],
  },
  tapHint: {
    fontSize: 14,
    color: MUTED,
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 40,
  },
  resetButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
  },
  resetText: {
    fontSize: 16,
    color: TEXT,
    fontWeight: "600",
  },
  stats: {
    flexDirection: "row",
    gap: 30,
  },
  statItem: {
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  statLabel: {
    fontSize: 11,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: TEXT,
  },
});
