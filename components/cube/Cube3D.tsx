import React, { useRef, useMemo } from "react";
import { View } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import type { Group } from "three";
import type { CubeState, CubeColor } from "@/types/cube";
import { SOLVED_STATE } from "@/lib/constants";
import { RoundedBox } from "@react-three/drei/native";

// ── Color hex map ─────────────────────────────────────────────────────────────
const HEX: Record<CubeColor, string> = {
  white: "#FFFFFF",
  red: "#B71234",
  green: "#009B48",
  yellow: "#FFD500",
  orange: "#FF5800",
  blue: "#0046AD",
};
const X = "#111111"; // inner face

// ── Sticker index mapping ─────────────────────────────────────────────────────
// Each face's 9 stickers are indexed 0-8 (row-major, top-left to bottom-right
// when looking directly at that face in standard orientation).
const uIdx = (x: number, z: number) => (z + 1) * 3 + (x + 1);
const dIdx = (x: number, z: number) => (1 - z) * 3 + (x + 1);
const fIdx = (x: number, y: number) => (1 - y) * 3 + (x + 1);
const bIdx = (x: number, y: number) => (1 - y) * 3 + (1 - x);
const rIdx = (y: number, z: number) => (1 - y) * 3 + (z + 1);
const lIdx = (y: number, z: number) => (1 - y) * 3 + (1 - z);

// Box geometry face order: +x, -x, +y, -y, +z, -z
function cubieColors(x: number, y: number, z: number, s: CubeState): string[] {
  return [
    x === 1 ? HEX[s.R[rIdx(y, z)]] : X,
    x === -1 ? HEX[s.L[lIdx(y, z)]] : X,
    y === 1 ? HEX[s.U[uIdx(x, z)]] : X,
    y === -1 ? HEX[s.D[dIdx(x, z)]] : X,
    z === 1 ? HEX[s.F[fIdx(x, y)]] : X,
    z === -1 ? HEX[s.B[bIdx(x, y)]] : X,
  ];
}

// ── Components ────────────────────────────────────────────────────────────────
type Pos = [number, number, number];

function Cubie({ pos, colors }: { pos: Pos; colors: string[] }) {
  return (
    <group position={[pos[0] * 1.02, pos[1] * 1.02, pos[2] * 1.02]}>
      {/* We use RoundedBox for that premium, physical speed-cube look */}
      <RoundedBox args={[0.96, 0.96, 0.96]} radius={0.08} smoothness={4}>
        {colors.map((c, i) => (
          <meshPhysicalMaterial
            key={i}
            attach={`material-${i}`}
            color={c}
            roughness={0.15} // Lower roughness = shinier
            metalness={0.05}
            clearcoat={1.0} // Gives it that hard-plastic glare
            clearcoatRoughness={0.1}
          />
        ))}
      </RoundedBox>
    </group>
  );
}

const POSITIONS: Pos[] = [];
for (let x = -1; x <= 1; x++)
  for (let y = -1; y <= 1; y++)
    for (let z = -1; z <= 1; z++)
      if (!(x === 0 && y === 0 && z === 0)) POSITIONS.push([x, y, z]);

function Scene({
  cubeState,
  autoRotate,
}: {
  cubeState: CubeState;
  autoRotate: boolean;
}) {
  const groupRef = useRef<Group>(null!);

  useFrame((_, delta) => {
    if (autoRotate) {
      groupRef.current.rotation.y += delta * 0.55;
      groupRef.current.rotation.x += delta * 0.08;
    }
  });

  const cubies = useMemo(
    () =>
      POSITIONS.map((pos) => ({
        pos,
        colors: cubieColors(pos[0], pos[1], pos[2], cubeState),
      })),
    [cubeState],
  );

  return (
    <group ref={groupRef} rotation={[0.35, 0.55, 0]}>
      {cubies.map(({ pos, colors }) => (
        <Cubie key={pos.join(",")} pos={pos} colors={colors} />
      ))}
    </group>
  );
}

// ── Public API ────────────────────────────────────────────────────────────────
interface Cube3DProps {
  width?: number | string;
  height?: number;
  style?: object;
  cubeState?: CubeState;
  autoRotate?: boolean;
}

export default function Cube3D({
  width = "100%",
  height = 300,
  style,
  cubeState,
  autoRotate = true,
}: Cube3DProps) {
  const state = cubeState ?? SOLVED_STATE;
  return (
    <View style={[{ width: width as any, height }, style]}>
      <Canvas
        camera={{ position: [4, 3, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[6, 8, 6]} intensity={1.4} />
        <directionalLight position={[-4, -3, -4]} intensity={0.3} />
        <Scene cubeState={state} autoRotate={autoRotate} />
      </Canvas>
    </View>
  );
}
