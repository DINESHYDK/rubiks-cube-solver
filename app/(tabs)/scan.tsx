import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

import CameraViewComponent from "@/components/camera/CameraView";
import CubeNet from "@/components/cube/CubeNet";
import OrientationGuide from "@/components/cube/OrientationGuide";
import type { CubeColor, CubeState, FaceName, FaceState } from "@/types/cube";
import { SCAN_ORDER, FACE_LABELS, CUBE_COLORS, SOLVED_STATE } from "@/lib/constants";
import { detectCubeColors } from "@/lib/detectFromImage";
import { validateCubeState } from "@/lib/cubeState";
import { useCubeStore } from "@/stores/cubeStore";
import { useTheme } from "@/lib/theme";

// ── Types & module constants ──────────────────────────────────────────────────

type Phase = "idle" | "orientation" | "camera" | "review" | "validate" | "manual";

const ALL_COLORS: CubeColor[] = ["white", "red", "green", "yellow", "orange", "blue"];

const SCAN_INSTRUCTIONS: Record<FaceName, string> = {
  U: "Hold White face toward camera · Green face on top",
  F: "Hold Green face toward camera · White face on top",
  R: "Hold Red face toward camera · White face on top",
  B: "Hold Blue face toward camera · White face on top",
  L: "Hold Orange face toward camera · White face on top",
  D: "Hold Yellow face toward camera · Green face on top",
};

const FACE_HEX: Record<FaceName, string> = {
  U: "#EEEEEE",
  R: "#B71234",
  F: "#009B48",
  D: "#FFD500",
  L: "#FF5800",
  B: "#0046AD",
};

