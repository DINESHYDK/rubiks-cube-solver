import React, { useRef, useState, useEffect } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const COLORS = {
  R: '#B71234',
  L: '#FF5800',
  U: '#EEEEEE',
  D: '#FFD500',
  F: '#009B48',
  B: '#0046AD',
  CORE: '#050505',
} as const;

const spacing = 1.02;

// --- Helper: Convert Notation to Physics Move ---
export const parseMove = (notation: string, isUndo = false) => {
  const base = notation.replace("'", "").replace("2", "");
  let isPrime = notation.includes("'");
  const isDouble = notation.includes("2");
  if (isUndo) isPrime = !isPrime;

  const dir = isPrime ? 1 : -1;
  const angle = isDouble ? 2 : 1; // Number of 90° turns
  switch (base) {
    case 'R': return { notation, axis: 'x' as const, layer: 1, dir, angle };
    case 'L': return { notation, axis: 'x' as const, layer: -1, dir: -dir, angle };
    case 'U': return { notation, axis: 'y' as const, layer: 1, dir, angle };
    case 'D': return { notation, axis: 'y' as const, layer: -1, dir: -dir, angle };
    case 'F': return { notation, axis: 'z' as const, layer: 1, dir, angle };
    case 'B': return { notation, axis: 'z' as const, layer: -1, dir: -dir, angle };
    default: return null;
  }
};

// --- Sticker Component ---
const Sticker = ({ color, pos, rot }: { color: string; pos: [number, number, number]; rot: [number, number, number] }) => (
  <mesh position={pos} rotation={rot}>
    <planeGeometry args={[0.82, 0.82]} />
    <meshPhysicalMaterial color={color} roughness={0.15} clearcoat={1} />
  </mesh>
);

// --- The Individual Cubie (Sticker Architecture) ---
const Cubie = ({ pos }: { pos: [number, number, number] }) => (
  <group position={[pos[0] * spacing, pos[1] * spacing, pos[2] * spacing]}>
    <mesh>
      <boxGeometry args={[0.96, 0.96, 0.96]} />
      <meshPhysicalMaterial color={COLORS.CORE} roughness={0.2} metalness={0.1} clearcoat={1} />
    </mesh>

    {pos[0] === 1 && <Sticker color={COLORS.R} pos={[0.485, 0, 0]} rot={[0, Math.PI / 2, 0]} />}
    {pos[0] === -1 && <Sticker color={COLORS.L} pos={[-0.485, 0, 0]} rot={[0, -Math.PI / 2, 0]} />}
    {pos[1] === 1 && <Sticker color={COLORS.U} pos={[0, 0.485, 0]} rot={[-Math.PI / 2, 0, 0]} />}
    {pos[1] === -1 && <Sticker color={COLORS.D} pos={[0, -0.485, 0]} rot={[Math.PI / 2, 0, 0]} />}
    {pos[2] === 1 && <Sticker color={COLORS.F} pos={[0, 0, 0.485]} rot={[0, 0, 0]} />}
    {pos[2] === -1 && <Sticker color={COLORS.B} pos={[0, 0, -0.485]} rot={[0, Math.PI, 0]} />}
  </group>
);

// --- Scene with full animation support ---
const Scene = ({ currentMove, onMoveComplete, animationSpeed = 3.0, autoRotate = false }: {
  currentMove?: any;
  onMoveComplete?: () => void;
  animationSpeed?: number;
  autoRotate?: boolean;
}) => {
  const cubeGroupRef = useRef<THREE.Group>(null);
  const pivotRef = useRef<THREE.Group>(null);
  const [animating, setAnimating] = useState(false);
  const animProgress = useRef(0);

  // Generate 27 cubie positions
  const initialCubies = useRef<[number, number, number][]>([]);
  if (initialCubies.current.length === 0) {
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++)
          initialCubies.current.push([x, y, z]);
  }

  // Start animation when a new move arrives
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
            c.position[currentMove.axis as 'x' | 'y' | 'z'] -
            currentMove.layer * spacing
          ) < 0.1
        ) {
          pivotRef.current.attach(c);
        }
      }
    }
  }, [currentMove]);

  // 60fps animation loop
  useFrame((_, delta) => {
    // Auto-rotation when idle
    if (autoRotate && !animating && cubeGroupRef.current) {
      cubeGroupRef.current.rotation.y += delta * 0.35;
    }

    if (animating && currentMove && pivotRef.current && cubeGroupRef.current) {
      animProgress.current += delta * animationSpeed;

      const easeInOut = (t: number) =>
        t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const progress = Math.min(animProgress.current, 1);

      pivotRef.current.rotation[currentMove.axis as 'x' | 'y' | 'z'] =
        currentMove.dir * (Math.PI / 2) * easeInOut(progress);

      if (progress >= 1) {
        pivotRef.current.rotation[currentMove.axis as 'x' | 'y' | 'z'] =
          currentMove.dir * (Math.PI / 2);
        pivotRef.current.updateMatrixWorld();

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
      <directionalLight position={[-4, -3, -4]} intensity={0.3} />
      <group ref={cubeGroupRef}>
        <group ref={pivotRef} />
        {initialCubies.current.map((pos, idx) => (
          <Cubie key={idx} pos={pos} />
        ))}
      </group>
    </group>
  );
};

// --- Exported Component ---
interface Cube3DProps {
  width?: number | string;
  height?: number;
  style?: object;
  currentMove?: any;
  onMoveComplete?: () => void;
  animationSpeed?: number;
  autoRotate?: boolean;
}

export default function Cube3D({
  width = '100%',
  height = 300,
  style,
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
