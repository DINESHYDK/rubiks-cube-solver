import type { CubeColor, CubeState, FaceName, FaceState } from '@/types/cube';
import { FACE_COLOR_MAP } from './constants';

/**
 * Convert our CubeState to the 54-character string format used by cubejs.
 * Order: U R F D L B, reading each face left-to-right, top-to-bottom.
 */
export function cubeStateToString(state: CubeState): string {
  const colorToFace: Record<CubeColor, FaceName> = {} as Record<CubeColor, FaceName>;
  for (const [face, color] of Object.entries(FACE_COLOR_MAP)) {
    colorToFace[color as CubeColor] = face as FaceName;
  }

  const faces: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  let result = '';

  for (const face of faces) {
    for (const color of state[face]) {
      result += colorToFace[color];
    }
  }

  return result;
}

/**
 * Convert a 54-character string back to CubeState.
 */
export function stringToCubeState(str: string): CubeState {
  if (str.length !== 54) {
    throw new Error(`Invalid cube string length: ${str.length}, expected 54`);
  }

  const faceToColor: Record<string, CubeColor> = {};
  for (const [face, color] of Object.entries(FACE_COLOR_MAP)) {
    faceToColor[face] = color;
  }

  const faces: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  const state: Partial<CubeState> = {};

  for (let i = 0; i < 6; i++) {
    const faceStr = str.slice(i * 9, (i + 1) * 9);
    state[faces[i]] = faceStr.split('').map((ch) => faceToColor[ch]) as unknown as FaceState;
  }

  return state as CubeState;
}

/**
 * Validate a CubeState:
 * 1. Must have exactly 9 of each color
 * 2. Center pieces must match expected colors
 */
export function validateCubeState(state: CubeState): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Count colors
  const colorCounts: Record<CubeColor, number> = {
    white: 0,
    red: 0,
    green: 0,
    yellow: 0,
    orange: 0,
    blue: 0,
  };

  const faces: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  for (const face of faces) {
    if (!state[face] || state[face].length !== 9) {
      errors.push(`Face ${face} is missing or has wrong number of squares`);
      continue;
    }
    for (const color of state[face]) {
      colorCounts[color]++;
    }
  }

  // Check exactly 9 of each color
  for (const [color, count] of Object.entries(colorCounts)) {
    if (count !== 9) {
      errors.push(`Expected 9 ${color} squares, found ${count}`);
    }
  }

  // Check center pieces (index 4 of each face)
  for (const face of faces) {
    if (state[face]) {
      const expectedCenter = FACE_COLOR_MAP[face];
      const actualCenter = state[face][4];
      if (actualCenter !== expectedCenter) {
        errors.push(
          `Center of face ${face} should be ${expectedCenter}, found ${actualCenter}`
        );
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
