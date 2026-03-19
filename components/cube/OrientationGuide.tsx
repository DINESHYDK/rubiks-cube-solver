import React, { useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import * as THREE from "three";
import type { FaceName } from "@/types/cube";
import { ACCENT, CARD, BG, TEXT, MUTED, BORDER } from "@/lib/theme";

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
  U: "White (Top)",
  R: "Red (Right)",
  F: "Green (Front)",
  D: "Yellow (Bottom)",
  L: "Orange (Left)",
  B: "Blue (Back)",
};

// The center cubie position for each face
const FACE_CENTERS: Record<FaceName, [number, number, number]> = {
  U: [0,  1,  0],
  D: [0, -1,  0],
  F: [0,  0,  1],
  B: [0,  0, -1],
  R: [1,  0,  0],
  L: [-1, 0,  0],
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

const spacing = 1.02;
const GHOST_COLOR   = "#888888";
const GHOST_OPACITY = 0.08;

// ── Three.js helpers ──────────────────────────────────────────────────────────

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
      roughness={0.15}
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

  const color = (face: FaceName) =>
    highlights.includes(face) && isCenter(pos, face)
      ? FACE_COLORS[face]
      : GHOST_COLOR;

  const opacity = (face: FaceName) =>
    highlights.includes(face) && isCenter(pos, face) ? 1.0 : GHOST_OPACITY;

  return (
    <group position={[x * spacing, y * spacing, z * spacing]}>
      <mesh>
        <boxGeometry args={[0.96, 0.96, 0.96]} />
        <meshPhysicalMaterial color="#050505" roughness={0.2} metalness={0.1} clearcoat={1} />
      </mesh>
      {x === 1  && <GhostSticker color={color("R")} opacity={opacity("R")} pos={[0.485, 0, 0]}  rot={[0, Math.PI / 2, 0]} />}
      {x === -1 && <GhostSticker color={color("L")} opacity={opacity("L")} pos={[-0.485, 0, 0]} rot={[0, -Math.PI / 2, 0]} />}
      {y === 1  && <GhostSticker color={color("U")} opacity={opacity("U")} pos={[0, 0.485, 0]}  rot={[-Math.PI / 2, 0, 0]} />}
      {y === -1 && <GhostSticker color={color("D")} opacity={opacity("D")} pos={[0, -0.485, 0]} rot={[Math.PI / 2, 0, 0]} />}
      {z === 1  && <GhostSticker color={color("F")} opacity={opacity("F")} pos={[0, 0, 0.485]}  rot={[0, 0, 0]} />}
      {z === -1 && <GhostSticker color={color("B")} opacity={opacity("B")} pos={[0, 0, -0.485]} rot={[0, Math.PI, 0]} />}
    </group>
  );
};

const CUBIES: [number, number, number][] = [];
for (let x = -1; x <= 1; x++)
  for (let y = -1; y <= 1; y++)
    for (let z = -1; z <= 1; z++)
      CUBIES.push([x, y, z]);

const GhostScene = ({ currentFace }: { currentFace: FaceName }) => {
  const groupRef = useRef<THREE.Group>(null);
  const highlights = HIGHLIGHT_MAP[currentFace];

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.4;
  });

  return (
    <group>
      <ambientLight intensity={0.9} />
      <directionalLight position={[10, 15, 10]} intensity={1.1} />
      <directionalLight position={[-4, -3, -4]} intensity={0.2} />
      <group ref={groupRef} rotation={[0.4, 0.5, 0]}>
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

export default function OrientationGuide({
  currentFace,
  onReady,
}: OrientationGuideProps) {
  return (
    <View style={styles.container}>
      <View style={styles.canvasWrap}>
        <Canvas
          camera={{ position: [5, 4, 6], fov: 45 }}
          gl={{ antialias: true }}
        >
          <GhostScene currentFace={currentFace} />
        </Canvas>
      </View>

      <Text style={styles.instruction}>
        Hold the{" "}
        <Text style={[styles.instruction, styles.faceHighlight]}>
          {FACE_DISPLAY[currentFace]}
        </Text>{" "}
        face toward the camera
      </Text>

      <Pressable style={styles.readyBtn} onPress={onReady}>
        <Text style={styles.readyBtnTxt}>Ready — Open Camera</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 20,
  },
  canvasWrap: {
    width: 200,
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  instruction: {
    fontSize: 15,
    color: TEXT,
    textAlign: "center",
    paddingHorizontal: 24,
    lineHeight: 22,
  },
  faceHighlight: {
    color: ACCENT,
    fontWeight: "700",
  },
  readyBtn: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  readyBtnTxt: {
    fontSize: 15,
    fontWeight: "700",
    color: "#000040",
  },
});
