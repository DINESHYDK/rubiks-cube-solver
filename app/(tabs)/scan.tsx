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
  Animated,
} from "react-native";
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

// ── Types & constants ─────────────────────────────────────────────────────────

type Phase = "idle" | "orientation" | "camera" | "review" | "validate" | "manual";

const ALL_COLORS: CubeColor[] = ["white", "red", "green", "yellow", "orange", "blue"];

const FACE_HEX: Record<FaceName, string> = {
  U: "#EEEEEE",
  R: "#B71234",
  F: "#009B48",
  D: "#FFD500",
  L: "#FF5800",
  B: "#0046AD",
};

const cardShadow = Platform.select({
  ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8 },
  android: { elevation: 4 },
  default: {},
}) as object;

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
  const flat    = StyleSheet.flatten(style as any) as Record<string, any> | undefined;

  const pressIn = () =>
    Animated.parallel([
      Animated.timing(scale,   { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.85, duration: 100, useNativeDriver: true }),
    ]).start();

  const pressOut = () =>
    Animated.parallel([
      Animated.timing(scale,   { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      disabled={disabled}
      style={{ flex: flat?.flex, alignSelf: flat?.alignSelf, width: flat?.width }}
    >
      <Animated.View style={[style, { transform: [{ scale }], opacity }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ── ColorCell ─────────────────────────────────────────────────────────────────

function ColorCell({ color, onPress, size }: { color: CubeColor; onPress: () => void; size: number }) {
  const t     = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }).start()}
      onPressOut={() => Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }).start()}
      onPress={onPress}
    >
      <Animated.View
        style={[
          s.colorCell,
          { width: size, height: size, backgroundColor: CUBE_COLORS[color], borderColor: t.BORDER },
          { transform: [{ scale }] },
        ]}
      />
    </Pressable>
  );
}

// ── FaceProgressStrip ─────────────────────────────────────────────────────────

function FaceProgressStrip({
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
                borderColor: isDone
                  ? FACE_HEX[face]
                  : isCurrent
                  ? t.HIGHLIGHT
                  : t.BORDER,
                backgroundColor: isDone
                  ? FACE_HEX[face]
                  : isCurrent
                  ? hexOpacity(t.HIGHLIGHT, 0.12)
                  : "transparent",
              },
            ]}
          >
            <Text
              style={[
                s.facePillTxt,
                { color: isDone ? "#111" : isCurrent ? t.HIGHLIGHT : t.MUTED },
              ]}
            >
              {face}
            </Text>
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
                borderColor: isProblem ? t.RED : isCurrent ? t.HIGHLIGHT : t.BORDER,
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
            <View style={s.stripLabelWrap}>
              <Text style={s.stripLabel}>{face}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ── ScanScreen ────────────────────────────────────────────────────────────────

