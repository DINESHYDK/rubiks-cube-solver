// ============================================
// Rubik's Cube Type Definitions
// ============================================

/** The 6 colors of a standard Rubik's Cube */
export type CubeColor = 'white' | 'red' | 'green' | 'yellow' | 'orange' | 'blue';

/** The 6 faces of a Rubik's Cube */
export type FaceName = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

/** A single face is a 3x3 grid of colors (9 squares) */
export type FaceState = [
  CubeColor, CubeColor, CubeColor,
  CubeColor, CubeColor, CubeColor,
  CubeColor, CubeColor, CubeColor,
];

/** Complete cube state: all 6 faces */
export type CubeState = Record<FaceName, FaceState>;

/** Standard Rubik's Cube move notation */
export type Move =
  | 'R' | "R'" | 'R2'
  | 'L' | "L'" | 'L2'
  | 'U' | "U'" | 'U2'
  | 'D' | "D'" | 'D2'
  | 'F' | "F'" | 'F2'
  | 'B' | "B'" | 'B2';

/** A solution is an ordered array of moves */
export type Solution = Move[];

/** RGB color representation */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/** HSV color representation */
export interface HSVColor {
  h: number; // 0-360
  s: number; // 0-100
  v: number; // 0-100
}

/** A single solve record (stored in DB) */
export interface SolveRecord {
  id: string;
  scramble: string;
  solution: Solution;
  moveCount: number;
  solveTimeMs?: number;
  createdAt: string;
}

/** API response from /api/solve */
export interface SolveResponse {
  moves: Solution;
  moveCount: number;
}

/** API response from /api/validate */
export interface ValidateResponse {
  valid: boolean;
  errors: string[];
}

/** API response from /api/scramble */
export interface ScrambleResponse {
  scramble: string;
  state: string;
}

/** Scan progress for camera scanning */
export interface ScanProgress {
  scannedFaces: FaceName[];
  currentFace: FaceName | null;
  totalFaces: 6;
}

/** 3D cube animation state */
export interface AnimationState {
  isPlaying: boolean;
  currentMoveIndex: number;
  totalMoves: number;
  speed: number; // ms per move
}
