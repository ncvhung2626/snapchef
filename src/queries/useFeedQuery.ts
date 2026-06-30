import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Post } from '../types/models';
import * as postService from '../services/postService';
import * as postRepository from '../repositories/post.repository';
import { attachCommentCountsToPosts } from '../utils/postCounts';
import { queryKeys } from './keys';
import type { FeedTab } from '../hooks/useFeed';

const PAGE_SIZE = 15;

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
  location?: { name: string; latitude?: number; longitude?: number } | null;
  profiles?: unknown;
  post_likes?: { user_id: string }[];
}

async function mapRowsToPosts(rows: PostRow[], userId?: string): Promise<Post[]> {
  const mapped = rows.map((r) => {
    const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
    const likes = (r.post_likes ?? []).map((l) => l.user_id);
    return {
      _id: r.id,
      author: profile
        ? {
            _id: (profile as { id: string }).id,
            fullname: (profile as { fullname: string }).fullname,
            email: (profile as { email: string | null }).email ?? '',
            avatar: (profile as { avatar: string | null }).avatar ?? undefined,
            bio: (profile as { bio: string | null }).bio ?? undefined,
            role: ((profile as { role: string }).role as Post['author']['role']) || 'user',
            followers: [],
            following: [],
            createdAt: (profile as { created_at: string }).created_at,
            updatedAt: (profile as { updated_at: string }).updated_at,
          }
        : {
            _id: r.author_id,
            fullname: 'Người dùng',
            email: '',
            role: 'user' as const,
            followers: [],
            following: [],
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          },
      title: r.title ?? undefined,
      content: r.content,
      images: r.images ?? [],
      videos: r.videos ?? [],
      likes,
      commentsCount: 0,
      shares: 0,
      hashtags: [],
      visibility: (r.visibility as Post['visibility']) || 'public',
      groupId: r.group_id ?? undefined,
      category: r.category ?? undefined,
      ingredients: r.ingredients ?? undefined,
      steps: r.steps ?? undefined,
      cookTimeMinutes: r.cook_time_minutes ?? undefined,
      isRecipe: Boolean(r.title || (r.steps && r.steps.length)),
      location: r.location ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    } satisfies Post;
  });

  if (!mapped.length) return mapped;
  return attachCommentCountsToPosts(mapped);
}

export function useFeedInfiniteQuery(tab: FeedTab, category: string, userId?: string) {
  return useInfiniteQuery({
    queryKey: ['feed', tab, category, userId],
    queryFn: async ({ pageParam }) => {
      if (tab === 'discover') {
        const rows = await postRepository.listPostsPage({
          limit: PAGE_SIZE,
          cursor: pageParam as string | undefined,
        });
        const posts = await mapRowsToPosts(rows as PostRow[], userId);
        const nextCursor =
          rows.length === PAGE_SIZE
            ? (rows[rows.length - 1] as { created_at: string }).created_at
            : undefined;
        return { posts, nextCursor };
      }

      const groupOnly = tab === 'groups';
      const rows = await postRepository.listPostsPage({
        limit: PAGE_SIZE,
        cursor: pageParam as string | undefined,
        category: tab === 'forYou' ? category : undefined,
        groupOnly,
      });

      const posts = await mapRowsToPosts(rows as PostRow[], userId);
      const nextCursor =
        rows.length === PAGE_SIZE
          ? (rows[rows.length - 1] as { created_at: string }).created_at
          : undefined;

      return { posts, nextCursor };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 30_000,
  });
}

export function useToggleLikeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      postService.toggleLike(postId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.posts.all });
      void qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
