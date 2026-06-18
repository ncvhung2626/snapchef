import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'snapchef_theme';

type ThemeMode = 'light' | 'dark' | 'system';

interface SettingsState {
  theme: ThemeMode;
  hydrated: boolean;
  setTheme: (theme: ThemeMode) => void;
  hydrate: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  hydrated: false,
  setTheme: (theme) => {
    set({ theme });
    void AsyncStorage.setItem(THEME_KEY, theme);
  },
  hydrate: async () => {
    const saved = await AsyncStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      set({ theme: saved, hydrated: true });
    } else {
      set({ hydrated: true });
    }
  },
}));
