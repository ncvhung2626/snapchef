import { getSupabase, assertSupabaseConfigured } from '../lib/supabase';
import type { Group } from '../types/models';

export type GroupMemberRole = 'owner' | 'admin' | 'member';

export interface GroupWithMembership extends Group {
  isMember: boolean;
  myRole?: GroupMemberRole;
}

export interface GroupMember {
  userId: string;
  role: GroupMemberRole;
  fullname: string;
  avatar?: string;
  joinedAt: string;
}

interface GroupRow {
  id: string;
  name: string;
  description: string;
  cover_image: string | null;
  avatar_url: string | null;
  owner_id: string;
  privacy: string;
  member_can_post?: boolean;
  member_can_invite?: boolean;
  members_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
}

function mapGroup(row: GroupRow, extras?: Partial<GroupWithMembership>): GroupWithMembership {
  return {
    _id: row.id,
    name: row.name,
    description: row.description,
    coverImage: row.cover_image ?? undefined,
    ownerId: row.owner_id,
    admins: [],
    members: [],
    membersCount: row.members_count,
    postsCount: row.posts_count,
    privacy: (row.privacy as Group['privacy']) ?? 'public',
    memberCanPost: row.member_can_post ?? true,
    memberCanInvite: row.member_can_invite ?? true,
    createdAt: row.created_at,
    isMember: false,
    ...extras,
  };
}

async function attachMembership(groups: GroupWithMembership[], userId?: string): Promise<GroupWithMembership[]> {
  if (!userId || !groups.length) return groups;
  const supabase = getSupabase();
  const ids = groups.map((g) => g._id);
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, role')
    .eq('user_id', userId)
    .in('group_id', ids);
  if (error) throw new Error(error.message);

  const map = new Map((data ?? []).map((m: { group_id: string; role: string }) => [m.group_id, m.role]));
  return groups.map((g) => {
    const role = map.get(g._id) as GroupMemberRole | undefined;
    return { ...g, isMember: !!role, myRole: role, members: role ? [userId] : [] };
  });
}

export async function getDiscoverGroups(userId?: string): Promise<GroupWithMembership[]> {
  assertSupabaseConfigured();
  const { data, error } = await getSupabase()
    .from('groups')
    .select('*')
    .eq('privacy', 'public')
    .order('members_count', { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return attachMembership((data as GroupRow[]).map((r) => mapGroup(r)), userId);
}

export async function getMyGroups(userId: string): Promise<GroupWithMembership[]> {
  assertSupabaseConfigured();
  const { data: memberships, error: memErr } = await getSupabase()
    .from('group_members')
    .select('group_id, role')
    .eq('user_id', userId);
  if (memErr) throw new Error(memErr.message);

  const ids = (memberships ?? []).map((m: { group_id: string }) => m.group_id);
  if (!ids.length) return [];

  const roleMap = new Map(
    (memberships ?? []).map((m: { group_id: string; role: string }) => [m.group_id, m.role as GroupMemberRole])
  );

  const { data, error } = await getSupabase().from('groups').select('*').in('id', ids);
  if (error) throw new Error(error.message);

  return (data as GroupRow[]).map((r) =>
    mapGroup(r, { isMember: true, myRole: roleMap.get(r.id), members: [userId] })
  );
}

export async function getGroupById(groupId: string, userId?: string): Promise<GroupWithMembership | undefined> {
  assertSupabaseConfigured();
  const { data, error } = await getSupabase().from('groups').select('*').eq('id', groupId).single();
  if (error || !data) return undefined;
  const [withMem] = await attachMembership([mapGroup(data as GroupRow)], userId);
  return withMem;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  privacy?: 'public' | 'private';
  coverImageUri?: string;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  privacy?: 'public' | 'private';
  coverImageUri?: string;
  memberCanPost?: boolean;
  memberCanInvite?: boolean;
}

export async function createGroup(ownerId: string, input: CreateGroupInput): Promise<GroupWithMembership> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  let cover_image: string | null = null;
  if (input.coverImageUri) {
    const { uploadGroupImage } = await import('./storageService');
    cover_image = await uploadGroupImage(ownerId, input.coverImageUri);
  }

  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      name: input.name.trim(),
      description: (input.description ?? '').trim(),
      owner_id: ownerId,
      privacy: input.privacy ?? 'public',
      cover_image,
    })
    .select('*')
    .single();

  if (error || !group) throw new Error(error?.message ?? 'Không tạo được nhóm');

  const { error: memberErr } = await supabase.from('group_members').insert({
    group_id: group.id,
    user_id: ownerId,
    role: 'owner',
  });

  if (memberErr) {
    await supabase.from('groups').delete().eq('id', group.id);
    throw new Error(memberErr.message);
  }

  return mapGroup(group as GroupRow, { isMember: true, myRole: 'owner', members: [ownerId] });
}

