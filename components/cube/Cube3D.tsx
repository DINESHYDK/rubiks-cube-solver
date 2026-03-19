import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, PanResponder } from "react-native";
import { Canvas, useFrame } from "@react-three/fiber/native";
import * as THREE from "three";

const COLORS = {
  R: "#B71234",
  L: "#FF5800",
  U: "#EEEEEE",
  D: "#FFD500",
  F: "#009B48",
  B: "#0046AD",
  CORE: "#050505",
} as const;

// Map the string colors from your OpenCV scan to the Hex colors in 3D
const COLOR_MAP: Record<string, string> = {
  white: COLORS.U,
  red: COLORS.R,
  green: COLORS.F,
  yellow: COLORS.D,
  orange: COLORS.L,
  blue: COLORS.B,
};

const spacing = 1.02;

// --- Helper: Convert Notation (e.g., "R", "U'") to Physics Math ---
export const parseMove = (notation: string, isUndo = false) => {
  const base = notation.replace("'", "").replace("2", "");
  let isPrime = notation.includes("'");
  const isDouble = notation.includes("2");
  if (isUndo) isPrime = !isPrime;

  const dir = isPrime ? 1 : -1;
  const angle = isDouble ? 2 : 1;
  switch (base) {
    case "R": return { notation, axis: "x" as const, layer: 1, dir, angle };
    case "L": return { notation, axis: "x" as const, layer: -1, dir: -dir, angle };
    case "U": return { notation, axis: "y" as const, layer: 1, dir, angle };
    case "D": return { notation, axis: "y" as const, layer: -1, dir: -dir, angle };
    case "F": return { notation, axis: "z" as const, layer: 1, dir, angle };
    case "B": return { notation, axis: "z" as const, layer: -1, dir: -dir, angle };
    default: return null;
  }
};

// --- OpenCV Array to 3D Coordinate Mappers ---
const uIdx = (x: number, z: number) => (z + 1) * 3 + (x + 1);
const dIdx = (x: number, z: number) => (1 - z) * 3 + (x + 1);
const fIdx = (x: number, y: number) => (1 - y) * 3 + (x + 1);
const bIdx = (x: number, y: number) => (1 - y) * 3 + (1 - x);
const rIdx = (y: number, z: number) => (1 - y) * 3 + (z + 1);
const lIdx = (y: number, z: number) => (1 - y) * 3 + (1 - z);

// --- Sticker Component ---
const Sticker = ({ color, pos, rot }: { color: string; pos: [number, number, number]; rot: [number, number, number]; }) => (
  <mesh position={pos} rotation={rot}>
    <planeGeometry args={[0.82, 0.82]} />
    <meshPhysicalMaterial color={color} roughness={0.15} clearcoat={1} />
  </mesh>
);

// --- The Individual Cubie ---
const Cubie = ({ pos, cubeState }: { pos: [number, number, number]; cubeState?: any }) => {
  const [x, y, z] = pos;

  // Bridge: Map the 3D position to the 2D OpenCV Scan Array
  const cR = cubeState?.R ? COLOR_MAP[cubeState.R[rIdx(y, z)]] : COLORS.R;
  const cL = cubeState?.L ? COLOR_MAP[cubeState.L[lIdx(y, z)]] : COLORS.L;
  const cU = cubeState?.U ? COLOR_MAP[cubeState.U[uIdx(x, z)]] : COLORS.U;
  const cD = cubeState?.D ? COLOR_MAP[cubeState.D[dIdx(x, z)]] : COLORS.D;
  const cF = cubeState?.F ? COLOR_MAP[cubeState.F[fIdx(x, y)]] : COLORS.F;
  const cB = cubeState?.B ? COLOR_MAP[cubeState.B[bIdx(x, y)]] : COLORS.B;

  return (
    <group position={[x * spacing, y * spacing, z * spacing]}>
      <mesh>
        <boxGeometry args={[0.96, 0.96, 0.96]} />
        <meshPhysicalMaterial color={COLORS.CORE} roughness={0.2} metalness={0.1} clearcoat={1} />
      </mesh>

      {x === 1 && <Sticker color={cR} pos={[0.485, 0, 0]} rot={[0, Math.PI / 2, 0]} />}
      {x === -1 && <Sticker color={cL} pos={[-0.485, 0, 0]} rot={[0, -Math.PI / 2, 0]} />}
      {y === 1 && <Sticker color={cU} pos={[0, 0.485, 0]} rot={[-Math.PI / 2, 0, 0]} />}
      {y === -1 && <Sticker color={cD} pos={[0, -0.485, 0]} rot={[Math.PI / 2, 0, 0]} />}
      {z === 1 && <Sticker color={cF} pos={[0, 0, 0.485]} rot={[0, 0, 0]} />}
      {z === -1 && <Sticker color={cB} pos={[0, 0, -0.485]} rot={[0, Math.PI, 0]} />}
    </group>
  );
};

