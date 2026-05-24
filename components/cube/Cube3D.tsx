import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, PanResponder } from "react-native";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber/native";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import * as THREE from "three/build/three.cjs";

// Register RoundedBoxGeometry as a JSX element in R3F
extend({ RoundedBoxGeometry });

// TypeScript: let JSX know about the custom geometry element
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
  const angle = isDouble ? 2 : 1;

  switch (base) {
    case "R":
      // Clockwise from right (+x) = negative x rotation
      return { notation, axis: "x" as const, layer:  1, dir: isPrime ? 1 : -1, angle };
    case "L":
      // Clockwise from left (-x) = positive x rotation
      return { notation, axis: "x" as const, layer: -1, dir: isPrime ? -1 : 1, angle };
    case "U":
      // Clockwise from above (+y) = negative y rotation
      return { notation, axis: "y" as const, layer:  1, dir: isPrime ? 1 : -1, angle };
    case "D":
      // Clockwise from below (-y) = positive y rotation
      return { notation, axis: "y" as const, layer: -1, dir: isPrime ? -1 : 1, angle };
    case "F":
      // Clockwise from front (+z) = negative z rotation
      return { notation, axis: "z" as const, layer:  1, dir: isPrime ? 1 : -1, angle };
    case "B":
      // Clockwise from back (-z) = positive z rotation
      return { notation, axis: "z" as const, layer: -1, dir: isPrime ? -1 : 1, angle };
    default: return null;
  }
};

// ── Index mappers: 3D position → scan array index ────────────────────────────
// Scan reads LEFT→RIGHT, TOP→BOTTOM: index = row * 3 + col
//
// U — White toward camera, tilt backward (Green/z=+1 goes DOWN → row 2)
//   TOP = z=-1 (Blue edge)  LEFT = x=-1 (Orange)
const uIdx = (x: number, z: number) => (z + 1) * 3 + (x + 1);

// D — Yellow toward camera, Green on top (Green/z=+1 is TOP → row 0)
//   TOP = z=+1 (Green edge)  LEFT = x=-1 (Orange)
const dIdx = (x: number, z: number) => (1 - z) * 3 + (x + 1);

// F — Green toward camera, White on top
//   TOP = y=+1 (White)  LEFT = x=-1 (Orange)
const fIdx = (x: number, y: number) => (1 - y) * 3 + (x + 1);

// B — Blue toward camera, White on top (rotate over back, left/right unchanged)
//   TOP = y=+1 (White)  LEFT = x=-1 (Orange)
const bIdx = (x: number, y: number) => (1 - y) * 3 + (1 - x);

// R — Red toward camera, White on top (rotate left, Green/z=+1 comes to LEFT)
//   TOP = y=+1 (White)  LEFT = z=+1 (Green/Front)
const rIdx = (y: number, z: number) => (1 - y) * 3 + (1 - z);

// L — Orange toward camera, White on top (rotate right, Blue/z=-1 comes to LEFT)
//   TOP = y=+1 (White)  LEFT = z=-1 (Blue/Back)
const lIdx = (y: number, z: number) => (1 - y) * 3 + (z + 1);

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

// ── Cubie ─────────────────────────────────────────────────────────────────────
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
// Captures R3F's invalidate() so PanResponder can trigger demand-mode re-renders
const InvalidateBridge = ({
  invalidateRef,
}: {
  invalidateRef: React.MutableRefObject<(() => void) | null>;
}) => {
  const { invalidate } = useThree();
  invalidateRef.current = invalidate;
  return null;
};

