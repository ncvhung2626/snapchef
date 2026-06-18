import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as postService from '../services/postService';
import * as postRepository from '../repositories/post.repository';
import { queryKeys } from './keys';

export function useDeletePostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      postRepository.deletePost(postId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
}

export function useToggleLikeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) =>
      postService.toggleLike(postId, userId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.posts.all });
    },
  });
}
