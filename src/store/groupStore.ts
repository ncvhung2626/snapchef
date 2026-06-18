import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GroupStoreState {
  currentGroupId: string | null;
  scrollOffsets: Record<string, number>;
  setCurrentGroupId: (id: string | null) => void;
  setScrollOffset: (screenKey: string, offset: number) => void;
  getScrollOffset: (screenKey: string) => number;
}

export const useGroupStore = create<GroupStoreState>()(
  persist(
    (set, get) => ({
      currentGroupId: null,
      scrollOffsets: {},
      setCurrentGroupId: (currentGroupId) => set({ currentGroupId }),
      setScrollOffset: (screenKey, offset) =>
        set((s) => ({ scrollOffsets: { ...s.scrollOffsets, [screenKey]: offset } })),
      getScrollOffset: (screenKey) => get().scrollOffsets[screenKey] ?? 0,
    }),
    {
      name: 'snapchef_group',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
