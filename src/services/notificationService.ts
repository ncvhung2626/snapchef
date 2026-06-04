import { getSupabase, assertSupabaseConfigured, isSupabaseConfigured } from '../lib/supabase';
import type { Notification, NotificationType } from '../types/models';

interface NotificationRow {
  id: string;
  receiver_id: string;
  sender_id: string | null;
  type: string;
  title: string;
  description: string;
  post_id: string | null;
  group_id: string | null;
  comment_id: string | null;
  is_read: boolean;
  created_at: string;
  profiles?: { id: string; fullname: string; avatar: string | null } | { id: string; fullname: string; avatar: string | null }[];
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    _id: 'n1',
    type: 'premium',
    receiver: 'me',
    title: 'SnapChef Premium 2026',
    description: 'Chào mừng đầu bếp số! Khám phá công thức độc quyền.',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
];

function mapNotification(row: NotificationRow): Notification {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    _id: row.id,
    sender: row.sender_id ?? undefined,
    senderName: profile?.fullname,
    senderAvatar: profile?.avatar ?? undefined,
    receiver: row.receiver_id,
    type: row.type as NotificationType,
    title: row.title,
    description: row.description,
    postId: row.post_id ?? undefined,
    groupId: row.group_id ?? undefined,
    commentId: row.comment_id ?? undefined,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

export async function getNotifications(receiverId: string): Promise<Notification[]> {
  if (!isSupabaseConfigured) {
    return MOCK_NOTIFICATIONS;
  }
  try {
    assertSupabaseConfigured();
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('notifications')
      .select(
        `
        id, receiver_id, sender_id, type, title, description,
        post_id, group_id, comment_id, is_read, created_at,
        profiles!sender_id (id, fullname, avatar)
      `
      )
      .eq('receiver_id', receiverId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return (data as NotificationRow[]).map(mapNotification);
  } catch {
    return MOCK_NOTIFICATIONS;
  }
}

export async function getUnreadCount(receiverId: string): Promise<number> {
  if (!isSupabaseConfigured) return MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length;
  try {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', receiverId)
      .eq('is_read', false);
    if (error) throw error;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function markAsRead(notificationId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  assertSupabaseConfigured();
  const { error } = await getSupabase()
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);
  if (error) throw new Error(error.message);
}

export async function markAllAsRead(receiverId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  assertSupabaseConfigured();
  const { error } = await getSupabase()
    .from('notifications')
    .update({ is_read: true })
    .eq('receiver_id', receiverId)
    .eq('is_read', false);
  if (error) throw new Error(error.message);
}
