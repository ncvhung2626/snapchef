import { useCallback, useEffect, useState } from 'react';
import type { Comment } from '../types/models';
import * as commentService from '../services/commentService';

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
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

  const addComment = useCallback(
    async (userId: string, content: string) => {
      setSubmitting(true);
      try {
        const created = await commentService.createComment(postId, userId, content);
        setComments((prev) => [...prev, created]);
        return created;
      } finally {
        setSubmitting(false);
      }
    },
    [postId]
  );

  return { comments, loading, submitting, reload: load, addComment };
}
