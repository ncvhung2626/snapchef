import { getSupabase, assertSupabaseConfigured } from '../lib/supabase';
import type { Conversation, Message } from '../types/models';

interface ConversationRow {
  id: string;
  dm_key: string | null;
  group_id: string | null;
  title: string | null;
  last_message: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  status?: string;
  created_at: string;
  profiles?: { id: string; fullname: string; avatar: string | null } | { id: string; fullname: string; avatar: string | null }[];
}

function mapMessage(row: MessageRow, readByOthers?: boolean): Message {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    _id: row.id,
    conversationId: row.conversation_id,
    sender: row.sender_id,
    senderName: profile?.fullname ?? 'Người dùng',
    content: row.content,
    createdAt: row.created_at,
    status: (row.status as Message['status']) ?? 'sent',
    readByOthers,
  };
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const { data: memberships, error: memErr } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', userId);

  if (memErr) throw new Error(memErr.message);
  const ids = (memberships ?? []).map((m: { conversation_id: string }) => m.conversation_id);
  if (!ids.length) return [];

  const { data: convos, error } = await supabase
    .from('conversations')
    .select('*')
    .in('id', ids)
    .order('last_message_at', { ascending: false });

  if (error) throw new Error(error.message);

  const results: Conversation[] = [];
  for (const row of (convos ?? []) as ConversationRow[]) {
    const { data: members } = await supabase
      .from('conversation_members')
      .select('user_id, profiles!user_id (id, fullname, avatar)')
      .eq('conversation_id', row.id);

    const participantIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
    const isGroupChat = Boolean(row.group_id);

    if (isGroupChat) {
      results.push({
        _id: row.id,
        participants: participantIds,
        groupId: row.group_id ?? undefined,
        groupTitle: row.title ?? undefined,
        isGroupChat: true,
        lastMessage: row.last_message,
        updatedAt: row.last_message_at,
      });
      continue;
    }

    const other = (members ?? []).find((m: { user_id: string }) => m.user_id !== userId) as
      | { user_id: string; profiles?: { fullname: string; avatar: string | null } | { fullname: string; avatar: string | null }[] }
      | undefined;
    const profile = other?.profiles
      ? Array.isArray(other.profiles)
        ? other.profiles[0]
        : other.profiles
      : undefined;

    results.push({
      _id: row.id,
      participants: participantIds,
      otherUserId: other?.user_id,
      otherUserName: profile?.fullname,
      otherUserAvatar: profile?.avatar ?? undefined,
      lastMessage: row.last_message,
      updatedAt: row.last_message_at,
    });
  }
  return results;
}

export async function getOrCreateConversation(userId: string, otherUserId: string): Promise<Conversation> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const { data: convoId, error } = await supabase.rpc('create_dm_conversation', {
    p_other_user_id: otherUserId,
  });

  if (error) throw new Error(error.message);
  const id = convoId as string;

  const list = await getConversations(userId);
  const found = list.find((c) => c._id === id);
  if (found) return found;

  const { data: otherProfile } = await supabase
    .from('profiles')
    .select('fullname, avatar')
    .eq('id', otherUserId)
    .single();

  const { data: convo } = await supabase.from('conversations').select('*').eq('id', id).single();

  return {
    _id: id,
    participants: [userId, otherUserId],
    otherUserId,
    otherUserName: otherProfile?.fullname,
    otherUserAvatar: otherProfile?.avatar ?? undefined,
    lastMessage: convo?.last_message ?? '',
    updatedAt: convo?.last_message_at ?? new Date().toISOString(),
  };
}

export async function getOrCreateGroupConversation(groupId: string, userId: string): Promise<Conversation> {
  assertSupabaseConfigured();
  const supabase = getSupabase();
  const { data: convoId, error } = await supabase.rpc('create_group_conversation', { p_group_id: groupId });
  if (error) throw new Error(error.message);

  const list = await getConversations(userId);
  const found = list.find((c) => c._id === convoId);
  if (found) return found;

  const { data: convo } = await supabase.from('conversations').select('*').eq('id', convoId).single();
  return {
    _id: convoId as string,
    participants: [],
    groupId,
    groupTitle: convo?.title ?? undefined,
    isGroupChat: true,
    lastMessage: convo?.last_message ?? '',
    updatedAt: convo?.last_message_at ?? new Date().toISOString(),
  };
}

