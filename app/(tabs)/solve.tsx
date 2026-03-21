import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
} from "react-native-reanimated";
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

// ── Move chips data (face hex colors are cube-specific, not theme tokens) ─────

const MOVE_CHIPS = [
  { move: "R",  color: "#B71234" },
  { move: "R'", color: "#B71234" },
  { move: "R2", color: "#B71234" },
  { move: "L",  color: "#FF5800" },
  { move: "L'", color: "#FF5800" },
  { move: "L2", color: "#FF5800" },
  { move: "U",  color: "#EEEEEE" },
  { move: "U'", color: "#EEEEEE" },
  { move: "U2", color: "#EEEEEE" },
  { move: "D",  color: "#FFD500" },
  { move: "D'", color: "#FFD500" },
  { move: "D2", color: "#FFD500" },
  { move: "F",  color: "#009B48" },
  { move: "F'", color: "#009B48" },
  { move: "F2", color: "#009B48" },
  { move: "B",  color: "#0046AD" },
  { move: "B'", color: "#0046AD" },
  { move: "B2", color: "#0046AD" },
];

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
      disabled={disabled}
    >
      <Animated.View style={[style, anim]}>{children}</Animated.View>
    </Pressable>
  );
}

// ── SolveScreen ───────────────────────────────────────────────────────────────

