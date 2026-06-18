import { getSupabase } from '../lib/supabase';
import type { User } from '../types/models';
import { fetchUserProfile, updateProfile } from '../services/profileService';
import { assertNoError } from './base.repository';

export async function getById(userId: string): Promise<User> {
  return fetchUserProfile(userId);
}

export async function update(
  userId: string,
  patch: { fullname: string; bio: string; avatar?: string }
): Promise<User> {
  return updateProfile(userId, patch);
}

export async function follow(followerId: string, followingId: string) {
  const { error } = await getSupabase().from('follows').insert({
    follower_id: followerId,
    following_id: followingId,
  });
  assertNoError(error);
}

export async function unfollow(followerId: string, followingId: string) {
  const { error } = await getSupabase()
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId);
  assertNoError(error);
}
