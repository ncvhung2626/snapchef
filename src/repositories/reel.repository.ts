import { getSupabase } from '../lib/supabase';
import { assertNoError } from './base.repository';

const REEL_SELECT = `
  *,
  profiles!user_id (id, fullname, avatar, email, bio, role, created_at, updated_at),
  reel_likes (user_id),
  reel_comments (id)
`;

export async function listReelsByUser(userId: string, limit = 30) {
  const { data, error } = await getSupabase()
    .from('reels')
    .select(REEL_SELECT)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  assertNoError(error);
  return data ?? [];
}

export async function listReelsPage(params: { limit: number; cursor?: string }) {
  let q = getSupabase()
    .from('reels')
    .select(REEL_SELECT)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(params.limit);

  if (params.cursor) {
    q = q.lt('created_at', params.cursor);
  }

  const { data, error } = await q;
  assertNoError(error);
  return data ?? [];
}

export async function toggleReelLike(reelId: string, userId: string) {
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from('reel_likes')
    .select('reel_id')
    .eq('reel_id', reelId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('reel_likes')
      .delete()
      .eq('reel_id', reelId)
      .eq('user_id', userId);
    assertNoError(error);
    return { liked: false };
  }

  const { error } = await supabase.from('reel_likes').insert({ reel_id: reelId, user_id: userId });
  assertNoError(error);
  return { liked: true };
}

export async function incrementReelView(reelId: string) {
  const supabase = getSupabase();
  const { data } = await supabase.from('reels').select('view_count').eq('id', reelId).single();
  if (!data) return;
  await supabase
    .from('reels')
    .update({ view_count: (data.view_count ?? 0) + 1 })
    .eq('id', reelId);
}

export async function createReel(params: {
  userId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  caption: string;
  durationSeconds?: number;
}) {
  const { data, error } = await getSupabase()
    .from('reels')
    .insert({
      user_id: params.userId,
      video_url: params.videoUrl,
      thumbnail_url: params.thumbnailUrl ?? null,
      caption: params.caption,
      duration_seconds: params.durationSeconds ?? null,
    })
    .select(REEL_SELECT)
    .single();
  assertNoError(error);
  return data;
}

export async function listReelComments(reelId: string) {
  const { data, error } = await getSupabase()
    .from('reel_comments')
    .select('*, profiles!user_id (id, fullname, avatar)')
    .eq('reel_id', reelId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  assertNoError(error);
  return data ?? [];
}

export async function addReelComment(reelId: string, userId: string, content: string) {
  const { data, error } = await getSupabase()
    .from('reel_comments')
    .insert({ reel_id: reelId, user_id: userId, content: content.trim() })
    .select('*, profiles!user_id (id, fullname, avatar)')
    .single();
  assertNoError(error);
  return data;
}
