import React from 'react';
import { StyleSheet } from 'react-native';
import { View } from '@/components/Themed';

interface GridOverlayProps {
  size: number;
}

/**
 * 3x3 grid overlay for the camera scanner.
 * Positioned on top of the camera feed to guide the user
 * in aligning the cube face within the grid.
 */
export default function GridOverlay({ size }: GridOverlayProps) {
  const cellSize = size / 3;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Horizontal lines */}
      <View style={[styles.hLine, { top: cellSize, width: size }]} />
      <View style={[styles.hLine, { top: cellSize * 2, width: size }]} />
      {/* Vertical lines */}
      <View style={[styles.vLine, { left: cellSize, height: size }]} />
      <View style={[styles.vLine, { left: cellSize * 2, height: size }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
  },
  hLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    left: 0,
  },
  vLine: {
    position: 'absolute',
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    top: 0,
  },
});
