import React from "react";
import { View, StyleSheet } from "react-native";
import { CameraView as ExpoCameraView } from "expo-camera";
import GridOverlay from "./GridOverlay";

interface Props {
  size: number;
  cameraRef: React.RefObject<ExpoCameraView | null>;
}

export default function CameraView({ size, cameraRef }: Props) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <ExpoCameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
      />
      <GridOverlay size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#111",
  },
});
