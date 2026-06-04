import { getSupabase, assertSupabaseConfigured, isSupabaseConfigured } from '../lib/supabase';
import type { Comment } from '../types/models';

interface CommentRow {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  created_at: string;
  profiles?: {
    id: string;
    fullname: string;
    avatar: string | null;
  } | {
    id: string;
    fullname: string;
    avatar: string | null;
  }[];
}

const MOCK_COMMENTS: Comment[] = [
  {
    _id: 'c1',
    postId: 'mock',
    userId: 'u2',
    authorName: 'Thanh Van',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100',
    content: 'Nhìn hấp dẫn quá! Cho mình xin công thức với ạ. 😍',
    likes: 12,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

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
  if (!isSupabaseConfigured) {
    return MOCK_COMMENTS.filter((c) => c.postId === postId || c.postId === 'mock');
  }
  try {
    assertSupabaseConfigured();
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('comments')
      .select(
        `
        id, post_id, user_id, content, parent_comment_id, created_at,
        profiles!user_id (id, fullname, avatar)
      `
      )
      .eq('post_id', postId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.message.includes('profiles')) {
        const { data: fallback, error: err2 } = await supabase
          .from('comments')
          .select('*')
          .eq('post_id', postId)
          .order('created_at', { ascending: true });
        if (err2) throw err2;
        return (fallback ?? []).map((r) =>
          mapComment({ ...r, profiles: undefined } as CommentRow)
        );
      }
      throw error;
    }
    return (data ?? []).map((r) => mapComment(r as CommentRow));
  } catch {
    return MOCK_COMMENTS;
  }
}

export async function createComment(
  postId: string,
  userId: string,
  content: string,
  parentCommentId?: string
): Promise<Comment> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content: content.trim(),
      parent_comment_id: parentCommentId ?? null,
    })
    .select(
      `
      id, post_id, user_id, content, parent_comment_id, created_at,
      profiles!user_id (id, fullname, avatar)
    `
    )
    .single();

  if (error || !data) {
    const { data: simple, error: err2 } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content: content.trim(),
        parent_comment_id: parentCommentId ?? null,
      })
      .select('*')
      .single();
    if (err2 || !simple) throw new Error(error?.message ?? err2?.message ?? 'Không gửi được bình luận');
    return mapComment(simple as CommentRow);
  }

  return mapComment(data as CommentRow);
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  assertSupabaseConfigured();
  const { error } = await getSupabase()
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}
