import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Easing,
} from "react-native";

interface Props {
  onComplete: () => void;
}

export default function AppSplashScreen({ onComplete }: Props) {
  const { width, height } = useWindowDimensions();

  // ── Main content fade-in ─────────────────────────────────────────────────────
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.85)).current;

  // ── YDK letter animations ────────────────────────────────────────────────────
  const yOpacity   = useRef(new Animated.Value(0)).current;
  const dOpacity   = useRef(new Animated.Value(0)).current;
  const kOpacity   = useRef(new Animated.Value(0)).current;
  const yTranslate = useRef(new Animated.Value(-18)).current;
  const dTranslate = useRef(new Animated.Value(0)).current;
  const kTranslate = useRef(new Animated.Value(18)).current;
  const yGlow      = useRef(new Animated.Value(0)).current; // loops for shimmer
  const lineWidth  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Fade + scale main content in
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(scale,   { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // 2. After 700ms: letters fly in staggered, then line expands
    const letterDelay = setTimeout(() => {
      Animated.parallel([
        // Y — slides in from left
        Animated.timing(yOpacity,   { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.spring(yTranslate, { toValue: 0, friction: 6, tension: 120, useNativeDriver: true }),
        // D — fades up from below
        Animated.sequence([
          Animated.delay(110),
          Animated.parallel([
            Animated.timing(dOpacity,   { toValue: 1, duration: 380, useNativeDriver: true }),
            Animated.spring(dTranslate, { toValue: 0, friction: 6, tension: 120, useNativeDriver: true }),
          ]),
        ]),
        // K — slides in from right
        Animated.sequence([
          Animated.delay(220),
          Animated.parallel([
            Animated.timing(kOpacity,   { toValue: 1, duration: 380, useNativeDriver: true }),
            Animated.spring(kTranslate, { toValue: 0, friction: 6, tension: 120, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => {
        // Underline sweeps in after letters land
        Animated.timing(lineWidth, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          // Continuous shimmer loop on Y letter
          Animated.loop(
            Animated.sequence([
              Animated.timing(yGlow, { toValue: 1, duration: 900, useNativeDriver: true }),
              Animated.timing(yGlow, { toValue: 0, duration: 900, useNativeDriver: true }),
            ])
          ).start();
        });
      });
    }, 700);

    // 3. Hard cutoff at 2200ms
    const done = setTimeout(onComplete, 2200);

    return () => {
      clearTimeout(letterDelay);
      clearTimeout(done);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Shimmer: Y pulses between silver-white and bright silver
  const yColor = yGlow.interpolate({
    inputRange:  [0, 1],
    outputRange: ["#A8B8C8", "#F0F8FF"],
  });

  // Underline scale from 0→1 on X axis
  const lineScale = lineWidth.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[s.container, { width, height }]}
      pointerEvents="none"
    >
      {/* ── Main logo + tagline ────────────────────────────────────── */}
      <Animated.View style={[s.content, { opacity, transform: [{ scale }] }]}>
        <View style={s.iconBox}>
          <Text style={s.iconSymbol}>⬡</Text>
        </View>
        <Text style={s.title}>Cube Master</Text>
        <Text style={s.subtitle}>ALGORITHMIC PRECISION</Text>
      </Animated.View>

      {/* ── YDK brand mark (bottom) ────────────────────────────────── */}
      <View style={s.brandWrap}>
        <Text style={s.createdBy}>created by</Text>

        {/* YDK letters */}
        <View style={s.ydkRow}>
          {/* Y */}
          <Animated.Text
            style={[
              s.ydkLetter,
              {
                opacity: yOpacity,
                color: yColor,
                transform: [{ translateX: yTranslate }],
              },
            ]}
          >
            Y
          </Animated.Text>

          {/* D */}
          <Animated.Text
            style={[
              s.ydkLetter,
              s.ydkD,
              {
                opacity: dOpacity,
                transform: [{ translateY: dTranslate }],
              },
            ]}
          >
            D
          </Animated.Text>

          {/* K */}
          <Animated.Text
            style={[
              s.ydkLetter,
              {
                opacity: kOpacity,
                transform: [{ translateX: kTranslate }],
              },
            ]}
          >
            K
          </Animated.Text>
        </View>

        {/* Animated underline */}
        <View style={s.lineTrack}>
          <Animated.View
            style={[
              s.line,
              { transform: [{ scaleX: lineScale }] },
            ]}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 999,
    backgroundColor: "#000040",
    alignItems: "center",
    justifyContent: "center",
  },

  // Main content
  content: {
    alignItems: "center",
    gap: 20,
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: "#90D5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  iconSymbol: {
    fontSize: 48,
    color: "#000040",
  },
  title: {
    fontSize: 48,
    fontWeight: "900",
    color: "#90D5FF",
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8899CC",
    letterSpacing: 6,
    textTransform: "uppercase",
  },

  // YDK brand
  brandWrap: {
    position: "absolute",
    bottom: 52,
    alignItems: "center",
    gap: 6,
  },
  createdBy: {
    fontSize: 10,
    fontWeight: "400",
    color: "#4A5A7A",
    letterSpacing: 3,
    textTransform: "lowercase",
  },
  ydkRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 2,
  },
  ydkLetter: {
    fontSize: 28,
    fontWeight: "800",
    color: "#C0D0E0",
    letterSpacing: 6,
  },
  ydkD: {
    fontSize: 34,       // D is taller — makes the brand mark feel crafted
    color: "#D8E8F8",
  },
  lineTrack: {
    width: 64,
    height: 2,
    overflow: "hidden",
  },
  line: {
    width: "100%",
    height: 2,
    borderRadius: 1,
    backgroundColor: "#7090B0",
    transformOrigin: "left center",
  },
});
