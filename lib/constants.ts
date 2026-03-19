import type { CubeColor, CubeState, FaceName } from '@/types/cube';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

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



// Dynamically detect the dev server host for API calls
function getApiBaseUrl(): string {
  if (!__DEV__) {
    // Replace with your deployed Python backend URL before publishing
    return 'https://your-cv-backend.onrender.com';
  }
  // In dev, use the Expo dev server host (works over WiFi with Expo Go)
  const debuggerHost =
    Constants.expoConfig?.hostUri ?? // Expo SDK 55+
    Constants.manifest2?.extra?.expoGo?.debuggerHost ??
    (Constants.manifest as any)?.debuggerHost;
  if (debuggerHost) {
    const host = debuggerHost.split(':')[0]; // strip port
    return `http://${host}:8000`;
  }
  // Fallback for web — guard against SSR where window doesn't exist
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:8000`;
  }
  return 'http://localhost:8000';
}

// Lazy-evaluate so it doesn't crash during module import
let _cachedApiUrl: string | null = null;
export function getApiUrl(): string {
  if (!_cachedApiUrl) _cachedApiUrl = getApiBaseUrl();
  return _cachedApiUrl;
}
// Keep backward-compatible export (evaluated lazily via getter)
export const API_BASE_URL = getApiBaseUrl();

// ============================================
// Animation
// ============================================

export const DEFAULT_ANIMATION_SPEED = 500; // ms per move
export const MIN_ANIMATION_SPEED = 100;
export const MAX_ANIMATION_SPEED = 2000;