export default function ScanScreen() {
  const t                = useTheme();
  const { width }        = useWindowDimensions();
  const CAM_SIZE         = width - 40;
  const GRID_GAP         = 8;
  const GRID_CELL        = Math.floor((width - 40 - GRID_GAP * 2) / 3);
  const GRID_WIDTH       = GRID_CELL * 3 + GRID_GAP * 2;
  const router           = useRouter();
  const { setCubeState } = useCubeStore();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase,        setPhase]        = useState<Phase>("idle");
  const [idleMode,     setIdleMode]     = useState<"camera" | "manual">("camera");
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

  const runValidation = (st: Partial<Record<FaceName, CubeColor[]>>) => {
    const fullState: CubeState = {
      U: (st.U ?? SOLVED_STATE.U) as FaceState,
      R: (st.R ?? SOLVED_STATE.R) as FaceState,
      F: (st.F ?? SOLVED_STATE.F) as FaceState,
      D: (st.D ?? SOLVED_STATE.D) as FaceState,
      L: (st.L ?? SOLVED_STATE.L) as FaceState,
      B: (st.B ?? SOLVED_STATE.B) as FaceState,
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
          <View>
            <Text style={[s.title, { color: t.TEXT }]}>Scan Your Cube</Text>
            <Text style={[s.subtitle, { color: t.MUTED }]}>Choose how to input your cube state</Text>

            {/* Mode selector */}
            <View style={[s.modeRow, { backgroundColor: t.CARD_ALT, borderColor: t.BORDER }]}>
              <Pressable
                style={[s.modeTab, idleMode === "camera" && [s.modeTabActive, { backgroundColor: t.CARD }]]}
                onPress={() => setIdleMode("camera")}
              >
                <Ionicons name="camera-outline" size={16} color={idleMode === "camera" ? t.HIGHLIGHT : t.MUTED} />
                <Text style={[s.modeTabTxt, { color: idleMode === "camera" ? t.HIGHLIGHT : t.MUTED }]}>
                  Camera
                </Text>
              </Pressable>
              <Pressable
                style={[s.modeTab, idleMode === "manual" && [s.modeTabActive, { backgroundColor: t.CARD }]]}
                onPress={() => setIdleMode("manual")}
              >
                <Ionicons name="grid-outline" size={16} color={idleMode === "manual" ? t.HIGHLIGHT : t.MUTED} />
                <Text style={[s.modeTabTxt, { color: idleMode === "manual" ? t.HIGHLIGHT : t.MUTED }]}>
                  Manual
                </Text>
              </Pressable>
            </View>

            {/* Camera mode card */}
            {idleMode === "camera" && (
              <View style={[s.idleCard, cardShadow, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
                <View
                  style={[
                    s.idleIconRing,
                    {
                      backgroundColor: hexOpacity(t.HIGHLIGHT, 0.10),
                      borderColor: hexOpacity(t.HIGHLIGHT, 0.35),
                    },
                  ]}
                >
                  <Ionicons name="camera" size={36} color={t.HIGHLIGHT} />
                </View>
                <Text style={[s.idleCardTitle, { color: t.TEXT }]}>Camera Scan</Text>
                <Text style={[s.idleCardDesc, { color: t.MUTED }]}>
                  Scan all 6 faces automatically using your camera with AI color detection.
                </Text>
                <View style={s.chipsRow}>
                  {["6 scans", "Auto-detect", "~2 min"].map((chip) => (
                    <View key={chip} style={[s.chip, { backgroundColor: t.CARD_ALT, borderColor: t.BORDER }]}>
                      <Text style={[s.chipTxt, { color: t.MUTED }]}>{chip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Manual mode card */}
            {idleMode === "manual" && (
              <View style={[s.idleCard, cardShadow, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
                <View
                  style={[
                    s.idleIconRing,
                    {
                      backgroundColor: hexOpacity(t.TEXT, 0.06),
                      borderColor: hexOpacity(t.TEXT, 0.18),
                    },
                  ]}
                >
                  <Ionicons name="grid" size={36} color={t.TEXT} />
                </View>
                <Text style={[s.idleCardTitle, { color: t.TEXT }]}>Manual Input</Text>
                <Text style={[s.idleCardDesc, { color: t.MUTED }]}>
                  Tap each sticker on the cube net to set its color manually.
                </Text>
                <View style={s.chipsRow}>
                  {["54 stickers", "Full control", "No camera"].map((chip) => (
                    <View key={chip} style={[s.chip, { backgroundColor: t.CARD_ALT, borderColor: t.BORDER }]}>
                      <Text style={[s.chipTxt, { color: t.MUTED }]}>{chip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* CTA */}
            <AnimatedPressable
              onPress={idleMode === "camera" ? handleStart : () => setPhase("manual")}
              style={[s.idleCTA, { backgroundColor: t.HIGHLIGHT }]}
            >
              <Ionicons
                name={idleMode === "camera" ? "camera" : "grid"}
                size={20}
                color={t.isDark ? "#000" : "#fff"}
              />
              <Text style={[s.idleCTATxt, { color: t.isDark ? "#000" : "#fff" }]}>
                {idleMode === "camera" ? "Start Camera Scan" : "Enter Manually"}
              </Text>
            </AnimatedPressable>
          </View>
        )}

        {/* ── MANUAL ────────────────────────────────────────────────── */}
        {phase === "manual" && (
          <View>
            <Text style={[s.title, { color: t.TEXT }]}>Manual Input</Text>
            <Text style={[s.subtitle, { color: t.MUTED }]}>Tap each sticker to cycle its color</Text>
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
                <Ionicons name="arrow-back-outline" size={16} color={t.TEXT} />
                <Text style={[s.secondaryActionTxt, { color: t.TEXT }]}>Back</Text>
              </AnimatedPressable>
              <AnimatedPressable
                onPress={handleManualSubmit}
                style={[s.primaryAction, { backgroundColor: t.HIGHLIGHT, flex: 2 }]}
              >
                <Text style={[s.primaryActionTxt, { color: t.isDark ? "#000" : "#fff" }]}>
                  Solve This Cube
                </Text>
              </AnimatedPressable>
            </View>
          </View>
        )}

        {/* ── ORIENTATION ───────────────────────────────────────────── */}
        {phase === "orientation" && (
          <View>
            <Text style={[s.title, { color: t.TEXT }]}>Get Ready</Text>
            <FaceProgressStrip faceIdx={faceIdx} scanned={scanned} />
            <OrientationGuide currentFace={currentFace} onReady={handleOrientationReady} />
          </View>
        )}

        {/* ── CAMERA ────────────────────────────────────────────────── */}
        {phase === "camera" && (
          <View>
            <FaceProgressStrip faceIdx={faceIdx} scanned={scanned} />

            {/* Face badge */}
            <View style={s.badgeRow}>
              <View
                style={[
                  s.faceBadge,
                  {
                    backgroundColor: hexOpacity(FACE_HEX[reviewingFace], 0.15),
                    borderColor: FACE_HEX[reviewingFace],
                  },
                ]}
              >
                <View style={[s.faceDot, { backgroundColor: FACE_HEX[reviewingFace] }]} />
                <Text style={[s.faceBadgeTxt, { color: t.TEXT }]}>{FACE_LABELS[reviewingFace]}</Text>
                <Text style={[s.faceCount, { color: t.MUTED }]}>{reviewingIdx + 1} / 6</Text>
              </View>
            </View>

            {/* Full-width camera */}
            <View style={[s.camWrap, { borderRadius: 20, overflow: "hidden" }]}>
              <CameraViewComponent size={CAM_SIZE} cameraRef={cameraRef} />
            </View>

            {/* Capture controls */}
            <View style={s.camControls}>
              <Pressable onPress={() => setPhase("idle")} style={s.cancelPressable}>
                <Text style={[s.cancelTxt, { color: t.MUTED }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  s.captureBtn,
                  { borderColor: t.isDark ? "#fff" : t.TEXT },
                  isCapturing && { opacity: 0.5 },
                ]}
                onPress={handleCapture}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <ActivityIndicator color={t.isDark ? "#fff" : t.TEXT} size="large" />
                ) : (
                  <View style={[s.captureInner, { backgroundColor: t.isDark ? "#fff" : t.TEXT }]} />
                )}
              </Pressable>
              <View style={{ width: 80 }} />
            </View>
          </View>
        )}

        {/* ── REVIEW ────────────────────────────────────────────────── */}
        {phase === "review" && (
          <View>
            <Text style={[s.title, { color: t.TEXT }]}>Check Colors</Text>
            <Text style={[s.subtitle, { color: t.MUTED }]}>Tap any square to correct its color</Text>

            {/* Top row: thumbnail + face info */}
            <View style={s.reviewTop}>
              {photos[reviewingFace] ? (
                <Image source={{ uri: photos[reviewingFace] }} style={s.thumbnail} />
              ) : (
                <View
                  style={[
                    s.thumbnail,
                    { backgroundColor: t.CARD_ALT, borderColor: t.BORDER, borderWidth: 1 },
                  ]}
                />
              )}
              <View style={s.reviewTopInfo}>
                <View style={s.reviewBadge}>
                  <View style={[s.faceDotLg, { backgroundColor: FACE_HEX[reviewingFace] }]} />
                  <Text style={[s.reviewFaceName, { color: t.TEXT }]}>{FACE_LABELS[reviewingFace]}</Text>
                </View>
                <Text style={[s.reviewHint, { color: t.MUTED }]}>Tap a cell to cycle its color</Text>
              </View>
            </View>

            {/* 3×3 color grid */}
            <View style={[s.colorGrid, { gap: GRID_GAP, width: GRID_WIDTH }]}>
              {detected.map((color, i) => (
                <ColorCell key={i} color={color} onPress={() => cycleColor(i)} size={GRID_CELL} />
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

            {/* Actions */}
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
                style={[s.primaryAction, { backgroundColor: t.HIGHLIGHT }]}
              >
                <Text style={[s.primaryActionTxt, { color: t.isDark ? "#000" : "#fff" }]}>
                  {reviewingIdx < faceIdx ? "Save Changes" : faceIdx < 5 ? "Confirm →" : "Finish →"}
                </Text>
              </AnimatedPressable>
            </View>
          </View>
        )}

        {/* ── VALIDATE ──────────────────────────────────────────────── */}
        {phase === "validate" && (
          <View>
            <Text style={[s.title, { color: t.TEXT }]}>
              {valErrors.length === 0 ? "Cube Validated!" : "Check Your Cube"}
            </Text>

            {valErrors.length === 0 ? (
              <View style={[s.resultCard, cardShadow, { backgroundColor: t.CARD, borderColor: t.GREEN }]}>
                <View
                  style={[
                    s.resultIconRing,
                    {
                      backgroundColor: hexOpacity(t.GREEN, 0.12),
                      borderColor: hexOpacity(t.GREEN, 0.30),
                    },
                  ]}
                >
                  <Ionicons name="checkmark-circle" size={40} color={t.GREEN} />
                </View>
                <Text style={[s.resultTitle, { color: t.GREEN }]}>All 54 stickers valid</Text>
                <Text style={[s.resultDesc, { color: t.MUTED }]}>
                  Your cube state is correct and ready to solve.
                </Text>
              </View>
            ) : (
              <View style={[s.resultCard, cardShadow, { backgroundColor: t.CARD, borderColor: t.RED }]}>
                <View
                  style={[
                    s.resultIconRing,
                    {
                      backgroundColor: hexOpacity(t.RED, 0.12),
                      borderColor: hexOpacity(t.RED, 0.30),
                    },
                  ]}
                >
                  <Ionicons name="alert-circle" size={40} color={t.RED} />
                </View>
                <Text style={[s.resultTitle, { color: t.RED }]}>Problem Detected</Text>
                {valErrors.slice(0, 3).map((err, i) => (
                  <Text key={i} style={[s.resultDesc, { color: t.MUTED }]}>{err}</Text>
                ))}
                <Text style={[s.resultHint, { color: t.MUTED }]}>
                  Tap the highlighted face below to fix it.
                </Text>
              </View>
            )}

            {/* PDF strip */}
            <View style={[s.stripWrap, { marginTop: 20 }]}>
              <PDFStrip
                scanned={scanned}
                photos={photos}
                reviewingIdx={reviewingIdx}
                problemFace={problemFace}
                onTap={handleStripTap}
              />
            </View>

            {/* Solve CTA */}
            {valErrors.length === 0 && (
              <AnimatedPressable
                onPress={() => setTimeout(() => router.push("/(tabs)/solve"), 50)}
                style={[s.solvePrimaryBtn, { backgroundColor: t.GREEN, width: "100%" }]}
              >
                <Ionicons name="cube-outline" size={20} color="#fff" />
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
                style={[s.secondaryAction, { backgroundColor: t.CARD_ALT, borderColor: t.BORDER }]}
              >
                <Text style={[s.secondaryActionTxt, { color: t.TEXT }]}>Edit Scans</Text>
              </AnimatedPressable>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 120 },

  title:    { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 20, marginBottom: 20 },

  // ── Idle
  modeRow: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modeTabActive: {},
  modeTabTxt: { fontSize: 14, fontWeight: "600" },

  idleCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  idleIconRing: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  idleCardTitle: { fontSize: 20, fontWeight: "700" },
  idleCardDesc:  { fontSize: 13, lineHeight: 20, textAlign: "center" },
  chipsRow:      { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipTxt: { fontSize: 12, fontWeight: "600" },
  idleCTA: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  idleCTATxt: { fontSize: 16, fontWeight: "700" },

  // ── Manual
  netScroll: { marginVertical: 12 },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  alertTxt: { fontSize: 13, flex: 1 },

  // ── Face progress strip
  faceRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  facePill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
  },
  facePillTxt: { fontSize: 13, fontWeight: "700" },

  // ── Camera
  badgeRow: { alignItems: "center", marginBottom: 14 },
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
  faceDotLg:    { width: 14, height: 14, borderRadius: 7 },
  faceBadgeTxt: { fontSize: 14, fontWeight: "700" },
  faceCount:    { fontSize: 12, marginLeft: 4 },
  camWrap:      { marginBottom: 24 },
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
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: { width: 56, height: 56, borderRadius: 28 },

  // ── Review
  reviewTop: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  thumbnail:      { width: 72, height: 72, borderRadius: 12 },
  reviewTopInfo:  { flex: 1, gap: 8 },
  reviewBadge:    { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewFaceName: { fontSize: 18, fontWeight: "700" },
  reviewHint:     { fontSize: 12, lineHeight: 18 },

  // ── Color grid
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
    alignSelf: "center",
  },
  colorCell: {
    borderRadius: 10,
    borderWidth: 1,
  },

  // ── PDF strip
  stripWrap:    { marginBottom: 20 },
  stripContent: { gap: 10, paddingVertical: 4 },
  stripSlot: {
    width: 60,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 4,
  },
  stripLabelWrap: {
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  stripLabel: { fontSize: 11, fontWeight: "700", color: "#fff" },

  // ── Validate
  resultCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  resultIconRing: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitle: { fontSize: 20, fontWeight: "700" },
  resultDesc:  { fontSize: 13, textAlign: "center", lineHeight: 20 },
  resultHint:  { fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 4 },
  solvePrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
    gap: 8,
  },

  // ── Shared action row
  rowGap: { flexDirection: "row", gap: 12 },
  secondaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  secondaryActionTxt: { fontSize: 14, fontWeight: "600" },
  primaryAction: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryActionTxt: { fontSize: 15, fontWeight: "700" },
});
