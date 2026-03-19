import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================
// Dark Mode Tokens (default)
// ============================================
export const BG       = '#000040';
export const CARD     = '#0A0A5C';
export const CARD_ALT = '#12127A';
export const BORDER   = '#2020A0';
export const TEXT     = '#E6EDF3';
export const MUTED    = '#8899CC';

// ============================================
// Light Mode Tokens
// ============================================
export const BG_LIGHT     = '#F0F8FF';
export const CARD_LIGHT   = '#FFFFFF';
export const BORDER_LIGHT = '#C0D8F0';
export const TEXT_LIGHT   = '#0A0A3A';
export const MUTED_LIGHT  = '#4A6080';
export const ACCENT_LIGHT = '#90D5FF';

// ============================================
// Shared Accent Colors (same in both modes)
// ============================================
export const ACCENT     = '#90D5FF';
export const GREEN      = '#009B48';
export const RED        = '#B71234';
export const ORANGE     = '#FF5800';
export const YELLOW     = '#FFD500';
export const BLUE       = '#0046AD';
export const WHITE_FACE = '#EEEEEE';
export const CUBE_CORE  = '#050505';

// ============================================
// Cube Face Color Map
// ============================================
export const CUBE_FACE = {
  R: RED,
  L: ORANGE,
  U: WHITE_FACE,
  D: YELLOW,
  F: GREEN,
  B: BLUE,
  CORE: CUBE_CORE,
} as const;

// ============================================
// Theme Token Sets (for useTheme hook)
// ============================================
export interface ThemeTokens {
  BG: string;
  CARD: string;
  CARD_ALT: string;
  BORDER: string;
  TEXT: string;
  MUTED: string;
  ACCENT: string;
  GREEN: string;
  RED: string;
  ORANGE: string;
  YELLOW: string;
  BLUE: string;
  WHITE_FACE: string;
  CUBE_CORE: string;
  isDark: boolean;
}

const darkTokens: ThemeTokens = {
  BG, CARD, CARD_ALT, BORDER, TEXT, MUTED,
  ACCENT, GREEN, RED, ORANGE, YELLOW, BLUE, WHITE_FACE, CUBE_CORE,
  isDark: true,
};

const lightTokens: ThemeTokens = {
  BG: BG_LIGHT,
  CARD: CARD_LIGHT,
  CARD_ALT: '#E8F4FF',
  BORDER: BORDER_LIGHT,
  TEXT: TEXT_LIGHT,
  MUTED: MUTED_LIGHT,
  ACCENT, GREEN, RED, ORANGE, YELLOW, BLUE, WHITE_FACE, CUBE_CORE,
  isDark: false,
};

// ============================================
// useTheme() hook
// Reads preference from AsyncStorage key "settings".
// Falls back to system color scheme, then dark.
// ============================================
export function useTheme(): ThemeTokens {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<'dark' | 'light'>(
    systemScheme === 'light' ? 'light' : 'dark'
  );

  useEffect(() => {
    AsyncStorage.getItem('settings')
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as { theme?: 'dark' | 'light' };
        if (parsed.theme === 'light' || parsed.theme === 'dark') {
          setMode(parsed.theme);
        }
      })
      .catch(() => {/* keep default */});
  }, []);

  return mode === 'dark' ? darkTokens : lightTokens;
}

// ============================================
// Static Style Helpers (theme-agnostic)
// ============================================
export const card = {
  backgroundColor: CARD,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: BORDER,
  padding: 16,
} as const;

export const cardLabel = {
  fontSize: 11,
  fontWeight: '700' as const,
  color: MUTED,
  letterSpacing: 1,
  marginBottom: 10,
} as const;