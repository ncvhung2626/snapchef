import { getSupabase, assertSupabaseConfigured } from '../lib/supabase';
import type { Comment } from '../types/models';

interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  profiles?: { id: string; fullname: string; avatar: string | null } | { id: string; fullname: string; avatar: string | null }[];
}

function mapComment(row: CommentRow): Comment {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    _id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    authorName: profile?.fullname ?? 'Người dùng',
    authorAvatar: profile?.avatar ?? undefined,
    content: row.content,
    parentComment: row.parent_comment_id ?? undefined,
    likes: 0,
    createdAt: row.created_at,
  };
}

export async function getComments(postId: string): Promise<Comment[]> {
  assertSupabaseConfigured();
  const { data, error } = await getSupabase()
    .from('comments')
    .select('id, post_id, user_id, content, parent_comment_id, created_at, profiles!user_id (id, fullname, avatar)')
    .eq('post_id', postId)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapComment(r as CommentRow));
}

export async function createComment(
  postId: string,
  userId: string,
  content: string,
  parentCommentId?: string
): Promise<Comment> {
  assertSupabaseConfigured();
  const { data, error } = await getSupabase()
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content: content.trim(),
      parent_comment_id: parentCommentId ?? null,
    })
    .select('id, post_id, user_id, content, parent_comment_id, created_at, profiles!user_id (id, fullname, avatar)')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Không gửi được bình luận');
  return mapComment(data as CommentRow);
}

export async function getReplies(parentCommentId: string): Promise<Comment[]> {
  assertSupabaseConfigured();
  const { data, error } = await getSupabase()
    .from('comments')
    .select('id, post_id, user_id, content, parent_comment_id, created_at, profiles!user_id (id, fullname, avatar)')
    .eq('parent_comment_id', parentCommentId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapComment(r as CommentRow));
}

export async function updateComment(commentId: string, userId: string, content: string): Promise<Comment> {
  assertSupabaseConfigured();
  const { data, error } = await getSupabase()
    .from('comments')
    .update({ content: content.trim() })
    .eq('id', commentId)
    .eq('user_id', userId)
    .select('id, post_id, user_id, content, parent_comment_id, created_at, profiles!user_id (id, fullname, avatar)')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Không cập nhật được');
  return mapComment(data as CommentRow);
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  assertSupabaseConfigured();
  const { error } = await getSupabase().from('comments').delete().eq('id', commentId).eq('user_id', userId);
  if (error) throw new Error(error.message);
}
