import React from 'react';
import { StyleSheet } from 'react-native';
import { View, Text } from '@/components/Themed';

/**
 * 3D Rubik's Cube component.
 * TODO: Replace with React Three Fiber <Canvas> + 26 cubies.
 * This is a placeholder until Three.js integration is set up.
 */
export default function Cube3D() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>3D Cube (R3F)</Text>
      <Text style={styles.hint}>Three.js will render here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: 280,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 18,
    fontWeight: 'bold',
    opacity: 0.5,
  },
  hint: {
    fontSize: 12,
    opacity: 0.3,
    marginTop: 4,
  },
});
