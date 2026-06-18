import { getSupabase, assertSupabaseConfigured } from '../lib/supabase';
import type { Post, User, UserRole } from '../types/models';
import { uploadPostImage } from './storageService';
type FeedTab = 'forYou' | 'groups' | 'discover';

interface PostRow {
  id: string;
  author_id: string;
  title?: string | null;
  content: string;
  images: string[];
  videos: string[];
  visibility: string;
  group_id: string | null;
  category?: string | null;
  ingredients?: string[] | null;
  steps?: string[] | null;
  cook_time_minutes?: number | null;
  created_at: string;
  updated_at: string;
  profiles?: ProfileRow | ProfileRow[];
  post_likes?: { user_id: string }[];
}

interface ProfileRow {
  id: string;
  fullname: string;
  username?: string | null;
  email: string | null;
  avatar: string | null;
  bio: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

const POST_SELECT = `
  *,
  profiles!author_id (id, fullname, username, email, avatar, bio, role, created_at, updated_at),
  post_likes (user_id)
`;

function mapAuthor(row: ProfileRow): User {
  return {
    _id: row.id,
    fullname: row.fullname,
    username: row.username ?? undefined,
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
    author: profile
      ? mapAuthor(profile)
      : mapAuthor({
          id: row.author_id,
          fullname: 'Người dùng',
          email: '',
          avatar: null,
          bio: null,
          role: 'user',
          created_at: row.created_at,
          updated_at: row.updated_at,
        }),
    title: row.title ?? undefined,
    content: row.content,
    images: row.images ?? [],
    videos: row.videos ?? [],
    likes,
    commentsCount: 0,
    shares: 0,
    hashtags: extractHashtags(row.content),
    visibility: (row.visibility as Post['visibility']) || 'public',
    groupId: row.group_id ?? undefined,
    category: row.category ?? undefined,
    ingredients: (row.ingredients as string[] | null) ?? undefined,
    steps: (row.steps as string[] | null) ?? undefined,
    cookTimeMinutes: row.cook_time_minutes ?? undefined,
    isRecipe: Boolean(row.title || (row.steps && row.steps.length)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u00C0-\u024F]+/g);
  return matches ? matches.map((t) => t.slice(1).toLowerCase()) : [];
}

async function attachCommentCounts(posts: Post[]): Promise<Post[]> {
  if (!posts.length) return posts;
  const supabase = getSupabase();
  const ids = posts.map((p) => p._id);
  const { data, error } = await supabase.from('comments').select('post_id').in('post_id', ids);
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  (data ?? []).forEach((c: { post_id: string }) => {
    counts[c.post_id] = (counts[c.post_id] ?? 0) + 1;
  });
  return posts.map((p) => ({ ...p, commentsCount: counts[p._id] ?? 0 }));
}

async function fetchPostsQuery(tab: FeedTab, category?: string): Promise<PostRow[]> {
  const supabase = getSupabase();
  let query = supabase.from('posts').select(POST_SELECT).order('created_at', { ascending: false }).limit(50);

  if (tab === 'groups') {
    query = query.not('group_id', 'is', null);
  }
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as PostRow[];
}

export async function getFeed(tab: FeedTab, currentUserId?: string, category?: string): Promise<Post[]> {
  assertSupabaseConfigured();
  const rows = await fetchPostsQuery(tab, category);
  const posts = rows.map((r) => mapPost(r, currentUserId));
  return attachCommentCounts(posts);
}

export async function getPostById(postId: string, currentUserId?: string): Promise<Post | undefined> {
  assertSupabaseConfigured();
  const { data, error } = await getSupabase()
    .from('posts')
    .select(POST_SELECT)
    .eq('id', postId)
    .single();

  if (error || !data) return undefined;
  const [post] = await attachCommentCounts([mapPost(data as PostRow, currentUserId)]);
  return post;
}

export interface CreatePostInput {
  content: string;
  imageUri?: string;
  groupId?: string;
  visibility?: Post['visibility'];
}

export interface CreateRecipeInput {
  title: string;
  description: string;
  category: string;
  ingredients: string[];
  steps: string[];
  cookTimeMinutes?: number;
  imageUri?: string;
  groupId?: string;
}

export interface UpdateRecipeInput {
  title?: string;
  description?: string;
  category?: string;
  ingredients?: string[];
  steps?: string[];
  cookTimeMinutes?: number | null;
  imageUri?: string;
  existingImages?: string[];
}

export async function createPost(authorId: string, input: CreatePostInput): Promise<Post> {
  assertSupabaseConfigured();
  const images: string[] = [];
  if (input.imageUri) {
    images.push(await uploadPostImage(authorId, input.imageUri));
  }

  const { data, error } = await getSupabase()
    .from('posts')
    .insert({
      author_id: authorId,
      content: input.content.trim(),
      images,
      videos: [],
      visibility: input.visibility ?? 'public',
      group_id: input.groupId ?? null,
    })
    .select(POST_SELECT)
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Không tạo được bài viết');
  return mapPost(data as PostRow, authorId);
}

export async function createRecipe(authorId: string, input: CreateRecipeInput): Promise<Post> {
  assertSupabaseConfigured();
  const images: string[] = [];
  if (input.imageUri) {
    images.push(await uploadPostImage(authorId, input.imageUri));
  }

  const { data, error } = await getSupabase()
    .from('posts')
    .insert({
      author_id: authorId,
      title: input.title.trim(),
      content: input.description.trim(),
      images,
      videos: [],
      visibility: 'public',
      group_id: input.groupId ?? null,
      category: input.category,
      ingredients: input.ingredients.map((i) => i.trim()).filter(Boolean),
      steps: input.steps.map((s) => s.trim()).filter(Boolean),
      cook_time_minutes: input.cookTimeMinutes ?? null,
    })
    .select(POST_SELECT)
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Không tạo được công thức');
  return mapPost(data as PostRow, authorId);
}

export async function updateRecipe(
  postId: string,
  authorId: string,
  input: UpdateRecipeInput
): Promise<Post> {
  assertSupabaseConfigured();
  const images = input.imageUri
    ? [await uploadPostImage(authorId, input.imageUri)]
    : [...(input.existingImages ?? [])];

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.description !== undefined) payload.content = input.description.trim();
  if (input.category !== undefined) payload.category = input.category;
  if (input.ingredients !== undefined) payload.ingredients = input.ingredients;
  if (input.steps !== undefined) payload.steps = input.steps;
  if (input.cookTimeMinutes !== undefined) payload.cook_time_minutes = input.cookTimeMinutes;
  if (images.length) payload.images = images;

