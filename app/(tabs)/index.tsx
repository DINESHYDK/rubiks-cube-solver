import { StyleSheet, Pressable } from "react-native";
import { Link } from "expo-router";
import { Text, View } from "@/components/Themed";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.cubeEmoji}>🧊</Text>
        <Text style={styles.title}>Rubik's Cube Solver</Text>
        <Text style={styles.subtitle}>
          Scan, solve, and learn — powered by AI
        </Text>
      </View>

      <View style={styles.actions}>
        <Link href="/(tabs)/scan" asChild>
          <Pressable
            style={[styles.actionCard, { backgroundColor: "#009B48" }]}
          >
            <Text style={styles.actionEmoji}>📷</Text>
            <Text style={styles.actionTitle}>Scan Cube</Text>
            <Text style={styles.actionDesc}>Use camera to scan your cube</Text>
          </Pressable>
        </Link>

        <Link href="/(tabs)/solve" asChild>
          <Pressable
            style={[styles.actionCard, { backgroundColor: "#0046AD" }]}
          >
            <Text style={styles.actionEmoji}>🧊</Text>
            <Text style={styles.actionTitle}>3D Solver</Text>
            <Text style={styles.actionDesc}>Step-by-step 3D solution</Text>
          </Pressable>
        </Link>

        <Link href="/(tabs)/timer" asChild>
          <Pressable
            style={[styles.actionCard, { backgroundColor: "#B71234" }]}
          >
            <Text style={styles.actionEmoji}>⏱️</Text>
            <Text style={styles.actionTitle}>Timer</Text>
            <Text style={styles.actionDesc}>Track your solve times</Text>
          </Pressable>
        </Link>

        <Link href="/(tabs)/history" asChild>
          <Pressable
            style={[styles.actionCard, { backgroundColor: "#FF5800" }]}
          >
            <Text style={styles.actionEmoji}>📊</Text>
            <Text style={styles.actionTitle}>History</Text>
            <Text style={styles.actionDesc}>View past solves & stats</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  hero: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  cubeEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    opacity: 0.6,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    justifyContent: "center",
  },
  actionCard: {
    width: "46%",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
  },
  actionEmoji: {
    fontSize: 32,
    marginBottom: 10,
  },
  actionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  actionDesc: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    textAlign: "center",
  },
});
