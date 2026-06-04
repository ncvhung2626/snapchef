import type { Group } from '../../types/models';

export const MOCK_GROUPS: Group[] = [
  {
    _id: 'g1',
    name: 'Eat Clean Vietnam',
    description: 'Cộng đồng ăn sạch, sống khỏe — chia sẻ công thức và động lực mỗi ngày.',
    ownerId: 'u1',
    admins: ['u1'],
    members: ['u1', 'u2', 'u3'],
    postsCount: 128,
    createdAt: '2024-06-01T00:00:00Z',
  },
  {
    _id: 'g2',
    name: 'Hội Mê Đồ Ngọt',
    description: '7 bài viết mới — thảo luận bánh, dessert và mẹo làm bếp.',
    ownerId: 'u2',
    admins: ['u2'],
    members: ['u1', 'u2'],
    postsCount: 45,
    createdAt: '2024-08-15T00:00:00Z',
  },
];
