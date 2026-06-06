// cubejs has no TS types – use require
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CubeJS = require("cubejs");
import type { CubeState } from "@/types/cube";
import { cubeStateToString, stringToCubeState } from "./cubeState";

let ready = false;

function expandMoves(moves: string[]): string[] {
  const expanded: string[] = [];
  for (const move of moves) {
    if (move.endsWith('2')) {
      const base = move.replace('2', '');
      expanded.push(base, base);
    } else {
      expanded.push(move);
    }
  }
  return expanded;
}

export function initSolver(): void {
  if (!ready) {
    CubeJS.initSolver();
    ready = true;
  }
}

export function isSolverReady(): boolean {
  return ready;
}

export function initSolverAsync(onProgress?: (progress: number) => void): Promise<void> {
  if (ready) return Promise.resolve();
  if (initPromise) return initPromise;

  initPromise = (async () => {
    // 1. Compute move tables synchronously (extremely fast, <50ms)
    CubeJS.computeMoveTables();

    // 2. Compute pruning tables asynchronously with cooperative yielding
    const N_SLICE1 = 495;
    const N_SLICE2 = 24;
    const N_TWIST = 2187;
    const N_FLIP = 2048;
    const N_URFtoDLF = 20160;
    const N_URtoDF = 20160;
    const N_PARITY = 2;

    const sliceTwistCoords = (index: number) => [index % N_SLICE1, (index / N_SLICE1) | 0];
    const sliceTwistNext = (current: number[], move: number) => {
      const [slice, twist] = current;
      const newSlice = (CubeJS.moveTables.FRtoBR[slice * 24][move] / 24) | 0;
      const newTwist = CubeJS.moveTables.twist[twist][move];
      return newTwist * N_SLICE1 + newSlice;
    };

    const sliceFlipCoords = (index: number) => [index % N_SLICE1, (index / N_SLICE1) | 0];
    const sliceFlipNext = (current: number[], move: number) => {
      const [slice, flip] = current;
      const newSlice = (CubeJS.moveTables.FRtoBR[slice * 24][move] / 24) | 0;
      const newFlip = CubeJS.moveTables.flip[flip][move];
      return newFlip * N_SLICE1 + newSlice;
    };

    const sliceURFtoDLFParityCoords = (index: number) => [
      index % 2,
      ((index / 2) | 0) % N_SLICE2,
      ((index / 2) | 0) / N_SLICE2 | 0
    ];
    const sliceURFtoDLFParityNext = (current: number[], move: number) => {
      const [parity, slice, URFtoDLF] = current;
      const newParity = CubeJS.moveTables.parity[parity][move];
      const newSlice = CubeJS.moveTables.FRtoBR[slice][move];
      const newURFtoDLF = CubeJS.moveTables.URFtoDLF[URFtoDLF][move];
      return (newURFtoDLF * N_SLICE2 + newSlice) * 2 + newParity;
    };

    const sliceURtoDFParityCoords = (index: number) => [
      index % 2,
      ((index / 2) | 0) % N_SLICE2,
      ((index / 2) | 0) / N_SLICE2 | 0
    ];
    const sliceURtoDFParityNext = (current: number[], move: number) => {
      const [parity, slice, URtoDF] = current;
      const newParity = CubeJS.moveTables.parity[parity][move];
      const newSlice = CubeJS.moveTables.FRtoBR[slice][move];
      const newURtoDF = CubeJS.moveTables.URtoDF[URtoDF][move];
      return (newURtoDF * N_SLICE2 + newSlice) * 2 + newParity;
    };

    const computeTable = async (
      name: string,
      phase: number,
      size: number,
      coordsFn: (i: number) => number[],
      nextFn: (c: number[], m: number) => number
    ) => {
      if (CubeJS.pruningTables[name] !== null) return;

      const table = new Uint32Array(Math.ceil(size / 8));
      table.fill(0xFFFFFFFF);

      const moves = phase === 1
        ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
        : [0, 1, 2, 4, 7, 9, 10, 11, 13, 16];

      const getPruning = (idx: number): number => {
        const pos = idx % 8;
        const slot = idx >> 3;
        const shift = pos << 2;
        return (table[slot] & (0xF << shift)) >>> shift;
      };

      const setPruning = (idx: number, val: number) => {
        const pos = idx % 8;
        const slot = idx >> 3;
        const shift = pos << 2;
        table[slot] &= ~(0xF << shift);
        table[slot] |= val << shift;
      };

      let depth = 0;
      setPruning(0, depth);
      let done = 1;

      let lastYield = Date.now();

      while (done !== size) {
        for (let idx = 0; idx < size; idx++) {
          if (getPruning(idx) !== depth) continue;

          const current = coordsFn(idx);
          for (let o = 0; o < moves.length; o++) {
            const move = moves[o];
            const next = nextFn(current, move);
            if (getPruning(next) === 0xF) {
              setPruning(next, depth + 1);
              done++;
            }
          }

          // Yield every 16ms to keep JS thread running at 60 FPS
          if (idx % 5000 === 0 && Date.now() - lastYield > 16) {
            await new Promise<void>((resolve) => setTimeout(resolve, 0));
            lastYield = Date.now();
          }
        }
        depth++;
      }

      CubeJS.pruningTables[name] = table;
    };

    await computeTable('sliceTwist', 1, N_SLICE1 * N_TWIST, sliceTwistCoords, sliceTwistNext);
    await computeTable('sliceFlip', 1, N_SLICE1 * N_FLIP, sliceFlipCoords, sliceFlipNext);
    await computeTable('sliceURFtoDLFParity', 2, N_SLICE2 * N_URFtoDLF * N_PARITY, sliceURFtoDLFParityCoords, sliceURFtoDLFParityNext);
    await computeTable('sliceURtoDFParity', 2, N_SLICE2 * N_URtoDF * N_PARITY, sliceURtoDFParityCoords, sliceURtoDFParityNext);

    ready = true;
  })();

  return initPromise;
}

