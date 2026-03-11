import { StyleSheet, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function ScanScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <Text style={styles.emoji}>📷</Text>
        <Text style={styles.title}>Camera Scanner</Text>
        <Text style={styles.subtitle}>
          Point your camera at each face of the Rubik's Cube
        </Text>
      </View>

      <View style={styles.faceGrid}>
        {['U', 'F', 'R', 'B', 'L', 'D'].map((face) => (
          <View key={face} style={styles.faceButton}>
            <Text style={styles.faceText}>{face}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.scanButton}>
        <Text style={styles.scanButtonText}>Start Scanning</Text>
      </Pressable>
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
    marginBottom: 40,
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
  faceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
  },
  faceButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanButton: {
    backgroundColor: '#009B48',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
