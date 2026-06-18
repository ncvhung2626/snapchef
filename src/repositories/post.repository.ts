import { getSupabase } from '../lib/supabase';
import { assertNoError } from './base.repository';

const POST_SELECT = `
  *,
  profiles!author_id (id, fullname, email, avatar, bio, role, created_at, updated_at),
  post_likes (user_id)
`;

export async function listPostsPage(params: {
  limit: number;
  cursor?: string;
  category?: string;
  groupOnly?: boolean;
}) {
  let q = getSupabase()
    .from('posts')
    .select(POST_SELECT)
    .order('created_at', { ascending: false })
    .limit(params.limit);

  if (params.cursor) {
    q = q.lt('created_at', params.cursor);
  }
  if (params.groupOnly) {
    q = q.not('group_id', 'is', null);
  }
  if (params.category && params.category !== 'all') {
    q = q.eq('category', params.category);
  }

  const { data, error } = await q;
  assertNoError(error);
  return data ?? [];
}

export async function searchPosts(query: string, limit = 20) {
  const { data, error } = await getSupabase()
    .from('posts')
    .select(POST_SELECT)
    .or(`content.ilike.%${query}%,title.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);
  assertNoError(error);
  return data ?? [];
}

export async function updatePost(
  postId: string,
  authorId: string,
  input: {
    content?: string;
    title?: string;
    category?: string;
    ingredients?: string[];
    steps?: string[];
    cookTimeMinutes?: number | null;
  }
) {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.content !== undefined) payload.content = input.content.trim();
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.category !== undefined) payload.category = input.category;
  if (input.ingredients !== undefined) payload.ingredients = input.ingredients;
  if (input.steps !== undefined) payload.steps = input.steps;
  if (input.cookTimeMinutes !== undefined) payload.cook_time_minutes = input.cookTimeMinutes;

  const { data, error } = await getSupabase()
    .from('posts')
    .update(payload)
    .eq('id', postId)
    .eq('author_id', authorId)
    .select(POST_SELECT)
    .single();
  assertNoError(error);
  return data;
}

export async function deletePost(postId: string, authorId: string) {
  const supabase = getSupabase();
  const soft = await supabase
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', postId)
    .eq('author_id', authorId);

  if (!soft.error) return;

  const hard = await supabase.from('posts').delete().eq('id', postId).eq('author_id', authorId);
  assertNoError(hard.error);
}

export async function deletePostAsModerator(postId: string) {
  const supabase = getSupabase();
  const soft = await supabase
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', postId);
  if (!soft.error) return;
  const hard = await supabase.from('posts').delete().eq('id', postId);
  assertNoError(hard.error);
}
