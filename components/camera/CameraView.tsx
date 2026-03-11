import React from 'react';
import { StyleSheet } from 'react-native';
import { View, Text } from '@/components/Themed';

/**
 * Camera feed wrapper for cube scanning.
 * TODO: Integrate expo-camera with live preview and snapshot capture.
 */
export default function CameraView() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Camera Feed</Text>
      <Text style={styles.hint}>expo-camera will render here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
