import { StyleSheet, Pressable, Platform, useWindowDimensions } from "react-native";
import { Link } from "expo-router";
import { Text, View } from "@/components/Themed";
import React from "react";
import { BG, CARD, BORDER, TEXT, MUTED, GREEN, BLUE, RED, ORANGE } from "@/lib/theme";

// Conditionally import Cube3D for web
let Cube3DComponent: any = null;
if (Platform.OS === "web") {
  try {
    Cube3DComponent = require("@/components/cube/Cube3D").default;
  } catch {}
}

const ACTION_CARDS = [
  {
    href: "/(tabs)/scan" as const,
    color: GREEN,
    icon: "[ ]",
    title: "Scan Cube",
    desc: "Use camera to scan your cube",
  },
  {
    href: "/(tabs)/solve" as const,
    color: BLUE,
    icon: "3D",
    title: "3D Solver",
    desc: "Step-by-step 3D solution",
  },
  {
    href: "/(tabs)/timer" as const,
    color: RED,
    icon: "T",
    title: "Timer",
    desc: "Track your solve times",
  },
  {
    href: "/(tabs)/history" as const,
    color: ORANGE,
    icon: "#",
    title: "History",
    desc: "View past solves & stats",
  },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const showCube = Platform.OS === "web" && Cube3DComponent != null;

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        {showCube ? (
          <View style={styles.cubeWrap}>
            <Cube3DComponent height={200} autoRotate />
          </View>
        ) : (
          <View style={styles.cubeIcon}>
            <Text style={styles.cubeIconText}>3D</Text>
          </View>
        )}
        <Text style={styles.title}>YDK — Rubik's Cube Solver</Text>
        <Text style={styles.subtitle}>
          Scan, solve, and learn — powered by AI
        </Text>
      </View>

      <View style={styles.actions}>
        {ACTION_CARDS.map((card) => (
          <Link key={card.href} href={card.href} asChild>
            <Pressable
              style={StyleSheet.flatten([
                styles.actionCard,
                { backgroundColor: card.color },
              ])}
            >
              <View style={styles.cardIconWrap}>
                <Text style={styles.cardIconText}>{card.icon}</Text>
              </View>
              <Text style={styles.actionTitle}>{card.title}</Text>
              <Text style={styles.actionDesc}>{card.desc}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: BG,
  },
  hero: {
    alignItems: "center",
    marginTop: 30,
    marginBottom: 36,
  },
  cubeWrap: {
    width: 220,
    height: 200,
    marginBottom: 16,
  },
  cubeIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cubeIconText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: TEXT,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: MUTED,
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
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  cardIconText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
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