  const { data, error } = await getSupabase()
    .from('posts')
    .update(payload)
    .eq('id', postId)
    .eq('author_id', authorId)
    .select(POST_SELECT)
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Không cập nhật được công thức');
  return mapPost(data as PostRow, authorId);
}

export async function searchPosts(query: string, category?: string, currentUserId?: string): Promise<Post[]> {
  assertSupabaseConfigured();
  const term = query.trim();
  if (!term) return getFeed('forYou', currentUserId, category);

  let q = getSupabase()
    .from('posts')
    .select(POST_SELECT)
    .or(`title.ilike.%${term}%,content.ilike.%${term}%,ingredients::text.ilike.%${term}%`)
    .order('created_at', { ascending: false })
    .limit(40);

  if (category && category !== 'all') {
    q = q.eq('category', category);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const posts = (data as PostRow[]).map((r) => mapPost(r, currentUserId));
  return attachCommentCounts(posts);
}

export async function toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
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

export async function getPostsByAuthorId(authorId: string, currentUserId?: string): Promise<Post[]> {
  assertSupabaseConfigured();
  const { data, error } = await getSupabase()
    .from('posts')
    .select(POST_SELECT)
    .eq('author_id', authorId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  const posts = (data as PostRow[]).map((r) => mapPost(r, currentUserId));
  return attachCommentCounts(posts);
}

export async function getPostsByGroupId(groupId: string, currentUserId?: string): Promise<Post[]> {
  assertSupabaseConfigured();
  const { data, error } = await getSupabase()
    .from('posts')
    .select(POST_SELECT)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  const posts = (data as PostRow[]).map((r) => mapPost(r, currentUserId));
  return attachCommentCounts(posts);
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
): Promise<Post> {
  assertSupabaseConfigured();
  const { updatePost: repoUpdate } = await import('../repositories/post.repository');
  const data = await repoUpdate(postId, authorId, input);
  return mapPost(data as PostRow, authorId);
}

export async function deletePost(postId: string, userId: string): Promise<void> {
  assertSupabaseConfigured();
  const { deletePost: repoDelete } = await import('../repositories/post.repository');
  await repoDelete(postId, userId);
}

export async function deletePostForModeration(postId: string): Promise<void> {
  assertSupabaseConfigured();
  const { deletePostAsModerator } = await import('../repositories/post.repository');
  await deletePostAsModerator(postId);
}
