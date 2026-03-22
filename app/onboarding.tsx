import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveSettings } from "@/lib/storage";
import { useThemeMode } from "@/lib/themeContext";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Props {
  onComplete: () => void;
}

type Step = 0 | 1 | 2; // 0 = name, 1 = theme, 2 = speed

const ACCENT = "#90D5FF";
const BG     = "#000040";
const CARD   = "#0A0A5C";
const BORDER = "#2020A0";
const TEXT   = "#E6EDF3";
const MUTED  = "#8899CC";

// ── Onboarding ─────────────────────────────────────────────────────────────────
export default function Onboarding({ onComplete }: Props) {
  const { width, height } = useWindowDimensions();
  const { setMode } = useThemeMode();

  const [step,      setStep]      = useState<Step>(0);
  const [name,      setName]      = useState("");
  const [nameError, setNameError] = useState("");
  const [theme,     setTheme]     = useState<"dark" | "light">("dark");
  const [delay,     setDelay]     = useState(1000);

  // Card slide + fade animation
  const cardOpacity   = useSharedValue(1);
  const cardTranslate = useSharedValue(0);

  const cardAnim = useAnimatedStyle(() => ({
    opacity:   cardOpacity.value,
    transform: [{ translateX: cardTranslate.value }],
  }));

  function animateToStep(next: Step) {
    // Slide out left
    cardOpacity.value   = withTiming(0, { duration: 200 });
    cardTranslate.value = withTiming(-32, { duration: 200 }, () => {
      runOnJS(setStep)(next);
      // Reset + slide in from right
      cardTranslate.value = 32;
      cardOpacity.value   = withTiming(1, { duration: 220 });
      cardTranslate.value = withSpring(0, { damping: 14, stiffness: 160 });
    });
  }

  const handleNext = () => {
    if (step === 0) {
      if (!name.trim()) {
        setNameError("Please enter your name to continue.");
        return;
      }
      setNameError("");
      animateToStep(1);
    } else if (step === 1) {
      animateToStep(2);
    } else {
      finish();
    }
  };

  const finish = async () => {
    await saveSettings({ username: name.trim(), theme, stepDelay: delay });
    await AsyncStorage.setItem("onboarded", "true");
    setMode(theme);
    onComplete();
  };

  // Delay buttons: −200 / +200, clamped 200–2500
  const stepMs = 200;
  const clamp  = (v: number) => Math.min(2500, Math.max(200, v));

  // Progress dots
  const dots: Step[] = [0, 1, 2];

  return (
    <View style={[s.overlay, { width, height }]}>
      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ────────────────────────────────────────────────── */}
          <Text style={s.logo}>Cube Master</Text>
          <Text style={s.tagline}>Let's set you up</Text>

          {/* ── Animated card ───────────────────────────────────────── */}
          <Animated.View style={[s.card, cardAnim]}>
            {step === 0 && (
              <StepName
                name={name}
                onChange={(v) => { setName(v); setNameError(""); }}
                error={nameError}
              />
            )}
            {step === 1 && (
              <StepTheme theme={theme} onChange={setTheme} />
            )}
            {step === 2 && (
              <StepSpeed
                delay={delay}
                onDecrease={() => setDelay((d) => clamp(d - stepMs))}
                onIncrease={() => setDelay((d) => clamp(d + stepMs))}
              />
            )}
          </Animated.View>

          {/* ── Progress dots ────────────────────────────────────────── */}
          <View style={s.dots}>
            {dots.map((d) => (
              <View
                key={d}
                style={[
                  s.dot,
                  d === step   && s.dotActive,
                  d  <  step   && s.dotDone,
                ]}
              />
            ))}
          </View>

          {/* ── CTA ─────────────────────────────────────────────────── */}
          <Pressable
            style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }]}
            onPress={handleNext}
          >
            <Text style={s.ctaTxt}>
              {step === 2 ? "Start Using Cube Master →" : "Continue →"}
            </Text>
          </Pressable>

          {/* ── Skip (steps 1 and 2 only) ───────────────────────────── */}
          {step > 0 && (
            <Pressable onPress={step === 1 ? () => animateToStep(2) : finish} style={s.skip}>
              <Text style={s.skipTxt}>Skip</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── Step 0: Name ───────────────────────────────────────────────────────────────
function StepName({
  name,
  onChange,
  error,
}: {
  name: string;
  onChange: (v: string) => void;
  error: string;
}) {
  const inputRef = useRef<TextInput>(null);
  return (
    <View style={s.stepWrap}>
      <View style={s.iconRow}>
        <Ionicons name="person-circle-outline" size={52} color={ACCENT} />
      </View>
      <Text style={s.stepTitle}>What's your name?</Text>
      <Text style={s.stepSub}>
        We'll use it on the home screen to greet you.
      </Text>
      <TextInput
        ref={inputRef}
        style={[s.input, !!error && s.inputError]}
        value={name}
        onChangeText={onChange}
        placeholder="e.g. Dinesh"
        placeholderTextColor={MUTED}
        autoFocus
        maxLength={24}
        returnKeyType="done"
        onSubmitEditing={() => inputRef.current?.blur()}
      />
      {!!error && <Text style={s.error}>{error}</Text>}
    </View>
  );
}

// ── Step 1: Theme ──────────────────────────────────────────────────────────────
function StepTheme({
  theme,
  onChange,
}: {
  theme: "dark" | "light";
  onChange: (t: "dark" | "light") => void;
}) {
  return (
    <View style={s.stepWrap}>
      <View style={s.iconRow}>
        <Ionicons name="contrast-outline" size={52} color={ACCENT} />
      </View>
      <Text style={s.stepTitle}>Pick your theme</Text>
      <Text style={s.stepSub}>You can change this anytime in Settings.</Text>

      <View style={s.themeRow}>
        <ThemeCard
          label="Dark"
          icon="moon-outline"
          selected={theme === "dark"}
          onPress={() => onChange("dark")}
          preview="#000040"
        />
        <ThemeCard
          label="Light"
          icon="sunny-outline"
          selected={theme === "light"}
          onPress={() => onChange("light")}
          preview="#F0F8FF"
        />
      </View>
    </View>
  );
}

function ThemeCard({
  label,
  icon,
  selected,
  onPress,
  preview,
}: {
  label: string;
  icon: any;
  selected: boolean;
  onPress: () => void;
  preview: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        s.themeCard,
        selected && { borderColor: ACCENT, borderWidth: 2 },
      ]}
    >
      <View style={[s.themePreview, { backgroundColor: preview }]} />
      <Ionicons name={icon} size={22} color={selected ? ACCENT : MUTED} style={{ marginBottom: 4 }} />
      <Text style={[s.themeLabel, selected && { color: ACCENT }]}>{label}</Text>
      {selected && (
        <Ionicons name="checkmark-circle" size={16} color={ACCENT} style={{ marginTop: 4 }} />
      )}
    </Pressable>
  );
}

