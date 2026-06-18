import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SearchTab = 'all' | 'posts' | 'recipes' | 'users' | 'communities' | 'reels';

interface SearchState {
  query: string;
  activeTab: SearchTab;
  recentSearches: string[];
  setQuery: (query: string) => void;
  setActiveTab: (tab: SearchTab) => void;
  addRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set, get) => ({
      query: '',
      activeTab: 'posts',
      recentSearches: [],
      setQuery: (query) => set({ query }),
      setActiveTab: (activeTab) => set({ activeTab }),
      addRecentSearch: (term) => {
        const trimmed = term.trim();
        if (!trimmed) return;
        set({
          recentSearches: [trimmed, ...get().recentSearches.filter((r) => r !== trimmed)].slice(0, 10),
        });
      },
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'snapchef_search',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ recentSearches: s.recentSearches, activeTab: s.activeTab, query: s.query }),
    }
  )
);
