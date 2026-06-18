import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme, StatusBar } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { darkColors, lightColors, type AppColors } from './palettes';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  colors: AppColors;
  isDark: boolean;
  themeMode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  themeMode: 'system',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode = useSettingsStore((s) => s.theme);
  const systemScheme = useColorScheme();

  const isDark = useMemo(() => {
    if (themeMode === 'dark') return true;
    if (themeMode === 'light') return false;
    return systemScheme === 'dark';
  }, [themeMode, systemScheme]);

  const colors = isDark ? darkColors : lightColors;

  const value = useMemo(() => ({ colors, isDark, themeMode }), [colors, isDark, themeMode]);

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
