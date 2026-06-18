export const queryKeys = {
  posts: {
    all: ['posts'] as const,
    list: (cursor?: string) => ['posts', 'list', cursor] as const,
    detail: (id: string) => ['posts', 'detail', id] as const,
    search: (q: string) => ['posts', 'search', q] as const,
  },
  comments: {
    byPost: (postId: string) => ['comments', postId] as const,
  },
  groups: {
    list: ['groups', 'list'] as const,
    detail: (id: string) => ['groups', 'detail', id] as const,
  },
  notifications: {
    list: ['notifications', 'list'] as const,
  },
  chat: {
    conversations: ['chat', 'conversations'] as const,
    messages: (conversationId: string) => ['chat', 'messages', conversationId] as const,
  },
  reels: {
    feed: ['reels', 'feed'] as const,
  },
} as const;
