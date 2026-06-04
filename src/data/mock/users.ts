import type { User } from '../../types/models';

export const MOCK_CURRENT_USER: User = {
  _id: 'u1',
  fullname: 'Đầu bếp Google',
  email: 'chef@snapchef.app',
  avatar: undefined,
  bio: '@gg_chef_24758 • Đăng nhập qua cổng Google Smart.',
  role: 'user',
  followers: ['u2', 'u3', 'u4'],
  following: ['u2'],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

export const MOCK_USERS: Record<string, User> = {
  u1: MOCK_CURRENT_USER,
  u2: {
    _id: 'u2',
    fullname: 'Linh Nguyen',
    email: 'linh@snapchef.app',
    role: 'user',
    followers: [],
    following: [],
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
  },
  u3: {
    _id: 'u3',
    fullname: 'Minh Chef',
    email: 'minh@snapchef.app',
    role: 'user',
    followers: [],
    following: [],
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
};
