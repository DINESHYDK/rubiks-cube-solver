import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  ScrollView,
  Platform,
} from "react-native";
import { useTheme } from "@/lib/theme";

// Cube-specific face color constants
const FACE_HEX: Record<string, string> = {
  R: "#B71234",
  L: "#FF5800",
  U: "#EEEEEE",
  D: "#FFD500",
  F: "#009B48",
  B: "#0046AD",
};

const MOVE_CHIPS = [
  { move: "R",  face: "R" },
  { move: "R'", face: "R" },
  { move: "L",  face: "L" },
  { move: "L'", face: "L" },
  { move: "U",  face: "U" },
  { move: "U'", face: "U" },
  { move: "D",  face: "D" },
  { move: "D'", face: "D" },
  { move: "F",  face: "F" },
  { move: "F'", face: "F" },
  { move: "B",  face: "B" },
  { move: "B'", face: "B" },
];

function hexOpacity(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface AlgorithmChipsProps {
  moves: string[];
  step: number;
  isAnimating: boolean;
  onChipPress: (index: number) => void;
  onMovePress: (move: string) => void;
}

// Individual algorithm chip with active scale animation
function AlgorithmChip({
  move,
  index,
  step,
  onChipPress,
  highlight,
  border,
  cardAlt,
  muted,
  text,
}: {
  move: string;
  index: number;
  step: number;
  onChipPress: (index: number) => void;
  highlight: string;
  border: string;
  cardAlt: string;
  muted: string;
  text: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isActive = index === step;
  const isDone = index < step;

  useEffect(() => {
    if (isActive) {
      Animated.spring(scaleAnim, {
        toValue: 1.05,
        useNativeDriver: true,
        friction: 6,
        tension: 120,
      }).start();
    } else {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 120,
      }).start();
    }
  }, [isActive]);

  let backgroundColor: string;
  let chipBorderColor: string;
  let chipColor: string;
  let fontWeight: "400" | "700" = "400";
  let opacity = 1;

  if (isDone) {
    backgroundColor = cardAlt;
    chipBorderColor = border;
    chipColor = muted;
    opacity = 0.35;
  } else if (isActive) {
    backgroundColor = hexOpacity(highlight, 0.15);
    chipBorderColor = highlight;
    chipColor = highlight;
    fontWeight = "700";
  } else {
    backgroundColor = cardAlt;
    chipBorderColor = border;
    chipColor = text;
  }

  const monoFont = Platform.OS === "ios" ? "Courier" : "monospace";

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity }}>
      <Pressable
        onPress={() => onChipPress(index)}
        style={[
          styles.algoChip,
          {
            backgroundColor,
            borderColor: chipBorderColor,
          },
        ]}
      >
        <Text
          style={{
            fontFamily: monoFont,
            fontSize: 13,
            fontWeight,
            color: chipColor,
          }}
        >
          {move}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Individual notation guide chip with press animation
function NotationChip({
  move,
  face,
  isAnimating,
  onMovePress,
  border,
  cardAlt,
  text,
}: {
  move: string;
  face: string;
  isAnimating: boolean;
  onMovePress: (move: string) => void;
  border: string;
  cardAlt: string;
  text: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const monoFont = Platform.OS === "ios" ? "Courier" : "monospace";

  const handlePressIn = () => {
    Animated.timing(scaleAnim, {
      toValue: 0.9,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  // For the U (white) face, use the border color so it's visible in both themes
  const dotColor = face === "U" ? border : FACE_HEX[face];

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        isAnimating && styles.disabledChip,
      ]}
    >
      <Pressable
        onPress={() => !isAnimating && onMovePress(move)}
        onPressIn={!isAnimating ? handlePressIn : undefined}
        onPressOut={!isAnimating ? handlePressOut : undefined}
        disabled={isAnimating}
        style={[
          styles.notationChip,
          {
            backgroundColor: cardAlt,
            borderColor: border,
          },
        ]}
      >
        <View style={[styles.faceDot, { backgroundColor: dotColor }]} />
        <Text
          style={{
            fontFamily: monoFont,
            fontSize: 13,
            fontWeight: "600",
            color: text,
          }}
        >
          {move}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function AlgorithmChips({
  moves,
  step,
  isAnimating,
  onChipPress,
  onMovePress,
}: AlgorithmChipsProps) {
  const t = useTheme();

  return (
    <View>
      {/* Section A: Algorithm Sequence */}
      {moves.length > 0 && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: t.CARD,
              borderColor: t.BORDER,
            },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: t.MUTED }]}>
            ALGORITHM SEQUENCE
          </Text>
          <View style={styles.chipsRow}>
            {moves.map((move, index) => (
              <AlgorithmChip
                key={`algo-${index}`}
                move={move}
                index={index}
                step={step}
                onChipPress={onChipPress}
                highlight={t.HIGHLIGHT}
                border={t.BORDER}
                cardAlt={t.CARD_ALT}
                muted={t.MUTED}
                text={t.TEXT}
              />
            ))}
          </View>
        </View>
      )}

      {/* Section B: Move Notation Guide */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: t.CARD,
            borderColor: t.BORDER,
          },
        ]}
      >
        <Text style={[styles.sectionLabel, { color: t.MUTED }]}>
          TAP ANY MOVE TO PREVIEW IT
        </Text>
        <View style={styles.notationGrid}>
          {MOVE_CHIPS.map(({ move, face }) => (
            <NotationChip
              key={`notation-${move}`}
              move={move}
              face={face}
              isAnimating={isAnimating}
              onMovePress={onMovePress}
              border={t.BORDER}
              cardAlt={t.CARD_ALT}
              text={t.TEXT}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  algoChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  notationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  notationChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  faceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  disabledChip: {
    opacity: 0.35,
  },
});
