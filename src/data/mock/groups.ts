import type { Group } from '../../types/models';
import { MOCK_USERS } from './users';

const COVERS = [
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800&auto=format&fit=crop',
];

const GROUP_DATA: Omit<Group, '_id' | 'ownerId' | 'admins' | 'members' | 'createdAt'>[] = [
  { name: 'Phở & Bún — Món Việt', description: 'Chia sẻ công thức phở, bún, mì từ Bắc vào Nam. Thảo luận nước dùng, topping và quán ngon.', coverImage: COVERS[0], privacy: 'public', postsCount: 128, membersCount: 2450 },
  { name: 'Eat Clean Việt Nam', description: 'Meal prep, salad, low-carb. Hỗ trợ nhau ăn healthy mà vẫn ngon.', coverImage: COVERS[1], privacy: 'public', postsCount: 89, membersCount: 1820 },
  { name: 'Bánh Ngọt Homemade', description: 'Flan, bánh bông lan, cookie, macaron. Workshop và tips nướng bánh.', coverImage: COVERS[2], privacy: 'public', postsCount: 156, membersCount: 3100 },
  { name: 'BBQ & Grill Masters', description: 'Gà nướng, sườn BBQ, lẩu nướng. Chia sẻ marinade và kỹ thuật nướng.', coverImage: COVERS[3], privacy: 'public', postsCount: 67, membersCount: 980 },
  { name: 'Trà Sữa & Dessert', description: 'Công thức trà sữa, trân châu, kem tự làm. Review quán trà sữa.', coverImage: COVERS[4], privacy: 'public', postsCount: 201, membersCount: 4200 },
  { name: 'Ẩm Thực Huế', description: 'Bún bò, cơm hến, bánh bèo, nem lụi. Giữ hồn xứ Huế.', coverImage: COVERS[5], privacy: 'public', postsCount: 74, membersCount: 1560 },
  { name: 'Street Food Sài Gòn', description: 'Bánh mì, hủ tiếu, bánh cuốn đường phố. Địa điểm ăn vặt Sài Gòn.', coverImage: COVERS[6], privacy: 'public', postsCount: 312, membersCount: 5600 },
  { name: 'Meal Prep Chủ Nhật', description: 'Chuẩn bị bữa ăn cả tuần trong 2 giờ. Tiết kiệm thời gian và tiền.', coverImage: COVERS[7], privacy: 'private', postsCount: 45, membersCount: 420 },
  { name: 'Vegan Việt', description: 'Món chay, vegan fusion Việt Nam. Thay thế nguyên liệu động vật.', coverImage: COVERS[8], privacy: 'public', postsCount: 58, membersCount: 890 },
  { name: 'SnapChef Cộng Đồng', description: 'Nhóm chính thức của SnapChef. Tin tức, sự kiện, feedback app.', coverImage: COVERS[9], privacy: 'public', postsCount: 24, membersCount: 1200 },
];

const OWNER_KEYS = ['u2', 'u3', 'u6', 'u8', 'u9', 'u7', 'u4', 'u5', 'u10', 'u11'];

export const MOCK_GROUPS: Group[] = GROUP_DATA.map((g, i) => {
  const owner = MOCK_USERS[OWNER_KEYS[i] as keyof typeof MOCK_USERS];
  const memberPool = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'].filter((k) => k !== OWNER_KEYS[i]);
  return {
    _id: `g${i + 1}`,
    ownerId: owner._id,
    admins: [owner._id],
    members: [owner._id, ...memberPool.slice(0, 4).map((k) => MOCK_USERS[k as keyof typeof MOCK_USERS]._id)],
    createdAt: new Date(Date.now() - (i + 1) * 86400000 * 7).toISOString(),
    ...g,
  };
});
