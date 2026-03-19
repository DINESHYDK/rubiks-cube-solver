import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { Settings, SessionStats, SolveRecord, Solution } from '@/types/cube';

// ── Storage Keys ─────────────────────────────────────────────────────────────
const KEYS = {
  SETTINGS:      'settings',
  HISTORY:       'solve_history',
  BEST_TIME:     'best_time',
  SESSION_STATS: 'session_stats',
} as const;

const HISTORY_CAP = 100;

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: Settings = {
  username:        'Cuber',
  theme:           'dark',
  autoModeDefault: true,
  stepDelay:       1200,
};

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(s: Partial<Settings>): Promise<void> {
  const current = await getSettings();
  await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify({ ...current, ...s }));
}

// ── Solve History ─────────────────────────────────────────────────────────────

export async function getSolveHistory(): Promise<SolveRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    return JSON.parse(raw) as SolveRecord[];
  } catch {
    return [];
  }
}

export async function saveSolve(
  record: Omit<SolveRecord, 'id' | 'createdAt'>
): Promise<void> {
  const history = await getSolveHistory();

  const newRecord: SolveRecord = {
    ...record,
    id:        `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  // Prepend (newest first), cap at limit
  const updated = [newRecord, ...history].slice(0, HISTORY_CAP);
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(updated));

  // Update best time if this solve has a time
  if (record.solveTimeMs) {
    const current = await getBestTime();
    if (current === null || record.solveTimeMs < current) {
      await AsyncStorage.setItem(KEYS.BEST_TIME, String(record.solveTimeMs));
    }
  }
}

// ── Best Time ─────────────────────────────────────────────────────────────────

export async function getBestTime(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.BEST_TIME);
    if (!raw) return null;
    return Number(raw);
  } catch {
    return null;
  }
}

// ── Session Stats ─────────────────────────────────────────────────────────────

export async function getSessionStats(): Promise<SessionStats> {
  const history = await getSolveHistory();
  const timed = history
    .filter((r) => typeof r.solveTimeMs === 'number')
    .map((r) => r.solveTimeMs as number);

  return {
    totalSolves: history.length,
    ao5:  timed.length >= 5  ? avg(timed.slice(0, 5))  : null,
    ao12: timed.length >= 12 ? avg(timed.slice(0, 12)) : null,
  };
}

function avg(times: number[]): number {
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}

// ── Clear All Data ────────────────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEYS.SETTINGS,
    KEYS.HISTORY,
    KEYS.BEST_TIME,
    KEYS.SESSION_STATS,
  ]);
}

// ── useSettings — Zustand hook ────────────────────────────────────────────────

interface SettingsStore {
  settings: Settings;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettings = create<SettingsStore>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  loaded:   false,

  loadSettings: async () => {
    if (get().loaded) return;
    const settings = await getSettings();
    set({ settings, loaded: true });
  },

  updateSettings: async (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    await saveSettings(patch);
  },
}));