const shadow = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
  android: { elevation: 4 },
  default: {},
}) as object;

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
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return (
    <Pressable
      onPressIn={() => {
        scale.value   = withTiming(0.95, { duration: 120 });
        opacity.value = withTiming(0.8,  { duration: 120 });
      }}
      onPressOut={() => {
        scale.value   = withTiming(1, { duration: 120 });
        opacity.value = withTiming(1, { duration: 120 });
      }}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={[style, animStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

// ── ColorCell ─────────────────────────────────────────────────────────────────

function ColorCell({ color, onPress }: { color: CubeColor; onPress: () => void }) {
  const scale     = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => { scale.value = withTiming(0.92, { duration: 80 }); }}
      onPressOut={() => { scale.value = withTiming(1,    { duration: 80 }); }}
      onPress={onPress}
    >
      <Animated.View
        style={[s.colorCell, { backgroundColor: CUBE_COLORS[color] }, animStyle]}
      />
    </Pressable>
  );
}

// ── FacePills ─────────────────────────────────────────────────────────────────

function FacePills({
  faceIdx,
  scanned,
}: {
  faceIdx: number;
  scanned: Partial<Record<FaceName, CubeColor[]>>;
}) {
  const t = useTheme();
  return (
    <View style={s.faceRow}>
      {SCAN_ORDER.map((face, i) => {
        const isDone    = !!scanned[face];
        const isCurrent = i === faceIdx;
        return (
          <View
            key={face}
            style={[
              s.facePill,
              {
                borderColor: isCurrent || isDone ? FACE_HEX[face] : t.BORDER,
                backgroundColor: isDone ? FACE_HEX[face] : "transparent",
              },
            ]}
          >
            <Text style={[s.facePillTxt, { color: isDone ? "#111" : t.TEXT }]}>{face}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── PDFStrip ──────────────────────────────────────────────────────────────────

function PDFStrip({
  scanned,
  photos,
  reviewingIdx,
  problemFace,
  onTap,
}: {
  scanned: Partial<Record<FaceName, CubeColor[]>>;
  photos: Partial<Record<FaceName, string>>;
  reviewingIdx: number;
  problemFace: FaceName | null;
  onTap: (fi: number) => void;
}) {
  const t = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.stripContent}
    >
      {SCAN_ORDER.map((face, fi) => {
        const isDone    = !!scanned[face];
        const isCurrent = fi === reviewingIdx;
        const isProblem = face === problemFace;
        const photoUri  = photos[face];
        return (
          <Pressable
            key={face}
            onPress={() => { if (isDone) onTap(fi); }}
            style={[
              s.stripSlot,
              {
                backgroundColor: t.CARD,
                borderColor: isProblem ? t.RED : isCurrent ? t.ACCENT : t.BORDER,
                borderWidth: isCurrent || isProblem ? 2 : 1,
              },
            ]}
          >
            {isDone && photoUri ? (
              <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: isDone ? FACE_HEX[face] : t.CARD_ALT },
                ]}
              />
            )}
            <Text style={s.stripLabel}>{face}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── ScanScreen ────────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const t               = useTheme();
  const { width }       = useWindowDimensions();
  const CAM_SIZE        = Math.min(width - 40, 320);
  const router          = useRouter();
  const { setCubeState } = useCubeStore();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase,        setPhase]        = useState<Phase>("idle");
  const [faceIdx,      setFaceIdx]      = useState(0);
  const [reviewingIdx, setReviewingIdx] = useState(0);
  const [detected,     setDetected]     = useState<CubeColor[]>(Array(9).fill("white"));
  const [scanned,      setScanned]      = useState<Partial<Record<FaceName, CubeColor[]>>>({});
  const [photos,       setPhotos]       = useState<Partial<Record<FaceName, string>>>({});
  const [isCapturing,  setIsCapturing]  = useState(false);
  const [valErrors,    setValErrors]    = useState<string[]>([]);
  const [problemFace,  setProblemFace]  = useState<FaceName | null>(null);
  const [manualState,  setManualState]  = useState<CubeState>(JSON.parse(JSON.stringify(SOLVED_STATE)));
  const [manualError,  setManualError]  = useState("");

  const currentFace   = SCAN_ORDER[faceIdx];
  const reviewingFace = SCAN_ORDER[reviewingIdx];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const cycleColor = (idx: number) => {
    setDetected((prev) => {
      const next = [...prev];
      const ci   = ALL_COLORS.indexOf(next[idx]);
      next[idx]  = ALL_COLORS[(ci + 1) % ALL_COLORS.length];
      return next;
    });
  };

  const handleStart = async () => {
    if (!permission?.granted) await requestPermission();
    setFaceIdx(0);
    setReviewingIdx(0);
    setScanned({});
    setPhotos({});
    setDetected(Array(9).fill("white"));
    setValErrors([]);
    setProblemFace(null);
    setPhase("orientation");
  };

  const handleOrientationReady = () => {
    setReviewingIdx(faceIdx);
    setPhase("camera");
  };

  const handleCapture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (!photo) { setIsCapturing(false); return; }
      setPhotos((prev) => ({ ...prev, [SCAN_ORDER[reviewingIdx]]: photo.uri }));
      const colors = await detectCubeColors(photo.uri);
      setDetected(colors);
      setPhase("review");
    } catch {
      setDetected(Array(9).fill("white") as CubeColor[]);
      setPhase("review");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleConfirm = () => {
    const face           = SCAN_ORDER[reviewingIdx];
    const updatedScanned = { ...scanned, [face]: [...detected] };
    setScanned(updatedScanned);

    if (reviewingIdx === faceIdx) {
      // Confirming a freshly scanned face
      if (faceIdx < 5) {
        const next = faceIdx + 1;
        setFaceIdx(next);
        setReviewingIdx(next);
        setDetected(Array(9).fill("white"));
        setPhase("orientation");
      } else {
        runValidation(updatedScanned);
      }
    } else {
      // Re-confirming a past face
      const allDone = Object.keys(updatedScanned).length === 6;
      if (allDone) {
        runValidation(updatedScanned);
      } else {
        setReviewingIdx(faceIdx);
        setDetected(Array(9).fill("white"));
        setPhase("camera");
      }
    }
  };

  const runValidation = (s: Partial<Record<FaceName, CubeColor[]>>) => {
    const fullState: CubeState = {
      U: (s.U ?? SOLVED_STATE.U) as FaceState,
      R: (s.R ?? SOLVED_STATE.R) as FaceState,
      F: (s.F ?? SOLVED_STATE.F) as FaceState,
      D: (s.D ?? SOLVED_STATE.D) as FaceState,
      L: (s.L ?? SOLVED_STATE.L) as FaceState,
      B: (s.B ?? SOLVED_STATE.B) as FaceState,
    };
    const { valid, errors } = validateCubeState(fullState);
    setValErrors(errors);
    if (valid) {
      setCubeState(fullState);
      setProblemFace(null);
    } else {
      const m = errors[0]?.match(/\b([URFDLB])\b/);
      setProblemFace(m ? (m[1] as FaceName) : null);
    }
    setPhase("validate");
  };

  const handleRetake = () => setPhase("camera");

  const handleStripTap = (fi: number) => {
    const face = SCAN_ORDER[fi];
    if (!scanned[face]) return;
    if (fi === reviewingIdx && phase === "review") return;
    setDetected([...(scanned[face] as CubeColor[])]);
    setReviewingIdx(fi);
    if (phase !== "review") setPhase("review");
  };

  const handleEditScans = () => {
    const lastFace = SCAN_ORDER[5];
    setReviewingIdx(5);
    setDetected([...(scanned[lastFace] as CubeColor[] ?? Array(9).fill("white"))]);
    setPhase("review");
  };

  const handleReset = () => {
    setPhase("idle");
    setFaceIdx(0);
    setReviewingIdx(0);
    setScanned({});
    setPhotos({});
    setDetected(Array(9).fill("white"));
    setValErrors([]);
    setProblemFace(null);
    setManualState(JSON.parse(JSON.stringify(SOLVED_STATE)));
    setManualError("");
  };

  const handleManualCell = (face: FaceName, index: number, color: CubeColor) => {
    setManualState((prev) => {
      const next = { ...prev, [face]: [...prev[face]] as FaceState };
      next[face][index] = color;
      return next;
    });
    setManualError("");
  };

  const handleManualSubmit = () => {
    const { valid, errors } = validateCubeState(manualState);
    if (!valid) { setManualError(errors[0]); return; }
    setCubeState(manualState);
    setTimeout(() => { router.push("/(tabs)/solve"); }, 50);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.BG }]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

        {/* ── IDLE ──────────────────────────────────────────────────── */}
        {phase === "idle" && (
          <>
            <Text style={[s.title, { color: t.TEXT }]}>Scan Your Cube</Text>
            <Text style={[s.subtitle, { color: t.MUTED }]}>
              Point your camera at each face one at a time
            </Text>
            <View style={s.idleButtons}>
              <AnimatedPressable
                onPress={handleStart}
                style={[s.primaryBtn, { backgroundColor: t.ACCENT }]}
              >
                <Ionicons name="camera-outline" size={20} color="#000040" />
                <Text style={[s.primaryBtnTxt, { color: "#000040" }]}>Start Camera Scan</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={() => setPhase("manual")}
                style={[s.secondaryBtn, { backgroundColor: t.CARD, borderColor: t.BORDER }]}
              >
                <Ionicons name="grid-outline" size={20} color={t.TEXT} />
                <Text style={[s.secondaryBtnTxt, { color: t.TEXT }]}>Enter Manually</Text>
              </AnimatedPressable>
            </View>
          </>
        )}

        {/* ── MANUAL ────────────────────────────────────────────────── */}
        {phase === "manual" && (
          <>
            <Text style={[s.title, { color: t.TEXT }]}>Manual Input</Text>
            <Text style={[s.subtitle, { color: t.MUTED }]}>
              Tap each sticker to cycle its color
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.netScroll}>
              <CubeNet state={manualState} editable onCellChange={handleManualCell} />
            </ScrollView>
            {!!manualError && (
              <View style={[s.alertCard, { backgroundColor: t.CARD, borderColor: t.RED }]}>
                <Ionicons name="warning-outline" size={16} color={t.RED} />
                <Text style={[s.alertTxt, { color: t.RED }]}>{manualError}</Text>
              </View>
            )}
            <View style={[s.rowGap, { marginTop: 20 }]}>
              <AnimatedPressable
                onPress={() => setPhase("idle")}
                style={[s.secondaryAction, { backgroundColor: t.CARD, borderColor: t.BORDER }]}
              >
                <Text style={[s.secondaryActionTxt, { color: t.TEXT }]}>Back</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handleManualSubmit}
                style={[s.primaryAction, { backgroundColor: t.ACCENT, flex: 2 }]}
              >
                <Text style={[s.primaryActionTxt, { color: "#000040" }]}>Solve This Cube</Text>
              </AnimatedPressable>
            </View>
          </>
        )}

        {/* ── ORIENTATION ───────────────────────────────────────────── */}
        {phase === "orientation" && (
          <>
            <Text style={[s.title, { color: t.TEXT }]}>Get Ready</Text>
            <Text style={[s.subtitle, { color: t.MUTED }]}>
              {SCAN_INSTRUCTIONS[currentFace]}
            </Text>
            <FacePills faceIdx={faceIdx} scanned={scanned} />
            <OrientationGuide currentFace={currentFace} onReady={handleOrientationReady} />
          </>
        )}

        {/* ── CAMERA ────────────────────────────────────────────────── */}
        {phase === "camera" && (
          <>
            <FacePills faceIdx={faceIdx} scanned={scanned} />
            <View style={s.badgeRow}>
              <View style={[s.faceBadge, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
                <View style={[s.faceDot, { backgroundColor: FACE_HEX[reviewingFace] }]} />
                <Text style={[s.faceBadgeTxt, { color: t.TEXT }]}>{FACE_LABELS[reviewingFace]}</Text>
                <Text style={[s.faceCount, { color: t.MUTED }]}>{reviewingIdx + 1} / 6</Text>
              </View>
            </View>
            <View style={s.camWrap}>
              <CameraViewComponent size={CAM_SIZE} cameraRef={cameraRef} />
            </View>
            <View style={s.camControls}>
              <Pressable onPress={() => setPhase("idle")} style={s.cancelPressable}>
                <Text style={[s.cancelTxt, { color: t.MUTED }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[s.captureBtn, isCapturing && { opacity: 0.5 }]}
                onPress={handleCapture}
                disabled={isCapturing}
              >
                {isCapturing
                  ? <ActivityIndicator color="#fff" size="large" />
                  : <View style={s.captureInner} />
                }
              </Pressable>
              <View style={{ width: 80 }} />
            </View>
          </>
        )}

        {/* ── REVIEW ────────────────────────────────────────────────── */}
        {phase === "review" && (
          <>
            <Text style={[s.title, { color: t.TEXT }]}>Check Colors</Text>
            <Text style={[s.subtitle, { color: t.MUTED }]}>
              Tap any square to correct its color
            </Text>

            {/* Top row: thumbnail + face info */}
            <View style={s.reviewTop}>
              {photos[reviewingFace] ? (
                <Image source={{ uri: photos[reviewingFace] }} style={s.thumbnail} />
              ) : (
                <View style={[s.thumbnail, { backgroundColor: t.CARD_ALT }]} />
              )}
              <View style={s.reviewTopInfo}>
                <Text style={[s.reviewFaceName, { color: t.TEXT }]}>
                  {FACE_LABELS[reviewingFace]}
                </Text>
                <Text style={[s.reviewHint, { color: t.MUTED }]}>
                  Tap a cell to{"\n"}cycle its color
                </Text>
              </View>
            </View>

            {/* 3×3 color grid */}
            <View style={s.colorGrid}>
              {detected.map((color, i) => (
                <ColorCell key={i} color={color} onPress={() => cycleColor(i)} />
              ))}
            </View>

            {/* PDF strip */}
            <View style={s.stripWrap}>
              <PDFStrip
                scanned={scanned}
                photos={photos}
                reviewingIdx={reviewingIdx}
                problemFace={problemFace}
                onTap={handleStripTap}
              />
            </View>

            <View style={s.rowGap}>
              <AnimatedPressable
                onPress={handleRetake}
                style={[s.secondaryAction, { backgroundColor: t.CARD, borderColor: t.BORDER }]}
              >
                <Ionicons name="camera-outline" size={15} color={t.TEXT} />
                <Text style={[s.secondaryActionTxt, { color: t.TEXT }]}>Retake</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handleConfirm}
                style={[s.primaryAction, { backgroundColor: t.ACCENT }]}
              >
                <Text style={[s.primaryActionTxt, { color: "#000040" }]}>
                  {reviewingIdx < faceIdx
                    ? "Save Changes"
                    : faceIdx < 5
                    ? "Confirm →"
                    : "Finish →"}
                </Text>
              </AnimatedPressable>
            </View>
          </>
        )}

        {/* ── VALIDATE ──────────────────────────────────────────────── */}
        {phase === "validate" && (
          <>
            <Text style={[s.title, { color: t.TEXT }]}>
              {valErrors.length === 0 ? "Cube Validated!" : "Check Your Cube"}
            </Text>

            {valErrors.length === 0 ? (
              <View style={[s.resultCard, shadow, { backgroundColor: t.CARD, borderColor: t.GREEN }]}>
                <Ionicons name="checkmark-circle" size={48} color={t.GREEN} />
                <Text style={[s.resultTitle, { color: t.GREEN }]}>All 54 stickers valid</Text>
                <Text style={[s.resultDesc, { color: t.MUTED }]}>
                  Your cube state is correct and ready to solve.
                </Text>
              </View>
            ) : (
              <View style={[s.resultCard, shadow, { backgroundColor: t.CARD, borderColor: t.RED }]}>
                <Ionicons name="alert-circle" size={40} color={t.RED} />
                <Text style={[s.resultTitle, { color: t.RED }]}>Problem Detected</Text>
                {valErrors.slice(0, 3).map((err, i) => (
                  <Text key={i} style={[s.resultDesc, { color: t.MUTED }]}>{err}</Text>
                ))}
                <Text style={[s.resultHint, { color: t.MUTED }]}>
                  Tap the highlighted face below to fix it.
                </Text>
              </View>
            )}

            <View style={[s.stripWrap, { marginTop: 20 }]}>
              <PDFStrip
                scanned={scanned}
                photos={photos}
                reviewingIdx={reviewingIdx}
                problemFace={problemFace}
                onTap={handleStripTap}
              />
            </View>

            {/* Primary CTA — full width, green, dominant */}
            {valErrors.length === 0 && (
              <AnimatedPressable
                onPress={() => setTimeout(() => router.push("/(tabs)/solve"), 50)}
                style={[s.solvePrimaryBtn, { backgroundColor: t.GREEN }]}
              >
                <Text style={[s.primaryActionTxt, { color: "#fff" }]}>Solve This Cube →</Text>
              </AnimatedPressable>
            )}

            {/* Secondary actions */}
            <View style={[s.rowGap, { marginTop: 12 }]}>
              <AnimatedPressable
                onPress={handleReset}
                style={[s.secondaryAction, { backgroundColor: t.CARD, borderColor: t.BORDER }]}
              >
                <Text style={[s.secondaryActionTxt, { color: t.TEXT }]}>Start Over</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handleEditScans}
                style={[s.secondaryAction, { backgroundColor: t.CARD_ALT, borderColor: t.ACCENT }]}
              >
                <Text style={[s.secondaryActionTxt, { color: t.TEXT }]}>Edit Scans</Text>
              </AnimatedPressable>
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },

  title:    { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 20, marginBottom: 20 },

  // ── Idle
  idleButtons:   { gap: 14, marginTop: 8 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  primaryBtnTxt: { fontSize: 16, fontWeight: "700" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderWidth: 1,
    gap: 10,
  },
  secondaryBtnTxt: { fontSize: 16, fontWeight: "600" },

  // ── Manual
  netScroll: { marginVertical: 12 },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  alertTxt: { fontSize: 13, flex: 1 },

  // ── Face pills
  faceRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  facePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
  },
  facePillTxt: { fontSize: 13, fontWeight: "700" },

  // ── Camera
  badgeRow:   { alignItems: "center", marginBottom: 14 },
  faceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
  faceDot:      { width: 10, height: 10, borderRadius: 5 },
  faceBadgeTxt: { fontSize: 14, fontWeight: "700" },
  faceCount:    { fontSize: 12, marginLeft: 4 },
  camWrap:      { alignSelf: "center", marginBottom: 24 },
  camControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  cancelPressable: {
    width: 80,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingVertical: 12,
  },
  cancelTxt:    { fontSize: 15, fontWeight: "600" },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff" },

  // ── Review
  reviewTop: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  thumbnail:      { width: 80, height: 80, borderRadius: 10 },
  reviewTopInfo:  { flex: 1 },
  reviewFaceName: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  reviewHint:     { fontSize: 12, lineHeight: 18 },

  // ── Color grid
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 228,
    gap: 6,
    marginBottom: 24,
    alignSelf: "center",
  },
  colorCell: {
    width: 68,
    height: 68,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  // ── PDF strip
  stripWrap:    { marginBottom: 20 },
  stripContent: { gap: 10, paddingVertical: 4 },
  stripSlot: {
    width: 60,
    height: 80,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  stripLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 4,
    borderRadius: 4,
    overflow: "hidden",
  },

  // ── Validate
  solvePrimaryBtn: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
  },
  resultCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  resultTitle: { fontSize: 20, fontWeight: "700" },
  resultDesc:  { fontSize: 13, textAlign: "center", lineHeight: 20 },
  resultHint:  { fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 4 },
  solveBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  solveBtnTxt: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // ── Shared action row
  rowGap: { flexDirection: "row", gap: 12 },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  secondaryActionTxt: { fontSize: 14, fontWeight: "600" },
  primaryAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryActionTxt: { fontSize: 15, fontWeight: "700" },
});
