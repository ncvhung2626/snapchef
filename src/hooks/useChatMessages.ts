import { useCallback, useEffect, useState } from 'react';
import type { Message } from '../types/models';
import * as chatService from '../services/chatService';

export function useChatMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const appendUnique = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m._id === msg._id)) return prev;
      return [...prev, msg];
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    chatService
      .getMessages(conversationId)
      .then(setMessages)
      .finally(() => setLoading(false));

    const unsubscribe = chatService.subscribeToMessages(conversationId, appendUnique);
    return unsubscribe;
  }, [conversationId, appendUnique]);

  const send = useCallback(
    async (senderId: string, content: string) => {
      setSending(true);
      try {
        const msg = await chatService.sendMessage(conversationId, senderId, content);
        appendUnique(msg);
        return msg;
      } finally {
        setSending(false);
      }
    },
    [conversationId, appendUnique]
  );

  return { messages, loading, sending, send };
}
