import { useThemeMode } from './themeContext';

// ── Dark theme ────────────────────────────────────────────────────────────────
export const DARK = {
  BG:        '#0D0D0D',
  CARD:      '#1A1A1A',
  CARD_ALT:  '#242424',
  BORDER:    '#2E2E2E',
  TEXT:      '#F0F0F0',
  MUTED:     '#7A7A7A',
  HIGHLIGHT: '#B8E4C0',   // pastel green — primary CTA
  ACCENT:    '#9B8FD4',   // soft violet — secondary interactive
  GREEN:     '#009B48',
  RED:       '#B71234',
  ORANGE:    '#FF5800',
  YELLOW:    '#FFD500',
  BLUE:      '#0046AD',
  isDark:    true,
};

// ── Light theme ───────────────────────────────────────────────────────────────
export const LIGHT = {
  BG:        '#F2F2F2',
  CARD:      '#FFFFFF',
  CARD_ALT:  '#F7F7F7',
  BORDER:    '#E8E8E8',
  TEXT:      '#0A0A0A',
  MUTED:     '#6B6B6B',
  HIGHLIGHT: '#5B4FCF',   // rich violet — primary CTA
  ACCENT:    '#7165DA',   // medium violet — secondary interactive
  GREEN:     '#009B48',
  RED:       '#B71234',
  ORANGE:    '#FF5800',
  YELLOW:    '#FFD500',
  BLUE:      '#0046AD',
  isDark:    false,
};

export type ThemeTokens = typeof DARK;

// ── useTheme() hook ───────────────────────────────────────────────────────────
export function useTheme(): ThemeTokens {
  const { mode } = useThemeMode();
  return mode === 'dark' ? DARK : LIGHT;
}
