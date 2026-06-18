import type { User } from '../../types/models';

const AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1599566150163-291fa0b0d631?w=200&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&auto=format&fit=crop',
];

const BIOS = [
  'Đầu bếp gia đình | Món Việt mỗi ngày',
  'Food blogger Sài Gòn | Street food lover',
  'Chuyên gia meal prep & eat clean',
  'Nghiện phở & cà phê sáng',
  'Chia sẻ công thức nhanh cho người bận',
  'Bánh ngọt homemade | Workshop cuối tuần',
  'Huế xưa trong từng món ăn',
  'Grill master | BBQ & beer',
  'Trà sữa & dessert addict',
  'Vegan-friendly recipes',
  'Admin SnapChef | Ẩm thực cộng đồng',
  'Kiểm duyệt nội dung | Food safety',
  'Nhiếp ảnh món ăn',
  'Du lịch ẩm thực Đông Nam Á',
  'Học viên VAA | LT Mobile',
];

const NAMES = [
  'Lan Nguyễn',
  'Minh Trần',
  'Hương Lê',
  'Đức Phạm',
  'Thảo Võ',
  'Quỳnh Đặng',
  'Hải Huỳnh',
  'Anh Bùi',
  'Chi Ngô',
  'Bảo Đinh',
  'SnapChef Admin',
  'Mod Kiểm Duyệt',
  'Photo Foodie',
  'Travel Eats',
  'Fish VAA',
];

function makeUser(i: number, role: User['role'] = 'user'): User {
  const id = `demo-u${i + 1}`;
  const now = new Date().toISOString();
  return {
    _id: id,
    fullname: NAMES[i],
    email: `demo${i + 1}@snapchef.app`,
    avatar: AVATARS[i],
    bio: BIOS[i],
    role,
    followers: [],
    following: [],
    createdAt: now,
    updatedAt: now,
  };
}

export const MOCK_USERS: Record<string, User> = {
  u1: makeUser(0),
  u2: makeUser(1),
  u3: makeUser(2),
  u4: makeUser(3),
  u5: makeUser(4),
  u6: makeUser(5),
  u7: makeUser(6),
  u8: makeUser(7),
  u9: makeUser(8),
  u10: makeUser(9),
  u11: makeUser(10, 'admin'),
  u12: makeUser(11, 'moderator'),
  u13: makeUser(12),
  u14: makeUser(13),
  u15: makeUser(14),
};

export const MOCK_USER_LIST = Object.values(MOCK_USERS);
export const MOCK_CURRENT_USER = MOCK_USERS.u1;
