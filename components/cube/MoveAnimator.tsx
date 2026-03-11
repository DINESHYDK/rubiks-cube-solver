import React from 'react';
import { StyleSheet } from 'react-native';
import { View, Text } from '@/components/Themed';
import type { Move } from '@/types/cube';

interface MoveAnimatorProps {
  moves: Move[];
  currentIndex: number;
}

/**
 * Displays the current move notation and move list.
 * TODO: Will be connected to the 3D cube animation system.
 */
export default function MoveAnimator({ moves, currentIndex }: MoveAnimatorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Move {currentIndex + 1} of {moves.length}
      </Text>
      <View style={styles.moveList}>
        {moves.map((move, i) => (
          <View
            key={i}
            style={[
              styles.moveBadge,
              i === currentIndex && styles.activeBadge,
              i < currentIndex && styles.completedBadge,
            ]}
          >
            <Text
              style={[
                styles.moveText,
                i === currentIndex && styles.activeMoveText,
              ]}
            >
              {move}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 12,
    textAlign: 'center',
  },
  moveList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  moveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeBadge: {
    backgroundColor: '#009B48',
    borderColor: '#009B48',
  },
  completedBadge: {
    opacity: 0.4,
  },
  moveText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeMoveText: {
    color: '#fff',
  },
});
