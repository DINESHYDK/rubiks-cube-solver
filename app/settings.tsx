import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useTheme } from "@/lib/theme";
import { useThemeMode } from "@/lib/themeContext";
import {
  useSettings,
  clearAllData,
  getBestTime,
  getSessionStats,
} from "@/lib/storage";
import { useCubeStore } from "@/stores/cubeStore";
import type { SessionStats } from "@/types/cube";

// ── AnimatedPressable ─────────────────────────────────────────────────────────

function AnimatedPressable({
  onPress,
  style,
  children,
}: {
  onPress: () => void;
  style?: object | object[];
  children: React.ReactNode;
}) {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);
  const anim    = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));
  return (
    <Pressable
      onPressIn={() => {
        scale.value   = withTiming(0.96, { duration: 120 });
        opacity.value = withTiming(0.82, { duration: 120 });
      }}
      onPressOut={() => {
        scale.value   = withTiming(1, { duration: 120 });
        opacity.value = withTiming(1, { duration: 120 });
      }}
      onPress={onPress}
    >
      <Animated.View style={[style, anim]}>{children}</Animated.View>
    </Pressable>
  );
}

// ── Separator ─────────────────────────────────────────────────────────────────

function Separator({ color }: { color: string }) {
  return <View style={[s.separator, { backgroundColor: color }]} />;
}

