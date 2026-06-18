import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationStoreState {
  unreadCount: number;
  lastReadAt: string | null;
  setUnreadCount: (count: number) => void;
  markAllRead: () => void;
  decrementUnread: (by?: number) => void;
}

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set, get) => ({
      unreadCount: 0,
      lastReadAt: null,
      setUnreadCount: (unreadCount) => set({ unreadCount }),
      markAllRead: () => set({ unreadCount: 0, lastReadAt: new Date().toISOString() }),
      decrementUnread: (by = 1) =>
        set({ unreadCount: Math.max(0, get().unreadCount - by) }),
    }),
    {
      name: 'snapchef_notifications',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