// --- The Core Scene Logic ---
const Scene = ({
  cubeState,
  currentMove,
  onMoveComplete,
  animationSpeed = 3.0,
  autoRotate = false,
  rotationRef,
}: {
  cubeState?: any;
  currentMove?: any;
  onMoveComplete?: () => void;
  animationSpeed?: number;
  autoRotate?: boolean;
  rotationRef?: React.MutableRefObject<{ x: number; y: number }>;
}) => {
  const cubeGroupRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(null);
  const [animating, setAnimating] = useState(false);
  const animProgress = useRef(0);

  const initialCubies = useRef<[number, number, number][]>([]);
  if (initialCubies.current.length === 0) {
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          initialCubies.current.push([x, y, z]);
        }
      }
    }
  }

  useEffect(() => {
    if (currentMove && !animating && cubeGroupRef.current && pivotRef.current) {
      setAnimating(true);
      animProgress.current = 0;

      const children = [...cubeGroupRef.current.children];
      for (let i = children.length - 1; i >= 0; i--) {
        const c = children[i];
        if (c === pivotRef.current) continue;
        if (Math.abs(c.position[currentMove.axis as "x" | "y" | "z"] - currentMove.layer * spacing) < 0.1) {
          pivotRef.current.attach(c);
        }
      }
    }
  }, [currentMove]);

  useFrame((_, delta) => {
    if (autoRotate && !animating && cubeGroupRef.current) {
      cubeGroupRef.current.rotation.y += delta * 0.35;
    }

    if (rotationRef && cubeGroupRef.current && !autoRotate) {
      cubeGroupRef.current.rotation.y = rotationRef.current.y;
      cubeGroupRef.current.rotation.x = rotationRef.current.x;
    }

    if (animating && currentMove && pivotRef.current && cubeGroupRef.current) {
      animProgress.current += delta * animationSpeed;

      const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const progress = Math.min(animProgress.current, 1);

      pivotRef.current.rotation[currentMove.axis as "x" | "y" | "z"] =
        currentMove.dir * (Math.PI / 2) * easeInOut(progress);

      if (progress >= 1) {
        pivotRef.current.rotation[currentMove.axis as "x" | "y" | "z"] = currentMove.dir * (Math.PI / 2);
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
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 15, 10]} intensity={1.2} />
      <directionalLight position={[-4, -3, -4]} intensity={0.3} />
      <group ref={cubeGroupRef}>
        <group ref={pivotRef} />
        {initialCubies.current.map((pos, idx) => (
          <Cubie key={idx} pos={pos} cubeState={cubeState} />
        ))}
      </group>
    </group>
  );
};

// --- Error Boundary Fallback ---
class Cube3DErrorBoundary extends React.Component<
  { children: React.ReactNode; height: number },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.warn("[Cube3D] GL rendering failed:", error?.message); }
  render() {
    if (this.state.hasError) {
      return (
        <View style={[fallbackStyles.container, { height: this.props.height }]}>
          <Text style={fallbackStyles.emoji}>🧊</Text>
          <Text style={fallbackStyles.text}>3D view unavailable on this device</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const fallbackStyles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", backgroundColor: "#161B22", borderRadius: 16 },
  emoji: { fontSize: 48, marginBottom: 8 },
  text: { color: "#8B949E", fontSize: 13 },
});

// --- Exported Component ---
interface Cube3DProps {
  width?: number | string;
  height?: number;
  style?: object;
  cubeState?: any;  // <-- THE BRIDGE IS NOW HERE
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
  const rotationRef = useRef({ x: 0.6, y: 0.7 });
  const lastTouchRef = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !autoRotate,
      onMoveShouldSetPanResponder: () => !autoRotate,
      onPanResponderGrant: (_, gestureState) => {
        lastTouchRef.current = { x: gestureState.x0, y: gestureState.y0 };
      },
      onPanResponderMove: (_, gestureState) => {
        const dx = gestureState.moveX - lastTouchRef.current.x;
        const dy = gestureState.moveY - lastTouchRef.current.y;
        rotationRef.current = {
          x: rotationRef.current.x + dy * 0.005,
          y: rotationRef.current.y + dx * 0.005,
        };
        lastTouchRef.current = { x: gestureState.moveX, y: gestureState.moveY };
      },
    })
  ).current;

  return (
    <Cube3DErrorBoundary height={height}>
      <View style={[{ width: width as any, height }, style]} {...panResponder.panHandlers}>
        <Canvas camera={{ position: [5, 4, 6], fov: 45 }} gl={{ antialias: true }}>
          <Scene
            cubeState={cubeState}
            currentMove={currentMove}
            onMoveComplete={onMoveComplete}
            animationSpeed={animationSpeed}
            autoRotate={autoRotate}
            rotationRef={autoRotate ? undefined : rotationRef}
          />
        </Canvas>
      </View>
    </Cube3DErrorBoundary>
  );
}