export async function updateGroup(
  groupId: string,
  actorId: string,
  input: UpdateGroupInput
): Promise<GroupWithMembership> {
  assertSupabaseConfigured();
  const group = await getGroupById(groupId, actorId);
  if (!group || !canManageGroup(group, actorId)) {
    throw new Error('Bạn không có quyền chỉnh sửa nhóm');
  }

  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.description !== undefined) payload.description = input.description.trim();
  if (input.privacy !== undefined) payload.privacy = input.privacy;
  if (input.memberCanPost !== undefined) payload.member_can_post = input.memberCanPost;
  if (input.memberCanInvite !== undefined) payload.member_can_invite = input.memberCanInvite;

  if (input.coverImageUri) {
    const { uploadGroupImage } = await import('./storageService');
    payload.cover_image = await uploadGroupImage(actorId, input.coverImageUri);
  }

  const { data, error } = await getSupabase()
    .from('groups')
    .update(payload)
    .eq('id', groupId)
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Không cập nhật được nhóm');
  const [updated] = await attachMembership([mapGroup(data as GroupRow)], actorId);
  return updated;
}

export async function joinGroup(groupId: string, userId: string): Promise<GroupWithMembership> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from('group_members').insert({
      group_id: groupId,
      user_id: userId,
      role: 'member',
    });
    if (error) throw new Error(error.message);
  }

  const group = await getGroupById(groupId, userId);
  if (!group) throw new Error('Không tìm thấy nhóm');
  return group;
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  assertSupabaseConfigured();
  const group = await getGroupById(groupId, userId);
  if (group?.ownerId === userId) {
    throw new Error('Chủ nhóm không thể rời nhóm. Hãy chuyển quyền hoặc xóa nhóm.');
  }

  const { error } = await getSupabase()
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  assertSupabaseConfigured();
  const { data, error } = await getSupabase()
    .from('group_members')
    .select('user_id, role, joined_at, profiles!user_id (id, fullname, avatar)')
    .eq('group_id', groupId)
    .order('joined_at', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: Record<string, unknown>) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const p = profile as { id: string; fullname: string; avatar: string | null } | null;
    return {
      userId: row.user_id as string,
      role: row.role as GroupMemberRole,
      fullname: p?.fullname ?? 'Thành viên',
      avatar: p?.avatar ?? undefined,
      joinedAt: row.joined_at as string,
    };
  });
}

export async function removeGroupMember(groupId: string, actorId: string, memberId: string): Promise<void> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const { data: actor } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', actorId)
    .single();

  if (!actor || !['owner', 'admin'].includes(actor.role)) {
    throw new Error('Bạn không có quyền xóa thành viên');
  }

  const { data: target } = await supabase
    .from('group_members')
    .select('role')
    .eq('group_id', groupId)
    .eq('user_id', memberId)
    .single();

  if (target?.role === 'owner') throw new Error('Không thể xóa chủ nhóm');

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', memberId);

  if (error) throw new Error(error.message);
}

export async function getOrCreateGroupConversation(groupId: string): Promise<string> {
  assertSupabaseConfigured();
  const { data, error } = await getSupabase().rpc('create_group_conversation', { p_group_id: groupId });
  if (error) throw new Error(error.message);
  return data as string;
}

export function canManageGroup(group: GroupWithMembership | null, userId?: string): boolean {
  if (!group || !userId) return false;
  return group.ownerId === userId || group.myRole === 'admin' || group.myRole === 'owner';
}

export async function searchGroups(query: string, limit = 20): Promise<Group[]> {
  assertSupabaseConfigured();
  const term = query.trim();
  if (!term) return [];

  const { data, error } = await getSupabase()
    .from('groups')
    .select('*')
    .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
    .order('members_count', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data as GroupRow[]).map((r) => mapGroup(r));
}

export function formatMemberCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
