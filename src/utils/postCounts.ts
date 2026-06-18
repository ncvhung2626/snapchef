import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

export async function attachCommentCountsToPosts<T extends { _id: string; commentsCount: number }>(
  posts: T[]
): Promise<T[]> {
  if (!posts.length || !isSupabaseConfigured) return posts;
  const supabase = getSupabase();
  const ids = posts.map((p) => p._id);
  const { data } = await supabase.from('comments').select('post_id').in('post_id', ids);
  const counts: Record<string, number> = {};
  (data ?? []).forEach((c: { post_id: string }) => {
    counts[c.post_id] = (counts[c.post_id] ?? 0) + 1;
  });
  return posts.map((p) => ({ ...p, commentsCount: counts[p._id] ?? 0 }));
}
