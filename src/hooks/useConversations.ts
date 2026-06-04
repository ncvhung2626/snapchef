import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Conversation } from '../types/models';
import * as chatService from '../services/chatService';

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }
    const data = await chatService.getConversations(user._id);
    setConversations(data);
  }, [user?._id]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return { conversations, loading, refreshing, refresh };
}
