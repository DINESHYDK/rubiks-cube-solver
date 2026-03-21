import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

// ── Constants ─────────────────────────────────────────────────────────────────

const COLORS = ["#90D5FF", "#009B48", "#B71234", "#FFD500", "#FF5800", "#0046AD"];
const COUNT  = 30;

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min);
}

// ── Particle shape ────────────────────────────────────────────────────────────

interface Particle {
  left:  number;           // % across screen
  ty:    Animated.Value;   // translateY (starts 0, goes negative = up)
  tx:    Animated.Value;   // translateX
  rot:   Animated.Value;   // degrees 0 → target
  op:    Animated.Value;   // opacity
  color: string;
  dur:   number;           // total animation duration ms
  delay: number;           // stagger delay ms
}

function makeParticles(): Particle[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    left:  rnd(20, 80),
    ty:    new Animated.Value(0),
    tx:    new Animated.Value(0),
    rot:   new Animated.Value(0),
    op:    new Animated.Value(0),
    color: COLORS[i % COLORS.length],
    dur:   rnd(1200, 1600),
    delay: rnd(0, 250),
  }));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ConfettiEffect({
  visible,
  onComplete,
}: {
  visible:     boolean;
  onComplete?: () => void;
}) {
  // Stable particle set — recreated each time visible flips true
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    if (!visible) {
      // Reset silently so next trigger starts clean
      particles.current.forEach((p) => {
        p.ty.setValue(0);
        p.tx.setValue(0);
        p.rot.setValue(0);
        p.op.setValue(0);
      });
      return;
    }

    // Rebuild with fresh random values each burst
    particles.current = makeParticles();

    const anims = particles.current.map((p) => {
      const targetY   = -rnd(400, 600);
      const targetX   = rnd(-150, 150);
      const targetRot = rnd(180, 720);
      const fadeStart = Math.max(0, p.dur - 400);

      return Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          // Appear instantly
          Animated.timing(p.op, {
            toValue:         1,
            duration:        60,
            useNativeDriver: true,
          }),
          // Fly upward
          Animated.timing(p.ty, {
            toValue:         targetY,
            duration:        p.dur,
            easing:          Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          // Drift sideways
          Animated.timing(p.tx, {
            toValue:         targetX,
            duration:        p.dur,
            easing:          Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          // Spin
          Animated.timing(p.rot, {
            toValue:         targetRot,
            duration:        p.dur,
            easing:          Easing.linear,
            useNativeDriver: true,
          }),
          // Fade out in last 400 ms
          Animated.sequence([
            Animated.delay(fadeStart),
            Animated.timing(p.op, {
              toValue:         0,
              duration:        400,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]);
    });

    Animated.parallel(anims).start(() => onComplete?.());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={s.container} pointerEvents="none">
      {particles.current.map((p, i) => {
        const rotate = p.rot.interpolate({
          inputRange:  [0, 720],
          outputRange: ["0deg", "720deg"],
          extrapolate: "clamp",
        });
        return (
          <Animated.View
            key={i}
            style={[
              s.particle,
              {
                left:            `${p.left}%` as any,
                backgroundColor: p.color,
                opacity:         p.op,
                transform: [
                  { translateY: p.ty },
                  { translateX: p.tx },
                  { rotate },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex:   999,
    overflow: "hidden",
    // Particles originate near the bottom-centre
    justifyContent: "flex-end",
    alignItems:     "center",
  },
  particle: {
    position:     "absolute",
    bottom:       80,
    width:        8,
    height:       8,
    borderRadius: 2,
  },
});