export async function getMessages(conversationId: string, currentUserId?: string): Promise<Message[]> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, sender_id, content, status, created_at, profiles!sender_id (id, fullname, avatar)')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) throw new Error(error.message);

  const reads = await getConversationReads(conversationId);
  return (data as MessageRow[]).map((row) => {
    const readByOthers =
      currentUserId && row.sender_id === currentUserId
        ? reads.some((r) => r.userId !== currentUserId && new Date(r.lastReadAt) >= new Date(row.created_at))
        : undefined;
    return mapMessage(row, readByOthers);
  });
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<Message> {
  assertSupabaseConfigured();
  const trimmed = content.trim();
  if (!trimmed) throw new Error('Nội dung trống');

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content: trimmed,
      status: 'sent',
    })
    .select('id, conversation_id, sender_id, content, status, created_at, profiles!sender_id (id, fullname, avatar)')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Không gửi được tin nhắn');
  return mapMessage(data as MessageRow, false);
}

export async function markConversationRead(conversationId: string): Promise<void> {
  assertSupabaseConfigured();
  const { error } = await getSupabase().rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  });
  if (error) throw new Error(error.message);
}

interface ReadRow {
  user_id: string;
  last_read_at: string;
}

export async function getConversationReads(
  conversationId: string
): Promise<Array<{ userId: string; lastReadAt: string }>> {
  assertSupabaseConfigured();
  const { data, error } = await getSupabase()
    .from('conversation_reads')
    .select('user_id, last_read_at')
    .eq('conversation_id', conversationId);
  if (error) return [];
  return (data as ReadRow[]).map((r) => ({ userId: r.user_id, lastReadAt: r.last_read_at }));
}

export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void
): () => void {
  assertSupabaseConfigured();
  const supabase = getSupabase();
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      async (payload) => {
        const row = payload.new as MessageRow;
        if (!row.profiles) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('fullname')
            .eq('id', row.sender_id)
            .single();
          row.profiles = profile
            ? { id: row.sender_id, fullname: profile.fullname, avatar: null }
            : undefined;
        }
        onMessage(mapMessage(row));
      }
    )
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
}

export function subscribeToReadReceipts(
  conversationId: string,
  onRead: () => void
): () => void {
  assertSupabaseConfigured();
  const supabase = getSupabase();
  const channel = supabase
    .channel(`reads:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversation_reads',
        filter: `conversation_id=eq.${conversationId}`,
      },
      () => onRead()
    )
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

export type TypingPayload = { userId: string; userName?: string; isTyping: boolean };

export function subscribeToTyping(
  conversationId: string,
  currentUserId: string,
  onTyping: (payload: TypingPayload) => void
): () => void {
  assertSupabaseConfigured();
  const supabase = getSupabase();
  const channel = supabase
    .channel(`typing:${conversationId}`, { config: { broadcast: { self: false } } })
    .on('broadcast', { event: 'typing' }, (payload) => {
      const data = payload.payload as TypingPayload;
      if (data.userId !== currentUserId) onTyping(data);
    })
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}

const typingChannels = new Map<string, ReturnType<ReturnType<typeof getSupabase>['channel']>>();

function getTypingChannel(conversationId: string) {
  const supabase = getSupabase();
  let channel = typingChannels.get(conversationId);
  if (!channel) {
    channel = supabase.channel(`typing:${conversationId}`, { config: { broadcast: { self: false } } });
    void channel.subscribe();
    typingChannels.set(conversationId, channel);
  }
  return channel;
}

export function emitTyping(
  conversationId: string,
  userId: string,
  userName: string,
  isTyping: boolean
): void {
  assertSupabaseConfigured();
  const channel = getTypingChannel(conversationId);
  void channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { userId, userName, isTyping } satisfies TypingPayload,
  });
}

export async function searchUsersForChat(
  currentUserId: string,
  query?: string
): Promise<Array<{ id: string; fullname: string; avatar?: string }>> {
  assertSupabaseConfigured();
  const supabase = getSupabase();
  let q = supabase.from('profiles').select('id, fullname, avatar').neq('id', currentUserId).limit(30);

  if (query?.trim()) {
    q = q.ilike('fullname', `%${query.trim()}%`);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []).map((p) => ({
    id: p.id,
    fullname: p.fullname,
    avatar: p.avatar ?? undefined,
  }));
}
