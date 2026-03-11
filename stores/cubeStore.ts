import { create } from 'zustand';
import type { AnimationState, CubeState, FaceName, FaceState, Move, ScanProgress, Solution } from '@/types/cube';
import { SOLVED_STATE, DEFAULT_ANIMATION_SPEED, SCAN_ORDER } from '@/lib/constants';

interface CubeStore {
  // Cube State
  cubeState: CubeState;
  setCubeState: (state: CubeState) => void;
  setFace: (face: FaceName, faceState: FaceState) => void;
  resetCube: () => void;

  // Scanning
  scanProgress: ScanProgress;
  startScanning: () => void;
  completeFaceScan: (face: FaceName, faceState: FaceState) => void;
  resetScan: () => void;

  // Solution
  solution: Solution | null;
  setSolution: (solution: Solution) => void;
  clearSolution: () => void;

  // Animation
  animation: AnimationState;
  setAnimationPlaying: (playing: boolean) => void;
  nextMove: () => void;
  prevMove: () => void;
  setAnimationSpeed: (speed: number) => void;
  resetAnimation: () => void;
}

export const useCubeStore = create<CubeStore>((set, get) => ({
  // ---- Cube State ----
  cubeState: { ...SOLVED_STATE },

  setCubeState: (cubeState) => set({ cubeState }),

  setFace: (face, faceState) =>
    set((state) => ({
      cubeState: { ...state.cubeState, [face]: faceState },
    })),

  resetCube: () => set({ cubeState: { ...SOLVED_STATE } }),

  // ---- Scanning ----
  scanProgress: {
    scannedFaces: [],
    currentFace: null,
    totalFaces: 6,
  },

  startScanning: () =>
    set({
      scanProgress: {
        scannedFaces: [],
        currentFace: SCAN_ORDER[0],
        totalFaces: 6,
      },
    }),

  completeFaceScan: (face, faceState) =>
    set((state) => {
      const scannedFaces = [...state.scanProgress.scannedFaces, face];
      const nextIndex = scannedFaces.length;
      const currentFace = nextIndex < 6 ? SCAN_ORDER[nextIndex] : null;

      return {
        cubeState: { ...state.cubeState, [face]: faceState },
        scanProgress: {
          ...state.scanProgress,
          scannedFaces,
          currentFace,
        },
      };
    }),

  resetScan: () =>
    set({
      scanProgress: {
        scannedFaces: [],
        currentFace: null,
        totalFaces: 6,
      },
    }),

  // ---- Solution ----
  solution: null,

  setSolution: (solution) =>
    set({
      solution,
      animation: {
        isPlaying: false,
        currentMoveIndex: 0,
        totalMoves: solution.length,
        speed: get().animation.speed,
      },
    }),

  clearSolution: () => set({ solution: null }),

  // ---- Animation ----
  animation: {
    isPlaying: false,
    currentMoveIndex: 0,
    totalMoves: 0,
    speed: DEFAULT_ANIMATION_SPEED,
  },

  setAnimationPlaying: (isPlaying) =>
    set((state) => ({
      animation: { ...state.animation, isPlaying },
    })),

  nextMove: () =>
    set((state) => {
      const next = state.animation.currentMoveIndex + 1;
      if (next >= state.animation.totalMoves) {
        return { animation: { ...state.animation, isPlaying: false } };
      }
      return {
        animation: { ...state.animation, currentMoveIndex: next },
      };
    }),

  prevMove: () =>
    set((state) => ({
      animation: {
        ...state.animation,
        currentMoveIndex: Math.max(0, state.animation.currentMoveIndex - 1),
      },
    })),

  setAnimationSpeed: (speed) =>
    set((state) => ({
      animation: { ...state.animation, speed },
    })),

  resetAnimation: () =>
    set((state) => ({
      animation: {
        ...state.animation,
        isPlaying: false,
        currentMoveIndex: 0,
      },
    })),
}));
