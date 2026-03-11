import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { View, Text } from '@/components/Themed';
import type { CubeState, FaceName } from '@/types/cube';
import { CUBE_COLORS, FACE_COLOR_MAP } from '@/lib/constants';

interface CubeNetProps {
  cubeState: CubeState;
  onSquareTap?: (face: FaceName, index: number) => void;
}

/**
 * 2D flat net editor for the Rubik's Cube.
 * Displays the cross-shaped unfolded layout of all 6 faces.
 * Tap a square to cycle through colors (manual input fallback).
 */
export default function CubeNet({ cubeState, onSquareTap }: CubeNetProps) {
  const renderFace = (face: FaceName) => (
    <View key={face} style={styles.face}>
      {cubeState[face].map((color, i) => (
        <Pressable
          key={`${face}-${i}`}
          style={[styles.square, { backgroundColor: CUBE_COLORS[color] }]}
          onPress={() => onSquareTap?.(face, i)}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Row 1: Up face */}
      <View style={styles.row}>
        <View style={styles.spacer} />
        {renderFace('U')}
        <View style={styles.spacer} />
        <View style={styles.spacer} />
      </View>
      {/* Row 2: L, F, R, B */}
      <View style={styles.row}>
        {renderFace('L')}
        {renderFace('F')}
        {renderFace('R')}
        {renderFace('B')}
      </View>
      {/* Row 3: Down face */}
      <View style={styles.row}>
        <View style={styles.spacer} />
        {renderFace('D')}
        <View style={styles.spacer} />
        <View style={styles.spacer} />
      </View>
    </View>
  );
}

const SQUARE_SIZE = 22;
const GAP = 2;
const FACE_SIZE = SQUARE_SIZE * 3 + GAP * 2;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  face: {
    width: FACE_SIZE,
    height: FACE_SIZE,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    margin: 1,
  },
  square: {
    width: SQUARE_SIZE,
    height: SQUARE_SIZE,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#333',
  },
  spacer: {
    width: FACE_SIZE + 2,
    height: FACE_SIZE + 2,
  },
});
