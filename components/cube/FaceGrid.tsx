import React from 'react';
import { StyleSheet } from 'react-native';
import { View } from '@/components/Themed';
import type { CubeColor } from '@/types/cube';
import { CUBE_COLORS } from '@/lib/constants';

interface FaceGridProps {
  colors: CubeColor[];
  size?: number;
}

/**
 * Renders a single 3x3 face grid with colored squares.
 * Used in scanning confirmation and manual input.
 */
export default function FaceGrid({ colors, size = 40 }: FaceGridProps) {
  const gap = Math.max(2, size * 0.06);

  return (
    <View style={[styles.container, { width: size * 3 + gap * 2, height: size * 3 + gap * 2 }]}>
      {colors.map((color, i) => (
        <View
          key={i}
          style={[
            styles.square,
            {
              width: size,
              height: size,
              backgroundColor: CUBE_COLORS[color],
              margin: gap / 2,
              borderRadius: size * 0.1,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  square: {
    borderWidth: 1,
    borderColor: '#222',
  },
});
