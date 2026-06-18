import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as reelService from '../services/reelService';
import { queryKeys } from './keys';

const PAGE_SIZE = 10;

export function useReelsInfiniteQuery(currentUserId?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.reels.feed,
    queryFn: async ({ pageParam }) => {
      const result = await reelService.getReelsFeed(currentUserId, pageParam as string | undefined, PAGE_SIZE);
      return result;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useToggleReelLikeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reelId, userId }: { reelId: string; userId: string }) =>
      reelService.toggleReelLike(reelId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.reels.feed });
    },
  });
}
