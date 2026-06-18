import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import * as postRepository from '../repositories/post.repository';
import { queryKeys } from './keys';

const PAGE_SIZE = 15;

export function usePostsInfiniteQuery() {
  return useInfiniteQuery({
    queryKey: queryKeys.posts.list(),
    queryFn: async ({ pageParam }) => {
      const rows = await postRepository.listPostsPage({
        limit: PAGE_SIZE,
        cursor: pageParam as string | undefined,
      });
      const nextCursor =
        rows.length === PAGE_SIZE ? (rows[rows.length - 1] as { created_at: string }).created_at : undefined;
      return { rows, nextCursor };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useSearchPostsQuery(query: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.posts.search(query),
    queryFn: () => postRepository.searchPosts(query),
    enabled: enabled && query.trim().length >= 2,
  });
}
