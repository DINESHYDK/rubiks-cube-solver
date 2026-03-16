// ============================================
// Shared Design Tokens — Rubik's Cube App
// ============================================

// ── Background & Surface ────────────────────
export const BG = '#0D1117';
export const CARD = '#161B22';
export const CARD_ALT = '#1C2128';
export const BORDER = '#30363D';

// ── Text ────────────────────────────────────
export const TEXT = '#E6EDF3';
export const MUTED = '#8B949E';

// ── Accent Colors ───────────────────────────
export const BLUE = '#0046AD';
export const GREEN = '#009B48';
export const RED = '#B71234';
export const ORANGE = '#FF5800';
export const YELLOW = '#FFD500';
export const WHITE_ACCENT = '#EEEEEE';

// ── Cube Face Colors ────────────────────────
export const CUBE_FACE = {
  R: RED,
  L: ORANGE,
  U: WHITE_ACCENT,
  D: YELLOW,
  F: GREEN,
  B: BLUE,
  CORE: '#050505',
} as const;

// ── Shared Style Helpers ────────────────────
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
};