// ── Step 2: Speed ──────────────────────────────────────────────────────────────
function StepSpeed({
  delay,
  onDecrease,
  onIncrease,
}: {
  delay: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <View style={s.stepWrap}>
      <View style={s.iconRow}>
        <Ionicons name="speedometer-outline" size={52} color={ACCENT} />
      </View>
      <Text style={s.stepTitle}>Solve animation speed</Text>
      <Text style={s.stepSub}>
        How fast should the 3D cube animate each move?{"\n"}
        You can adjust this anytime on the Solve screen.
      </Text>

      <View style={s.speedRow}>
        <Pressable
          style={({ pressed }) => [s.speedBtn, pressed && { opacity: 0.7 }]}
          onPress={onDecrease}
        >
          <Text style={s.speedBtnTxt}>−</Text>
        </Pressable>

        <View style={s.speedDisplay}>
          <Text style={s.speedValue}>{delay}</Text>
          <Text style={s.speedUnit}>ms / move</Text>
        </View>

        <Pressable
          style={({ pressed }) => [s.speedBtn, pressed && { opacity: 0.7 }]}
          onPress={onIncrease}
        >
          <Text style={s.speedBtnTxt}>+</Text>
        </Pressable>
      </View>

      <View style={s.speedHints}>
        <Text style={s.speedHint}>⚡ 200ms — Very fast</Text>
        <Text style={s.speedHint}>🐢 2500ms — Slow</Text>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0,
    zIndex: 1000,
    backgroundColor: BG,
  },
  kav:    { flex: 1 },
  scroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  logo: {
    fontSize: 36,
    fontWeight: "900",
    color: ACCENT,
    letterSpacing: 4,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    fontWeight: "600",
    color: MUTED,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 40,
  },

  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: CARD,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 28,
    marginBottom: 28,
  },

  stepWrap:  { alignItems: "center" },
  iconRow:   { marginBottom: 16 },
  stepTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: TEXT,
    textAlign: "center",
    marginBottom: 8,
  },
  stepSub: {
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },

  // Name input
  input: {
    width: "100%",
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
    paddingHorizontal: 16,
    fontSize: 16,
    color: TEXT,
    backgroundColor: "#06064A",
  },
  inputError: { borderColor: "#B71234" },
  error: {
    fontSize: 12,
    color: "#FF6B6B",
    marginTop: 6,
    alignSelf: "flex-start",
  },

  // Theme cards
  themeRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  themeCard: {
    flex: 1,
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    backgroundColor: "#06064A",
  },
  themePreview: {
    width: "100%",
    height: 48,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
  },

  // Speed
  speedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  speedBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#12127A",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  speedBtnTxt:   { fontSize: 24, fontWeight: "700", color: TEXT },
  speedDisplay:  { alignItems: "center", flex: 1 },
  speedValue:    { fontSize: 36, fontWeight: "900", color: ACCENT },
  speedUnit:     { fontSize: 11, color: MUTED, marginTop: 2 },
  speedHints: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  speedHint:     { fontSize: 11, color: MUTED },

  // Dots
  dots: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: BORDER,
  },
  dotActive: { backgroundColor: ACCENT, width: 20 },
  dotDone:   { backgroundColor: "#4A6080" },

  // CTA
  cta: {
    width: "100%",
    maxWidth: 400,
    height: 52,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  ctaTxt: { fontSize: 16, fontWeight: "800", color: "#000040" },

  // Skip
  skip: { paddingVertical: 8 },
  skipTxt: { fontSize: 13, color: MUTED, textDecorationLine: "underline" },
});
