import { StyleSheet, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function SolveScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.emoji}>🧊</Text>
        <Text style={styles.title}>3D Solver</Text>
        <Text style={styles.subtitle}>
          Interactive 3D cube with step-by-step solution playback
        </Text>
      </View>

      <View style={styles.cubePreview}>
        <Text style={styles.cubePreviewText}>3D Cube will render here</Text>
        <Text style={styles.cubePreviewSubtext}>(Three.js / React Three Fiber)</Text>
      </View>

      <View style={styles.controls}>
        <Pressable style={styles.controlButton}>
          <Text style={styles.controlText}>⏮</Text>
        </Pressable>
        <Pressable style={[styles.controlButton, styles.playButton]}>
          <Text style={styles.controlText}>▶️</Text>
        </Pressable>
        <Pressable style={styles.controlButton}>
          <Text style={styles.controlText}>⏭</Text>
        </Pressable>
      </View>

      <Text style={styles.moveCounter}>Move 0 / 0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholder: {
    alignItems: 'center',
    marginBottom: 30,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  cubePreview: {
    width: 280,
    height: 280,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  cubePreviewText: {
    fontSize: 16,
    opacity: 0.5,
  },
  cubePreviewSubtext: {
    fontSize: 12,
    opacity: 0.3,
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#009B48',
    borderColor: '#009B48',
  },
  controlText: {
    fontSize: 20,
  },
  moveCounter: {
    fontSize: 14,
    opacity: 0.6,
  },
});
