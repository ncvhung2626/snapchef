import { useCallback, useEffect, useState } from 'react';
import type { Post } from '../types/models';
import * as postService from '../services/postService';
import { useAuth } from '../context/AuthContext';

export type FeedTab = 'forYou' | 'groups' | 'discover';

export function useFeed(tab: FeedTab) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await postService.getFeed(tab, user?._id);
    setPosts(data);
  }, [tab, user?._id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!user) return;
      try {
      const result = await postService.toggleLike(postId, user._id);
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id !== postId) return p;
          const likes = result.liked
            ? [...p.likes, user._id]
            : p.likes.filter((id) => id !== user._id);
          return { ...p, likes };
        })
      );
      } catch {
        /* ignore if tables not ready */
      }
    },
    [user]
  );

  return { posts, loading, refreshing, refresh, toggleLike };
}
