import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import Cube3D, { parseMove } from "@/components/cube/Cube3D";
import {
  solveFromScramble,
  getScrambledState,
  isSolverReady,
  initSolver,
} from "@/lib/solver";
import { useTheme } from "@/lib/theme";
import type { CubeState } from "@/types/cube";

// ── Demo scramble ─────────────────────────────────────────────────────────────
// A well-known 14-move scramble that touches all 6 faces visibly
const DEMO_SCRAMBLE = "R U R' U' R' F R2 U' R' U' R U R' F'";

// ── Move face colors (cube-specific, not theme tokens) ────────────────────────
const MOVE_FACE_COLOR: Record<string, string> = {
  R: "#B71234",
  L: "#FF5800",
  U: "#EEEEEE",
  D: "#FFD500",
  F: "#009B48",
  B: "#0046AD",
};

function getMoveColor(move: string) {
  return MOVE_FACE_COLOR[move[0]] ?? "#888888";
}

// ── Shadow helper ─────────────────────────────────────────────────────────────
const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  android: { elevation: 4 },
  default: {},
}) as object;

// ── TutorialScreen ────────────────────────────────────────────────────────────

export default function TutorialScreen() {
  const t = useTheme();

  // ── State ────────────────────────────────────────────────────────────────────
  const [scrambledState, setScrambledState] = useState<CubeState | null>(null);
  const [moves, setMoves]           = useState<string[]>([]);
  const [step, setStep]             = useState(-1);
  const [playing, setPlaying]       = useState(false);
  const [activeMove, setActiveMove] = useState<ReturnType<typeof parseMove> | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cubeKey, setCubeKey]       = useState(0);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Refs to avoid stale closures inside handleMoveComplete
  const playingRef = useRef(false);
  const stepRef    = useRef(-1);
  const movesRef   = useRef<string[]>([]);

  playingRef.current = playing;
  stepRef.current    = step;
  movesRef.current   = moves;

  const STEP_DELAY = 900; // ms between auto-play moves

  // ── Init: compute scramble + solution on mount ────────────────────────────────
  useEffect(() => {
    let attempts = 0;
    const setup = () => {
      try {
        if (!isSolverReady()) initSolver();
        const state = getScrambledState(DEMO_SCRAMBLE);
        const sol   = solveFromScramble(DEMO_SCRAMBLE);
        setScrambledState(state);
        setMoves(sol);
        movesRef.current = sol;
        setLoading(false);
      } catch {
        attempts++;
        if (attempts < 20) {
          setTimeout(setup, 300);
        } else {
          setError("Solver failed to initialize. Please restart the app.");
          setLoading(false);
        }
      }
    };
    setup();
  }, []);

  // ── Animation callback ────────────────────────────────────────────────────────
  const handleMoveComplete = () => {
    setIsAnimating(false);
    setActiveMove(null);

    const currentStep  = stepRef.current;
    const currentMoves = movesRef.current;

    if (playingRef.current && currentStep < currentMoves.length - 1) {
      // Auto-advance to next step
      setTimeout(() => {
        if (!playingRef.current) return; // user may have paused
        const nextStep = currentStep + 1;
        setStep(nextStep);
        setIsAnimating(true);
        setActiveMove(parseMove(currentMoves[nextStep]));
      }, STEP_DELAY);
    } else if (playingRef.current && currentStep >= currentMoves.length - 1) {
      // Finished all moves
      setPlaying(false);
    }
  };

  // ── Controls ──────────────────────────────────────────────────────────────────
  const handlePlay = () => {
    if (solved) {
      handleReset();
      return;
    }
    if (isAnimating) return;
    setPlaying(true);
    const startStep = step >= 0 ? step + 1 : 0;
    if (startStep >= moves.length) return;
    setStep(startStep);
    setIsAnimating(true);
    setActiveMove(parseMove(moves[startStep]));
  };

  const handlePause = () => {
    setPlaying(false);
  };

  const handleNext = () => {
    if (isAnimating || step >= moves.length - 1) return;
    setPlaying(false);
    const nextStep = step + 1;
    setStep(nextStep);
    setIsAnimating(true);
    setActiveMove(parseMove(moves[nextStep]));
  };

  const handlePrev = () => {
    if (isAnimating || step < 0) return;
    setPlaying(false);
    setIsAnimating(true);
    setActiveMove(parseMove(moves[step], true)); // undo last applied move
    setStep((s) => s - 1);
  };

  const handleReset = () => {
    setPlaying(false);
    setActiveMove(null);
    setIsAnimating(false);
    setStep(-1);
    setCubeKey((k) => k + 1); // remount Cube3D → resets sticker positions to scrambled state
  };

  // ── Derived values ────────────────────────────────────────────────────────────
  const solved  = moves.length > 0 && step >= moves.length - 1;
  const pct     = moves.length > 0 && step >= 0
    ? Math.round(((step + 1) / moves.length) * 100)
    : 0;

  // ── Loading / Error ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.BG }]}>
        <View style={s.center}>
          <ActivityIndicator color={t.ACCENT} size="large" />
          <Text style={[s.loadingTxt, { color: t.MUTED }]}>Initializing solver…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !scrambledState) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: t.BG }]}>
        <View style={s.center}>
          <Ionicons name="warning-outline" size={40} color={t.RED} />
          <Text style={[s.errorTxt, { color: t.RED }]}>{error ?? "Unknown error"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.BG }]} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── WHAT IS KOCIEMBA ──────────────────────────────────────────── */}
        <View style={[s.infoCard, shadow, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
          <View style={s.infoHeader}>
            <View style={[s.iconBadge, { backgroundColor: t.ACCENT + "22" }]}>
              <Ionicons name="bulb-outline" size={20} color={t.ACCENT} />
            </View>
            <Text style={[s.infoTitle, { color: t.ACCENT }]}>Kociemba Algorithm</Text>
          </View>
          <Text style={[s.infoBody, { color: t.MUTED }]}>
            A two-phase algorithm that solves any Rubik's Cube in{" "}
            <Text style={{ color: t.TEXT, fontWeight: "700" }}>20 moves or fewer</Text>.
          </Text>
          <View style={[s.phaseDivider, { backgroundColor: t.BORDER }]} />
          <View style={s.phaseRow}>
            <View style={[s.phaseBadge, { backgroundColor: t.ACCENT + "22" }]}>
              <Text style={[s.phaseNum, { color: t.ACCENT }]}>1</Text>
            </View>
            <Text style={[s.phaseDesc, { color: t.MUTED }]}>
              Reduce the cube into a smaller subgroup (U, D, F2, B2, L2, R2 only)
            </Text>
          </View>
          <View style={s.phaseRow}>
            <View style={[s.phaseBadge, { backgroundColor: t.GREEN + "33" }]}>
              <Text style={[s.phaseNum, { color: t.GREEN }]}>2</Text>
            </View>
            <Text style={[s.phaseDesc, { color: t.MUTED }]}>
              Optimally solve within that subgroup using pattern databases
            </Text>
          </View>
        </View>

        {/* ── SCRAMBLE LABEL ────────────────────────────────────────────── */}
        <View style={[s.scrambleCard, shadow, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
          <Text style={[s.sectionLabel, { color: t.MUTED }]}>PRESET SCRAMBLE</Text>
          <Text style={[s.scrambleTxt, { color: t.TEXT }]}>{DEMO_SCRAMBLE}</Text>
          <Text style={[s.scrambleSub, { color: t.MUTED }]}>
            {moves.length} moves to solve · Kociemba optimal
          </Text>
        </View>

        {/* ── 3D CUBE ───────────────────────────────────────────────────── */}
        <View style={[s.cubeCard, shadow, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
          <Cube3D
            key={cubeKey}
            cubeState={scrambledState}
            height={240}
            currentMove={activeMove}
            onMoveComplete={handleMoveComplete}
            animationSpeed={3.0}
            autoRotate={false}
          />

          {/* Status strip */}
          <View style={[s.cubeStrip, { borderTopColor: t.BORDER }]}>
            <View style={[s.stripDot, {
              backgroundColor: solved ? t.GREEN : step >= 0 ? t.ACCENT : t.MUTED,
            }]} />
            <Text style={[s.stripTxt, { color: t.MUTED }]}>
              {solved
                ? "SOLVED ✓"
                : step >= 0
                ? `Step ${step + 1} of ${moves.length}`
                : "Scrambled — press Play"}
            </Text>
            {step >= 0 && !solved && (
              <Text style={[s.stripPct, { color: t.ACCENT }]}>{pct}%</Text>
            )}
          </View>

          {/* Progress bar */}
          <View style={[s.progressTrack, { backgroundColor: t.BORDER }]}>
            <View
              style={[
                s.progressFill,
                {
                  width: `${pct}%` as any,
                  backgroundColor: solved ? t.GREEN : t.ACCENT,
                },
              ]}
            />
          </View>
        </View>

        {/* ── PLAYBACK CONTROLS ─────────────────────────────────────────── */}
        <View style={[s.controls, shadow, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
          {/* Prev */}
          <Pressable
            onPress={handlePrev}
            disabled={isAnimating || step < 0}
            style={[
              s.ctrlBtn,
              { backgroundColor: t.CARD_ALT, borderColor: t.BORDER },
              (isAnimating || step < 0) && { opacity: 0.35 },
            ]}
          >
            <Ionicons name="play-skip-back-outline" size={20} color={t.TEXT} />
          </Pressable>

          {/* Play / Pause / Replay */}
          <Pressable
            onPress={playing ? handlePause : handlePlay}
            style={[
              s.playBtn,
              { backgroundColor: solved ? t.GREEN : t.ACCENT },
            ]}
          >
            <Ionicons
              name={
                playing
                  ? "pause"
                  : solved
                  ? "refresh-outline"
                  : "play"
              }
              size={28}
              color="#000040"
            />
          </Pressable>

          {/* Next */}
          <Pressable
            onPress={handleNext}
            disabled={isAnimating || step >= moves.length - 1}
            style={[
              s.ctrlBtn,
              { backgroundColor: t.CARD_ALT, borderColor: t.BORDER },
              (isAnimating || step >= moves.length - 1) && { opacity: 0.35 },
            ]}
          >
            <Ionicons name="play-skip-forward-outline" size={20} color={t.TEXT} />
          </Pressable>
        </View>

        {/* Reset */}
        <Pressable
          onPress={handleReset}
          style={[s.resetBtn, { borderColor: t.BORDER }]}
        >
          <Ionicons name="refresh-outline" size={14} color={t.MUTED} />
          <Text style={[s.resetTxt, { color: t.MUTED }]}>Reset to scrambled</Text>
        </Pressable>

        {/* ── SOLUTION STEPS ────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: t.MUTED, marginTop: 24 }]}>
          SOLUTION — {moves.length} MOVES
        </Text>
        <View style={s.movesWrap}>
          {moves.map((move, i) => {
            const isActive  = i === step;
            const isDone    = i < step;
            const faceColor = getMoveColor(move);
            return (
              <View
                key={i}
                style={[
                  s.moveChip,
                  {
                    backgroundColor: isActive
                      ? faceColor
                      : isDone
                      ? t.CARD_ALT
                      : t.CARD,
                    borderColor: isActive
                      ? faceColor
                      : t.BORDER,
                    opacity: !isDone && !isActive && step >= 0 ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={[
                  s.moveChipNum,
                  { color: isActive ? "rgba(0,0,64,0.6)" : t.MUTED },
                ]}>
                  {i + 1}
                </Text>
                <Text style={[
                  s.moveChipTxt,
                  {
                    color: isActive ? "#000040" : isDone ? t.MUTED : t.TEXT,
                    fontWeight: isActive ? "700" : isDone ? "400" : "600",
                  },
                ]}>
                  {move}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ── NOTATION GUIDE ────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: t.MUTED, marginTop: 24 }]}>
          NOTATION GUIDE
        </Text>
        <View style={[s.notationCard, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
          {[
            { sym: "R",  desc: "Right face — clockwise" },
            { sym: "R'", desc: "Right face — counter-clockwise" },
            { sym: "R2", desc: "Right face — 180°" },
            { sym: "U",  desc: "Upper face — clockwise" },
            { sym: "F",  desc: "Front face — clockwise" },
          ].map((item, i, arr) => (
            <React.Fragment key={item.sym}>
              <View style={s.notationRow}>
                <View style={[s.notationBadge, { backgroundColor: getMoveColor(item.sym) + "33" }]}>
                  <Text style={[s.notationSym, { color: getMoveColor(item.sym) }]}>
                    {item.sym}
                  </Text>
                </View>
                <Text style={[s.notationDesc, { color: t.MUTED }]}>{item.desc}</Text>
              </View>
              {i < arr.length - 1 && (
                <View style={[s.rowDivider, { backgroundColor: t.BORDER }]} />
              )}
            </React.Fragment>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 100 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  loadingTxt: { fontSize: 14 },
  errorTxt:   { fontSize: 14, textAlign: "center", marginTop: 8 },

  // Info card
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
    gap: 10,
  },
  infoHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: { fontSize: 17, fontWeight: "700" },
  infoBody:  { fontSize: 13, lineHeight: 20 },
  phaseDivider: { height: 1, marginVertical: 4 },
  phaseRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  phaseBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  phaseNum:  { fontSize: 13, fontWeight: "800" },
  phaseDesc: { fontSize: 13, lineHeight: 19, flex: 1 },

  // Scramble card
  scrambleCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 6,
  },
  scrambleTxt: {
    fontSize: 15,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    letterSpacing: 1,
  },
  scrambleSub: { fontSize: 12 },

  // 3D Cube card
  cubeCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 14,
  },
  cubeStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  stripDot: { width: 8, height: 8, borderRadius: 4 },
  stripTxt: { fontSize: 13, flex: 1 },
  stripPct: { fontSize: 13, fontWeight: "700" },

  // Progress bar
  progressTrack: { height: 3 },
  progressFill:  { height: 3 },

  // Controls
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 20,
    marginBottom: 10,
  },
  ctrlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  // Reset
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    marginBottom: 4,
    gap: 6,
  },
  resetTxt: { fontSize: 13, fontWeight: "600" },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },

  // Move chips
  movesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  moveChip: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 44,
  },
  moveChipNum: { fontSize: 9, fontWeight: "600", marginBottom: 1 },
  moveChipTxt: { fontSize: 14 },

  // Notation guide
  notationCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  notationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  notationBadge: {
    width: 40,
    height: 32,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  notationSym:  { fontSize: 14, fontWeight: "700" },
  notationDesc: { fontSize: 13, flex: 1 },
  rowDivider:   { height: 1, marginHorizontal: 16 },
});
