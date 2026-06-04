import type { Post } from '../../types/models';
import { MOCK_USERS } from './users';

export const MOCK_POSTS: Post[] = [
  {
    _id: 'p1',
    author: MOCK_USERS.u2,
    content:
      'Bữa trưa salad ức gà cam thảo siêu tốc cho ngày bận rộn. Vừa đủ chất lại không sợ béo! 🥗✨ #eatclean #healthylifestyle',
    images: [
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
    ],
    videos: [],
    likes: ['u1', 'u3'],
    commentsCount: 12,
    shares: 3,
    hashtags: ['eatclean', 'healthylifestyle'],
    visibility: 'public',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    _id: 'p2',
    author: MOCK_USERS.u3,
    content:
      'Gợi ý thực đơn Detox 3 ngày cho anh em. Vừa ngon vừa khỏe, không hề khó ăn chút nào đâu nhé. 👇 #detox #mealprep',
    images: [
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop',
    ],
    videos: [],
    likes: ['u1'],
    commentsCount: 8,
    shares: 1,
    hashtags: ['detox', 'mealprep'],
    visibility: 'public',
    groupId: 'g1',
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    _id: 'p3',
    author: MOCK_USERS.u2,
    content: 'Công thức phở bò tái chuẩn vị Hà Nội — nước dùng ninh 6 tiếng. #pho #vietnamese',
    images: [],
    videos: [],
    likes: [],
    commentsCount: 24,
    shares: 5,
    hashtags: ['pho', 'vietnamese'],
    visibility: 'public',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
];
