import { getSupabase, assertSupabaseConfigured, isSupabaseConfigured } from '../lib/supabase';
import type { Group } from '../types/models';
import { MOCK_GROUPS } from '../data/mock';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
    createdAt: row.created_at,
    isMember: false,
    ...extras,
  };
}

async function attachMembership(
  groups: GroupWithMembership[],
  userId?: string
): Promise<GroupWithMembership[]> {
  if (!userId || !groups.length) return groups;
  const supabase = getSupabase();
  const ids = groups.map((g) => g._id);
  const { data } = await supabase
    .from('group_members')
    .select('group_id, role')
    .eq('user_id', userId)
    .in('group_id', ids);

  const map = new Map((data ?? []).map((m: { group_id: string; role: string }) => [m.group_id, m.role]));
  return groups.map((g) => {
    const role = map.get(g._id) as GroupMemberRole | undefined;
    return {
      ...g,
      isMember: !!role,
      myRole: role,
      members: role ? [userId] : [],
    };
  });
}

export async function getDiscoverGroups(userId?: string): Promise<GroupWithMembership[]> {
  if (!isSupabaseConfigured) {
    await delay(400);
    return MOCK_GROUPS.map((g) => ({
      ...g,
      isMember: userId ? g.members.includes(userId) : false,
    }));
  }
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('privacy', 'public')
      .order('members_count', { ascending: false })
      .limit(20);
    if (error) throw error;
    const groups = (data as GroupRow[]).map((r) => mapGroup(r));
    return attachMembership(groups, userId);
  } catch {
    await delay(300);
    return MOCK_GROUPS.map((g) => ({
      ...g,
      isMember: userId ? g.members.includes(userId) : false,
    }));
  }
}

export async function getMyGroups(userId: string): Promise<GroupWithMembership[]> {
  if (!isSupabaseConfigured) {
    await delay(400);
    return MOCK_GROUPS.filter((g) => g.members.includes(userId)).map((g) => ({
      ...g,
      isMember: true,
      myRole: g.ownerId === userId ? 'owner' : 'member',
    }));
  }
  try {
    const supabase = getSupabase();
    const { data: memberships, error: memErr } = await supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', userId);
    if (memErr) throw memErr;
    const ids = (memberships ?? []).map((m: { group_id: string }) => m.group_id);
    if (!ids.length) return [];

    const roleMap = new Map(
      (memberships ?? []).map((m: { group_id: string; role: string }) => [m.group_id, m.role as GroupMemberRole])
    );

    const { data, error } = await supabase.from('groups').select('*').in('id', ids);
    if (error) throw error;

    return (data as GroupRow[]).map((r) =>
      mapGroup(r, {
        isMember: true,
        myRole: roleMap.get(r.id),
        members: [userId],
      })
    );
  } catch {
    await delay(300);
    return MOCK_GROUPS.filter((g) => g.members.includes(userId)).map((g) => ({
      ...g,
      isMember: true,
    }));
  }
}

export async function getGroupById(
  groupId: string,
  userId?: string
): Promise<GroupWithMembership | undefined> {
  if (!isSupabaseConfigured) {
    await delay(300);
    const g = MOCK_GROUPS.find((x) => x._id === groupId);
    if (!g) return undefined;
    return {
      ...g,
      isMember: userId ? g.members.includes(userId) : false,
      myRole: g.ownerId === userId ? 'owner' : g.members.includes(userId ?? '') ? 'member' : undefined,
    };
  }
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('groups').select('*').eq('id', groupId).single();
    if (error || !data) return undefined;
    const group = mapGroup(data as GroupRow);
    const [withMem] = await attachMembership([group], userId);
    return withMem;
  } catch {
    const g = MOCK_GROUPS.find((x) => x._id === groupId);
    return g
      ? {
          ...g,
          isMember: userId ? g.members.includes(userId) : false,
        }
      : undefined;
  }
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  privacy?: 'public' | 'private';
  coverImageUri?: string;
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

  if (error || !group) {
    throw new Error(error?.message ?? 'Không tạo được nhóm');
  }

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
  const supabase = getSupabase();

  const group = await getGroupById(groupId, userId);
  if (group?.ownerId === userId) {
    throw new Error('Chủ nhóm không thể rời nhóm. Hãy chuyển quyền hoặc xóa nhóm.');
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  if (!isSupabaseConfigured) {
    await delay(300);
    const g = MOCK_GROUPS.find((x) => x._id === groupId);
    return (g?.members ?? []).map((id) => ({
      userId: id,
      role: id === g?.ownerId ? 'owner' : 'member',
      fullname: `Thành viên ${id.slice(0, 4)}`,
      joinedAt: new Date().toISOString(),
    }));
  }
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('group_members')
    .select(
      `
      user_id,
      role,
      joined_at,
      profiles!user_id (id, fullname, avatar)
    `
    )
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

export async function removeGroupMember(
  groupId: string,
  actorId: string,
  memberId: string
): Promise<void> {
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

  if (target?.role === 'owner') {
    throw new Error('Không thể xóa chủ nhóm');
  }

  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', memberId);

  if (error) throw new Error(error.message);
}

export function canManageGroup(group: GroupWithMembership | null, userId?: string): boolean {
  if (!group || !userId) return false;
  return group.ownerId === userId || group.myRole === 'admin' || group.myRole === 'owner';
}

export function formatMemberCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}
