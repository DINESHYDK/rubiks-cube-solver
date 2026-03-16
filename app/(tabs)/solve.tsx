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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Cube3D, { parseMove } from "@/components/cube/Cube3D";
import {
  solveFromScramble,
  generateScramble,
  solveCubeState,
  getIntermediateStates,
  getScrambledState,
} from "@/lib/solver";
import type { CubeState } from "@/types/cube";
import { useCubeStore } from "@/stores/cubeStore";
import { SOLVED_STATE } from "@/lib/constants";
import { Alert } from 'react-native';
import { saveSolve } from "@/lib/api";
import {
  BG, CARD, CARD_ALT, BORDER,
  TEXT, MUTED, BLUE, GREEN, RED, ORANGE, YELLOW,
} from "@/lib/theme";

// ── Move Notation Data ─────────────────────────────────────────────────
const MOVE_NOTATION = [
  { face: "R", color: RED,    label: "Right",  cw: "R",  ccw: "R'" },
  { face: "L", color: ORANGE, label: "Left",   cw: "L",  ccw: "L'" },
  { face: "U", color: "#EEE", label: "Top",    cw: "U",  ccw: "U'" },
  { face: "D", color: YELLOW, label: "Bottom", cw: "D",  ccw: "D'" },
  { face: "F", color: GREEN,  label: "Front",  cw: "F",  ccw: "F'" },
  { face: "B", color: BLUE,   label: "Back",   cw: "B",  ccw: "B'" },
];

