import React from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Canvas, extend } from "@react-three/fiber/native";

// ── Error Boundary — fallback for expo-gl / New Architecture issues ───────────

class GuideErrorBoundary extends React.Component<
  { children: React.ReactNode; faceName: string; faceColor: string; faceLabel: string; refColor: string; refLabel: string },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.warn("[OrientationGuide] GL failed:", error?.message);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={fb.wrap}>
          <View style={[fb.box, { backgroundColor: this.props.faceColor }]}>
            <Text style={fb.letter}>{this.props.faceLabel}</Text>
          </View>
          <View style={fb.dotsRow}>
            <View style={[fb.dot, { backgroundColor: this.props.faceColor }]} />
            <View style={[fb.dot, { backgroundColor: this.props.refColor }]} />
          </View>
        </View>
      );
    }
    return this.props.children;
  }
}

const fb = StyleSheet.create({
  wrap:    { alignItems: "center", gap: 10 },
  box:     { width: 180, height: 180, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  letter:  { fontSize: 48, fontWeight: "800", color: "#fff" },
  dotsRow: { flexDirection: "row", gap: 12 },
  dot:     { width: 20, height: 20, borderRadius: 10 },
});
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { Ionicons } from "@expo/vector-icons";

extend({ RoundedBoxGeometry });
declare global {
  namespace JSX {
    interface IntrinsicElements {
      roundedBoxGeometry: any;
    }
  }
}

import type { FaceName } from "@/types/cube";
import { useTheme } from "@/lib/theme";

// ── Config ────────────────────────────────────────────────────────────────────

const FACE_COLORS: Record<FaceName, string> = {
  U: "#EEEEEE",
  R: "#B71234",
  F: "#009B48",
  D: "#FFD500",
  L: "#FF5800",
  B: "#0046AD",
};

const FACE_DISPLAY: Record<FaceName, string> = {
  U: "White",
  R: "Red",
  F: "Green",
  D: "Yellow",
  L: "Orange",
  B: "Blue",
};

const FACE_FULL: Record<FaceName, string> = {
  U: "White (Top)",
  R: "Red (Right)",
  F: "Green (Front)",
  D: "Yellow (Bottom)",
  L: "Orange (Left)",
  B: "Blue (Back)",
};

// Center cubie position for each face
const FACE_CENTERS: Record<FaceName, [number, number, number]> = {
  U: [ 0,  1,  0],
  D: [ 0, -1,  0],
  F: [ 0,  0,  1],
  B: [ 0,  0, -1],
  R: [ 1,  0,  0],
  L: [-1,  0,  0],
};

// Which two face centers to highlight per scanning face
const HIGHLIGHT_MAP: Record<FaceName, FaceName[]> = {
  U: ["U", "R"],
  F: ["F", "U"],
  R: ["R", "U"],
  B: ["B", "U"],
  L: ["L", "U"],
  D: ["D", "F"],
};

// Fixed camera position per face — chosen so BOTH highlighted faces are clearly visible.
// Camera always looks toward the origin (Three.js default).
const CAMERA_POSITIONS: Record<FaceName, [number, number, number]> = {
  U: [ 4,  6,  5],   // above + right + front → shows White top + Red right
  F: [ 4,  4,  7],   // front + above + right  → shows Green front + White top
  R: [ 7,  4,  4],   // right + above + front  → shows Red right  + White top
  B: [-4,  4, -7],   // behind + above + left  → shows Blue back  + White top
  L: [-7,  4,  4],   // left  + above + front  → shows Orange left + White top
  D: [ 0, -6,  5],   // below + in front → shows Yellow bottom + Green front centered
};

const spacing     = 1.02;
const GHOST_COLOR   = "#888888";
const GHOST_OPACITY = 0.06;

// ── Three.js scene helpers ────────────────────────────────────────────────────

function isCenter(pos: [number, number, number], face: FaceName): boolean {
  const c = FACE_CENTERS[face];
  return pos[0] === c[0] && pos[1] === c[1] && pos[2] === c[2];
}

const GhostSticker = ({
  pos,
  rot,
  color,
  opacity,
}: {
  pos: [number, number, number];
  rot: [number, number, number];
  color: string;
  opacity: number;
}) => (
  <mesh position={pos} rotation={rot}>
    <planeGeometry args={[0.82, 0.82]} />
    <meshPhysicalMaterial
      color={color}
      opacity={opacity}
      transparent
      roughness={0.1}
      clearcoat={1}
    />
  </mesh>
);

const GhostCubie = ({
  pos,
  highlights,
}: {
  pos: [number, number, number];
  highlights: FaceName[];
}) => {
  const [x, y, z] = pos;

  const stickerColor = (face: FaceName) =>
    highlights.includes(face) && isCenter(pos, face) ? FACE_COLORS[face] : GHOST_COLOR;

  const stickerOpacity = (face: FaceName) =>
    highlights.includes(face) && isCenter(pos, face) ? 1.0 : GHOST_OPACITY;

  return (
    <group position={[x * spacing, y * spacing, z * spacing]}>
      <mesh>
        <roundedBoxGeometry args={[0.96, 0.96, 0.96, 4, 0.08]} />
        <meshPhysicalMaterial color="#050505" roughness={0.2} metalness={0.1} clearcoat={1} />
      </mesh>
      {x === 1  && <GhostSticker color={stickerColor("R")} opacity={stickerOpacity("R")} pos={[ 0.485, 0, 0]}    rot={[0,  Math.PI / 2, 0]} />}
      {x === -1 && <GhostSticker color={stickerColor("L")} opacity={stickerOpacity("L")} pos={[-0.485, 0, 0]}    rot={[0, -Math.PI / 2, 0]} />}
      {y === 1  && <GhostSticker color={stickerColor("U")} opacity={stickerOpacity("U")} pos={[0,  0.485, 0]}    rot={[-Math.PI / 2, 0, 0]} />}
      {y === -1 && <GhostSticker color={stickerColor("D")} opacity={stickerOpacity("D")} pos={[0, -0.485, 0]}    rot={[ Math.PI / 2, 0, 0]} />}
      {z === 1  && <GhostSticker color={stickerColor("F")} opacity={stickerOpacity("F")} pos={[0, 0,  0.485]}    rot={[0, 0, 0]} />}
      {z === -1 && <GhostSticker color={stickerColor("B")} opacity={stickerOpacity("B")} pos={[0, 0, -0.485]}    rot={[0, Math.PI, 0]} />}
    </group>
  );
};

const CUBIES: [number, number, number][] = [];
for (let x = -1; x <= 1; x++)
  for (let y = -1; y <= 1; y++)
    for (let z = -1; z <= 1; z++)
      CUBIES.push([x, y, z]);

// Static scene — no useFrame, no rotation, no controls
const GhostScene = ({ currentFace }: { currentFace: FaceName }) => {
  const highlights = HIGHLIGHT_MAP[currentFace];
  return (
    <group>
      <ambientLight intensity={0.7} />
      <directionalLight position={[10, 15, 10]} intensity={1.4} />
      <directionalLight position={[-6, -4, -6]} intensity={1.6} />
      <pointLight position={[0, 0, 3]} intensity={3} distance={12} />
      {/* Static pose — slight tilt for depth */}
      <group rotation={[0.12, 0.1, 0]}>
        {CUBIES.map((pos, idx) => (
          <GhostCubie key={idx} pos={pos} highlights={highlights} />
        ))}
      </group>
    </group>
  );
};

// ── Public Component ──────────────────────────────────────────────────────────

interface OrientationGuideProps {
  currentFace: FaceName;
  onReady: () => void;
}

export default function OrientationGuide({ currentFace, onReady }: OrientationGuideProps) {
  const t             = useTheme();
  const highlights    = HIGHLIGHT_MAP[currentFace];
  const primaryFace   = highlights[0];
  const referenceFace = highlights[1];
  const faceAccent    = FACE_COLORS[primaryFace];

  const canvasShadow = Platform.select({
    ios: {
      shadowColor: faceAccent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55,
      shadowRadius: 14,
    },
    android: { elevation: 10 },
    default: {},
  }) as object;

  return (
    <View style={s.container}>

      {/* ── 3D Reference cube ──────────────────────────────────────── */}
      <GuideErrorBoundary
        faceName={currentFace}
        faceColor={faceAccent}
        faceLabel={currentFace}
        refColor={FACE_COLORS[referenceFace]}
        refLabel={referenceFace}
      >
        <View
          style={[
            s.canvasCard,
            canvasShadow,
            { backgroundColor: t.CARD, borderColor: faceAccent },
          ]}
        >
          <Canvas
            camera={{ position: CAMERA_POSITIONS[currentFace], fov: 45 }}
            gl={{ antialias: true }}
          >
            <GhostScene currentFace={currentFace} />
          </Canvas>
        </View>
      </GuideErrorBoundary>

      {/* ── Face chips ─────────────────────────────────────────────── */}
      <View style={s.chipsRow}>
        {/* Primary face — the one to scan */}
        <View style={[s.chip, { backgroundColor: t.CARD, borderColor: faceAccent }]}>
          <View style={[s.chipDot, { backgroundColor: faceAccent }]} />
          <View>
            <Text style={[s.chipName, { color: t.TEXT }]}>{FACE_DISPLAY[primaryFace]}</Text>
            <Text style={[s.chipRole, { color: faceAccent }]}>FACE TO SCAN</Text>
          </View>
        </View>

        {/* Reference face — how to orient the cube */}
        <View style={[s.chip, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
          <View style={[s.chipDot, { backgroundColor: FACE_COLORS[referenceFace] }]} />
          <View>
            <Text style={[s.chipName, { color: t.TEXT }]}>{FACE_DISPLAY[referenceFace]}</Text>
            <Text style={[s.chipRole, { color: t.MUTED }]}>REFERENCE</Text>
          </View>
        </View>
      </View>

      {/* ── Instruction text ───────────────────────────────────────── */}
      <View style={s.instructionBox}>
        <Text style={[s.instructionText, { color: t.TEXT }]}>
          Hold the{" "}
          <Text style={[s.instructionBold, { color: faceAccent }]}>
            {FACE_FULL[primaryFace]}
          </Text>
          {"\n"}toward the camera.
        </Text>
        <Text style={[s.instructionSub, { color: t.MUTED }]}>
          Keep{" "}
          <Text style={{ color: FACE_COLORS[referenceFace], fontWeight: "600" }}>
            {FACE_DISPLAY[referenceFace]}
          </Text>
          {" "}face as your reference ({referenceFace === "U" ? "top" : "front"}).
        </Text>
      </View>

      {/* ── CTA button ─────────────────────────────────────────────── */}
      <Pressable
        style={[s.readyBtn, { backgroundColor: faceAccent }]}
        onPress={onReady}
      >
        <Text style={s.readyBtnTxt}>Ready — Open Camera</Text>
        <Ionicons name="chevron-forward" size={18} color="#000040" />
      </Pressable>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 18,
    width: "100%",
  },

  // Canvas
  canvasCard: {
    width: 240,
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
  },

  // Chips
  chipsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  chipName: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  chipRole: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
  },

  // Instructions
  instructionBox: {
    width: "100%",
    gap: 4,
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  instructionBold: {
    fontWeight: "800",
  },
  instructionSub: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  // Button
  readyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    borderRadius: 14,
    paddingVertical: 15,
    gap: 6,
  },
  readyBtnTxt: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000040",
  },
});
