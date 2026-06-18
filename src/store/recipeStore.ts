import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecipeDraft {
  title: string;
  description: string;
  category: string;
  ingredients: string[];
  steps: string[];
  cookTimeMinutes?: number;
  imageUri?: string;
  groupId?: string;
  updatedAt: string;
}

interface RecipeStoreState {
  draft: RecipeDraft | null;
  editDrafts: Record<string, RecipeDraft>;
  currentRecipeId: string | null;
  setDraft: (draft: RecipeDraft | null) => void;
  setEditDraft: (postId: string, draft: RecipeDraft) => void;
  getEditDraft: (postId: string) => RecipeDraft | null;
  clearEditDraft: (postId: string) => void;
  setCurrentRecipeId: (id: string | null) => void;
  clearDraft: () => void;
}

export const useRecipeStore = create<RecipeStoreState>()(
  persist(
    (set, get) => ({
      draft: null,
      editDrafts: {},
      currentRecipeId: null,
      setDraft: (draft) => set({ draft }),
      setEditDraft: (postId, draft) =>
        set((s) => ({ editDrafts: { ...s.editDrafts, [postId]: draft } })),
      getEditDraft: (postId) => get().editDrafts[postId] ?? null,
      clearEditDraft: (postId) =>
        set((s) => {
          const next = { ...s.editDrafts };
          delete next[postId];
          return { editDrafts: next };
        }),
      setCurrentRecipeId: (currentRecipeId) => set({ currentRecipeId }),
      clearDraft: () => set({ draft: null }),
    }),
    {
      name: 'snapchef_recipe_draft',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
