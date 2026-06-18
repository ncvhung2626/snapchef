import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = 'snapchef_draft_post';

export interface PostDraft {
  content: string;
  title?: string;
  updatedAt: string;
}

interface PostStoreState {
  draft: PostDraft | null;
  setDraft: (draft: PostDraft | null) => void;
  loadDraft: () => Promise<void>;
  persistDraft: () => Promise<void>;
  clearDraft: () => Promise<void>;
}

export const usePostStore = create<PostStoreState>((set, get) => ({
  draft: null,
  setDraft: (draft) => set({ draft }),
  loadDraft: async () => {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      set({ draft: JSON.parse(raw) as PostDraft });
    } catch {
      /* ignore */
    }
  },
  persistDraft: async () => {
    const { draft } = get();
    if (draft) await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else await AsyncStorage.removeItem(DRAFT_KEY);
  },
  clearDraft: async () => {
    set({ draft: null });
    await AsyncStorage.removeItem(DRAFT_KEY);
  },
}));