export default function SolveScreen() {
  const t = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const isWide = Platform.OS === "web" && windowWidth >= 768;
  const { cubeState, setCubeState, resetCube } = useCubeStore();

  // ── State (unchanged) ────────────────────────────────────────────────────────
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
  const [cubeKey, setCubeKey] = useState(0);
  const [playbackMode, setPlaybackMode] = useState<"auto" | "manual">("auto");
  const [stepDelay,    setStepDelay]    = useState(2500);
  const [isAnimating,  setIsAnimating]  = useState(false);

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

  const solvedOpacity = useSharedValue(0);
  const solvedAnim    = useAnimatedStyle(() => ({ opacity: solvedOpacity.value }));

  const overlayOpacity = useSharedValue(0);
  const overlayScale   = useSharedValue(0.5);
  const overlayAnim    = useAnimatedStyle(() => ({
    opacity:   overlayOpacity.value,
    transform: [{ scale: overlayScale.value }],
  }));

  // ── Elapsed timer (unchanged) ─────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTicks((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [playing]);

  // ── Auto-solve scanned cube (unchanged) ───────────────────────────────────────
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

  // ── Handlers (unchanged) ──────────────────────────────────────────────────────

  // ── Scramble animation helper ─────────────────────────────────────────────────
  // Applies each move of a scramble string one-by-one to the live 3D cube,
  // then updates cubeState in the store when done so Solve has accurate state.
  const applyScramble = (scrambleStr: string) => {
    const scrambleMoves = scrambleStr.trim().split(/\s+/);
    let idx = 0;

    const applyNext = () => {
      if (idx >= scrambleMoves.length) {
        // All scramble moves applied — update store so Solve has correct state
        const scrambledState = getScrambledState(scrambleStr);
        isManualScrambleRef.current = true;   // block the auto-solve effect
        setCubeState(scrambledState);
        const sol = solveFromScramble(scrambleStr);
        setMoves(sol);
        setCubeSnapshots(getIntermediateStates(scrambleStr, sol));
        return;
      }
      const physicsMove = parseMove(scrambleMoves[idx]);
      idx++;
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
    // Increment key to force Cube3D remount (resets THREE.js cubie positions)
    // then start the scramble animation after scene re-initialises
    pendingScrambleRef.current = newScramble;
    setCubeKey((k) => k + 1);
  };

  // After cubeKey changes the Cube3D is remounted with a fresh scene.
  // Wait 150ms for THREE.js to initialise, then play the scramble moves.
  useEffect(() => {
    if (cubeKey === 0) return;
    const str = pendingScrambleRef.current;
    if (!str) return;
    pendingScrambleRef.current = null;
    const id = setTimeout(() => applyScramble(str), 150);
    return () => clearTimeout(id);
  }, [cubeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSolve = async () => {
    // Nothing to solve and nothing loaded — generate a scramble first
    if (!scramble && JSON.stringify(cubeState) === JSON.stringify(SOLVED_STATE)) {
      handleNewScramble();
      return;
    }
    setSolving(true);
    try {
      let sol: string[];
      let snapshots: CubeState[];
      if (fromScan || !scramble || chipTappedRef.current) {
        // Solve from the live cube state (scanned cube, manual chip taps, or modified scramble)
        sol = solveCubeState(cubeState);
        snapshots = [cubeState];
      } else {
        // Solve from the scramble string (fastest + gets intermediate snapshots)
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
    if (isAnimating) return;
    if (fromChip) chipMoveRef.current = isUndo ? notation + "_undo" : notation;
    setIsAnimating(true);
    const physicsMove = parseMove(notation, isUndo);
    setActiveMove(physicsMove);
  };

  const handleMoveComplete = () => {
    setIsAnimating(false);
    setActiveMove(null);
    // Drain the scramble animation queue first
    if (scrambleQueueRef.current) {
      const next = scrambleQueueRef.current;
      scrambleQueueRef.current = null;
      setTimeout(next, 30);   // small pause between scramble moves
      return;
    }
    // Sync cubeState when a notation chip was tapped manually
    if (chipMoveRef.current) {
      const chipMove = chipMoveRef.current;
      chipMoveRef.current = null;
      try {
        const isUndo = chipMove.endsWith("_undo");
        const notation = isUndo ? chipMove.slice(0, -5) : chipMove;
        const cube = CubeJS.fromString(cubeStateToString(cubeState));
        if (isUndo) {
          // Undo: apply the inverse move (append/remove prime)
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
      // Reset visual cube to solved state — cubeState was still scrambled during playback
      isManualScrambleRef.current = true;   // block auto-solve effect
      setCubeState(SOLVED_STATE);           // sticker colors → all solved
      setCubeKey((k) => k + 1);            // remount Cube3D: clean scene, cubies at correct positions
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

  // ── Computed (unchanged) ──────────────────────────────────────────────────────
  const pct     = moves.length > 0 && step >= 0 ? Math.round(((step + 1) / moves.length) * 100) : 0;
  const elapsed = `${Math.floor(ticks / 10)}.${ticks % 10}s`;
  const solved  = moves.length > 0 && step >= moves.length - 1;
  const status  = solved ? "SOLVED" : playing ? "SOLVING" : moves.length > 0 ? "SCRAMBLED" : "READY";

  // ── Auto-save (unchanged) ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!solved || savedRef.current || !scramble) return;
    savedRef.current = true;
    const solveTimeMs = startTimeRef.current ? Date.now() - startTimeRef.current : undefined;
    saveSolve({ scramble, solution: moves as any, moveCount: moves.length, solveTimeMs }).catch(() => {});
  }, [solved, scramble, moves]);

  // ── Trigger solved animation ──────────────────────────────────────────────────
  useEffect(() => {
    if (solved) {
      solvedOpacity.value = withTiming(1, { duration: 600 });

      // Confetti burst
      setShowConfetti(true);

      // "Solved!" overlay: scale-spring in, hold 2s, fade out
      overlayOpacity.value = withSequence(
        withTiming(1, { duration: 400 }),
        withDelay(2000, withTiming(0, { duration: 500 })),
      );
      overlayScale.value = withSequence(
        withSpring(1.1, { damping: 8, stiffness: 180 }),
        withSpring(1.0, { damping: 12, stiffness: 200 }),
      );
    } else {
      solvedOpacity.value  = 0;
      overlayOpacity.value = 0;
      overlayScale.value   = 0.5;
      setShowConfetti(false);
    }
  }, [solved]);

  // ── Derived UI values ─────────────────────────────────────────────────────────
  const statusBg = solved ? t.GREEN : playing ? t.ACCENT : t.CARD;
  const statusTextColor = solved || playing ? "#fff" : t.TEXT;
  const statusMutedColor = solved || playing ? "rgba(255,255,255,0.7)" : t.MUTED;

  // ── Cube card (shared helper) ─────────────────────────────────────────────────
  const isScrambling = scrambleQueueRef.current !== null || pendingScrambleRef.current !== null;

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
      {/* Bottom strip: badge + step counter */}
      <View style={[s.cubeStrip, { borderTopColor: t.BORDER }]}>
        <View style={s.stripLeft}>
          <View style={[s.stripDot, {
            backgroundColor: solved ? t.GREEN : moves.length > 0 ? t.ACCENT : t.MUTED,
          }]} />
          <Text style={[s.stripBadge, { color: t.MUTED }]}>
            {solved ? "SOLVED" : moves.length > 0 ? `${moves.length} MOVES` : "SOLVED STATE"}
          </Text>
        </View>
        {moves.length > 0 && step >= 0 && (
          <Text style={[s.stripStep, { color: t.TEXT }]}>
            {step + 1} / {moves.length}
          </Text>
        )}
      </View>
      {/* Progress bar */}
      <View style={[s.progressTrack, { backgroundColor: t.BORDER }]}>
        <View style={[s.progressFill, { width: `${pct}%` as any, backgroundColor: t.ACCENT }]} />
      </View>
    </View>
  );

  // ── Stats row ─────────────────────────────────────────────────────────────────
  const renderStats = () => (
    <View style={s.statsRow}>
      <View style={[s.statBox, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
        <Text style={[s.statVal, { color: t.TEXT }]}>{moves.length > 0 ? String(moves.length) : "0"}</Text>
        <Text style={[s.statLbl, { color: t.MUTED }]}>MOVES</Text>
      </View>
      <View style={[s.statBox, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
        <Text style={[s.statVal, { color: t.TEXT }]}>
          {moves.length > 0 && step >= 0 ? `${step + 1}/${moves.length}` : "0/0"}
        </Text>
        <Text style={[s.statLbl, { color: t.MUTED }]}>STEP</Text>
      </View>
      <View style={[s.statBox, { backgroundColor: statusBg, borderColor: t.BORDER }]}>
        <Text style={[s.statVal, { fontSize: 13, color: statusTextColor }]}>{status}</Text>
        <Text style={[s.statLbl, { color: statusMutedColor }]}>STATUS</Text>
      </View>
    </View>
  );

  // ── Playback card ─────────────────────────────────────────────────────────────
  const renderPlayback = () => (
    <View style={[s.card, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
      <Text style={[s.cardLabel, { color: t.MUTED }]}>PLAYBACK</Text>

      {/* Mode toggle */}
      <View style={s.modeRow}>
        <Text style={[s.modeHint, { color: t.TEXT }]}>Mode</Text>
        <View style={[s.modeToggle, { backgroundColor: t.CARD_ALT, borderColor: t.BORDER }]}>
          {(["auto", "manual"] as const).map((m) => (
            <Pressable
              key={m}
              onPress={() => setPlaybackMode(m)}
              style={[s.modePill, playbackMode === m && { backgroundColor: t.ACCENT }]}
            >
              <Text style={[
                s.modePillTxt,
                { color: playbackMode === m ? "#000040" : t.MUTED },
                playbackMode === m && { fontWeight: "700" },
              ]}>
                {m === "auto" ? "Auto" : "Manual"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Auto mode: step delay */}
      {playbackMode === "auto" && (
        <>
          <View style={s.delayRow}>
            <Text style={[s.delayLabel, { color: t.TEXT }]}>Step Delay</Text>
            <View style={[s.delayBadge, { backgroundColor: t.CARD_ALT }]}>
              <Text style={[s.delayValue, { color: t.ACCENT }]}>{stepDelay} ms</Text>
            </View>
          </View>
          {Platform.OS === "web" ? (
            <View style={s.sliderWrap}>
              <input
                type="range"
                min={100}
                max={2500}
                step={100}
                value={stepDelay}
                onChange={(e: any) => setStepDelay(Number(e.target.value))}
                style={{ width: "100%", accentColor: t.ACCENT, height: 4, cursor: "pointer" }}
              />
              <View style={s.sliderLabels}>
                <Text style={[s.sliderLbl, { color: t.MUTED }]}>Fast — 100ms</Text>
                <Text style={[s.sliderLbl, { color: t.MUTED }]}>2500ms — Slow</Text>
              </View>
            </View>
          ) : (
            <View style={s.nativeDelayRow}>
              <AnimatedPressable
                onPress={() => setStepDelay((d) => Math.max(100, d - 200))}
                style={[s.delayBtn, { backgroundColor: t.CARD_ALT, borderColor: t.BORDER }]}
              >
                <Text style={[s.delayBtnTxt, { color: t.TEXT }]}>−</Text>
              </AnimatedPressable>
              <Text style={[s.delayCenter, { color: t.TEXT }]}>{stepDelay} ms</Text>
              <AnimatedPressable
                onPress={() => setStepDelay((d) => Math.min(2500, d + 200))}
                style={[s.delayBtn, { backgroundColor: t.CARD_ALT, borderColor: t.BORDER }]}
              >
                <Text style={[s.delayBtnTxt, { color: t.TEXT }]}>+</Text>
              </AnimatedPressable>
            </View>
          )}
        </>
      )}

      {/* Transport controls (always visible) */}
      <View style={s.transportRow}>
        <AnimatedPressable
          onPress={handlePrev}
          disabled={step < 0 || isAnimating}
          style={[s.transportBtn, { backgroundColor: t.CARD_ALT, borderColor: t.BORDER }, step < 0 && s.dimmed]}
        >
          <Ionicons name="play-back" size={14} color={t.TEXT} />
          <Text style={[s.transportTxt, { color: t.TEXT }]}>Prev</Text>
        </AnimatedPressable>
        <AnimatedPressable
          onPress={playing ? handlePause : handlePlay}
          disabled={moves.length === 0 || isAnimating}
          style={[s.playBtn, { backgroundColor: solved ? t.GREEN : t.ACCENT }, moves.length === 0 && s.dimmed]}
        >
          {solving ? (
            <ActivityIndicator color="#000040" size="small" />
          ) : (
            <>
              <Ionicons name={playing ? "pause" : "play"} size={16} color="#000040" />
              <Text style={s.playBtnTxt}>{playing ? "Pause" : "Play"}</Text>
            </>
          )}
        </AnimatedPressable>
        <AnimatedPressable
          onPress={handleNext}
          disabled={step >= moves.length - 1 || isAnimating}
          style={[s.transportBtn, { backgroundColor: t.CARD_ALT, borderColor: t.BORDER }, step >= moves.length - 1 && s.dimmed]}
        >
          <Text style={[s.transportTxt, { color: t.TEXT }]}>Next</Text>
          <Ionicons name="play-forward" size={14} color={t.TEXT} />
        </AnimatedPressable>
      </View>
    </View>
  );

  // ── Algorithm sequence ────────────────────────────────────────────────────────
  const renderAlgorithm = () => {
    if (moves.length === 0) return null;
    return (
      <View style={[s.card, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
        <Text style={[s.cardLabel, { color: t.MUTED }]}>ALGORITHM SEQUENCE</Text>
        <View style={s.chips}>
          {moves.map((m, i) => {
            const isActive = i === step;
            const isDone   = i < step;
            return (
              <Pressable
                key={i}
                onPress={() => {
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
                }}
                style={[
                  s.algChip,
                  {
                    backgroundColor: isActive ? t.ACCENT : t.CARD_ALT,
                    borderColor:     isActive ? t.ACCENT : t.BORDER,
                    opacity:         isDone ? 0.3 : 1,
                    transform:       isActive ? [{ scale: 1.05 }] : [],
                  },
                ]}
              >
                <Text style={[s.algChipTxt, { color: isActive ? "#000040" : t.TEXT, fontWeight: isActive ? "700" : "400" }]}>
                  {m}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  // ── Move notation guide ───────────────────────────────────────────────────────
  const renderNotation = () => (
    <View style={[s.card, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
      <Text style={[s.cardLabel, { color: t.MUTED }]}>TAP ANY MOVE TO PREVIEW IT</Text>
      <View style={s.notationGrid}>
        {MOVE_CHIPS.map(({ move, color }) => (
          <AnimatedPressable
            key={move}
            onPress={() => handleExecuteMove(move, false, true)}
            disabled={isAnimating}
            style={[s.notationChip, { backgroundColor: t.CARD_ALT, borderColor: t.BORDER }, isAnimating && { opacity: 0.4 }]}
          >
            <View style={[s.notationDot, { backgroundColor: color }]} />
            <Text style={[s.notationLabel, { color: t.TEXT }]}>{move}</Text>
          </AnimatedPressable>
        ))}
      </View>
    </View>
  );

  // ── Action buttons ────────────────────────────────────────────────────────────
  const renderActions = () => (
    <View style={s.actionRow}>
      <AnimatedPressable
        onPress={handleNewScramble}
        style={[s.scrambleBtn, { backgroundColor: t.CARD, borderColor: t.BORDER }]}
      >
        <Ionicons name="shuffle" size={16} color={t.TEXT} />
        <Text style={[s.scrambleBtnTxt, { color: t.TEXT }]}>Scramble</Text>
      </AnimatedPressable>
      <AnimatedPressable
        onPress={handleSolve}
        disabled={solving}
        style={[s.solveBtn, { backgroundColor: t.ACCENT }]}
      >
        {solving ? (
          <ActivityIndicator color="#000040" size="small" />
        ) : (
          <>
            <Ionicons name="bulb-outline" size={16} color="#000040" />
            <Text style={s.solveBtnTxt}>Solve</Text>
          </>
        )}
      </AnimatedPressable>
    </View>
  );

  // ── WIDE LAYOUT ───────────────────────────────────────────────────────────────
  if (isWide) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.BG }]}>
        <View style={s.wideContainer}>

          {/* Left 62%: cube */}
          <View style={[s.cubePanel, { backgroundColor: t.BG }]}>
            <Text
              style={[s.scrambleLine, { color: t.MUTED, marginBottom: 8, alignSelf: "center" }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {scramble || "Tap Scramble to begin"}
            </Text>
            {renderCubeCard(Math.min(windowWidth * 0.55, 560))}
            <View style={s.hints}>
              <View style={s.hintItem}>
                <View style={[s.hintDot, { backgroundColor: t.MUTED }]} />
                <Text style={[s.hintTxt, { color: t.MUTED }]}>Drag to rotate</Text>
              </View>
              <View style={s.hintItem}>
                <View style={[s.hintDot, { backgroundColor: t.MUTED }]} />
                <Text style={[s.hintTxt, { color: t.MUTED }]}>Scroll to zoom</Text>
              </View>
            </View>
            {/* Solved flash (wide — overlays cube panel) */}
            <Animated.View style={[s.solvedOverlay, solvedAnim]} pointerEvents="none">
              <Text style={[s.solvedOverlayTxt, { color: t.GREEN }]}>Solved!</Text>
            </Animated.View>
          </View>

          {/* Right 38%: controls */}
          <View style={[s.controlPanel, { backgroundColor: t.CARD, borderLeftColor: t.BORDER }]}>
            <ScrollView contentContainerStyle={s.controlScroll} showsVerticalScrollIndicator={false}>
              <View style={s.panelHeader}>
                <Text style={[s.panelTitle, { color: t.TEXT }]}>3D Solver</Text>
                <Text style={[s.panelSub, { color: t.MUTED }]}>Step-by-step interactive visualization</Text>
              </View>
              {!solverReady && (
                <View style={[s.solverBanner, { backgroundColor: t.CARD_ALT }]}>
                  <ActivityIndicator size="small" color={t.ACCENT} />
                  <Text style={[s.solverBannerTxt, { color: t.MUTED }]}>Solver initializing...</Text>
                </View>
              )}
              {renderStats()}
              {renderPlayback()}
              {renderAlgorithm()}
              {!playing && !isAnimating && renderNotation()}
              {renderActions()}
            </ScrollView>
          </View>

        </View>

        {/* Confetti + "Solved!" overlay (wide) */}
        <ConfettiEffect visible={showConfetti} onComplete={() => setShowConfetti(false)} />
        {showConfetti && (
          <Animated.View style={[s.solvedTextOverlay, overlayAnim]} pointerEvents="none">
            <Text style={[s.solvedTextBig, { color: t.GREEN }]}>Solved!</Text>
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
        {/* Solver warm-up banner */}
        {!solverReady && (
          <View style={[s.solverBanner, { backgroundColor: t.CARD }]}>
            <ActivityIndicator size="small" color={t.ACCENT} />
            <Text style={[s.solverBannerTxt, { color: t.MUTED }]}>Solver initializing...</Text>
          </View>
        )}

        {/* Header row with solved flash */}
        <View style={s.mobileHeader}>
          <Text style={[s.title, { color: t.TEXT }]}>3D Solver</Text>
          <Animated.View style={solvedAnim}>
            <Text style={[s.solvedBadge, { color: t.GREEN }]}>
              {solved ? "Solved!" : ""}
            </Text>
          </Animated.View>
        </View>

        {/* Scramble display */}
        <Text
          style={[s.scrambleLine, { color: t.MUTED }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {scramble || "Tap Scramble to begin"}
        </Text>

        {renderCubeCard(260)}
        {renderStats()}
        {renderPlayback()}
        {renderAlgorithm()}
        {!playing && !isAnimating && renderNotation()}
        {renderActions()}
      </ScrollView>

      {/* Confetti + "Solved!" overlay (mobile) */}
      <ConfettiEffect visible={showConfetti} onComplete={() => setShowConfetti(false)} />
      {showConfetti && (
        <Animated.View style={[s.solvedTextOverlay, overlayAnim]} pointerEvents="none">
          <Text style={[s.solvedTextBig, { color: t.GREEN }]}>Solved!</Text>
        </Animated.View>
      )}

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1 },

  // Solver banner
  solverBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  solverBannerTxt: { fontSize: 13 },

  // Mobile
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  mobileHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title:        { fontSize: 26, fontWeight: "700" },
  solvedBadge:  { fontSize: 18, fontWeight: "800" },
  scrambleLine: { fontSize: 11, fontFamily: "SpaceMono", marginBottom: 8 },

  // Wide layout
  wideContainer: { flex: 1, flexDirection: "row" },
  cubePanel: {
    width: "62%",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    position: "relative",
  },
  controlPanel: { width: "38%", borderLeftWidth: 1 },
  controlScroll: { padding: 20, paddingBottom: 40 },
  panelHeader:   { marginBottom: 16 },
  panelTitle:    { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  panelSub:      { fontSize: 12 },

  // Hints (wide)
  hints:   { flexDirection: "row", gap: 20, marginTop: 12 },
  hintItem:{ flexDirection: "row", alignItems: "center", gap: 6 },
  hintDot: { width: 5, height: 5, borderRadius: 3 },
  hintTxt: { fontSize: 11 },

  // Solved overlay (wide)
  solvedOverlay: {
    position: "absolute",
    top: 28,
    right: 28,
  },
  solvedOverlayTxt: { fontSize: 28, fontWeight: "800" },

  // Confetti "Solved!" big text (both layouts — absolute centred)
  solvedTextOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex:         998,
    alignItems:     "center",
    justifyContent: "center",
    top:            "35%" as any,
    bottom:         "35%" as any,
    pointerEvents:  "none",
  },
  solvedTextBig: {
    fontSize:   42,
    fontWeight: "800",
    textShadowColor:   "rgba(0,0,0,0.35)",
    textShadowOffset:  { width: 0, height: 2 },
    textShadowRadius:  6,
  },

  // Cube card
  cubeCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
    width: "100%",
  },
  cubeStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  stripLeft:  { flexDirection: "row", alignItems: "center", gap: 6 },
  stripDot:   { width: 8, height: 8, borderRadius: 4 },
  stripBadge: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  stripStep:  { fontSize: 13, fontWeight: "700" },
  progressTrack: { height: 3 },
  progressFill:  { height: 3 },

  // Stats row
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  statVal: { fontSize: 18, fontWeight: "700" },
  statLbl: { fontSize: 10, marginTop: 2, letterSpacing: 0.5 },

  // Generic card
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  cardLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 12 },

  // Mode toggle
  modeRow:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  modeHint:   { fontSize: 13 },
  modeToggle: { flexDirection: "row", borderRadius: 8, borderWidth: 1, overflow: "hidden" },
  modePill:   { paddingHorizontal: 16, paddingVertical: 6 },
  modePillTxt:{ fontSize: 12 },

  // Delay
  delayRow:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  delayLabel: { fontSize: 13 },
  delayBadge: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, overflow: "hidden" },
  delayValue: { fontSize: 13, fontWeight: "700" },
  sliderWrap: { marginBottom: 12 },
  sliderLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  sliderLbl:  { fontSize: 10 },
  nativeDelayRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 12 },
  delayBtn:   { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  delayBtnTxt:{ fontSize: 18, fontWeight: "700" },
  delayCenter:{ fontSize: 14, fontWeight: "700", minWidth: 80, textAlign: "center" },

  // Transport controls
  transportRow: { flexDirection: "row", gap: 8 },
  transportBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  transportTxt: { fontSize: 13, fontWeight: "600" },
  playBtn: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
  },
  playBtnTxt: { fontSize: 14, fontWeight: "700", color: "#000040" },
  dimmed: { opacity: 0.35 },

  // Algorithm chips
  chips:      { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  algChip:    { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, borderWidth: 1 },
  algChipTxt: { fontSize: 12, fontFamily: "SpaceMono" },

  // Notation guide
  notationGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  notationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  notationDot:   { width: 10, height: 10, borderRadius: 5 },
  notationLabel: { fontSize: 13, fontWeight: "700", fontFamily: "SpaceMono" },

  // Action row
  actionRow: { flexDirection: "row", gap: 12 },
  scrambleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 16,
    minHeight: 52,
  },
  scrambleBtnTxt: { fontSize: 15, fontWeight: "600" },
  solveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    paddingVertical: 16,
    minHeight: 52,
  },
  solveBtnTxt: { fontSize: 15, fontWeight: "700", color: "#000040" },
});
