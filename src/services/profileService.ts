import type { User } from '../types/models';
import { getSupabase, assertSupabaseConfigured } from '../lib/supabase';

export interface ProfileStats {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

interface ProfileRow {
  id: string;
  fullname: string;
  email: string | null;
  avatar: string | null;
  bio: string | null;
  role: string;
  posts_count?: number;
  created_at: string;
  updated_at: string;
}

function mapProfile(row: ProfileRow, stats?: ProfileStats): User {
  const followers = stats ? Array(stats.followersCount).fill('') : [];
  const following = stats ? Array(stats.followingCount).fill('') : [];
  return {
    _id: row.id,
    fullname: row.fullname,
    email: row.email ?? '',
    avatar: row.avatar ?? undefined,
    bio: row.bio ?? undefined,
    role: (row.role as User['role']) || 'user',
    followers,
    following,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('profile_stats')
    .select('posts_count, followers_count, following_count')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    const [followersRes, followingRes] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);
    return {
      postsCount: 0,
      followersCount: followersRes.count ?? 0,
      followingCount: followingRes.count ?? 0,
    };
  }

  return {
    postsCount: data?.posts_count ?? 0,
    followersCount: data?.followers_count ?? 0,
    followingCount: data?.following_count ?? 0,
  };
}

export async function fetchUserProfile(userId: string): Promise<User> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Không tải được hồ sơ');
  }

  let stats: ProfileStats | undefined;
  try {
    stats = await getProfileStats(userId);
  } catch {
    stats = { postsCount: data.posts_count ?? 0, followersCount: 0, followingCount: 0 };
  }

  return mapProfile(data as ProfileRow, stats);
}

export interface UpdateProfileInput {
  fullname: string;
  bio: string;
  avatar?: string;
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<User> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('profiles')
    .update({
      fullname: input.fullname.trim(),
      bio: input.bio.trim(),
      avatar: input.avatar?.trim() || '',
    })
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Cập nhật hồ sơ thất bại');
  }

  const stats = await getProfileStats(userId);
  return mapProfile(data as ProfileRow, stats);
}

export async function followUser(followerId: string, followingId: string): Promise<void> {
  if (followerId === followingId) return;
  assertSupabaseConfigured();
  const { error } = await getSupabase().from('follows').insert({
    follower_id: followerId,
    following_id: followingId,
  });
  if (error && !error.message.includes('duplicate')) {
    throw new Error(error.message);
  }
}

export async function unfollowUser(followerId: string, followingId: string): Promise<void> {
  assertSupabaseConfigured();
  const { error } = await getSupabase()
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  if (error) throw new Error(error.message);
}
