import { getSupabase, assertSupabaseConfigured, isSupabaseConfigured } from '../lib/supabase';
import type { User, UserRole } from '../types/models';
import { followUser, unfollowUser, getProfileStats } from './profileService';

interface ProfileRow {
  id: string;
  fullname: string;
  username?: string | null;
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
    username: row.username ?? undefined,
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

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { data } = await getSupabase()
    .from('follows')
    .select('id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  return Boolean(data);
}

export async function getFollowers(userId: string): Promise<User[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await getSupabase()
    .from('follows')
    .select('follower_id, profiles!follower_id (*)')
    .eq('following_id', userId)
    .limit(50);
  if (error) return [];
  return (data ?? [])
    .map((row: { profiles: ProfileRow | ProfileRow[] }) => {
      const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return p ? mapProfile(p) : null;
    })
    .filter(Boolean) as User[];
}

export async function getFollowing(userId: string): Promise<User[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await getSupabase()
    .from('follows')
    .select('following_id, profiles!following_id (*)')
    .eq('follower_id', userId)
    .limit(50);
  if (error) return [];
  return (data ?? [])
    .map((row: { profiles: ProfileRow | ProfileRow[] }) => {
      const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return p ? mapProfile(p) : null;
    })
    .filter(Boolean) as User[];
}

export async function getMutualFriends(userId: string, otherUserId: string): Promise<User[]> {
  if (!isSupabaseConfigured) return [];
  const [myFollowing, theirFollowing] = await Promise.all([
    getSupabase().from('follows').select('following_id').eq('follower_id', userId),
    getSupabase().from('follows').select('following_id').eq('follower_id', otherUserId),
  ]);
  const mySet = new Set((myFollowing.data ?? []).map((r: { following_id: string }) => r.following_id));
  const mutualIds = (theirFollowing.data ?? [])
    .map((r: { following_id: string }) => r.following_id)
    .filter((id: string) => mySet.has(id) && id !== userId && id !== otherUserId);

  if (!mutualIds.length) return [];

  const { data } = await getSupabase().from('profiles').select('*').in('id', mutualIds.slice(0, 20));
  return (data ?? []).map((r) => mapProfile(r as ProfileRow));
}

export async function getSuggestedFriends(userId: string, limit = 10): Promise<User[]> {
  if (!isSupabaseConfigured) return [];
  const following = await getFollowing(userId);
  const excludeIds = new Set([userId, ...following.map((u) => u._id)]);

  const { data } = await getSupabase()
    .from('profiles')
    .select('*')
    .not('id', 'in', `(${[...excludeIds].join(',') || '00000000-0000-0000-0000-000000000000'})`)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map((r) => mapProfile(r as ProfileRow));
}

export async function searchUsers(query: string, limit = 20): Promise<User[]> {
  if (!isSupabaseConfigured) return [];
  const term = query.trim();
  if (!term) return [];
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .or(`fullname.ilike.%${term}%,email.ilike.%${term}%,username.ilike.%${term}%`)
    .limit(limit);
  if (error) return [];
  return (data ?? []).map((r) => mapProfile(r as ProfileRow));
}

export { followUser, unfollowUser, getProfileStats };
