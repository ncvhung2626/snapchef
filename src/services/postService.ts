import { getSupabase, assertSupabaseConfigured, isSupabaseConfigured } from '../lib/supabase';
import type { Post, User, UserRole } from '../types/models';
import { MOCK_POSTS } from '../data/mock';
import { uploadPostImage } from './storageService';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

type FeedTab = 'forYou' | 'groups' | 'discover';

interface PostRow {
  id: string;
  author_id: string;
  content: string;
  images: string[];
  videos: string[];
  visibility: string;
  group_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: ProfileRow | ProfileRow[];
  post_likes?: { user_id: string }[];
}

interface ProfileRow {
  id: string;
  fullname: string;
  email: string | null;
  avatar: string | null;
  bio: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

function mapAuthor(row: ProfileRow): User {
  return {
    _id: row.id,
    fullname: row.fullname,
    email: row.email ?? '',
    avatar: row.avatar ?? undefined,
    bio: row.bio ?? undefined,
    role: (row.role as UserRole) || 'user',
    followers: [],
    following: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPost(row: PostRow, currentUserId?: string): Post {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const likes = (row.post_likes ?? []).map((l) => l.user_id);
  return {
    _id: row.id,
    author: profile ? mapAuthor(profile) : mapAuthor({
      id: row.author_id,
      fullname: 'Người dùng',
      email: '',
      avatar: null,
      bio: null,
      role: 'user',
      created_at: row.created_at,
      updated_at: row.updated_at,
    }),
    content: row.content,
    images: row.images ?? [],
    videos: row.videos ?? [],
    likes,
    commentsCount: 0,
    shares: 0,
    hashtags: extractHashtags(row.content),
    visibility: (row.visibility as Post['visibility']) || 'public',
    groupId: row.group_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024F]+/g);
  return matches ? matches.map((t) => t.slice(1).toLowerCase()) : [];
}

async function fetchPostsQuery(tab: FeedTab): Promise<PostRow[]> {
  const supabase = getSupabase();
  let query = supabase
    .from('posts')
    .select(
      `
      *,
      profiles!author_id (id, fullname, email, avatar, bio, role, created_at, updated_at),
      post_likes (user_id)
    `
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (tab === 'groups') {
    query = query.not('group_id', 'is', null);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as PostRow[];
}

async function attachCommentCounts(posts: Post[]): Promise<Post[]> {
  if (!posts.length) return posts;
  const supabase = getSupabase();
  const ids = posts.map((p) => p._id);
  const { data } = await supabase.from('comments').select('post_id').in('post_id', ids);
  const counts: Record<string, number> = {};
  (data ?? []).forEach((c: { post_id: string }) => {
    counts[c.post_id] = (counts[c.post_id] ?? 0) + 1;
  });
  return posts.map((p) => ({ ...p, commentsCount: counts[p._id] ?? 0 }));
}

/** GET feed */
export async function getFeed(tab: FeedTab, currentUserId?: string): Promise<Post[]> {
  if (!isSupabaseConfigured) {
    await delay(400);
    return tab === 'groups' ? MOCK_POSTS.filter((p) => p.groupId) : [...MOCK_POSTS];
  }
  try {
    const rows = await fetchPostsQuery(tab);
    const posts = rows.map((r) => mapPost(r, currentUserId));
    return attachCommentCounts(posts);
  } catch {
    await delay(300);
    return tab === 'groups' ? MOCK_POSTS.filter((p) => p.groupId) : [...MOCK_POSTS];
  }
}

export async function getPostById(postId: string, currentUserId?: string): Promise<Post | undefined> {
  if (!isSupabaseConfigured) {
    await delay(200);
    return MOCK_POSTS.find((p) => p._id === postId);
  }
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        profiles!author_id (id, fullname, email, avatar, bio, role, created_at, updated_at),
        post_likes (user_id)
      `
      )
      .eq('id', postId)
      .single();

    if (error || !data) return undefined;
    const [post] = await attachCommentCounts([mapPost(data as PostRow, currentUserId)]);
    return post;
  } catch {
    return MOCK_POSTS.find((p) => p._id === postId);
  }
}

export interface CreatePostInput {
  content: string;
  imageUri?: string;
  groupId?: string;
  visibility?: Post['visibility'];
}

export async function createPost(
  authorId: string,
  input: CreatePostInput
): Promise<Post> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const images: string[] = [];
  if (input.imageUri) {
    const url = await uploadPostImage(authorId, input.imageUri);
    images.push(url);
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      author_id: authorId,
      content: input.content.trim(),
      images,
      videos: [],
      visibility: input.visibility ?? 'public',
      group_id: input.groupId ?? null,
    })
    .select(
      `
      *,
      profiles!author_id (id, fullname, email, avatar, bio, role, created_at, updated_at),
      post_likes (user_id)
    `
    )
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Không tạo được bài viết');
  }

  return mapPost(data as PostRow, authorId);
}

export async function toggleLike(
  postId: string,
  userId: string
): Promise<{ liked: boolean; likesCount: number }> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId);
  } else {
    const { error } = await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    if (error) throw new Error(error.message);
  }

  const { count } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  return { liked: !existing, likesCount: count ?? 0 };
}

export async function getPostsByGroupId(
  groupId: string,
  currentUserId?: string
): Promise<Post[]> {
  if (!isSupabaseConfigured) {
    await delay(300);
    return MOCK_POSTS.filter((p) => p.groupId === groupId);
  }
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('posts')
      .select(
        `
        *,
        profiles!author_id (id, fullname, email, avatar, bio, role, created_at, updated_at),
        post_likes (user_id)
      `
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw new Error(error.message);
    const posts = (data as PostRow[]).map((r) => mapPost(r, currentUserId));
    return attachCommentCounts(posts);
  } catch {
    await delay(300);
    return MOCK_POSTS.filter((p) => p.groupId === groupId);
  }
}

export async function deletePost(postId: string, userId: string): Promise<void> {
  assertSupabaseConfigured();
  const supabase = getSupabase();
  const { error } = await supabase.from('posts').delete().eq('id', postId).eq('author_id', userId);
  if (error) throw new Error(error.message);
}
