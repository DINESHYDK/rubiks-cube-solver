import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';

// ── Props ──────────────────────────────────────────────────────────────────────

interface PlaybackCardProps {
  playbackMode: 'auto' | 'manual';
  stepDelay: number;
  step: number;
  moves: string[];
  playing: boolean;
  solving: boolean;
  isAnimating: boolean;
  onModeChange: (mode: 'auto' | 'manual') => void;
  onDelayChange: (delay: number) => void;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onPrev: () => void;
}

// ── AnimatedPressable ──────────────────────────────────────────────────────────

function AnimatedPressable({
  onPress,
  style,
  children,
  disabled = false,
}: {
  onPress: () => void;
  style: any;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const flat = StyleSheet.flatten(style) as any;

  const pressIn = () =>
    Animated.parallel([
      Animated.timing(scale, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.85, duration: 100, useNativeDriver: true }),
    ]).start();

  const pressOut = () =>
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

  return (
    <Pressable
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      disabled={disabled}
      style={{ flex: flat?.flex, width: flat?.width, alignSelf: flat?.alignSelf }}
    >
      <Animated.View style={[style, { transform: [{ scale }], opacity }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ── PlaybackCard ───────────────────────────────────────────────────────────────

export default function PlaybackCard({
  playbackMode,
  stepDelay,
  step,
  moves,
  playing,
  solving,
  isAnimating,
  onModeChange,
  onDelayChange,
  onPlay,
  onPause,
  onNext,
  onPrev,
}: PlaybackCardProps) {
  const T = useTheme();

  const prevDisabled = step < 0 || isAnimating;
  const nextDisabled = step >= moves.length - 1 || isAnimating;
  const playPauseDisabled = moves.length === 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: T.CARD,
          borderColor: T.BORDER,
        },
      ]}
    >
      {/* Section label */}
      <Text style={[styles.sectionLabel, { color: T.MUTED }]}>PLAYBACK</Text>

      {/* Mode Toggle Row */}
      <View style={styles.modeRow}>
        <Text style={[styles.modeLabel, { color: T.TEXT }]}>Mode</Text>
        <View
          style={[
            styles.pillContainer,
            { backgroundColor: T.CARD_ALT, borderColor: T.BORDER },
          ]}
        >
          {(['auto', 'manual'] as const).map((option) => {
            const isActive = playbackMode === option;
            return (
              <Pressable
                key={option}
                onPress={() => onModeChange(option)}
                style={[
                  styles.pillOption,
                  { backgroundColor: isActive ? T.HIGHLIGHT : 'transparent' },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    {
                      color: isActive ? T.BG : T.MUTED,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {option === 'auto' ? 'Auto' : 'Manual'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Auto mode: step delay controls */}
      {playbackMode === 'auto' && (
        <View>
          {/* Step delay label + badge */}
          <View style={styles.delayRow}>
            <Text style={[styles.modeLabel, { color: T.TEXT }]}>Step delay</Text>
            <View style={[styles.valueBadge, { backgroundColor: T.CARD_ALT }]}>
              <Text style={[styles.valueBadgeText, { color: T.HIGHLIGHT }]}>
                {stepDelay} ms
              </Text>
            </View>
          </View>

          {/* Native +/- buttons */}
          {Platform.OS !== 'web' && (
            <View style={styles.nativeSliderRow}>
              <AnimatedPressable
                onPress={() => onDelayChange(Math.max(100, stepDelay - 200))}
                style={[
                  styles.stepButton,
                  { backgroundColor: T.CARD_ALT, borderColor: T.BORDER },
                ]}
              >
                <Ionicons name="remove" size={18} color={T.TEXT} />
              </AnimatedPressable>

              <Text style={[styles.stepValue, { color: T.TEXT }]}>{stepDelay}</Text>

              <AnimatedPressable
                onPress={() => onDelayChange(Math.min(2500, stepDelay + 200))}
                style={[
                  styles.stepButton,
                  { backgroundColor: T.CARD_ALT, borderColor: T.BORDER },
                ]}
              >
                <Ionicons name="add" size={18} color={T.TEXT} />
              </AnimatedPressable>
            </View>
          )}

          {/* Web slider */}
          {Platform.OS === 'web' && (
            <View style={styles.webSliderContainer}>
              {/* @ts-ignore — web-only input element */}
              <input
                type="range"
                min={100}
                max={2500}
                step={100}
                value={stepDelay}
                onChange={(e: any) => onDelayChange(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <View style={styles.webSliderLabels}>
                <Text style={[styles.webSliderLabel, { color: T.MUTED }]}>
                  Fast — 100ms
                </Text>
                <Text style={[styles.webSliderLabel, { color: T.MUTED }]}>
                  2500ms — Slow
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Manual mode: placeholder spacer (transport shown below for both modes) */}
      {playbackMode === 'manual' && <View style={styles.manualSpacer} />}

      {/* Transport controls — always visible */}
      <View style={styles.transportRow}>
        {/* Prev */}
        <AnimatedPressable
          onPress={onPrev}
          disabled={prevDisabled}
          style={[
            styles.transportBtn,
            { flex: 1, backgroundColor: T.CARD_ALT, borderColor: T.BORDER },
            prevDisabled && styles.disabledBtn,
          ]}
        >
          <Ionicons name="play-skip-back" size={18} color={T.TEXT} />
        </AnimatedPressable>

        {/* Play / Pause */}
        <AnimatedPressable
          onPress={playing ? onPause : onPlay}
          disabled={playPauseDisabled}
          style={[
            styles.transportBtn,
            { flex: 1.6, backgroundColor: playing ? T.ACCENT : T.HIGHLIGHT },
            playPauseDisabled && styles.disabledBtn,
          ]}
        >
          {solving ? (
            <ActivityIndicator size="small" color={playing ? '#fff' : T.BG} />
          ) : (
            <Ionicons
              name={playing ? 'pause' : 'play'}
              size={18}
              color={playing ? '#fff' : T.BG}
            />
          )}
        </AnimatedPressable>

        {/* Next */}
        <AnimatedPressable
          onPress={onNext}
          disabled={nextDisabled}
          style={[
            styles.transportBtn,
            { flex: 1, backgroundColor: T.CARD_ALT, borderColor: T.BORDER },
            nextDisabled && styles.disabledBtn,
          ]}
        >
          <Ionicons name="play-skip-forward" size={18} color={T.TEXT} />
        </AnimatedPressable>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  sectionLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeLabel: {
    fontSize: 14,
  },
  pillContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pillOption: {
    paddingHorizontal: 16,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 13,
  },
  delayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  valueBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  valueBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  nativeSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 10,
    marginBottom: 4,
  },
  stepButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  webSliderContainer: {
    marginTop: 8,
  },
  webSliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  webSliderLabel: {
    fontSize: 10,
  },
  manualSpacer: {
    height: 4,
  },
  transportRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  transportBtn: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.3,
  },
});
