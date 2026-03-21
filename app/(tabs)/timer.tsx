import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Pressable,
  Text,
  View,
  Alert,
  Animated,
} from "react-native";
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { generateScramble } from "@/lib/solver";
import { useTheme } from "@/lib/theme";
import { saveSolve, getBestTime, getSessionStats } from "@/lib/storage";
import type { SessionStats } from "@/types/cube";

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "idle" | "countdown" | "running" | "stopped";
type CountNum = 3 | 2 | 1 | "GO!";
const COUNTDOWN_STEPS: CountNum[] = [3, 2, 1, "GO!"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  const cs      = Math.floor(ms / 10);          // centiseconds
  const cents   = cs % 100;
  const totalSec = Math.floor(cs / 100);
  const secs    = totalSec % 60;
  const mins    = Math.floor(totalSec / 60);
  const cStr    = cents.toString().padStart(2, "0");
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, "0")}.${cStr}`;
  }
  return `${secs}.${cStr}`;
}

function formatStatTime(ms?: number | null): string {
  if (!ms) return "--";
  return formatTime(ms);
}

// ── AnimatedPressable (Reanimated — for buttons) ──────────────────────────────

function AnimatedPressable({
  onPress,
  style,
  children,
}: {
  onPress: () => void;
  style?: object | object[];
  children: React.ReactNode;
}) {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);
  const anim    = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return (
    <Pressable
      onPressIn={() => {
        scale.value   = withTiming(0.96, { duration: 120 });
        opacity.value = withTiming(0.82, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value   = withTiming(1, { duration: 120 });
        opacity.value = withTiming(1, { duration: 120 });
      }}
      onPress={onPress}
    >
      <ReAnimated.View style={[style, anim]}>{children}</ReAnimated.View>
    </Pressable>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={[s.statCard, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
      <Text style={[s.statLabel, { color: t.MUTED }]}>{label}</Text>
      <Text style={[s.statValue, { color: t.TEXT }]}>{value}</Text>
    </View>
  );
}

// ── TimerScreen ───────────────────────────────────────────────────────────────

export default function TimerScreen() {
  const t = useTheme();

  const [scramble,     setScramble]     = useState(() => generateScramble(20));
  const [time,         setTime]         = useState(0);
  const [phase,        setPhase]        = useState<Phase>("idle");
  const [countdownNum, setCountdownNum] = useState<CountNum | null>(null);
  const [bestTime,     setBestTime]     = useState<number | null>(null);
  const [stats,        setStats]        = useState<SessionStats | null>(null);

  const intervalRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const countTimeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef       = useRef<number>(0);

  // RN Animated values for countdown overlay
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const countScale     = useRef(new Animated.Value(1)).current;

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadStats = useCallback(async () => {
    const [bt, ss] = await Promise.all([getBestTime(), getSessionStats()]);
    setBestTime(bt);
    setStats(ss);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // ── Cleanup on unmount ──────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (intervalRef.current)     clearInterval(intervalRef.current);
      if (countTimeoutRef.current) clearTimeout(countTimeoutRef.current);
    };
  }, []);

  // ── Countdown logic ─────────────────────────────────────────────────────────

  const startCountdown = () => {
    setPhase("countdown");
    overlayOpacity.setValue(1);

    let i = 0;

    const runStep = () => {
      setCountdownNum(COUNTDOWN_STEPS[i]);

      // Scale pop: 1.2 → 1.0
      countScale.setValue(1.2);
      Animated.timing(countScale, {
        toValue: 1.0,
        duration: 800,
        useNativeDriver: true,
      }).start();

      i++;

      if (i < COUNTDOWN_STEPS.length) {
        // More steps to show
        countTimeoutRef.current = setTimeout(runStep, 1000);
      } else {
        // "GO!" just shown — start timer after 1s, fade overlay
        countTimeoutRef.current = setTimeout(() => {
          startTimeRef.current = Date.now();
          intervalRef.current  = setInterval(() => {
            setTime(Date.now() - startTimeRef.current);
          }, 10);
          setPhase("running");

          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => setCountdownNum(null));
        }, 1000);
      }
    };

    runStep();
  };

  // ── Timer controls ──────────────────────────────────────────────────────────

  const handleTimerPress = () => {
    if (phase === "countdown") return; // ignore taps during countdown

    if (phase === "idle") {
      startCountdown();
    } else if (phase === "running") {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setPhase("stopped");
    } else if (phase === "stopped") {
      // Resume without new countdown
      startTimeRef.current = Date.now() - time;
      intervalRef.current  = setInterval(() => {
        setTime(Date.now() - startTimeRef.current);
      }, 10);
      setPhase("running");
    }
  };

  const handleReset = () => {
    if (intervalRef.current)     clearInterval(intervalRef.current);
    if (countTimeoutRef.current) clearTimeout(countTimeoutRef.current);
    overlayOpacity.setValue(0);
    setCountdownNum(null);
    setPhase("idle");
    setTime(0);
  };

  const handleNewScramble = () => {
    handleReset();
    setScramble(generateScramble(20));
  };

  const handleSave = async () => {
    try {
      await saveSolve({
        scramble,
        solution:    [],
        moveCount:   0,
        solveTimeMs: time,
      });
      Alert.alert("Saved!", "Your solve has been recorded.", [{ text: "OK" }]);
      await loadStats();
      setScramble(generateScramble(20));
      handleReset();
    } catch {
      Alert.alert("Error", "Could not save solve. Try again.");
    }
  };

  // ── Hint text ───────────────────────────────────────────────────────────────

  const hintText: Record<Phase, string> = {
    idle:      "Tap to start",
    countdown: "Get ready...",
    running:   "Tap to stop",
    stopped:   "Tap to resume",
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.BG }]}>
      <View style={s.main}>

        {/* ── Scramble card ────────────────────────────────────────── */}
        <View style={[s.scrambleCard, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
          <Text style={[s.scrambleLabel, { color: t.MUTED }]}>SCRAMBLE</Text>
          <Text style={[s.scrambleTxt, { color: t.TEXT }]}>{scramble}</Text>
          <AnimatedPressable
            onPress={handleNewScramble}
            style={[s.newScrambleBtn, { backgroundColor: t.CARD_ALT, borderColor: t.BORDER }]}
          >
            <Text style={[s.newScrambleTxt, { color: t.MUTED }]}>New Scramble</Text>
          </AnimatedPressable>
          <Text style={[s.scrambleHint, { color: t.MUTED }]}>
            Apply this scramble to your cube, then tap the timer to start
          </Text>
        </View>

        {/* ── Timer area ───────────────────────────────────────────── */}
        <Pressable style={s.timerArea} onPress={handleTimerPress}>
          <Text style={[s.time, { color: t.TEXT }]}>{formatTime(time)}</Text>
          <Text style={[s.hint, { color: t.MUTED }]}>{hintText[phase]}</Text>
        </Pressable>

        {/* ── Action buttons (stopped only) ────────────────────────── */}
        {phase === "stopped" && time > 0 && (
          <View style={s.actions}>
            <AnimatedPressable
              onPress={handleReset}
              style={[s.resetBtn, { backgroundColor: t.CARD, borderColor: t.BORDER }]}
            >
              <Text style={[s.resetBtnTxt, { color: t.TEXT }]}>Reset</Text>
            </AnimatedPressable>
            <AnimatedPressable
              onPress={handleSave}
              style={[s.saveBtn, { backgroundColor: t.ACCENT }]}
            >
              <Text style={s.saveBtnTxt}>Save Solve</Text>
            </AnimatedPressable>
          </View>
        )}

        {/* ── Stats row ────────────────────────────────────────────── */}
        <View style={s.statsRow}>
          <StatCard label="BEST"  value={formatStatTime(bestTime)}  />
          <StatCard label="AO5"   value={formatStatTime(stats?.ao5)}  />
          <StatCard label="AO12"  value={formatStatTime(stats?.ao12)} />
        </View>

      </View>

      {/* ── Countdown overlay (absolute) ─────────────────────────── */}
      {countdownNum !== null && (
        <Animated.View
          style={[s.overlay, { opacity: overlayOpacity }]}
          pointerEvents="none"
        >
          <Animated.Text
            style={[
              s.countNum,
              { color: t.ACCENT, transform: [{ scale: countScale }] },
            ]}
          >
            {String(countdownNum)}
          </Animated.Text>
        </Animated.View>
      )}

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },
  main: {
    flex: 1,
    paddingBottom: 100,
  },

  // Scramble card
  scrambleCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    margin: 20,
    marginBottom: 0,
    alignItems: "center",
  },
  scrambleLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 0,
  },
  scrambleTxt: {
    fontSize: 14,
    fontFamily: "SpaceMono",
    textAlign: "center",
    lineHeight: 22,
    marginVertical: 8,
  },
  newScrambleBtn: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  newScrambleTxt: { fontSize: 12, fontWeight: "700" },
  scrambleHint: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 16,
  },

  // Timer area
  timerArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  time: {
    fontSize: 72,
    fontWeight: "200",
    fontVariant: ["tabular-nums"],
    letterSpacing: -1,
  },
  hint: { fontSize: 14 },

  // Action buttons
  actions: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  resetBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  resetBtnTxt: { fontSize: 15, fontWeight: "600" },
  saveBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  saveBtnTxt: { fontSize: 15, fontWeight: "700", color: "#000040" },

  // Stats row
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center",
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statValue: { fontSize: 22, fontWeight: "700" },

  // Countdown overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  countNum: {
    fontSize: 120,
    fontWeight: "700",
    lineHeight: 144,
  },
});
