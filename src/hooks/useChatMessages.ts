import { useCallback, useEffect, useRef, useState } from 'react';
import type { Message } from '../types/models';
import * as chatService from '../services/chatService';

export function useChatMessages(conversationId: string, currentUserId?: string, currentUserName?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshReads = useCallback(async () => {
    const reads = await chatService.getConversationReads(conversationId);
    setMessages((prev) =>
      prev.map((msg) => {
        if (!currentUserId || msg.sender !== currentUserId) return msg;
        const readByOthers = reads.some(
          (r) => r.userId !== currentUserId && new Date(r.lastReadAt) >= new Date(msg.createdAt)
        );
        return { ...msg, readByOthers };
      })
    );
  }, [conversationId, currentUserId]);

  const appendUnique = useCallback((msg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m._id === msg._id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const loadMessages = useCallback(async () => {
    const data = await chatService.getMessages(conversationId, currentUserId);
    setMessages(data);
    await chatService.markConversationRead(conversationId);
  }, [conversationId, currentUserId]);

  useEffect(() => {
    setLoading(true);
    loadMessages()
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));

    const unsubMessages = chatService.subscribeToMessages(conversationId, (msg) => {
      appendUnique(msg);
      if (currentUserId && msg.sender !== currentUserId) {
        void chatService.markConversationRead(conversationId);
      }
    });
    const unsubReads = chatService.subscribeToReadReceipts(conversationId, () => {
      void refreshReads();
    });

    let unsubTyping: (() => void) | undefined;
    if (currentUserId) {
      unsubTyping = chatService.subscribeToTyping(conversationId, currentUserId, (payload) => {
        setTypingUsers((prev) => {
          if (payload.isTyping) {
            return prev.includes(payload.userId) ? prev : [...prev, payload.userId];
          }
          return prev.filter((id) => id !== payload.userId);
        });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (payload.isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((id) => id !== payload.userId));
          }, 3000);
        }
      });
    }

    return () => {
      unsubMessages();
      unsubReads();
      unsubTyping?.();
    };
  }, [conversationId, currentUserId, appendUnique, loadMessages, refreshReads]);

  const send = useCallback(
    async (senderId: string, content: string) => {
      setSending(true);
      try {
        const msg = await chatService.sendMessage(conversationId, senderId, content);
        appendUnique(msg);
        chatService.emitTyping(conversationId, senderId, currentUserName ?? '', false);
        return msg;
      } finally {
        setSending(false);
      }
    },
    [conversationId, appendUnique, currentUserName]
  );

  const notifyTyping = useCallback(
    (isTyping: boolean) => {
      if (!currentUserId) return;
      if (emitTimeoutRef.current) clearTimeout(emitTimeoutRef.current);
      chatService.emitTyping(conversationId, currentUserId, currentUserName ?? 'Bạn', isTyping);
      if (isTyping) {
        emitTimeoutRef.current = setTimeout(() => {
          chatService.emitTyping(conversationId, currentUserId, currentUserName ?? 'Bạn', false);
        }, 2000);
      }
    },
    [conversationId, currentUserId, currentUserName]
  );

  return { messages, loading, sending, send, typingUsers, notifyTyping };
}
