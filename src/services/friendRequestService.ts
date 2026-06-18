import { getSupabase, assertSupabaseConfigured, isSupabaseConfigured } from '../lib/supabase';
import type { User, UserRole } from '../types/models';
import { followUser, unfollowUser } from './profileService';

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  sender?: User;
  receiver?: User;
  createdAt: string;
}

interface ProfileRow {
  id: string;
  fullname: string;
  email: string | null;
  avatar: string | null;
  bio: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

function mapProfile(row: ProfileRow): User {
  return {
    _id: row.id,
    fullname: row.fullname,
    email: row.email ?? '',
    avatar: row.avatar ?? undefined,
    bio: row.bio ?? undefined,
    role: (row.role as UserRole) || 'user',
    followers: [],
    following: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function tableExists(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await getSupabase().from('friend_requests').select('id').limit(1);
  return !error;
}

export async function sendFriendRequest(senderId: string, receiverId: string): Promise<void> {
  if (senderId === receiverId) throw new Error('Không thể kết bạn với chính mình');
  assertSupabaseConfigured();

  if (await tableExists()) {
    const { error } = await getSupabase().from('friend_requests').insert({
      sender_id: senderId,
      receiver_id: receiverId,
      status: 'pending',
    });
    if (error && !error.message.includes('duplicate')) throw new Error(error.message);
    return;
  }
  await followUser(senderId, receiverId);
}

export async function acceptFriendRequest(requestId: string, userId: string): Promise<void> {
  assertSupabaseConfigured();
  if (await tableExists()) {
    const { data, error } = await getSupabase()
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .eq('receiver_id', userId)
      .select('sender_id, receiver_id')
      .single();
    if (error) throw new Error(error.message);
    if (data) {
      await followUser(data.receiver_id, data.sender_id);
      await followUser(data.sender_id, data.receiver_id);
    }
    return;
  }
}

export async function rejectFriendRequest(requestId: string, userId: string): Promise<void> {
  assertSupabaseConfigured();
  if (await tableExists()) {
    const { error } = await getSupabase()
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .eq('receiver_id', userId);
    if (error) throw new Error(error.message);
  }
}

export async function cancelFriendRequest(requestId: string, userId: string): Promise<void> {
  assertSupabaseConfigured();
  if (await tableExists()) {
    const { error } = await getSupabase()
      .from('friend_requests')
      .update({ status: 'cancelled' })
      .eq('id', requestId)
      .eq('sender_id', userId);
    if (error) throw new Error(error.message);
  }
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  await unfollowUser(userId, friendId);
  await unfollowUser(friendId, userId);
  if (isSupabaseConfigured && (await tableExists())) {
    await getSupabase()
      .from('friend_requests')
      .update({ status: 'cancelled' })
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`);
  }
}

export async function getPendingRequests(userId: string): Promise<FriendRequest[]> {
  if (!isSupabaseConfigured || !(await tableExists())) return [];
  const { data, error } = await getSupabase()
    .from('friend_requests')
    .select('*, sender:sender_id (*), receiver:receiver_id (*)')
    .eq('receiver_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map((row: {
    id: string;
    sender_id: string;
    receiver_id: string;
    status: FriendRequestStatus;
    created_at: string;
    sender?: ProfileRow;
  }) => ({
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    status: row.status,
    sender: row.sender ? mapProfile(row.sender) : undefined,
    createdAt: row.created_at,
  }));
}

export async function getSentRequests(userId: string): Promise<FriendRequest[]> {
  if (!isSupabaseConfigured || !(await tableExists())) return [];
  const { data, error } = await getSupabase()
    .from('friend_requests')
    .select('*, receiver:receiver_id (*)')
    .eq('sender_id', userId)
    .eq('status', 'pending');
  if (error) return [];
  return (data ?? []).map((row: {
    id: string;
    sender_id: string;
    receiver_id: string;
    status: FriendRequestStatus;
    created_at: string;
    receiver?: ProfileRow;
  }) => ({
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    status: row.status,
    receiver: row.receiver ? mapProfile(row.receiver) : undefined,
    createdAt: row.created_at,
  }));
}
