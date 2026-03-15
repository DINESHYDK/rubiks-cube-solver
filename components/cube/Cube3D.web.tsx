import React, { useRef } from 'react';
import { View } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Group } from 'three';

const COLORS = {
  R: '#B71234',
  L: '#FF5800',
  U: '#FFFFFF',
  D: '#FFD500',
  F: '#009B48',
  B: '#0046AD',
  X: '#111111',
} as const;

type Pos = [number, number, number];

function faceMaterials(x: number, y: number, z: number) {
  return [
    x === 1  ? COLORS.R : COLORS.X,
    x === -1 ? COLORS.L : COLORS.X,
    y === 1  ? COLORS.U : COLORS.X,
    y === -1 ? COLORS.D : COLORS.X,
    z === 1  ? COLORS.F : COLORS.X,
    z === -1 ? COLORS.B : COLORS.X,
  ];
}

function Cubie({ pos }: { pos: Pos }) {
  const [x, y, z] = pos;
  const colors = faceMaterials(x, y, z);
  return (
    <mesh position={[x * 1.05, y * 1.05, z * 1.05]}>
      <boxGeometry args={[0.94, 0.94, 0.94]} />
      {colors.map((color, i) => (
        <meshStandardMaterial
          key={i}
          attach={`material-${i}`}
          color={color}
          roughness={0.35}
          metalness={0.08}
        />
      ))}
    </mesh>
  );
}

function RubiksCubeScene() {
  const groupRef = useRef<Group>(null!);

  useFrame((_, delta) => {
    groupRef.current.rotation.y += delta * 0.55;
    groupRef.current.rotation.x += delta * 0.08;
  });

  const positions: Pos[] = [];
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++)
        if (!(x === 0 && y === 0 && z === 0))
          positions.push([x, y, z]);

  return (
    <group ref={groupRef} rotation={[0.35, 0.55, 0]}>
      {positions.map(pos => (
        <Cubie key={pos.join(',')} pos={pos} />
      ))}
    </group>
  );
}

interface Cube3DProps {
  width?: number | string;
  height?: number;
  style?: object;
}

export default function Cube3D({ width = '100%', height = 300, style }: Cube3DProps) {
  return (
    <View style={[{ width: width as any, height }, style]}>
      <Canvas
        camera={{ position: [4, 3, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.75} />
        <directionalLight position={[6, 8, 6]} intensity={1.4} />
        <directionalLight position={[-4, -3, -4]} intensity={0.3} />
        <RubiksCubeScene />
      </Canvas>
    </View>
  );
}
