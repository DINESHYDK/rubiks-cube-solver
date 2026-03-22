import React, { useEffect, useRef } from "react";
import {
  Text,
  Image,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from "react-native";

interface Props {
  onComplete: () => void;
}

export default function AppSplashScreen({ onComplete }: Props) {
  const { width, height } = useWindowDimensions();

  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(scale,   { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    const done = setTimeout(onComplete, 2200);
    return () => clearTimeout(done);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View
      style={[s.container, { width, height }]}
      pointerEvents="none"
    >
      <Animated.View style={[s.content, { opacity, transform: [{ scale }] }]}>
        <Image
          source={require("../assets/images/splash-icon.png")}
          style={s.splashIcon}
          resizeMode="contain"
        />
        <Text style={s.subtitle}>ALGORITHMIC PRECISION</Text>
      </Animated.View>

      <Text style={s.createdBy}>created by Dinesh</Text>
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
  content: {
    alignItems: "center",
    gap: 24,
  },
  splashIcon: {
    width: 220,
    height: 220,
    borderRadius: 32,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8899CC",
    letterSpacing: 6,
    textTransform: "uppercase",
  },
  createdBy: {
    position: "absolute",
    bottom: 48,
    fontSize: 13,
    color: "rgba(144,213,255,0.4)",
    letterSpacing: 2,
  },
});
