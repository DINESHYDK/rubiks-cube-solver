import React, { useRef, useState, useEffect } from "react";
import { View } from "react-native";
import { Canvas, useFrame, extend } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import * as THREE from "three";

// Register RoundedBoxGeometry as a JSX element in R3F
extend({ RoundedBoxGeometry });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      roundedBoxGeometry: any;
    }
  }
}

// ── Colors ────────────────────────────────────────────────────────────────────

const COLORS = {
  R: "#B71234",
  L: "#FF5800",
  U: "#EEEEEE",
  D: "#FFD500",
  F: "#009B48",
  B: "#0046AD",
  CORE: "#050505",
} as const;

const COLOR_MAP: Record<string, string> = {
  white:  COLORS.U,
  red:    COLORS.R,
  green:  COLORS.F,
  yellow: COLORS.D,
  orange: COLORS.L,
  blue:   COLORS.B,
};

const spacing = 1.02;

// ── parseMove — exported for use in solve screen ──────────────────────────────
export const parseMove = (notation: string, isUndo = false) => {
  const base = notation.replace("'", "").replace("2", "");
  let isPrime = notation.includes("'");
  const isDouble = notation.includes("2");
  if (isUndo) isPrime = !isPrime;

  const dir = isPrime ? 1 : -1;
  const angle = isDouble ? 2 : 1;
  switch (base) {
    case "R": return { notation, axis: "x" as const, layer:  1, dir,    angle };
    case "L": return { notation, axis: "x" as const, layer: -1, dir: -dir, angle };
    case "U": return { notation, axis: "y" as const, layer:  1, dir,    angle };
    case "D": return { notation, axis: "y" as const, layer: -1, dir: -dir, angle };
    case "F": return { notation, axis: "z" as const, layer:  1, dir,    angle };
    case "B": return { notation, axis: "z" as const, layer: -1, dir: -dir, angle };
    default: return null;
  }
};

// ── Index mappers: 3D position → OpenCV scan array index ─────────────────────
const uIdx = (x: number, z: number) => (z + 1) * 3 + (x + 1);
const dIdx = (x: number, z: number) => (1 - z) * 3 + (x + 1);
const fIdx = (x: number, y: number) => (1 - y) * 3 + (x + 1);
const bIdx = (x: number, y: number) => (1 - y) * 3 + (1 - x);
const rIdx = (y: number, z: number) => (1 - y) * 3 + (z + 1);
const lIdx = (y: number, z: number) => (1 - y) * 3 + (1 - z);

// ── Sticker ───────────────────────────────────────────────────────────────────
const Sticker = ({
  color,
  pos,
  rot,
}: {
  color: string;
  pos: [number, number, number];
  rot: [number, number, number];
}) => (
  <mesh position={pos} rotation={rot}>
    <planeGeometry args={[0.82, 0.82]} />
    <meshPhysicalMaterial color={color} roughness={0.15} clearcoat={1} />
  </mesh>
);

// ── Cubie (with cubeState color mapping) ─────────────────────────────────────
const Cubie = ({
  pos,
  cubeState,
}: {
  pos: [number, number, number];
  cubeState?: any;
}) => {
  const [x, y, z] = pos;

  const cR = cubeState?.R ? COLOR_MAP[cubeState.R[rIdx(y, z)]] : COLORS.R;
  const cL = cubeState?.L ? COLOR_MAP[cubeState.L[lIdx(y, z)]] : COLORS.L;
  const cU = cubeState?.U ? COLOR_MAP[cubeState.U[uIdx(x, z)]] : COLORS.U;
  const cD = cubeState?.D ? COLOR_MAP[cubeState.D[dIdx(x, z)]] : COLORS.D;
  const cF = cubeState?.F ? COLOR_MAP[cubeState.F[fIdx(x, y)]] : COLORS.F;
  const cB = cubeState?.B ? COLOR_MAP[cubeState.B[bIdx(x, y)]] : COLORS.B;

  return (
    <group position={[x * spacing, y * spacing, z * spacing]}>
      <mesh>
        <roundedBoxGeometry args={[0.96, 0.96, 0.96, 4, 0.08]} />
        <meshPhysicalMaterial
          color={COLORS.CORE}
          roughness={0.2}
          metalness={0.1}
          clearcoat={1}
        />
      </mesh>

      {x === 1  && <Sticker color={cR} pos={[0.485, 0, 0]}  rot={[0, Math.PI / 2, 0]} />}
      {x === -1 && <Sticker color={cL} pos={[-0.485, 0, 0]} rot={[0, -Math.PI / 2, 0]} />}
      {y === 1  && <Sticker color={cU} pos={[0, 0.485, 0]}  rot={[-Math.PI / 2, 0, 0]} />}
      {y === -1 && <Sticker color={cD} pos={[0, -0.485, 0]} rot={[Math.PI / 2, 0, 0]} />}
      {z === 1  && <Sticker color={cF} pos={[0, 0, 0.485]}  rot={[0, 0, 0]} />}
      {z === -1 && <Sticker color={cB} pos={[0, 0, -0.485]} rot={[0, Math.PI, 0]} />}
    </group>
  );
};

