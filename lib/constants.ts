import type { CubeColor, CubeState, FaceName } from '@/types/cube';

// ============================================
// Color Constants
// ============================================

/** Hex colors for rendering the cube */
export const CUBE_COLORS: Record<CubeColor, string> = {
  white: '#FFFFFF',
  red: '#B71234',
  green: '#009B48',
  yellow: '#FFD500',
  orange: '#FF5800',
  blue: '#0046AD',
};

/** Face-to-color mapping (standard Rubik's orientation) */
export const FACE_COLOR_MAP: Record<FaceName, CubeColor> = {
  U: 'white',
  R: 'red',
  F: 'green',
  D: 'yellow',
  L: 'orange',
  B: 'blue',
};

/** Face labels for UI display */
export const FACE_LABELS: Record<FaceName, string> = {
  U: 'Top (White)',
  R: 'Right (Red)',
  F: 'Front (Green)',
  D: 'Bottom (Yellow)',
  L: 'Left (Orange)',
  B: 'Back (Blue)',
};

/** Order to scan faces */
export const SCAN_ORDER: FaceName[] = ['U', 'F', 'R', 'B', 'L', 'D'];

// ============================================
// Solved State
// ============================================

const makeFace = (color: CubeColor) =>
  [color, color, color, color, color, color, color, color, color] as CubeState[FaceName];

export const SOLVED_STATE: CubeState = {
  U: makeFace('white'),
  R: makeFace('red'),
  F: makeFace('green'),
  D: makeFace('yellow'),
  L: makeFace('orange'),
  B: makeFace('blue'),
};

// ============================================
// API
// ============================================

export const API_BASE_URL = __DEV__
  ? 'http://172.22.76.144:3001/api'
  : 'https://your-backend.onrender.com/api';

// ============================================
// Animation
// ============================================

export const DEFAULT_ANIMATION_SPEED = 500; // ms per move
export const MIN_ANIMATION_SPEED = 100;
export const MAX_ANIMATION_SPEED = 2000;
