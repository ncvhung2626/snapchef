import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Notification } from '../types/models';
import * as notificationService from '../services/notificationService';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    const [list, count] = await Promise.all([
      notificationService.getNotifications(user._id),
      notificationService.getUnreadCount(user._id),
    ]);
    setNotifications(list);
    setUnreadCount(count);
  }, [user?._id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const markRead = useCallback(async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user._id);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, [user?._id]);

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    refresh,
    markRead,
    markAllRead,
  };
}