// ── Scene ─────────────────────────────────────────────────────────────────────
const Scene = ({
  cubeState,
  currentMove,
  onMoveComplete,
  animationSpeed = 3.0,
  autoRotate = false,
}: {
  cubeState?: any;
  currentMove?: any;
  onMoveComplete?: () => void;
  animationSpeed?: number;
  autoRotate?: boolean;
}) => {
  const cubeGroupRef = useRef<THREE.Group>(null);
  const pivotRef     = useRef<THREE.Group>(null);
  const [animating, setAnimating] = useState(false);
  const animProgress = useRef(0);

  const initialCubies = useRef<[number, number, number][]>([]);
  if (initialCubies.current.length === 0) {
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++)
          initialCubies.current.push([x, y, z]);
  }

  useEffect(() => {
    if (currentMove && !animating && cubeGroupRef.current && pivotRef.current) {
      setAnimating(true);
      animProgress.current = 0;

      const children = [...cubeGroupRef.current.children];
      for (let i = children.length - 1; i >= 0; i--) {
        const c = children[i];
        if (c === pivotRef.current) continue;
        if (
          Math.abs(
            c.position[currentMove.axis as "x" | "y" | "z"] -
              currentMove.layer * spacing
          ) < 0.1
        ) {
          pivotRef.current.attach(c);
        }
      }
    }
  }, [currentMove]);

  useFrame((_, delta) => {
    if (autoRotate && !animating && cubeGroupRef.current) {
      cubeGroupRef.current.rotation.y += delta * 0.35;
    }

    if (animating && currentMove && pivotRef.current && cubeGroupRef.current) {
      animProgress.current += delta * animationSpeed;
      const easeInOut = (t: number) =>
        t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const progress = Math.min(animProgress.current, 1);

      pivotRef.current.rotation[currentMove.axis as "x" | "y" | "z"] =
        currentMove.dir * (Math.PI / 2) * easeInOut(progress);

      if (progress >= 1) {
        pivotRef.current.rotation[
          currentMove.axis as "x" | "y" | "z"
        ] = currentMove.dir * (Math.PI / 2);
        pivotRef.current.updateMatrixWorld();

        const pivotChildren = [...pivotRef.current.children];
        for (let i = pivotChildren.length - 1; i >= 0; i--) {
          const c = pivotChildren[i];
          cubeGroupRef.current.attach(c);
          c.position.set(
            Math.round(c.position.x / spacing) * spacing,
            Math.round(c.position.y / spacing) * spacing,
            Math.round(c.position.z / spacing) * spacing
          );
          c.rotation.set(
            Math.round(c.rotation.x / (Math.PI / 2)) * (Math.PI / 2),
            Math.round(c.rotation.y / (Math.PI / 2)) * (Math.PI / 2),
            Math.round(c.rotation.z / (Math.PI / 2)) * (Math.PI / 2)
          );
        }

        pivotRef.current.rotation.set(0, 0, 0);
        setAnimating(false);
        if (onMoveComplete) onMoveComplete();
      }
    }
  });

  return (
    <group>
      {/* Premium lighting — matches the reference HTML implementation */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} />
      <directionalLight position={[-4, -3, -4]} intensity={1.8} />
      <pointLight position={[0, 0, 2.5]} intensity={4} distance={10} />

      <group ref={cubeGroupRef}>
        <group ref={pivotRef} />
        {initialCubies.current.map((pos, idx) => (
          <Cubie key={idx} pos={pos} cubeState={cubeState} />
        ))}
      </group>
    </group>
  );
};

// ── Public Component ──────────────────────────────────────────────────────────
interface Cube3DProps {
  width?: number | string;
  height?: number;
  style?: object;
  cubeState?: any;
  currentMove?: any;
  onMoveComplete?: () => void;
  animationSpeed?: number;
  autoRotate?: boolean;
}

export default function Cube3D({
  width = "100%",
  height = 300,
  style,
  cubeState,
  currentMove,
  onMoveComplete,
  animationSpeed = 3.0,
  autoRotate = false,
}: Cube3DProps) {
  return (
    <View style={[{ width: width as any, height }, style]}>
      <Canvas
        camera={{ position: [5, 4, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene
          cubeState={cubeState}
          currentMove={currentMove}
          onMoveComplete={onMoveComplete}
          animationSpeed={animationSpeed}
          autoRotate={autoRotate}
        />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={4}
          maxDistance={15}
        />
      </Canvas>
    </View>
  );
}
