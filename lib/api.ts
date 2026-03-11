import type { ScrambleResponse, SolveRecord, SolveResponse, ValidateResponse } from '@/types/cube';
import { API_BASE_URL } from './constants';

/**
 * Generic fetch wrapper with error handling.
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error ${response.status}: ${errorBody}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Send cube state to backend, get solution moves.
 */
export async function solveCube(cubeState: string): Promise<SolveResponse> {
  return apiFetch<SolveResponse>('/solve', {
    method: 'POST',
    body: JSON.stringify({ cubeState }),
  });
}

/**
 * Validate a cube state on the backend.
 */
export async function validateCube(cubeState: string): Promise<ValidateResponse> {
  return apiFetch<ValidateResponse>('/validate', {
    method: 'POST',
    body: JSON.stringify({ cubeState }),
  });
}

/**
 * Get a random scramble from the backend.
 */
export async function getScramble(): Promise<ScrambleResponse> {
  return apiFetch<ScrambleResponse>('/scramble');
}

/**
 * Get solve history.
 */
export async function getHistory(): Promise<SolveRecord[]> {
  return apiFetch<SolveRecord[]>('/history');
}

/**
 * Save a solve record.
 */
export async function saveSolve(
  record: Omit<SolveRecord, 'id' | 'createdAt'>
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>('/history', {
    method: 'POST',
    body: JSON.stringify(record),
  });
}