export default function SolveScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isWide = Platform.OS === "web" && windowWidth >= 768;
  const { cubeState, resetCube } = useCubeStore();

  // ── State ──────────────────────────────────────────────────────────
  const [scramble, setScramble] = useState("");
  const [moves, setMoves] = useState<string[]>([]);
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [solving, setSolving] = useState(false);
  const [ticks, setTicks] = useState(0);
  const [fromScan, setFromScan] = useState(false);
  const [cubeSnapshots, setCubeSnapshots] = useState<CubeState[]>([]);
  const [activeMove, setActiveMove] = useState<any>(null);
  const startTimeRef = useRef<number>(0);
  const savedRef = useRef(false);
  const lastSolvedStateRef = useRef<string>("");

  // New: playback mode & delay
  const [playbackMode, setPlaybackMode] = useState<"auto" | "manual">("auto");
  const [stepDelay, setStepDelay] = useState(2500);

  // ── Elapsed timer ────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTicks((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [playing]);

  // ── Auto-solve scanned cube ──────────────────────────────────────
  useEffect(() => {
    const stateKey = JSON.stringify(cubeState);
    const isSolved = stateKey === JSON.stringify(SOLVED_STATE);
    // Skip if already solved, or if we already solved this exact state
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

  // ── Handlers ──────────────────────────────────────────────────────
  const handleNewScramble = () => {
    resetCube();
    setFromScan(false);
    const newScramble = generateScramble(20);
    setScramble(newScramble);
    setMoves([]);
    setCubeSnapshots([getScrambledState(newScramble)]);
    setStep(-1);
    setPlaying(false);
    setTicks(0);
  };

  const handleSolve = async () => {
    if (!scramble) {
      handleNewScramble();
      return;
    }
    setSolving(true);
    try {
      let sol: string[];
      if (fromScan) {
        sol = solveCubeState(cubeState);
        setCubeSnapshots([cubeState]);
      } else {
        sol = solveFromScramble(scramble);
        setCubeSnapshots(getIntermediateStates(scramble, sol));
      }
      setMoves(sol);
      setStep(-1);
      setTicks(0);
      setPlaying(false);
    } catch (e) {
      console.error("[solve] failed:", e);
    } finally {
      setSolving(false);
    }
  };

  const handleExecuteMove = (notation: string, isUndo = false) => {
    const physicsMove = parseMove(notation, isUndo);
    setActiveMove(physicsMove);
  };

  const handleMoveComplete = () => {
    setActiveMove(null);
    if (playing && step < moves.length - 1) {
      const delay = playbackMode === "auto" ? stepDelay : 100;
      setTimeout(() => {
        const nextStep = step + 1;
        setStep(nextStep);
        handleExecuteMove(moves[nextStep]);
      }, delay);
    } else if (playing && step >= moves.length - 1) {
      setPlaying(false);
    }
  };

  const handlePlay = () => {
    if (step >= moves.length - 1) {
      setStep(-1);
      savedRef.current = false;
    }
    startTimeRef.current = Date.now();
    setPlaying(true);
    const startStep = step >= moves.length - 1 ? 0 : step + 1;
    setStep(startStep);
    if (moves.length > 0) {
      handleExecuteMove(moves[startStep]);
    }
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

  const pct =
    moves.length > 0 && step >= 0
      ? Math.round(((step + 1) / moves.length) * 100)
      : 0;
  const elapsed = `${Math.floor(ticks / 10)}.${ticks % 10}s`;
  const solved = moves.length > 0 && step >= moves.length - 1;

  const status = solved
    ? "SOLVED"
    : playing
      ? "SOLVING"
      : moves.length > 0
        ? "SCRAMBLED"
        : "READY";

  // ── Auto-save ────────────────────────────────────────────────────
  useEffect(() => {
    if (!solved || savedRef.current || !scramble) return;
    savedRef.current = true;
    const solveTimeMs = startTimeRef.current
      ? Date.now() - startTimeRef.current
      : undefined;
    saveSolve({
      scramble,
      solution: moves as any,
      moveCount: moves.length,
      solveTimeMs,
    }).catch(() => {});
  }, [solved, scramble, moves]);

  // ── Subcomponents ─────────────────────────────────────────────────

  const StatsRow = () => (
    <View style={s.statsRow}>
      <View style={s.statBox}>
        <Text style={s.statVal}>
          {moves.length > 0 ? String(moves.length) : "0"}
        </Text>
        <Text style={s.statLbl}>MOVES</Text>
      </View>
      <View style={s.statBox}>
        <Text style={s.statVal}>
          {moves.length > 0 && step >= 0
            ? `${step + 1}/${moves.length}`
            : "0/0"}
        </Text>
        <Text style={s.statLbl}>STEP</Text>
      </View>
      <View
        style={[
          s.statBox,
          {
            backgroundColor:
              status === "SOLVED"
                ? GREEN
                : status === "SOLVING"
                  ? BLUE
                  : CARD,
          },
        ]}
      >
        <Text
          style={[
            s.statVal,
            { fontSize: 13 },
            (status === "SOLVED" || status === "SOLVING") && { color: "#fff" },
          ]}
        >
          {status}
        </Text>
        <Text
          style={[
            s.statLbl,
            (status === "SOLVED" || status === "SOLVING") && {
              color: "rgba(255,255,255,0.7)",
            },
          ]}
        >
          STATUS
        </Text>
      </View>
    </View>
  );

  const CurrentMoveDisplay = () => (
    <View style={s.section}>
      <Text style={s.sectionLabel}>CURRENT MOVE</Text>
      <Text style={[s.monoText, { color: MUTED }]}>
        {playing && step >= 0 && step < moves.length
          ? moves[step]
          : moves.length > 0 && step >= 0
            ? moves[step]
            : "Press Scramble to begin..."}
      </Text>
    </View>
  );

  const PlaybackControls = () => (
    <View style={s.section}>
      <Text style={s.sectionLabel}>PLAYBACK CONTROLS</Text>

      {/* Mode Toggle */}
      <View style={s.modeRow}>
        <Text style={s.modeLabel}>Mode</Text>
        <View style={s.modeToggle}>
          <Pressable
            style={[
              s.modePill,
              playbackMode === "auto" && s.modePillActive,
            ]}
            onPress={() => setPlaybackMode("auto")}
          >
            <Text
              style={[
                s.modePillTxt,
                playbackMode === "auto" && s.modePillTxtActive,
              ]}
            >
              Auto
            </Text>
          </Pressable>
          <Pressable
            style={[
              s.modePill,
              playbackMode === "manual" && s.modePillActive,
            ]}
            onPress={() => setPlaybackMode("manual")}
          >
            <Text
              style={[
                s.modePillTxt,
                playbackMode === "manual" && s.modePillTxtActive,
              ]}
            >
              Manual
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Step Delay (auto only) */}
      {playbackMode === "auto" && (
        <View style={s.delayRow}>
          <Text style={s.delayLabel}>Step Delay</Text>
          <Text style={s.delayValue}>{stepDelay} ms</Text>
        </View>
      )}
      {playbackMode === "auto" && Platform.OS === "web" && (
        <View style={s.sliderWrap}>
          <input
            type="range"
            min={100}
            max={2500}
            step={100}
            value={stepDelay}
            onChange={(e: any) => setStepDelay(Number(e.target.value))}
            style={{
              width: "100%",
              accentColor: BLUE,
              height: 4,
              cursor: "pointer",
            }}
          />
          <View style={s.sliderLabels}>
            <Text style={s.sliderLblTxt}>100 ms — Fast</Text>
            <Text style={s.sliderLblTxt}>Slow — 2500 ms</Text>
          </View>
        </View>
      )}
      {playbackMode === "auto" && Platform.OS !== "web" && (
        <View style={s.nativeDelayRow}>
          <Pressable
            style={s.delayBtn}
            onPress={() => setStepDelay((d) => Math.max(100, d - 200))}
          >
            <Text style={s.delayBtnTxt}>−</Text>
          </Pressable>
          <Text style={s.delayValue}>{stepDelay} ms</Text>
          <Pressable
            style={s.delayBtn}
            onPress={() => setStepDelay((d) => Math.min(2500, d + 200))}
          >
            <Text style={s.delayBtnTxt}>+</Text>
          </Pressable>
        </View>
      )}

      {/* Prev / Play / Next */}
      <View style={s.transportRow}>
        <Pressable
          style={[s.transportBtn, step < 0 && s.transportBtnDisabled]}
          onPress={handlePrev}
          disabled={step < 0}
        >
          <Text style={s.transportIcon}>←</Text>
          <Text style={s.transportTxt}>Prev</Text>
        </Pressable>
        <Pressable
          style={[s.transportBtn, s.playBtn]}
          onPress={playing ? handlePause : handlePlay}
          disabled={moves.length === 0}
        >
          {solving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.playBtnTxt}>
              {playing ? "⏸ Pause" : "▶ Play"}
            </Text>
          )}
        </Pressable>
        <Pressable
          style={[
            s.transportBtn,
            step >= moves.length - 1 && s.transportBtnDisabled,
          ]}
          onPress={handleNext}
          disabled={step >= moves.length - 1}
        >
          <Text style={s.transportTxt}>Next</Text>
          <Text style={s.transportIcon}>→</Text>
        </Pressable>
      </View>
    </View>
  );

  const AlgorithmSequence = () => {
    if (moves.length === 0) return null;
    return (
      <View style={s.section}>
        <Text style={s.sectionLabel}>ALGORITHM SEQUENCE</Text>
        <View style={s.chips}>
          {moves.map((m, i) => (
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
                s.chip,
                i === step && s.chipActive,
                i < step && s.chipDone,
              ]}
            >
              <Text
                style={[s.chipTxt, i === step && s.chipActiveTxt]}
              >
                {m}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  const MoveNotationGuide = () => (
    <View style={s.section}>
      <View style={s.notationHeader}>
        <Text style={s.sectionLabel}>MOVE NOTATION GUIDE</Text>
      </View>
      <View style={s.notationGrid}>
        {MOVE_NOTATION.map((n) => (
          <View key={n.face} style={s.notationRow}>
            <View style={s.notationCell}>
              <View style={[s.faceDot, { backgroundColor: n.color }]} />
              <Text style={s.notationFace}>{n.cw}</Text>
              <Text style={s.notationDesc}>{n.label}</Text>
              <Text style={s.notationDir}>Clockwise ↻</Text>
            </View>
            <View style={s.notationCell}>
              <View style={[s.faceDot, { backgroundColor: n.color }]} />
              <Text style={s.notationFace}>{n.ccw}</Text>
              <Text style={s.notationDesc}>{n.label}</Text>
              <Text style={s.notationDir}>Counter CW ↺</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const ActionButtons = () => (
    <View style={s.actionRow}>
      <Pressable style={s.scrambleBtn} onPress={handleNewScramble}>
        <Text style={s.scrambleBtnTxt}>Scramble</Text>
      </Pressable>
      <Pressable
        style={s.solveBtn}
        onPress={handleSolve}
        disabled={solving}
      >
        {solving ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={s.solveBtnTxt}>Solve</Text>
        )}
      </Pressable>
    </View>
  );

  // ── WIDE (Web) Layout ────────────────────────────────────────────
  if (isWide) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.wideContainer}>
          {/* LEFT: 3D Cube */}
          <View style={s.cubePanel}>
            <Cube3D
              height={Math.min(windowWidth * 0.55, 650)}
              currentMove={activeMove}
              onMoveComplete={handleMoveComplete}
              animationSpeed={3.0}
            />
            <View style={s.cubeHints}>
              <View style={s.hintItem}>
                <View style={s.hintDot} />
                <Text style={s.hintTxt}>Drag to rotate</Text>
              </View>
              <View style={s.hintItem}>
                <View style={s.hintDot} />
                <Text style={s.hintTxt}>Scroll to zoom</Text>
              </View>
            </View>
          </View>

          {/* RIGHT: Controls Panel */}
          <View style={s.controlPanel}>
            <ScrollView
              contentContainerStyle={s.controlScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={s.panelHeader}>
                <Text style={s.panelTitle}>3D Solver</Text>
                <Text style={s.panelSubtitle}>
                  Step-by-step interactive visualization
                </Text>
              </View>

              <StatsRow />
              <CurrentMoveDisplay />
              <PlaybackControls />
              <AlgorithmSequence />
              <MoveNotationGuide />
              <ActionButtons />
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── NARROW (Mobile) Layout ───────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} bounces={false}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>3D Solver</Text>
          <Text style={s.subtitle}>
            Step-by-step interactive visualization
          </Text>
        </View>

        {/* Cube Card */}
        <View style={s.cubeCard}>
          <Cube3D
            height={260}
            currentMove={activeMove}
            onMoveComplete={handleMoveComplete}
            animationSpeed={3.0}
          />
          <View style={s.cubeFooter}>
            <View style={s.badgeRow}>
              <View
                style={[
                  s.dot,
                  {
                    backgroundColor: solved
                      ? GREEN
                      : moves.length > 0
                        ? BLUE
                        : GREEN,
                  },
                ]}
              />
              <Text style={s.badgeText}>
                {solved
                  ? "SOLVED"
                  : moves.length > 0
                    ? `${moves.length} MOVES`
                    : "SOLVED STATE"}
              </Text>
            </View>
            {moves.length > 0 && step >= 0 && (
              <Text style={s.stepText}>
                {step + 1} / {moves.length}
              </Text>
            )}
          </View>
          {moves.length > 0 && (
            <View style={s.progressBar}>
              <View
                style={[s.progressFill, { width: `${pct}%` as any }]}
              />
            </View>
          )}
        </View>

        <StatsRow />
        <CurrentMoveDisplay />
        <PlaybackControls />
        <AlgorithmSequence />
        <MoveNotationGuide />
        <ActionButtons />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 48 },

  // ── Wide Layout ──────────────────────────────────
  wideContainer: {
    flex: 1,
    flexDirection: "row",
    width: "100%",
  },
  cubePanel: {
    width: "65%",
    backgroundColor: BG,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  cubeHints: {
    flexDirection: "row",
    gap: 24,
    marginTop: 16,
  },
  hintItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  hintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MUTED,
  },
  hintTxt: { fontSize: 12, color: MUTED },
  controlPanel: {
    width: "35%",
    backgroundColor: CARD,
    borderLeftWidth: 1,
    borderLeftColor: BORDER,
  },
  controlScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  panelHeader: { marginBottom: 18 },
  panelTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 4,
  },
  panelSubtitle: { fontSize: 12, color: MUTED },

  // ── Mobile Header ────────────────────────────────
  header: { marginBottom: 18 },
  title: { fontSize: 28, fontWeight: "700", color: TEXT, marginBottom: 4 },
  subtitle: { fontSize: 13, color: MUTED },

  // ── Cube Card (mobile) ───────────────────────────
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

  // ── Stats Row ───────────────────────────────────
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  statVal: { fontSize: 18, fontWeight: "700", color: TEXT },
  statLbl: {
    fontSize: 10,
    color: MUTED,
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // ── Section (generic card) ──────────────────────
  section: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: MUTED,
    letterSpacing: 1,
    marginBottom: 10,
  },
  monoText: {
    fontSize: 13,
    color: TEXT,
    fontFamily: "SpaceMono",
    lineHeight: 20,
  },

  // ── Mode Toggle ─────────────────────────────────
  modeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modeLabel: { fontSize: 13, color: TEXT },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: CARD_ALT,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: "hidden",
  },
  modePill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  modePillActive: {
    backgroundColor: BLUE,
  },
  modePillTxt: { fontSize: 12, fontWeight: "600", color: MUTED },
  modePillTxtActive: { color: "#fff" },

  // ── Step Delay ──────────────────────────────────
  delayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  delayLabel: { fontSize: 13, color: TEXT },
  delayValue: {
    fontSize: 13,
    fontWeight: "700",
    color: BLUE,
    backgroundColor: CARD_ALT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  sliderWrap: { marginBottom: 12 },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sliderLblTxt: { fontSize: 10, color: MUTED },

  // ── Native Delay Controls ───────────────────────
  nativeDelayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 12,
  },
  delayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CARD_ALT,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  delayBtnTxt: { fontSize: 18, fontWeight: "700", color: TEXT },

  // ── Transport Controls ──────────────────────────
  transportRow: {
    flexDirection: "row",
    gap: 8,
  },
  transportBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: CARD_ALT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  transportBtnDisabled: { opacity: 0.35 },
  transportIcon: { fontSize: 14, color: TEXT },
  transportTxt: { fontSize: 13, fontWeight: "600", color: TEXT },
  playBtn: {
    flex: 1.5,
    backgroundColor: BLUE,
    borderColor: BLUE,
  },
  playBtnTxt: { fontSize: 14, fontWeight: "700", color: "#fff" },

  // ── Algorithm Chips ─────────────────────────────
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: CARD_ALT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipActive: { backgroundColor: BLUE, borderColor: BLUE },
  chipDone: { opacity: 0.3 },
  chipTxt: { fontSize: 12, color: TEXT, fontFamily: "SpaceMono" },
  chipActiveTxt: { color: "#fff", fontWeight: "700" },

  // ── Move Notation Guide ─────────────────────────
  notationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notationGrid: { gap: 6 },
  notationRow: {
    flexDirection: "row",
    gap: 6,
  },
  notationCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: CARD_ALT,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  faceDot: { width: 10, height: 10, borderRadius: 5 },
  notationFace: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT,
    fontFamily: "SpaceMono",
    width: 22,
  },
  notationDesc: { fontSize: 11, color: TEXT, flex: 1 },
  notationDir: { fontSize: 10, color: MUTED },

  // ── Action Buttons ──────────────────────────────
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  scrambleBtn: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  scrambleBtnTxt: { fontSize: 14, fontWeight: "600", color: TEXT },
  solveBtn: {
    flex: 1,
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  solveBtnTxt: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
