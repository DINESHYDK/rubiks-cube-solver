import { useState, useRef } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { Text, View } from '@/components/Themed';

export default function TimerScreen() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const millis = ms % 1000;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (minutes > 0) {
      return `${minutes}:${secs.toString().padStart(2, '0')}.${Math.floor(millis / 10)
        .toString()
        .padStart(2, '0')}`;
    }
    return `${secs}.${Math.floor(millis / 10)
      .toString()
      .padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (isRunning) {
      // Stop
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRunning(false);
    } else {
      // Start
      const startTime = Date.now() - time;
      intervalRef.current = setInterval(() => {
        setTime(Date.now() - startTime);
      }, 10);
      setIsRunning(true);
    }
  };

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsRunning(false);
    setTime(0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.scrambleLabel}>Scramble</Text>
      <Text style={styles.scramble}>R U R' F2 D' L B2 U' R D2 F' L2 U B R2 D F2 L' U2 R'</Text>

      <Pressable style={styles.timerArea} onPress={toggleTimer}>
        <Text style={styles.time}>{formatTime(time)}</Text>
        <Text style={styles.tapHint}>
          {isRunning ? 'Tap to stop' : time > 0 ? 'Tap to resume' : 'Tap to start'}
        </Text>
      </Pressable>

      {time > 0 && !isRunning && (
        <View style={styles.actions}>
          <Pressable style={styles.resetButton} onPress={resetTimer}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
          <Pressable style={styles.saveButton}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Best</Text>
          <Text style={styles.statValue}>--</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Ao5</Text>
          <Text style={styles.statValue}>--</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Ao12</Text>
          <Text style={styles.statValue}>--</Text>
        </View>
      </View>
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
  scrambleLabel: {
    fontSize: 12,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  scramble: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  timerArea: {
    alignItems: 'center',
    marginBottom: 30,
  },
  time: {
    fontSize: 72,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  tapHint: {
    fontSize: 14,
    opacity: 0.4,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  resetText: {
    fontSize: 16,
  },
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#009B48',
  },
  saveText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    gap: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
  },
});
