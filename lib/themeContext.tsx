import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'dark' | 'light';

interface ThemeModeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: 'dark',
  setMode: () => {},
});

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  // Load persisted theme on mount
  useEffect(() => {
    AsyncStorage.getItem('settings')
      .then((raw) => {
        if (!raw) return;
        const parsed = JSON.parse(raw) as { theme?: ThemeMode };
        if (parsed.theme === 'light' || parsed.theme === 'dark') {
          setModeState(parsed.theme);
        }
      })
      .catch(() => {});
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    // Also persist into the same 'settings' key so next launch picks it up
    AsyncStorage.getItem('settings')
      .then((raw) => {
        const existing = raw ? JSON.parse(raw) : {};
        return AsyncStorage.setItem('settings', JSON.stringify({ ...existing, theme: m }));
      })
      .catch(() => {});
  };

  return (
    <ThemeModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode(): ThemeModeContextValue {
  return useContext(ThemeModeContext);
}
