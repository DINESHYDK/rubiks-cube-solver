import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  ScrollView,
  Pressable,
  Text,
  View,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Alert,
  Animated,
} from "react-native";
import { useFocusEffect } from "expo-router";
import ConfettiEffect from "@/components/effects/ConfettiEffect";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import Cube3D, { parseMove } from "@/components/cube/Cube3D";
import {
  solveFromScramble,
  generateScramble,
  solveCubeState,
  getIntermediateStates,
  getScrambledState,
  isSolverReady,
} from "@/lib/solver";
import { cubeStateToString, stringToCubeState } from "@/lib/cubeState";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CubeJS = require("cubejs");
import type { CubeState } from "@/types/cube";
import { useCubeStore } from "@/stores/cubeStore";
import { SOLVED_STATE } from "@/lib/constants";
import { saveSolve } from "@/lib/storage";
import { useTheme } from "@/lib/theme";
import PlaybackCard from "@/components/solve/PlaybackCard";
import AlgorithmChips from "@/components/solve/AlgorithmChips";

// ── Helper: hex + alpha ────────────────────────────────────────────────────────

function hexOpacity(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── AnimatedPressable ─────────────────────────────────────────────────────────

function AnimatedPressable({
  onPress,
  style,
  children,
  disabled = false,
}: {
  onPress: () => void;
  style?: object | object[];
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const flat = StyleSheet.flatten(style as any) as any;
  const pressIn = () => Animated.parallel([
    Animated.timing(scale,   { toValue: 0.96, duration: 100, useNativeDriver: true }),
    Animated.timing(opacity, { toValue: 0.85, duration: 100, useNativeDriver: true }),
  ]).start();
  const pressOut = () => Animated.parallel([
    Animated.timing(scale,   { toValue: 1, duration: 100, useNativeDriver: true }),
    Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
  ]).start();
  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      disabled={disabled}
      style={{ flex: flat?.flex, width: flat?.width, alignSelf: flat?.alignSelf }}
    >
      <Animated.View style={[style, { transform: [{ scale }], opacity }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ── SolveScreen ───────────────────────────────────────────────────────────────

export default function SolveScreen() {
  const t = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isWide = Platform.OS === "web" && windowWidth >= 768;
  const { cubeState, setCubeState, resetCube } = useCubeStore();

  // ── State ─────────────────────────────────────────────────────────────────────
  const [scramble,      setScramble]      = useState("");
  const [moves,         setMoves]         = useState<string[]>([]);
  const [step,          setStep]          = useState(-1);
  const [playing,       setPlaying]       = useState(false);
  const [solving,       setSolving]       = useState(false);
  const [ticks,         setTicks]         = useState(0);
  const [fromScan,      setFromScan]      = useState(false);
  const [cubeSnapshots, setCubeSnapshots] = useState<CubeState[]>([]);
  const [activeMove,    setActiveMove]    = useState<any>(null);

  const startTimeRef        = useRef<number>(0);
  const savedRef            = useRef(false);
  const lastSolvedStateRef  = useRef<string>("");
  const isManualScrambleRef  = useRef(false);
  const scrambleQueueRef     = useRef<(() => void) | null>(null);
  const pendingScrambleRef   = useRef<string | null>(null);
  const chipMoveRef          = useRef<string | null>(null);
  const chipTappedRef        = useRef(false);

  const [cubeKey,      setCubeKey]      = useState(0);
  const [playbackMode, setPlaybackMode] = useState<"auto" | "manual">("auto");
  const [stepDelay,    setStepDelay]    = useState(1000);
  const [isAnimating,  setIsAnimating]  = useState(false);
  // Ref mirrors isAnimating for use in async callbacks — avoids stale closure reads
  const isAnimatingRef = useRef(false);

  // ── Clear stale animation state on tab focus ──────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      scrambleQueueRef.current = null;
      pendingScrambleRef.current = null;
      chipMoveRef.current = null;
      isAnimatingRef.current = false;
      setPlaying(false);
      setActiveMove(null);
      setIsAnimating(false);
    }, [])
  );

  // ── Solver ready banner ───────────────────────────────────────────────────────
  const [solverReady, setSolverReady] = useState(isSolverReady());
  useEffect(() => {
    if (solverReady) return;
    const id = setInterval(() => {
      if (isSolverReady()) {
        setSolverReady(true);
        clearInterval(id);
      }
    }, 500);
    return () => clearInterval(id);
  }, []);

  // ── Confetti + solved overlay ─────────────────────────────────────────────────
  const [showConfetti, setShowConfetti] = useState(false);

  const solvedOpacity  = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const overlayScale   = useRef(new Animated.Value(0.5)).current;

  // ── Progress bar animation ────────────────────────────────────────────────────
  const progressAnim = useRef(new Animated.Value(0)).current;

  // ── Elapsed timer ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTicks((prev) => prev + 1), 100);
    return () => clearInterval(id);
  }, [playing]);

  // ── Auto-solve scanned cube ───────────────────────────────────────────────────
  useEffect(() => {
    if (isManualScrambleRef.current) {
      isManualScrambleRef.current = false;
      return;
    }
    const stateKey = JSON.stringify(cubeState);
    const isSolved = stateKey === JSON.stringify(SOLVED_STATE);
    if (isSolved || stateKey === lastSolvedStateRef.current) return;
    lastSolvedStateRef.current = stateKey;
    setSolving(true);
    setFromScan(true);
    setScramble("(Scanned cube)");
    setTimeout(() => {
      try {
        const sol = solveCubeState(cubeState);
        setMoves(sol);
        setCubeSnapshots([cubeState]);
        setStep(-1);
        setTicks(0);
        setPlaying(false);
      } catch (e) {
        console.error(e);
        Alert.alert(
          "Unsolvable Cube",
          "The scanned colors don't form a valid Rubik's Cube. Please check your lighting and scan again.",
          [{ text: "Go Back", onPress: () => resetCube() }]
        );
      } finally {
        setSolving(false);
      }
    }, 80);
  }, [cubeState]);

  // ── cubeKey change effect ─────────────────────────────────────────────────────
  useEffect(() => {
    if (cubeKey === 0) return;
    const str = pendingScrambleRef.current;
    if (!str) return;
    pendingScrambleRef.current = null;
    const id = setTimeout(() => applyScramble(str), 150);
    return () => clearTimeout(id);
  }, [cubeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-save ─────────────────────────────────────────────────────────────────
  const pct     = moves.length > 0 && step >= 0 ? Math.round(((step + 1) / moves.length) * 100) : 0;
  const elapsed = `${Math.floor(ticks / 10)}.${ticks % 10}s`;
  const solved  = moves.length > 0 && step >= moves.length - 1;
  const status  = solved ? "SOLVED" : playing ? "SOLVING" : moves.length > 0 ? "SCRAMBLED" : "READY";

  useEffect(() => {
    if (!solved || savedRef.current || !scramble) return;
    savedRef.current = true;
    const solveTimeMs = startTimeRef.current ? Date.now() - startTimeRef.current : undefined;
    saveSolve({ scramble, solution: moves as any, moveCount: moves.length, solveTimeMs }).catch(() => {});
  }, [solved, scramble, moves]);

  // ── Solved animation trigger ──────────────────────────────────────────────────
  useEffect(() => {
    if (solved) {
      Animated.timing(solvedOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      setShowConfetti(true);
      Animated.sequence([
        Animated.spring(overlayScale, { toValue: 1.05, useNativeDriver: true, damping: 8, stiffness: 180 }),
        Animated.spring(overlayScale, { toValue: 1.0,  useNativeDriver: true, damping: 12, stiffness: 200 }),
      ]).start();
      Animated.sequence([
        Animated.timing(overlayOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(2000),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    } else {
      solvedOpacity.setValue(0);
      overlayOpacity.setValue(0);
      overlayScale.setValue(0.5);
      setShowConfetti(false);
    }
  }, [solved]);

  // ── Progress bar animation ────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(progressAnim, { toValue: pct, duration: 300, useNativeDriver: false }).start();
  }, [pct]);

  // ── Scramble animation helper ─────────────────────────────────────────────────
  const applyScramble = (scrambleStr: string) => {
    const scrambleMoves = scrambleStr.trim().split(/\s+/);
    let idx = 0;

    const applyNext = () => {
      if (idx >= scrambleMoves.length) {
        const scrambledState = getScrambledState(scrambleStr);
        isManualScrambleRef.current = true;
        setCubeState(scrambledState);
        const sol = solveFromScramble(scrambleStr);
        setMoves(sol);
        setCubeSnapshots(getIntermediateStates(scrambleStr, sol));
        return;
      }
      const physicsMove = parseMove(scrambleMoves[idx]);
      idx++;
      isAnimatingRef.current = true;
      setIsAnimating(true);
      setActiveMove(physicsMove);
      scrambleQueueRef.current = applyNext;
    };

    applyNext();
  };

  const handleNewScramble = () => {
    isManualScrambleRef.current = true;
    scrambleQueueRef.current = null;
    chipTappedRef.current = false;
    setActiveMove(null);
    setIsAnimating(false);
    setPlaying(false);
    setFromScan(false);
    const newScramble = generateScramble(20);
    setScramble(newScramble);
    setMoves([]);
    setCubeSnapshots([]);
    setStep(-1);
    setTicks(0);
    savedRef.current = false;
    pendingScrambleRef.current = newScramble;
    setCubeKey((k) => k + 1);
  };

  const handleSolve = async () => {
    if (!scramble && JSON.stringify(cubeState) === JSON.stringify(SOLVED_STATE)) {
      Alert.alert("Scan a cube first", "Scan your cube on the Scan tab, then press Solve.");
      return;
    }
    setSolving(true);
    try {
      let sol: string[];
      let snapshots: CubeState[];
      if (fromScan || !scramble || chipTappedRef.current) {
        sol = solveCubeState(cubeState);
        snapshots = [cubeState];
      } else {
        sol = solveFromScramble(scramble);
        snapshots = getIntermediateStates(scramble, sol);
      }
      setMoves(sol);
      setCubeSnapshots(snapshots);
      setStep(-1);
      setTicks(0);
      setPlaying(false);
    } catch (e) {
      console.error("[solve] failed:", e);
    } finally {
      setSolving(false);
    }
  };

  const handleExecuteMove = (notation: string, isUndo = false, fromChip = false) => {
    if (isAnimatingRef.current) return;  // ref = always current, no stale closure
    if (fromChip) chipMoveRef.current = isUndo ? notation + "_undo" : notation;
    isAnimatingRef.current = true;
    setIsAnimating(true);
    const physicsMove = parseMove(notation, isUndo);
    setActiveMove(physicsMove);
  };

  const handleMoveComplete = () => {
    if (scrambleQueueRef.current) {
      // Scramble queue: unlock immediately so next move can start after 30ms
      const next = scrambleQueueRef.current;
      scrambleQueueRef.current = null;
      isAnimatingRef.current = false;
      setIsAnimating(false);
      setActiveMove(null);
      setTimeout(next, 30);
      return;
    }
    // Delay unlock by 50ms — lets Three.js fully snap cubies before next input
    setTimeout(() => {
      isAnimatingRef.current = false;
      setIsAnimating(false);
      setActiveMove(null);
    }, 50);
    if (chipMoveRef.current) {
      const chipMove = chipMoveRef.current;
      chipMoveRef.current = null;
      try {
        const isUndo = chipMove.endsWith("_undo");
        const notation = isUndo ? chipMove.slice(0, -5) : chipMove;
        const cube = CubeJS.fromString(cubeStateToString(cubeState));
        if (isUndo) {
          const inverse = notation.includes("'")
            ? notation.replace("'", "")
            : notation + "'";
          cube.move(inverse);
        } else {
          cube.move(notation);
        }
        isManualScrambleRef.current = true;
        chipTappedRef.current = true;
        setCubeState(stringToCubeState(cube.asString()));
      } catch (_) { /* ignore parse errors */ }
    }
    if (playing && step < moves.length - 1) {
      const delay = playbackMode === "auto" ? stepDelay : 100;
      setTimeout(() => {
        const nextStep = step + 1;
        setStep(nextStep);
        handleExecuteMove(moves[nextStep]);
      }, delay);
    } else if (playing && step >= moves.length - 1) {
      setPlaying(false);
      isManualScrambleRef.current = true;
      setCubeState(SOLVED_STATE);
      setCubeKey((k) => k + 1);
    }
  };

  const handlePlay = () => {
    if (step >= moves.length - 1) { setStep(-1); savedRef.current = false; }
    startTimeRef.current = Date.now();
    setPlaying(true);
    const startStep = step >= moves.length - 1 ? 0 : step + 1;
    setStep(startStep);
    if (moves.length > 0) handleExecuteMove(moves[startStep]);
  };

  const handlePause = () => setPlaying(false);

  const handleNext = () => {
    setPlaying(false);
    if (step < moves.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      handleExecuteMove(moves[nextStep]);
    }
  };

  const handlePrev = () => {
    setPlaying(false);
    if (step >= 0) {
      handleExecuteMove(moves[step], true);
      setStep((s) => s - 1);
    }
  };

  // ── Chip handlers ─────────────────────────────────────────────────────────────
  const handleChipPress = (i: number) => {
    setPlaying(false);
    if (i > step) {
      for (let j = step + 1; j <= i; j++) {
        setTimeout(() => handleExecuteMove(moves[j]), (j - step - 1) * 100);
      }
    } else if (i < step) {
      for (let j = step; j > i; j--) {
        setTimeout(() => handleExecuteMove(moves[j], true), (step - j) * 100);
      }
    }
    setStep(i);
  };

  const handleMovePress = (move: string) => handleExecuteMove(move, false, true);

  // ── Derived UI values ─────────────────────────────────────────────────────────
  const isScrambling = scrambleQueueRef.current !== null || pendingScrambleRef.current !== null;

  // Status badge config
  const getStatusBadgeStyle = () => {
    if (solved) return {
      bg: hexOpacity("#009B48", 0.12),
      border: hexOpacity("#009B48", 0.3),
      dot: "#009B48",
      text: "SOLVED",
      textColor: "#009B48",
    };
    if (playing) return {
      bg: hexOpacity("#B8E4C0", 0.10),
      border: hexOpacity("#B8E4C0", 0.25),
      dot: t.HIGHLIGHT,
      text: "SOLVING",
      textColor: t.HIGHLIGHT,
    };
    if (moves.length === 0) return {
      bg: t.CARD_ALT,
      border: t.BORDER,
      dot: t.MUTED,
      text: "READY",
      textColor: t.MUTED,
    };
    return {
      bg: t.CARD_ALT,
      border: t.BORDER,
      dot: t.MUTED,
      text: "SCRAMBLED",
      textColor: t.MUTED,
    };
  };
  const badge = getStatusBadgeStyle();

  const progressFillColor = solved ? "#009B48" : playing ? t.HIGHLIGHT : t.ACCENT;

  // Status card bg for stats row
  const statusCardBg = solved
    ? "rgba(0,155,72,0.15)"
    : playing
    ? "rgba(184,228,192,0.10)"
    : t.CARD;

  // ── Render: cube card ─────────────────────────────────────────────────────────
  const renderCubeCard = (height: number) => (
    <View style={[s.cubeCard, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
      <Cube3D
        key={cubeKey}
        cubeState={cubeState}
        height={height}
        currentMove={activeMove}
        onMoveComplete={handleMoveComplete}
        animationSpeed={isScrambling ? 8.0 : 3.0}
      />
      {/* Bottom strip */}
      <View style={[s.cubeStrip, { borderTopColor: t.BORDER }]}>
        {/* Status badge */}
        <View style={[s.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          <View style={[s.statusDot, { backgroundColor: badge.dot }]} />
          <Text style={[s.statusTxt, { color: badge.textColor }]}>{badge.text}</Text>
        </View>
        {/* Step counter */}
        {moves.length > 0 && step >= 0 && (
          <Text style={[s.stepCounter, { color: t.TEXT }]}>
            {step + 1} / {moves.length}
          </Text>
        )}
      </View>
      {/* Progress bar */}
      <View style={[s.progressTrack, { backgroundColor: t.BORDER }]}>
        <Animated.View
          style={[
            s.progressFill,
            {
              backgroundColor: progressFillColor,
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
    </View>
  );

  // ── Render: stats row ─────────────────────────────────────────────────────────
  const renderStats = () => (
    <View style={s.statsRow}>
      <View style={[s.statCard, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
        <Text style={[s.statLabel, { color: t.MUTED }]}>MOVES</Text>
        <Text style={[s.statValue, { color: t.TEXT }]}>
          {moves.length > 0 ? String(moves.length) : "0"}
        </Text>
      </View>
      <View style={[s.statCard, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
        <Text style={[s.statLabel, { color: t.MUTED }]}>STEP</Text>
        <Text style={[s.statValue, { color: t.TEXT }]}>
          {moves.length > 0 && step >= 0 ? `${step + 1} / ${moves.length}` : "0 / 0"}
        </Text>
      </View>
      <View style={[s.statCard, { backgroundColor: statusCardBg, borderColor: t.BORDER }]}>
        <Text style={[s.statLabel, { color: t.MUTED }]}>STATUS</Text>
        <Text style={[s.statValue, { color: t.TEXT }]}>{status}</Text>
      </View>
    </View>
  );

  // ── Render: solver initializing banner ───────────────────────────────────────
  const renderSolverBanner = () => {
    if (solverReady) return null;
    return (
      <View style={[s.solverBanner, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
        <ActivityIndicator size="small" color={t.HIGHLIGHT} />
        <Text style={[s.solverBannerTxt, { color: t.MUTED }]}>Solver initializing...</Text>
      </View>
    );
  };

  // ── Render: action button ─────────────────────────────────────────────────────
  const renderActionButton = () => (
    <View style={s.actionWrapper}>
      <Pressable
        onPress={handleSolve}
        disabled={solving || solved}
        style={[s.solveBtn, { backgroundColor: "#009B48", opacity: (solving || solved) ? 0.6 : 1 }]}
      >
        {solving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="bulb-outline" size={20} color="#fff" />
            <Text style={s.solveBtnTxt}>Solve</Text>
          </>
        )}
      </Pressable>
    </View>
  );

  // ── WIDE LAYOUT ───────────────────────────────────────────────────────────────
  if (isWide) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.BG }]}>
        <View style={s.wideContainer}>

          {/* Left 60%: cube */}
          <View style={[s.cubePanel, { backgroundColor: t.BG }]}>
            <Text
              style={[s.scrambleLine, { color: t.MUTED }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {scramble || "Tap Solve to begin"}
            </Text>
            {renderCubeCard(Math.min(windowWidth * 0.55, 560))}
          </View>

          {/* Right 40%: controls */}
          <View style={[s.controlPanel, { backgroundColor: t.CARD, borderLeftColor: t.BORDER }]}>
            <ScrollView contentContainerStyle={s.controlScroll} showsVerticalScrollIndicator={false}>
              <Text style={[s.panelTitle, { color: t.TEXT }]}>3D Cube Guide</Text>
              <Text
                style={[s.scrambleLine, { color: t.MUTED }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {scramble || "Tap Solve to begin"}
              </Text>
              {renderSolverBanner()}
              {renderStats()}
              <View style={{ marginTop: 14 }}>
                <PlaybackCard
                  playbackMode={playbackMode}
                  stepDelay={stepDelay}
                  step={step}
                  moves={moves}
                  playing={playing}
                  solving={solving}
                  isAnimating={isAnimating}
                  onModeChange={setPlaybackMode}
                  onDelayChange={setStepDelay}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onNext={handleNext}
                  onPrev={handlePrev}
                />
              </View>
              {moves.length > 0 && (
                <View style={{ marginTop: 14 }}>
                  <AlgorithmChips
                    moves={moves}
                    step={step}
                    isAnimating={isAnimating}
                    onChipPress={handleChipPress}
                    onMovePress={handleMovePress}
                  />
                </View>
              )}
              {moves.length === 0 && (
                <View style={{ marginTop: 14 }}>
                  <AlgorithmChips
                    moves={moves}
                    step={step}
                    isAnimating={isAnimating}
                    onChipPress={handleChipPress}
                    onMovePress={handleMovePress}
                  />
                </View>
              )}
              {renderActionButton()}
            </ScrollView>
          </View>

        </View>

        {/* Confetti + "Solved!" overlay */}
        <ConfettiEffect visible={showConfetti} onComplete={() => setShowConfetti(false)} />
        {showConfetti && (
          <Animated.View
            style={[s.solvedTextOverlay, { opacity: overlayOpacity, transform: [{ scale: overlayScale }] }]}
            pointerEvents="none"
          >
            <Text style={[s.solvedTextBig, { color: "#009B48" }]}>Solved!</Text>
          </Animated.View>
        )}

      </SafeAreaView>
    );
  }

  // ── MOBILE LAYOUT ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.BG }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header */}
        <Text style={[s.title, { color: t.TEXT }]}>3D Cube Guide</Text>
        <Text
          style={[s.scrambleLine, { color: t.MUTED }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {scramble || "Tap Solve to begin"}
        </Text>

        {/* Cube card */}
        {renderCubeCard(260)}

        {/* Stats row */}
        {renderStats()}

        {/* Solver banner */}
        {renderSolverBanner()}

        {/* Playback card */}
        <View style={{ marginTop: 14 }}>
          <PlaybackCard
            playbackMode={playbackMode}
            stepDelay={stepDelay}
            step={step}
            moves={moves}
            playing={playing}
            solving={solving}
            isAnimating={isAnimating}
            onModeChange={setPlaybackMode}
            onDelayChange={setStepDelay}
            onPlay={handlePlay}
            onPause={handlePause}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        </View>

        {/* Algorithm chips */}
        <View style={{ marginTop: 14 }}>
          <AlgorithmChips
            moves={moves}
            step={step}
            isAnimating={isAnimating}
            onChipPress={handleChipPress}
            onMovePress={handleMovePress}
          />
        </View>

        {/* Action button */}
        {renderActionButton()}

      </ScrollView>

      {/* Confetti + "Solved!" overlay (outside ScrollView, absolute) */}
      <ConfettiEffect visible={showConfetti} onComplete={() => setShowConfetti(false)} />
      {showConfetti && (
        <Animated.View
          style={[s.solvedTextOverlay, { opacity: overlayOpacity, transform: [{ scale: overlayScale }] }]}
          pointerEvents="none"
        >
          <Text style={[s.solvedTextBig, { color: "#009B48" }]}>Solved!</Text>
        </Animated.View>
      )}

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },

  // Scroll / layout
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 120,
  },

  // Header
  title: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginTop: 16,
  },
  scrambleLine: {
    fontSize: 12,
    fontFamily: "monospace",
    marginTop: 4,
  },

  // Cube card
  cubeCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 16,
  },
  cubeStrip: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusTxt: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  stepCounter: {
    fontSize: 13,
    fontWeight: "700",
  },
  progressTrack: {
    height: 3,
  },
  progressFill: {
    height: 3,
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
  },

  // Solver banner
  solverBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  solverBannerTxt: {
    fontSize: 13,
  },

  // Action button
  actionWrapper: {
    marginTop: 14,
  },
  solveBtn: {
    height: 56,
    borderRadius: 28,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  solveBtnTxt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },

  // Solved overlay
  solvedTextOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none",
  } as any,
  solvedTextBig: {
    fontSize: 42,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // Wide layout
  wideContainer: {
    flex: 1,
    flexDirection: "row",
  },
  cubePanel: {
    width: "60%",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    position: "relative",
  },
  controlPanel: {
    width: "40%",
    borderLeftWidth: 1,
  },
  controlScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
});