// ── SettingsScreen ────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const t      = useTheme();
  const { setMode } = useThemeMode();
  const router = useRouter();
  const { settings, loadSettings, updateSettings } = useSettings();
  const { resetCube } = useCubeStore();

  const [bestTime, setBestTime] = useState<number | null>(null);
  const [stats,    setStats]    = useState<SessionStats | null>(null);
  const [username, setUsername] = useState(settings.username);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadSettings();
    getBestTime().then(setBestTime);
    getSessionStats().then(setStats);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Sync local username when settings load from storage
  useEffect(() => {
    setUsername(settings.username);
  }, [settings.username]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateSettings({ username: value });
    }, 500);
  };

  const handleThemeToggle = (mode: "dark" | "light") => {
    setMode(mode);
    updateSettings({ theme: mode });
  };

  const handleDelayChange = (delta: number) => {
    const current = settings.stepDelay ?? 1200;
    const next = Math.min(2500, Math.max(100, current + delta));
    updateSettings({ stepDelay: next });
  };

  const handleFactoryReset = () => {
    Alert.alert(
      "Factory Reset",
      "This will delete all your solve history and settings permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            await clearAllData();
            resetCube();
            router.back();
          },
        },
      ]
    );
  };

  const formatTime = (ms: number | null | undefined): string => {
    if (!ms) return "--";
    const s = ms / 1000;
    if (s < 60) return `${s.toFixed(2)}s`;
    return `${Math.floor(s / 60)}:${(s % 60).toFixed(0).padStart(2, "0")}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.BG }]} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ── PROFILE ────────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: t.MUTED }]}>PROFILE</Text>
        <View style={[s.card, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
          <View style={s.row}>
            <Text style={[s.rowLabel, { color: t.TEXT }]}>Your Name</Text>
            <TextInput
              style={[s.textInput, { color: t.TEXT }]}
              value={username}
              onChangeText={handleUsernameChange}
              placeholder="Enter your name"
              placeholderTextColor={t.MUTED}
              textAlign="right"
              returnKeyType="done"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* ── APPEARANCE ─────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: t.MUTED }]}>APPEARANCE</Text>
        <View style={[s.card, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
          <View style={s.row}>
            <Text style={[s.rowLabel, { color: t.TEXT }]}>Theme</Text>
            <View style={[s.toggle, { backgroundColor: t.CARD_ALT, borderColor: t.BORDER }]}>
              {(["dark", "light"] as const).map((mode) => {
                const isActive = settings.theme === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => handleThemeToggle(mode)}
                    style={[s.togglePill, isActive && { backgroundColor: t.ACCENT }]}
                  >
                    <Text
                      style={[
                        s.toggleTxt,
                        { color: isActive ? "#000040" : t.MUTED },
                        isActive && { fontWeight: "700" },
                      ]}
                    >
                      {mode === "dark" ? "Dark" : "Light"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── SOLVER ─────────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: t.MUTED }]}>SOLVER</Text>
        <View style={[s.card, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
          <View style={s.row}>
            <Text style={[s.rowLabel, { color: t.TEXT }]}>Auto step delay</Text>
            <View style={[s.delayBadge, { backgroundColor: t.CARD_ALT }]}>
              <Text style={[s.delayValue, { color: t.ACCENT }]}>
                {settings.stepDelay ?? 1200} ms
              </Text>
            </View>
          </View>
          <Separator color={t.BORDER} />
          <View style={[s.row, { justifyContent: "center" }]}>
            <View style={s.delayControls}>
              <AnimatedPressable
                onPress={() => handleDelayChange(-100)}
                style={[s.delayBtn, { backgroundColor: t.CARD_ALT, borderColor: t.BORDER }]}
              >
                <Text style={[s.delayBtnTxt, { color: t.TEXT }]}>−</Text>
              </AnimatedPressable>
              <Text style={[s.delayRange, { color: t.MUTED }]}>100ms – 2500ms</Text>
              <AnimatedPressable
                onPress={() => handleDelayChange(100)}
                style={[s.delayBtn, { backgroundColor: t.CARD_ALT, borderColor: t.BORDER }]}
              >
                <Text style={[s.delayBtnTxt, { color: t.TEXT }]}>+</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>

        {/* ── DATA ───────────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: t.MUTED }]}>DATA</Text>
        <View style={[s.card, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
          <View style={s.row}>
            <Text style={[s.rowLabel, { color: t.TEXT }]}>Total Solves</Text>
            <Text style={[s.rowValue, { color: t.MUTED }]}>
              {stats ? String(stats.totalSolves) : "--"}
            </Text>
          </View>
          <Separator color={t.BORDER} />
          <View style={s.row}>
            <Text style={[s.rowLabel, { color: t.TEXT }]}>Best Time</Text>
            <Text style={[s.rowValue, { color: t.MUTED }]}>{formatTime(bestTime)}</Text>
          </View>
        </View>

        <AnimatedPressable
          onPress={handleFactoryReset}
          style={[s.resetBtn, { borderColor: t.RED }]}
        >
          <Text style={[s.resetBtnTxt, { color: t.RED }]}>Factory Reset</Text>
        </AnimatedPressable>

        {/* ── ABOUT ──────────────────────────────────────────────────── */}
        <Text style={[s.sectionLabel, { color: t.MUTED }]}>ABOUT</Text>
        <View style={[s.card, { backgroundColor: t.CARD, borderColor: t.BORDER }]}>
          <View style={s.row}>
            <Text style={[s.rowLabel, { color: t.TEXT }]}>App</Text>
            <Text style={[s.rowValue, { color: t.MUTED }]}>CubeIQ</Text>
          </View>
          <Separator color={t.BORDER} />
          <View style={s.row}>
            <Text style={[s.rowLabel, { color: t.TEXT }]}>Algorithm</Text>
            <Text style={[s.rowValue, { color: t.MUTED }]}>Kociemba (≤20 moves)</Text>
          </View>
          <Separator color={t.BORDER} />
          <View style={s.row}>
            <Text style={[s.rowLabel, { color: t.TEXT }]}>Color Detection</Text>
            <Text style={[s.rowValue, { color: t.MUTED }]}>OpenCV</Text>
          </View>
          <Separator color={t.BORDER} />
          <View style={s.row}>
            <Text style={[s.rowLabel, { color: t.TEXT }]}>Made by</Text>
            <Text style={[s.rowValue, { color: t.ACCENT }]}>[Your Name]</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 },

  // Section label
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
  },

  // Card
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },

  // Row (52px tall)
  row: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  rowLabel: { fontSize: 15 },
  rowValue: { fontSize: 15 },

  // Separator inside card
  separator: {
    height: 1,
    marginHorizontal: 16,
  },

  // TextInput (profile)
  textInput: {
    fontSize: 15,
    minWidth: 140,
    maxWidth: 220,
    textAlign: "right",
    paddingVertical: 0,
  },

  // Theme toggle
  toggle: {
    flexDirection: "row",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  togglePill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  toggleTxt: { fontSize: 13 },

  // Step delay
  delayBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
  },
  delayValue: { fontSize: 13, fontWeight: "700" },
  delayControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  delayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  delayBtnTxt: { fontSize: 20, fontWeight: "700", lineHeight: 24 },
  delayRange:  { fontSize: 12, minWidth: 100, textAlign: "center" },

  // Factory reset
  resetBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  resetBtnTxt: { fontSize: 15, fontWeight: "700" },
});
