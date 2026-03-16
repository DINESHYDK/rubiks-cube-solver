import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, OrbitControls } from "@react-three/drei/native"; // Note: /native for Expo
import * as THREE from "three";

const COLORS = {
  R: "#B71234",
  L: "#FF5800",
  U: "#EEEEEE",
  D: "#FFD500",
  F: "#009B48",
  B: "#0046AD",
  CORE: "#050505",
};
const spacing = 1.02;

// --- Helper: Convert Notation (e.g., "R", "U'") to Physics Math ---
export const parseMove = (notation: string, isUndo = false) => {
  const base = notation.replace("'", "");
  let isPrime = notation.includes("'");
  if (isUndo) isPrime = !isPrime;

  const dir = isPrime ? 1 : -1;
  switch (base) {
    case "R":
      return { notation, axis: "x", layer: 1, dir: dir };
    case "L":
      return { notation, axis: "x", layer: -1, dir: -dir };
    case "U":
      return { notation, axis: "y", layer: 1, dir: dir };
    case "D":
      return { notation, axis: "y", layer: -1, dir: -dir };
    case "F":
      return { notation, axis: "z", layer: 1, dir: dir };
    case "B":
      return { notation, axis: "z", layer: -1, dir: -dir };
    default:
      return null;
  }
};

// --- The Individual Cubie (Sticker Architecture) ---
const Cubie = ({ pos }: { pos: [number, number, number] }) => {
  return (
    <group position={[pos[0] * spacing, pos[1] * spacing, pos[2] * spacing]}>
      <RoundedBox args={[0.96, 0.96, 0.96]} radius={0.06} smoothness={4}>
        <meshPhysicalMaterial
          color={COLORS.CORE}
          roughness={0.2}
          metalness={0.1}
          clearcoat={1}
        />
      </RoundedBox>

      {pos[0] === 1 && (
        <Sticker
          color={COLORS.R}
          pos={[0.485, 0, 0]}
          rot={[0, Math.PI / 2, 0]}
        />
      )}
      {pos[0] === -1 && (
        <Sticker
          color={COLORS.L}
          pos={[-0.485, 0, 0]}
          rot={[0, -Math.PI / 2, 0]}
        />
      )}
      {pos[1] === 1 && (
        <Sticker
          color={COLORS.U}
          pos={[0, 0.485, 0]}
          rot={[-Math.PI / 2, 0, 0]}
        />
      )}
      {pos[1] === -1 && (
        <Sticker
          color={COLORS.D}
          pos={[0, -0.485, 0]}
          rot={[Math.PI / 2, 0, 0]}
        />
      )}
      {pos[2] === 1 && (
        <Sticker color={COLORS.F} pos={[0, 0, 0.485]} rot={[0, 0, 0]} />
      )}
      {pos[2] === -1 && (
        <Sticker color={COLORS.B} pos={[0, 0, -0.485]} rot={[0, Math.PI, 0]} />
      )}
    </group>
  );
};

const Sticker = ({ color, pos, rot }: any) => (
  <mesh position={pos} rotation={rot}>
    <planeGeometry args={[0.82, 0.82]} />
    <meshPhysicalMaterial color={color} roughness={0.15} clearcoat={1} />
  </mesh>
);

// --- The Core Scene Logic ---
const Scene = ({ currentMove, onMoveComplete, animationSpeed = 3.0 }: any) => {
  const cubeGroupRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(null);
  const [animating, setAnimating] = useState(false);
  const animProgress = useRef(0);

  // Generate the 27 positions once
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

  // Intercept the new move and prepare the Pivot Group
  useEffect(() => {
    if (currentMove && !animating && cubeGroupRef.current && pivotRef.current) {
      setAnimating(true);
      animProgress.current = 0;

      // Attach targeted cubies to the pivot
      const children = [...cubeGroupRef.current.children];
      for (let i = children.length - 1; i >= 0; i--) {
        const c = children[i];
        if (c === pivotRef.current) continue;
        // Target the specific face layer
        if (
          Math.abs(
            c.position[currentMove.axis as "x" | "y" | "z"] -
              currentMove.layer * spacing,
          ) < 0.1
        ) {
          pivotRef.current.attach(c);
        }
      }
    }
  }, [currentMove]);

  // The 60FPS Animation Loop
  useFrame((state, delta) => {
    if (animating && currentMove && pivotRef.current && cubeGroupRef.current) {
      animProgress.current += delta * animationSpeed;

      const easeInOut = (t: number) =>
        t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      let progress = Math.min(animProgress.current, 1);

      pivotRef.current.rotation[currentMove.axis as "x" | "y" | "z"] =
        currentMove.dir * (Math.PI / 2) * easeInOut(progress);

      if (progress >= 1) {
        // Snap to perfect 90 degrees
        pivotRef.current.rotation[currentMove.axis as "x" | "y" | "z"] =
          currentMove.dir * (Math.PI / 2);
        pivotRef.current.updateMatrixWorld();

        // Detach back to main group and fix floating point math drift
        const pivotChildren = [...pivotRef.current.children];
        for (let i = pivotChildren.length - 1; i >= 0; i--) {
          const c = pivotChildren[i];
          cubeGroupRef.current.attach(c);
          c.position.set(
            Math.round(c.position.x / spacing) * spacing,
            Math.round(c.position.y / spacing) * spacing,
            Math.round(c.position.z / spacing) * spacing,
          );
          c.rotation.set(
            Math.round(c.rotation.x / (Math.PI / 2)) * (Math.PI / 2),
            Math.round(c.rotation.y / (Math.PI / 2)) * (Math.PI / 2),
            Math.round(c.rotation.z / (Math.PI / 2)) * (Math.PI / 2),
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
      <group ref={cubeGroupRef}>
        <group ref={pivotRef} />
        {initialCubies.current.map((pos, idx) => (
          <Cubie key={idx} pos={pos} />
        ))}
      </group>
    </group>
  );
};

export default function Cube3D({
  currentMove,
  onMoveComplete,
  animationSpeed,
}: any) {
  return (
    <Canvas camera={{ position: [5, 4, 6], fov: 45 }}>
      <Scene
        currentMove={currentMove}
        onMoveComplete={onMoveComplete}
        animationSpeed={animationSpeed}
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={4}
        maxDistance={15}
      />
    </Canvas>
  );
}
