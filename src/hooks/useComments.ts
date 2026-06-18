import { useCallback, useEffect, useState } from 'react';
import type { Comment } from '../types/models';
import * as commentService from '../services/commentService';

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [replies, setReplies] = useState<Record<string, Comment[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const data = await commentService.getComments(postId);
    setComments(data);
  }, [postId]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const loadReplies = useCallback(async (parentId: string) => {
    const data = await commentService.getReplies(parentId);
    setReplies((prev) => ({ ...prev, [parentId]: data }));
  }, []);

  const addComment = useCallback(
    async (userId: string, content: string, parentCommentId?: string) => {
      setSubmitting(true);
      try {
        const created = await commentService.createComment(postId, userId, content, parentCommentId);
        if (parentCommentId) {
          setReplies((prev) => ({
            ...prev,
            [parentCommentId]: [...(prev[parentCommentId] ?? []), created],
          }));
        } else {
          setComments((prev) => [...prev, created]);
        }
        return created;
      } finally {
        setSubmitting(false);
      }
    },
    [postId]
  );

  const removeComment = useCallback(async (commentId: string, userId: string) => {
    await commentService.deleteComment(commentId, userId);
    setComments((prev) => prev.filter((c) => c._id !== commentId));
    setReplies((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[key] = next[key].filter((c) => c._id !== commentId);
      }
      return next;
    });
  }, []);

  return { comments, replies, loading, submitting, reload: load, loadReplies, addComment, removeComment };
};
