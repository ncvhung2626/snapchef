import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatDraft {
  conversationId: string;
  content: string;
  updatedAt: string;
}

interface ChatStoreState {
  drafts: Record<string, ChatDraft>;
  unreadByConversation: Record<string, number>;
  totalUnread: number;
  setDraft: (conversationId: string, content: string) => void;
  clearDraft: (conversationId: string) => void;
  setUnread: (conversationId: string, count: number) => void;
  incrementUnread: (conversationId: string) => void;
  clearConversationUnread: (conversationId: string) => void;
}

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
      drafts: {},
      unreadByConversation: {},
      totalUnread: 0,

      setDraft: (conversationId, content) =>
        set((s) => ({
          drafts: {
            ...s.drafts,
            [conversationId]: { conversationId, content, updatedAt: new Date().toISOString() },
          },
        })),

      clearDraft: (conversationId) =>
        set((s) => {
          const { [conversationId]: _, ...rest } = s.drafts;
          return { drafts: rest };
        }),

      setUnread: (conversationId, count) => {
        const prev = get().unreadByConversation[conversationId] ?? 0;
        set((s) => ({
          unreadByConversation: { ...s.unreadByConversation, [conversationId]: count },
          totalUnread: Math.max(0, s.totalUnread - prev + count),
        }));
      },

      incrementUnread: (conversationId) => {
        const prev = get().unreadByConversation[conversationId] ?? 0;
        set((s) => ({
          unreadByConversation: { ...s.unreadByConversation, [conversationId]: prev + 1 },
          totalUnread: s.totalUnread + 1,
        }));
      },

      clearConversationUnread: (conversationId) => {
        const prev = get().unreadByConversation[conversationId] ?? 0;
        set((s) => ({
          unreadByConversation: { ...s.unreadByConversation, [conversationId]: 0 },
          totalUnread: Math.max(0, s.totalUnread - prev),
        }));
      },
    }),
    {
      name: 'snapchef_chat',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
