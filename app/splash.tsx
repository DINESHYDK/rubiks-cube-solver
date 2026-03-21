import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from "react-native";

// ── Simple Rubik face tile colors ─────────────────────────────────────────────
const FACE_COLORS = [
  "#B71234", "#FFD500", "#009B48",
  "#0046AD", "#FF5800", "#FFFFFF",
  "#FFD500", "#009B48", "#B71234",
];

interface Props {
  onComplete: () => void;
}

// ── AppSplashScreen ───────────────────────────────────────────────────────────
export default function AppSplashScreen({ onComplete }: Props) {
  const { width, height } = useWindowDimensions();

  // Animated values
  const tileAnims      = useRef(FACE_COLORS.map(() => new Animated.Value(0))).current;
  const titleOpacity   = useRef(new Animated.Value(0)).current;
  const titleScale     = useRef(new Animated.Value(0.88)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const splashOpacity  = useRef(new Animated.Value(1)).current;
  const completedRef   = useRef(false);

  useEffect(() => {
    // Safety net: force-complete after 4s
    const safety = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    }, 4000);

    // Stagger tiles in
    const tileStagger = Animated.stagger(
      55,
      tileAnims.map((anim) =>
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 6, tension: 100 })
      )
    );

    Animated.sequence([
      tileStagger,
      Animated.delay(100),
      // Title fades in
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(titleScale,   { toValue: 1, friction: 7, tension: 80, useNativeDriver: true }),
      ]),
      Animated.delay(80),
      // Subtitle fades in
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      // Hold
      Animated.delay(800),
      // Fade out entire splash
      Animated.timing(splashOpacity, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onComplete();
      }
    });

    return () => clearTimeout(safety);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View
      style={[s.container, { width, height, opacity: splashOpacity }]}
      pointerEvents="none"
    >
      {/* ── Animated tile grid ───────────────────────────────────── */}
      <View style={s.faceGrid}>
        {FACE_COLORS.map((color, i) => (
          <Animated.View
            key={i}
            style={[
              s.tile,
              { backgroundColor: color },
              {
                opacity: tileAnims[i],
                transform: [{ scale: tileAnims[i] }],
              },
            ]}
          />
        ))}
      </View>

      {/* ── Text reveal ──────────────────────────────────────────── */}
      <View style={s.textWrap}>
        <Animated.Text
          style={[
            s.title,
            { opacity: titleOpacity, transform: [{ scale: titleScale }] },
          ]}
        >
          CubeIQ
        </Animated.Text>
        <Animated.Text style={[s.subtitle, { opacity: subtitleOpacity }]}>
          ALGORITHMIC PRECISION
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 999,
    backgroundColor: "#000040",
    alignItems: "center",
    justifyContent: "center",
    gap: 36,
  },
  faceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: 192,
    gap: 6,
  },
  tile: {
    width: 58,
    height: 58,
    borderRadius: 8,
  },
  textWrap: {
    alignItems: "center",
    gap: 10,
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
});
