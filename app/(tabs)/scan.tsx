import React, { useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import CameraViewComponent from "@/components/camera/CameraView";
import type { CubeColor, FaceName } from "@/types/cube";
import { SCAN_ORDER, FACE_LABELS, CUBE_COLORS } from "@/lib/constants";
import { rgbToHsv, classifyColor } from "@/lib/colorDetection";

// ── theme ─────────────────────────────────────────────────────────────────────
const BG = "#0D1117",
  CARD = "#161B22",
  BORDER = "#30363D";
const TEXT = "#E6EDF3",
  MUTED = "#8B949E",
  GREEN = "#009B48",
  BLUE = "#0046AD";

const ALL_COLORS: CubeColor[] = [
  "white",
  "red",
  "green",
  "yellow",
  "orange",
  "blue",
];

// ── web canvas color detection ─────────────────────────────────────────────────
async function detectColorsWeb(base64: string): Promise<CubeColor[]> {
  return new Promise((resolve) => {
    const img = new (window as any).Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const S = 270;
      const canvas = document.createElement("canvas");
      canvas.width = S;
      canvas.height = S;
      const ctx = canvas.getContext("2d")!;
      const src = Math.min(img.width, img.height);
      ctx.drawImage(
        img,
        (img.width - src) / 2,
        (img.height - src) / 2,
        src,
        src,
        0,
        0,
        S,
        S,
      );
      const colors: CubeColor[] = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const px = ctx.getImageData(col * 90 + 45, row * 90 + 45, 1, 1).data;
          colors.push(
            classifyColor(rgbToHsv({ r: px[0], g: px[1], b: px[2] })),
          );
        }
      }
      resolve(colors);
    };
    img.onerror = () => resolve(Array(9).fill("white") as CubeColor[]);
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

type Phase = "idle" | "camera" | "review" | "complete";

export default function ScanScreen() {
  const { width } = useWindowDimensions();
  const CAM_SIZE = Math.min(width - 40, 320);

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [faceIdx, setFaceIdx] = useState(0);
  const [photoUri, setPhotoUri] = useState("");
  const [detected, setDetected] = useState<CubeColor[]>(Array(9).fill("white"));
  const [scanned, setScanned] = useState<
    Partial<Record<FaceName, CubeColor[]>>
  >({});

  const currentFace = SCAN_ORDER[faceIdx];

  // ── face color map for indicators ─────────────────────────────────────────
  const faceHex: Record<FaceName, string> = {
    U: "#FFFFFF",
    R: "#B71234",
    F: "#009B48",
    D: "#FFD500",
    L: "#FF5800",
    B: "#0046AD",
  };

  // ── start scanning ─────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!permission?.granted) await requestPermission();
    setPhase("camera");
  };

  // ── capture photo ──────────────────────────────────────────────────────────
  const handleCapture = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        base64: true,
        quality: 0.6,
      });
      if (!photo) return;
      setPhotoUri(photo.uri);
      const colors =
        Platform.OS === "web" && photo.base64
          ? await detectColorsWeb(photo.base64)
          : (Array(9).fill("white") as CubeColor[]);
      setDetected(colors);
      setPhase("review");
    } catch (e) {
      console.error("Capture error:", e);
    }
  };

  // ── cycle color on tap ─────────────────────────────────────────────────────
  const cycleColor = (idx: number) => {
    setDetected((prev) => {
      const next = [...prev];
      const ci = ALL_COLORS.indexOf(next[idx]);
      next[idx] = ALL_COLORS[(ci + 1) % ALL_COLORS.length];
      return next;
    });
  };

  // ── confirm face ───────────────────────────────────────────────────────────
  const handleConfirm = () => {
    const updated = { ...scanned, [currentFace]: detected };
    setScanned(updated);
    if (faceIdx < 5) {
      setFaceIdx((i) => i + 1);
      setDetected(Array(9).fill("white"));
      setPhase("camera");
    } else {
      setPhase("complete");
    }
  };

  // ── reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setPhase("idle");
    setFaceIdx(0);
    setScanned({});
    setDetected(Array(9).fill("white"));
  };

  // ── face progress indicator ────────────────────────────────────────────────
  const FaceProgress = () => (
    <View style={styles.faceRow}>
      {SCAN_ORDER.map((f, i) => {
        const done = scanned[f] !== undefined;
        const current =
          i === faceIdx && phase !== "idle" && phase !== "complete";
        return (
          <View
            key={f}
            style={[
              styles.facePill,
              { borderColor: current ? faceHex[f] : BORDER },
              done && { backgroundColor: faceHex[f] },
            ]}
          >
            <Text style={[styles.facePillTxt, done && { color: "#000" }]}>
              {f}
            </Text>
          </View>
        );
      })}
    </View>
  );

  // ── COLOR GRID (review) ────────────────────────────────────────────────────
  const ColorGrid = () => (
    <View style={styles.colorGrid}>
      {detected.map((color, i) => (
        <Pressable
          key={i}
          onPress={() => cycleColor(i)}
          style={[styles.colorCell, { backgroundColor: CUBE_COLORS[color] }]}
        />
      ))}
    </View>
  );

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Camera Scanner</Text>
          <Text style={styles.subtitle}>
            {phase === "idle" && "Scan each face one at a time"}
            {phase === "camera" &&
              `Align ${FACE_LABELS[currentFace]} with the grid`}
            {phase === "review" && "Tap any square to correct its color"}
            {phase === "complete" && "All 6 faces scanned!"}
          </Text>
        </View>

        {/* Face progress */}
        <FaceProgress />

        {/* ── IDLE ───────────────────────────────────────────────────────── */}
        {phase === "idle" && (
          <View style={styles.idleBox}>
            <Text style={styles.idleEmoji}>📷</Text>
            <Text style={styles.idleTitle}>Ready to Scan</Text>
            <Text style={styles.idleDesc}>
              Hold each face of your cube in front of the camera.{"\n"}
              The app detects colors using your camera.
            </Text>
            <View style={styles.instructRow}>
              {["1. Hold face flat", "2. Fill the grid", "3. Tap Capture"].map(
                (s) => (
                  <View key={s} style={styles.instructChip}>
                    <Text style={styles.instructTxt}>{s}</Text>
                  </View>
                ),
              )}
            </View>
            <Pressable style={styles.startBtn} onPress={handleStart}>
              <Text style={styles.startBtnTxt}>Start Scanning</Text>
            </Pressable>
          </View>
        )}

        {/* ── CAMERA ─────────────────────────────────────────────────────── */}
        {phase === "camera" && (
          <View style={styles.cameraSection}>
            <View style={styles.faceLabelBadge}>
              <View
                style={[
                  styles.faceDot,
                  { backgroundColor: faceHex[currentFace] },
                ]}
              />
              <Text style={styles.faceLabelTxt}>
                {FACE_LABELS[currentFace]}
              </Text>
              <Text style={styles.faceCount}>{faceIdx + 1} / 6</Text>
            </View>

            <View style={styles.camWrap}>
              <CameraViewComponent size={CAM_SIZE} cameraRef={cameraRef} />
            </View>

            <View style={styles.camActions}>
              <Pressable
                style={styles.retakeBtn}
                onPress={() => setPhase("idle")}
              >
                <Text style={styles.retakeTxt}>✕ Cancel</Text>
              </Pressable>
              <Pressable style={styles.captureBtn} onPress={handleCapture}>
                <View style={styles.captureInner} />
              </Pressable>
              <View style={{ width: 80 }} />
            </View>
          </View>
        )}

        {/* ── REVIEW ─────────────────────────────────────────────────────── */}
        {phase === "review" && (
          <View style={styles.reviewSection}>
            <View style={styles.reviewRow}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.thumbnail} />
              ) : (
                <View style={[styles.thumbnail, { backgroundColor: CARD }]} />
              )}
              <View style={styles.reviewInfo}>
                <Text style={styles.reviewFace}>
                  {FACE_LABELS[currentFace]}
                </Text>
                <Text style={styles.reviewHint}>
                  Tap a square to{"\n"}change its color
                </Text>
              </View>
            </View>

            <ColorGrid />

            <View style={styles.reviewActions}>
              <Pressable
                style={styles.retakeBtn}
                onPress={() => setPhase("camera")}
              >
                <Text style={styles.retakeTxt}>↩ Retake</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
                <Text style={styles.confirmTxt}>
                  {faceIdx < 5 ? "Next Face →" : "Finish ✓"}
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── COMPLETE ───────────────────────────────────────────────────── */}
        {phase === "complete" && (
          <View style={styles.completeBox}>
            <Text style={styles.completeEmoji}>✅</Text>
            <Text style={styles.completeTitle}>All 6 Faces Scanned!</Text>
            <Text style={styles.completeDesc}>
              Your cube state is ready.{"\n"}Head to the Solver to get a
              solution.
            </Text>
            <Pressable style={[styles.startBtn, { backgroundColor: BLUE }]}>
              <Text style={styles.startBtnTxt}>🧩 Go to Solver</Text>
            </Pressable>
            <Pressable
              style={[styles.retakeBtn, { marginTop: 12, alignSelf: "center" }]}
              onPress={handleReset}
            >
              <Text style={styles.retakeTxt}>↩ Scan Again</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 48 },

  header: { marginBottom: 14 },
  title: { fontSize: 26, fontWeight: "700", color: TEXT, marginBottom: 4 },
  subtitle: { fontSize: 13, color: MUTED },

  faceRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  facePill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: BORDER,
    alignItems: "center",
  },
  facePillTxt: { fontSize: 13, fontWeight: "700", color: TEXT },

  // Idle
  idleBox: { alignItems: "center", paddingTop: 20 },
  idleEmoji: { fontSize: 64, marginBottom: 16 },
  idleTitle: { fontSize: 22, fontWeight: "700", color: TEXT, marginBottom: 10 },
  idleDesc: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  instructRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  instructChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  instructTxt: { fontSize: 12, color: MUTED },
  startBtn: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingHorizontal: 36,
    paddingVertical: 15,
    alignItems: "center",
  },
  startBtnTxt: { fontSize: 16, fontWeight: "700", color: "#fff" },

  // Camera
  cameraSection: { alignItems: "center" },
  faceLabelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: CARD,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
  },
  faceDot: { width: 10, height: 10, borderRadius: 5 },
  faceLabelTxt: { fontSize: 14, fontWeight: "700", color: TEXT },
  faceCount: { fontSize: 12, color: MUTED, marginLeft: 4 },
  camWrap: { marginBottom: 24 },
  camActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
  },

  // Review
  reviewSection: { alignItems: "center" },
  reviewRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  thumbnail: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#222",
  },
  reviewInfo: { flex: 1 },
  reviewFace: { fontSize: 18, fontWeight: "700", color: TEXT, marginBottom: 6 },
  reviewHint: { fontSize: 12, color: MUTED, lineHeight: 18 },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 222,
    marginBottom: 24,
    gap: 4,
  },
  colorCell: {
    width: 68,
    height: 68,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  reviewActions: { flexDirection: "row", gap: 12, width: "100%" },
  retakeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  retakeTxt: { fontSize: 14, fontWeight: "600", color: TEXT },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: GREEN,
    alignItems: "center",
  },
  confirmTxt: { fontSize: 15, fontWeight: "700", color: "#fff" },

  // Complete
  completeBox: { alignItems: "center", paddingTop: 20 },
  completeEmoji: { fontSize: 64, marginBottom: 16 },
  completeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 10,
  },
  completeDesc: {
    fontSize: 14,
    color: MUTED,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
});
