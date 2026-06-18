import type { User, UserRole } from '../types/models';

export type AppRole = 'guest' | 'member' | 'vice_leader' | 'leader' | 'admin';

export type CommunityRole = 'member' | 'vice_leader' | 'leader';

export type Permission =
  | 'feed.read'
  | 'post.create'
  | 'post.edit_own'
  | 'post.delete_own'
  | 'post.delete_any'
  | 'recipe.create'
  | 'reel.create'
  | 'comment.create'
  | 'group.create'
  | 'group.moderate'
  | 'group.manage_members'
  | 'admin.moderate'
  | 'admin.ban'
  | 'chat.send'
  | 'profile.edit';

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  guest: ['feed.read'],
  member: [
    'feed.read',
    'post.create',
    'post.edit_own',
    'post.delete_own',
    'recipe.create',
    'reel.create',
    'comment.create',
    'group.create',
    'chat.send',
    'profile.edit',
  ],
  vice_leader: [
    'feed.read',
    'post.create',
    'post.edit_own',
    'post.delete_own',
    'post.delete_any',
    'recipe.create',
    'reel.create',
    'comment.create',
    'group.create',
    'group.moderate',
    'chat.send',
    'profile.edit',
  ],
  leader: [
    'feed.read',
    'post.create',
    'post.edit_own',
    'post.delete_own',
    'post.delete_any',
    'recipe.create',
    'reel.create',
    'comment.create',
    'group.create',
    'group.moderate',
    'group.manage_members',
    'chat.send',
    'profile.edit',
  ],
  admin: [
    'feed.read',
    'post.create',
    'post.edit_own',
    'post.delete_own',
    'post.delete_any',
    'recipe.create',
    'reel.create',
    'comment.create',
    'group.create',
    'group.moderate',
    'group.manage_members',
    'admin.moderate',
    'admin.ban',
    'chat.send',
    'profile.edit',
  ],
};

export function mapUserRole(role?: UserRole): AppRole {
  if (!role || role === 'user') return 'member';
  if (role === 'moderator') return 'vice_leader';
  if (role === 'admin') return 'admin';
  return 'member';
}

export function getAppRole(user: User | null | undefined): AppRole {
  if (!user) return 'guest';
  return mapUserRole(user.role);
}

export function hasPermission(
  user: User | null | undefined,
  permission: Permission,
  communityRole?: CommunityRole
): boolean {
  const appRole = getAppRole(user);
  if (ROLE_PERMISSIONS[appRole].includes(permission)) return true;

  if (communityRole === 'leader') {
    return ROLE_PERMISSIONS.leader.includes(permission);
  }
  if (communityRole === 'vice_leader') {
    return ROLE_PERMISSIONS.vice_leader.includes(permission);
  }
  return false;
}

export function canModerate(user: User | null | undefined): boolean {
  return hasPermission(user, 'admin.moderate') || hasPermission(user, 'group.moderate');
}

export function isAdmin(user: User | null | undefined): boolean {
  return getAppRole(user) === 'admin';
}
