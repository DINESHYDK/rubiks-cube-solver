import React from "react";
import {
  View,
  Pressable,
  Text,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import type { CubeColor, CubeState, FaceName } from "@/types/cube";
import { CUBE_COLORS } from "@/lib/constants";

const ALL_COLORS: CubeColor[] = [
  "white",
  "red",
  "green",
  "yellow",
  "orange",
  "blue",
];

const FACE_LABELS: Record<FaceName, string> = {
  U: "U",
  R: "R",
  F: "F",
  D: "D",
  L: "L",
  B: "B",
};

interface Props {
  state: CubeState;
  editable?: boolean;
  onCellChange?: (face: FaceName, index: number, color: CubeColor) => void;
  cellSize?: number;
}

function FaceGrid({
  face,
  colors,
  cellSize,
  editable,
  onCellChange,
}: {
  face: FaceName;
  colors: CubeColor[];
  cellSize: number;
  editable: boolean;
  onCellChange?: (i: number, c: CubeColor) => void;
}) {
  const gap = 2;
  const gridW = cellSize * 3 + gap * 2;
  return (
    <View>
      <Text style={[styles.faceLabel, { width: gridW }]}>
        {FACE_LABELS[face]}
      </Text>
      <View style={[styles.faceGrid, { width: gridW, height: gridW, gap }]}>
        {colors.map((color, i) => {
          const isCenter = i === 4;
          return (
            <Pressable
              key={i}
              disabled={isCenter || !editable}
              onPress={() => {
                const ci = ALL_COLORS.indexOf(color);
                onCellChange?.(i, ALL_COLORS[(ci + 1) % ALL_COLORS.length]);
              }}
              style={[
                styles.cell,
                {
                  width: cellSize,
                  height: cellSize,
                  backgroundColor: CUBE_COLORS[color],
                  borderColor: isCenter
                    ? "rgba(255,255,255,0.55)"
                    : "rgba(0,0,0,0.45)",
                  borderWidth: isCenter ? 2 : 1,
                  borderRadius: 3,
                },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function CubeNet({
  state,
  editable = true,
  onCellChange,
  cellSize: csProp,
}: Props) {
  const { width } = useWindowDimensions();
  const cellSize =
    csProp ?? Math.max(20, Math.floor((Math.min(width, 440) - 56) / 14));
  const gap = 2;
  const faceW = cellSize * 3 + gap * 2;

  const spacer = <View style={{ width: faceW, height: faceW + 18 }} />;
  const onChange = (f: FaceName) => (i: number, c: CubeColor) =>
    onCellChange?.(f, i, c);

  return (
    <View style={styles.container}>
      {/* Row 1: U */}
      <View style={styles.row}>
        {spacer}
        <FaceGrid
          face="U"
          colors={state.U}
          cellSize={cellSize}
          editable={editable}
          onCellChange={onChange("U")}
        />
        {spacer}
        {spacer}
      </View>
      {/* Row 2: L F R B */}
      <View style={styles.row}>
        <FaceGrid
          face="L"
          colors={state.L}
          cellSize={cellSize}
          editable={editable}
          onCellChange={onChange("L")}
        />
        <FaceGrid
          face="F"
          colors={state.F}
          cellSize={cellSize}
          editable={editable}
          onCellChange={onChange("F")}
        />
        <FaceGrid
          face="R"
          colors={state.R}
          cellSize={cellSize}
          editable={editable}
          onCellChange={onChange("R")}
        />
        <FaceGrid
          face="B"
          colors={state.B}
          cellSize={cellSize}
          editable={editable}
          onCellChange={onChange("B")}
        />
      </View>
      {/* Row 3: D */}
      <View style={styles.row}>
        {spacer}
        <FaceGrid
          face="D"
          colors={state.D}
          cellSize={cellSize}
          editable={editable}
          onCellChange={onChange("D")}
        />
        {spacer}
        {spacer}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  row: { flexDirection: "row", gap: 3, marginBottom: 3 },
  faceGrid: { flexDirection: "row", flexWrap: "wrap" },
  faceLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8B949E",
    textAlign: "center",
    marginBottom: 2,
  },
  cell: {},
});
