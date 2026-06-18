import { assertSupabaseConfigured, getSupabase } from '../lib/supabase';
import type { Post } from '../types/models';
import { getPostById } from './postService';

export async function toggleSaveRecipe(userId: string, postId: string): Promise<boolean> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('saved_recipes')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);
    if (error) throw new Error(error.message);
    return false;
  }

  const { error } = await supabase.from('saved_recipes').insert({
    user_id: userId,
    post_id: postId,
  });
  if (error) throw new Error(error.message);
  return true;
}

export async function getSavedRecipes(userId: string): Promise<Post[]> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('saved_recipes')
    .select('post_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  const posts: Post[] = [];
  for (const row of data ?? []) {
    const p = await getPostById(row.post_id as string, userId);
    if (p) posts.push({ ...p, isSaved: true });
  }
  return posts;
}

export async function isPostSaved(userId: string, postId: string): Promise<boolean> {
  assertSupabaseConfigured();
  const { data } = await getSupabase()
    .from('saved_recipes')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .maybeSingle();
  return Boolean(data);
}