let initPromise: Promise<void> | null = null;

/**
 * Apply a scramble to a solved cube, then return the Kociemba solution.
 * Returns array of moves: ["R", "U'", "F2", ...]
 */
export function solveFromScramble(scramble: string): string[] {
  initSolver();
  const cube = new CubeJS();
  cube.move(scramble);
  const sol: string = cube.solve();
  return sol.trim() ? expandMoves(sol.trim().split(/\s+/)) : [];
}

/**
 * Solve from a 54-character cube string (U R F D L B order).
 */
export function solveCubeString(cubeString: string): string[] {
  initSolver();
  const cube = CubeJS.fromString(cubeString);
  const sol: string = cube.solve();
  return sol.trim() ? expandMoves(sol.trim().split(/\s+/)) : [];
}

/**
 * Solve directly from a CubeState object (from scanner or manual input).
 */
export function solveCubeState(state: CubeState): string[] {
  return solveCubeString(cubeStateToString(state));
}

/**
 * Compute intermediate CubeState snapshots for each step of the solution.
 * Returns [scrambledState, afterMove1, afterMove2, ..., solvedState]
 * Length = solution.length + 1
 */
export function getIntermediateStates(
  scramble: string,
  solution: string[],
): CubeState[] {
  initSolver();
  const cube = new CubeJS();
  cube.move(scramble);
  const states: CubeState[] = [stringToCubeState(cube.asString())];
  for (const move of expandMoves(solution)) {
    cube.move(move);
    states.push(stringToCubeState(cube.asString()));
  }
  return states;
}

export function getIntermediateStatesFromState(
  startState: CubeState,
  solution: string[],
): CubeState[] {
  initSolver();
  const cube = CubeJS.fromString(cubeStateToString(startState));
  const states: CubeState[] = [startState];
  for (const move of solution) {
    cube.move(move);
    states.push(stringToCubeState(cube.asString()));
  }
  return states;
}

/**
 * Get the CubeState after applying a scramble.
 */
export function getScrambledState(scramble: string): CubeState {
  initSolver();
  const cube = new CubeJS();
  cube.move(scramble);
  return stringToCubeState(cube.asString());
}

export function generateScramble(length = 20): string {
  const faces = ["R", "L", "U", "D", "F", "B"];
  const mods = ["", "'", "2"];
  const out: string[] = [];
  let last = "";
  for (let i = 0; i < length; i++) {
    let f: string;
    do {
      f = faces[Math.floor(Math.random() * faces.length)];
    } while (f === last);
    out.push(f + mods[Math.floor(Math.random() * mods.length)]);
    last = f;
  }
  return out.join(" ");
}
