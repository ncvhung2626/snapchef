import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FeedStoreState {
  scrollOffset: number;
  reelsIndex: number;
  lastRoute: string | null;
  commentDrafts: Record<string, string>;
  videoPositions: Record<string, number>;
  setScrollOffset: (offset: number) => void;
  setReelsIndex: (index: number) => void;
  setLastRoute: (route: string | null) => void;
  setCommentDraft: (postId: string, content: string) => void;
  clearCommentDraft: (postId: string) => void;
  setVideoPosition: (mediaId: string, positionMs: number) => void;
}

export const useFeedStore = create<FeedStoreState>()(
  persist(
    (set) => ({
      scrollOffset: 0,
      reelsIndex: 0,
      lastRoute: null,
      commentDrafts: {},
      videoPositions: {},
      setScrollOffset: (scrollOffset) => set({ scrollOffset }),
      setReelsIndex: (reelsIndex) => set({ reelsIndex }),
      setLastRoute: (lastRoute) => set({ lastRoute }),
      setCommentDraft: (postId, content) =>
        set((s) => ({ commentDrafts: { ...s.commentDrafts, [postId]: content } })),
      clearCommentDraft: (postId) =>
        set((s) => {
          const { [postId]: _, ...rest } = s.commentDrafts;
          return { commentDrafts: rest };
        }),
      setVideoPosition: (mediaId, positionMs) =>
        set((s) => ({ videoPositions: { ...s.videoPositions, [mediaId]: positionMs } })),
    }),
    {
      name: 'snapchef_feed_state',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
