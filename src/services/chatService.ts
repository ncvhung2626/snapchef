import { getSupabase, assertSupabaseConfigured, isSupabaseConfigured } from '../lib/supabase';
import type { Conversation, Message } from '../types/models';

interface ConversationRow {
  id: string;
  dm_key: string | null;
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
  created_at: string;
  profiles?: { id: string; fullname: string; avatar: string | null } | { id: string; fullname: string; avatar: string | null }[];
}

function mapMessage(row: MessageRow): Message {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    _id: row.id,
    conversationId: row.conversation_id,
    sender: row.sender_id,
    senderName: profile?.fullname ?? 'Người dùng',
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  if (!isSupabaseConfigured) return [];
  try {
    assertSupabaseConfigured();
    const supabase = getSupabase();

    const { data: memberships, error: memErr } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId);

    if (memErr) throw memErr;
    const ids = (memberships ?? []).map((m: { conversation_id: string }) => m.conversation_id);
    if (!ids.length) return [];

    const { data: convos, error } = await supabase
      .from('conversations')
      .select('*')
      .in('id', ids)
      .order('last_message_at', { ascending: false });

    if (error) throw error;

    const results: Conversation[] = [];
    for (const row of (convos ?? []) as ConversationRow[]) {
      const { data: members } = await supabase
        .from('conversation_members')
        .select('user_id, profiles!user_id (id, fullname, avatar)')
        .eq('conversation_id', row.id);

      const participantIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
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
  } catch {
    return [];
  }
}

export async function getOrCreateConversation(
  userId: string,
  otherUserId: string
): Promise<Conversation> {
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

export async function getMessages(conversationId: string): Promise<Message[]> {
  if (!isSupabaseConfigured) return [];
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('messages')
    .select(
      `
      id, conversation_id, sender_id, content, created_at,
      profiles!sender_id (id, fullname, avatar)
    `
    )
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data as MessageRow[]).map(mapMessage);
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
    })
    .select(
      `
      id, conversation_id, sender_id, content, created_at,
      profiles!sender_id (id, fullname, avatar)
    `
    )
    .single();

  if (error || !data) {
    const { data: simple, error: err2 } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, content: trimmed })
      .select('*')
      .single();
    if (err2 || !simple) throw new Error(error?.message ?? 'Không gửi được tin nhắn');
    return mapMessage(simple as MessageRow);
  }

  return mapMessage(data as MessageRow);
}

export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void
): () => void {
  if (!isSupabaseConfigured) return () => undefined;

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

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function searchUsersForChat(
  currentUserId: string,
  query?: string
): Promise<Array<{ id: string; fullname: string; avatar?: string }>> {
  assertSupabaseConfigured();
  const supabase = getSupabase();
  let q = supabase
    .from('profiles')
    .select('id, fullname, avatar')
    .neq('id', currentUserId)
    .limit(30);

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
