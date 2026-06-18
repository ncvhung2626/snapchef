import { getSupabase } from '../lib/supabase';
import { assertNoError } from './base.repository';

/** Dùng saved_recipes (sprint9) hoặc saved_posts (production) tùy bảng đã migrate. */
export async function saveRecipe(userId: string, postId: string) {
  const supabase = getSupabase();
  const { error: e1 } = await supabase.from('saved_recipes').insert({ user_id: userId, post_id: postId });
  if (!e1) return;

  const { error: e2 } = await supabase.from('saved_posts').insert({ user_id: userId, post_id: postId });
  assertNoError(e2);
}

export async function unsaveRecipe(userId: string, postId: string) {
  const supabase = getSupabase();
  await supabase.from('saved_recipes').delete().eq('user_id', userId).eq('post_id', postId);
  const { error } = await supabase.from('saved_posts').delete().eq('user_id', userId).eq('post_id', postId);
  if (error && error.code !== 'PGRST205') assertNoError(error);
}

export async function listSaved(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('saved_recipes')
    .select('post_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (!error) return data ?? [];

  const fallback = await supabase
    .from('saved_posts')
    .select('post_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  assertNoError(fallback.error);
  return fallback.data ?? [];
}
