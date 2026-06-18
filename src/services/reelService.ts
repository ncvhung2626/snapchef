import { getSupabase, assertSupabaseConfigured } from '../lib/supabase';
import type { Reel, User, UserRole } from '../types/models';
import * as reelRepo from '../repositories/reel.repository';

export const MAX_VIDEO_DURATION_SEC = 120;

interface ReelRow {
  id: string;
  user_id: string;
  video_url: string;
  thumbnail_url: string | null;
  caption: string;
  duration_seconds: number | null;
  view_count: number;
  created_at: string;
  profiles?: ProfileRow | ProfileRow[];
  reel_likes?: { user_id: string }[];
  reel_comments?: { id: string }[];
}

interface ProfileRow {
  id: string;
  fullname: string;
  avatar: string | null;
  email: string | null;
  bio: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

function mapReel(row: ReelRow, currentUserId?: string): Reel {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const likes = row.reel_likes ?? [];
  const likedByMe = currentUserId ? likes.some((l) => l.user_id === currentUserId) : false;

  return {
    _id: row.id,
    authorId: row.user_id,
    authorName: profile?.fullname ?? 'Người dùng',
    authorHandle: profile ? `@${profile.fullname.toLowerCase().replace(/\s+/g, '_')}` : '@user',
    authorAvatar: profile?.avatar ?? undefined,
    description: row.caption,
    videoUrl: row.video_url,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    likesCount: likes.length,
    commentsCount: row.reel_comments?.length ?? 0,
    savesCount: 0,
    viewCount: row.view_count ?? 0,
    likedByMe,
    savedByMe: false,
    createdAt: row.created_at,
  };
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export async function getReelsByUserId(userId: string, currentUserId?: string): Promise<Reel[]> {
  assertSupabaseConfigured();
  const rows = await reelRepo.listReelsByUser(userId);
  return (rows as ReelRow[]).map((r) => mapReel(r, currentUserId));
}

export async function getReelsFeed(
  currentUserId?: string,
  cursor?: string,
  limit = 10
): Promise<{ reels: Reel[]; nextCursor?: string }> {
  assertSupabaseConfigured();
  const rows = await reelRepo.listReelsPage({ limit, cursor });
  const reels = (rows as ReelRow[]).map((r) => mapReel(r, currentUserId));
  const nextCursor =
    rows.length === limit ? (rows[rows.length - 1] as { created_at: string }).created_at : undefined;
  return { reels, nextCursor };
}

export async function searchReels(query: string, limit = 20) {
  assertSupabaseConfigured();
  const term = query.trim();
  if (!term) return { reels: [] as Reel[] };
  const { data, error } = await getSupabase()
    .from('reels')
    .select('*, profiles!user_id (*), reel_likes (user_id), reel_comments (id)')
    .ilike('caption', `%${term}%`)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return { reels: (data as ReelRow[]).map((r) => mapReel(r)) };
}

export async function toggleReelSave(reelId: string, userId: string): Promise<boolean> {
  assertSupabaseConfigured();
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from('saved_posts')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', reelId)
    .maybeSingle();
  if (existing) {
    await supabase.from('saved_posts').delete().eq('user_id', userId).eq('post_id', reelId);
    return false;
  }
  await supabase.from('saved_posts').insert({ user_id: userId, post_id: reelId, collection_name: 'reels' });
  return true;
}

export async function toggleReelLike(reelId: string, userId: string) {
  assertSupabaseConfigured();
  return reelRepo.toggleReelLike(reelId, userId);
}

export async function recordReelView(reelId: string) {
  assertSupabaseConfigured();
  await reelRepo.incrementReelView(reelId);
}

export async function uploadReelVideo(
  userId: string,
  localUri: string,
  onProgress?: (pct: number) => void
): Promise<string> {
  assertSupabaseConfigured();
  const supabase = getSupabase();
  onProgress?.(10);
  const ext = localUri.split('.').pop()?.toLowerCase() || 'mp4';
  const path = `${userId}/${Date.now()}.${ext}`;
  const response = await fetch(localUri);
  const blob = await response.blob();
  onProgress?.(40);
  const { error } = await supabase.storage.from('reel-videos').upload(path, blob, {
    contentType: blob.type || 'video/mp4',
    upsert: false,
  });
  if (error) throw new Error(error.message);
  onProgress?.(100);
  const { data } = supabase.storage.from('reel-videos').getPublicUrl(path);
  return data.publicUrl;
}

export function validateVideoDuration(seconds: number): boolean {
  return seconds > 0 && seconds <= MAX_VIDEO_DURATION_SEC;
}
