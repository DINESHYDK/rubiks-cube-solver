// cubejs has no TS types – use require
// eslint-disable-next-line @typescript-eslint/no-var-requires
const CubeJS = require("cubejs");
import type { CubeState } from "@/types/cube";
import { cubeStateToString, stringToCubeState } from "./cubeState";

let ready = false;

export function initSolver(): void {
  if (!ready) {
    CubeJS.initSolver();
    ready = true;
  }
}

export function isSolverReady(): boolean {
  return ready;
}

/**
 * Apply a scramble to a solved cube, then return the Kociemba solution.
 * Returns array of moves: ["R", "U'", "F2", ...]
 */
export function solveFromScramble(scramble: string): string[] {
  initSolver();
  const cube = new CubeJS();
  cube.move(scramble);
  const sol: string = cube.solve();
  return sol.trim() ? sol.trim().split(/\s+/) : [];
}

/**
 * Solve from a 54-character cube string (U R F D L B order).
 */
export function solveCubeString(cubeString: string): string[] {
  initSolver();
  const cube = CubeJS.fromString(cubeString);
  const sol: string = cube.solve();
  return sol.trim() ? sol.trim().split(/\s+/) : [];
}

/**
 * Solve directly from a CubeState object (from scanner or manual input).
 */
export function solveCubeState(state: CubeState): string[] {
  return solveCubeString(cubeStateToString(state));
}

/**
 * Generate a random scramble string of `length` moves.
 */
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
