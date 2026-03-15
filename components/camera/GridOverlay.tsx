import React from "react";
import { View, StyleSheet } from "react-native";

interface Props {
  size: number;
  color?: string;
}

export default function GridOverlay({
  size,
  color = "rgba(255,255,255,0.85)",
}: Props) {
  const c = size / 3;
  return (
    <View
      style={[styles.wrap, { width: size, height: size }]}
      pointerEvents="none"
    >
      {/* outer border */}
      <View
        style={[
          styles.border,
          { width: size, height: size, borderColor: color },
        ]}
      />
      {/* horizontal lines */}
      <View
        style={[styles.hLine, { top: c, width: size, backgroundColor: color }]}
      />
      <View
        style={[
          styles.hLine,
          { top: c * 2, width: size, backgroundColor: color },
        ]}
      />
      {/* vertical lines */}
      <View
        style={[
          styles.vLine,
          { left: c, height: size, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.vLine,
          { left: c * 2, height: size, backgroundColor: color },
        ]}
      />
      {/* corner brackets */}
      <View style={[styles.cTL, { borderColor: color }]} />
      <View style={[styles.cTR, { borderColor: color }]} />
      <View style={[styles.cBL, { borderColor: color }]} />
      <View style={[styles.cBR, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute" },
  border: { position: "absolute", borderWidth: 2, borderRadius: 4 },
  hLine: { position: "absolute", height: 1, left: 0 },
  vLine: { position: "absolute", width: 1, top: 0 },
  cTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
});
