import { StyleSheet, FlatList } from 'react-native';
import { Text, View } from '@/components/Themed';

const MOCK_HISTORY = [
  { id: '1', date: '2025-03-10', moves: 21, time: '45.2s' },
  { id: '2', date: '2025-03-09', moves: 18, time: '38.7s' },
  { id: '3', date: '2025-03-08', moves: 23, time: '52.1s' },
];

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solve History</Text>
      <Text style={styles.subtitle}>Your past solves will appear here</Text>

      <FlatList
        data={MOCK_HISTORY}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardDate}>{item.date}</Text>
              <Text style={styles.cardMoves}>{item.moves} moves</Text>
            </View>
            <Text style={styles.cardTime}>{item.time}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyText}>No solves yet. Scan a cube to get started!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardLeft: {
    gap: 4,
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardMoves: {
    fontSize: 13,
    opacity: 0.6,
  },
  cardTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#009B48',
  },
  empty: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
  },
});