const Scene = ({
  cubeState,
  currentMove,
  onMoveComplete,
  animationSpeed = 3.0,
  autoRotate = false,
  rotationRef,
  paused = false,
}: {
  cubeState?: any;
  currentMove?: any;
  onMoveComplete?: () => void;
  animationSpeed?: number;
  autoRotate?: boolean;
  rotationRef?: React.MutableRefObject<{ x: number; y: number }>;
  paused?: boolean;
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

  // cubieSlots[N] = current physical grid position of cubie N.
  // Must stay in sync with Three.js object positions so color lookups
  // and sticker visibility (x===1 etc.) use the correct coordinates.
  const [cubieSlots, setCubieSlots] = useState<[number, number, number][]>(
    () => initialCubies.current.map((p) => [...p] as [number, number, number])
  );

  // Helper: apply one 90° rotation step in pure JS (same math as the pivot animation)
  const rotateSlot = (
    [x, y, z]: [number, number, number],
    axis: "x" | "y" | "z",
    dir: number
  ): [number, number, number] => {
    const v = new THREE.Vector3(x, y, z);
    const q = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(axis === "x" ? 1 : 0, axis === "y" ? 1 : 0, axis === "z" ? 1 : 0),
      dir * (Math.PI / 2)
    );
    v.applyQuaternion(q);
    return [Math.round(v.x), Math.round(v.y), Math.round(v.z)];
  };

  // Geometry reset on mount — clears stale pivot state from tab navigation
  useEffect(() => {
    if (!cubeGroupRef.current || !pivotRef.current) return;
    const lingering = [...pivotRef.current.children];
    for (const c of lingering) {
      cubeGroupRef.current.attach(c);
      c.position.set(
        Math.round(c.position.x / spacing) * spacing,
        Math.round(c.position.y / spacing) * spacing,
        Math.round(c.position.z / spacing) * spacing
      );
    }
    pivotRef.current.rotation.set(0, 0, 0);
    // Reset slot tracking to match fresh Three.js positions
    setCubieSlots(initialCubies.current.map((p) => [...p] as [number, number, number]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (paused && !animating) return;

    if (autoRotate && !animating && cubeGroupRef.current) {
      cubeGroupRef.current.rotation.y += delta * 0.35;
    }

    if (rotationRef && cubeGroupRef.current && !autoRotate) {
      cubeGroupRef.current.rotation.y = rotationRef.current.y;
      cubeGroupRef.current.rotation.x = rotationRef.current.x;
    }

    // Parent cleared the move mid-animation (tab navigation) — unblock the queue
    if (animating && !currentMove && pivotRef.current && cubeGroupRef.current) {
      const lingering = [...pivotRef.current.children];
      for (const c of lingering) {
        cubeGroupRef.current.attach(c);
        c.position.set(
          Math.round(c.position.x / spacing) * spacing,
          Math.round(c.position.y / spacing) * spacing,
          Math.round(c.position.z / spacing) * spacing
        );
      }
      pivotRef.current.rotation.set(0, 0, 0);
      // Reset slot tracking — aborted animation leaves state unknown, reset to initial
      setCubieSlots(initialCubies.current.map((p) => [...p] as [number, number, number]));
      setAnimating(false);
    }

    if (animating && currentMove && pivotRef.current && cubeGroupRef.current) {
      animProgress.current += delta * animationSpeed;
      const easeInOut = (t: number) =>
        t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const progress = Math.min(animProgress.current, 1);

      pivotRef.current.rotation[currentMove.axis as "x" | "y" | "z"] =
        currentMove.dir * (Math.PI / 2) * currentMove.angle * easeInOut(progress);

      if (progress >= 1) {
        // 1. Snap pivot to exact final angle
        pivotRef.current.rotation[currentMove.axis as "x" | "y" | "z"] =
          currentMove.dir * (Math.PI / 2) * currentMove.angle;
        pivotRef.current.updateMatrixWorld();

        const pivotChildren = [...pivotRef.current.children];
        for (let i = pivotChildren.length - 1; i >= 0; i--) {
          const c = pivotChildren[i];

          // 2. Capture true world position + quaternion before detaching
          const worldPos  = new THREE.Vector3();
          const worldQuat = new THREE.Quaternion();
          c.getWorldPosition(worldPos);
          c.getWorldQuaternion(worldQuat);

          // 3. Re-attach to main cube group
          cubeGroupRef.current.attach(c);

          // 4. Snap position to grid
          c.position.set(
            Math.round(worldPos.x / spacing) * spacing,
            Math.round(worldPos.y / spacing) * spacing,
            Math.round(worldPos.z / spacing) * spacing
          );

          // 5. Apply exact world quaternion then snap Euler angles —
          //    avoids floating-point drift corrupting 180° (U2/F2/etc.) snaps
          c.quaternion.copy(worldQuat);
          const euler = new THREE.Euler().setFromQuaternion(c.quaternion);
          c.rotation.set(
            Math.round(euler.x / (Math.PI / 2)) * (Math.PI / 2),
            Math.round(euler.y / (Math.PI / 2)) * (Math.PI / 2),
            Math.round(euler.z / (Math.PI / 2)) * (Math.PI / 2)
          );
        }

        // 6. Reset pivot for next move
        pivotRef.current.rotation.set(0, 0, 0);

        // 7. Update React slot tracking to match new Three.js positions.
        //    Without this, Cubie color lookups and sticker visibility use
        //    stale original coordinates → visual corruption after moves.
        const { axis, layer, dir, angle } = currentMove;
        setCubieSlots((prev) =>
          prev.map((slot) => {
            const axisCoord = slot[axis === "x" ? 0 : axis === "y" ? 1 : 2];
            if (Math.abs(axisCoord - layer) > 0.1) return slot;
            let result = slot;
            for (let a = 0; a < angle; a++) result = rotateSlot(result, axis, dir);
            return result;
          })
        );

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
        {cubieSlots.map((pos, idx) => (
          <Cubie key={idx} pos={pos} cubeState={cubeState} />
        ))}
      </group>
    </group>
  );
};

// ── Error Boundary ────────────────────────────────────────────────────────────
class Cube3DErrorBoundary extends React.Component<
  { children: React.ReactNode; height: number },
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
    console.warn("[Cube3D] GL rendering failed:", error?.message);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={[fallback.container, { height: this.props.height }]}>
          <Text style={fallback.text}>3D view unavailable on this device</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const fallback = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0A0A5C",
    borderRadius: 16,
  },
  text: { color: "#8899CC", fontSize: 13 },
});

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
  paused?: boolean;
  frameloop?: "always" | "demand";
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
  paused = false,
  frameloop = "always",
}: Cube3DProps) {
  const rotationRef   = useRef({ x: 0.6, y: 0.7 });
  const lastTouchRef  = useRef({ x: 0, y: 0 });
  const invalidateRef = useRef<(() => void) | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !autoRotate,
      onMoveShouldSetPanResponder: () => !autoRotate,
      onPanResponderGrant: (_, g) => {
        lastTouchRef.current = { x: g.x0, y: g.y0 };
      },
      onPanResponderMove: (_, g) => {
        const dx = g.moveX - lastTouchRef.current.x;
        const dy = g.moveY - lastTouchRef.current.y;
        rotationRef.current = {
          x: rotationRef.current.x + dy * 0.005,
          y: rotationRef.current.y + dx * 0.005,
        };
        lastTouchRef.current = { x: g.moveX, y: g.moveY };
        // In demand mode, drag must manually trigger a re-render
        invalidateRef.current?.();
      },
    })
  ).current;

  return (
    <Cube3DErrorBoundary height={height}>
      <View
        style={[{ width: width as any, height }, style]}
        {...panResponder.panHandlers}
      >
        <Canvas
          camera={{ position: [5, 4, 6], fov: 45 }}
          gl={{ antialias: true }}
          frameloop={frameloop}
        >
          {frameloop === "demand" && (
            <InvalidateBridge invalidateRef={invalidateRef} />
          )}
          <Scene
            cubeState={cubeState}
            currentMove={currentMove}
            onMoveComplete={onMoveComplete}
            animationSpeed={animationSpeed}
            autoRotate={autoRotate}
            rotationRef={autoRotate ? undefined : rotationRef}
            paused={paused}
          />
        </Canvas>
      </View>
    </Cube3DErrorBoundary>
  );
}
