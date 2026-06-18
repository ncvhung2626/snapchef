import type { UserRole } from '../types/models';

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Thành viên',
  moderator: 'Kiểm duyệt',
  admin: 'Quản trị',
};

export function getRoleLabel(role?: UserRole): string {
  if (!role) return ROLE_LABELS.user;
  return ROLE_LABELS[role] ?? ROLE_LABELS.user;
}
