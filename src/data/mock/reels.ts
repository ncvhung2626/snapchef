import type { Reel } from '../../types/models';
import { MOCK_USERS } from './users';

const VIDEO_SAMPLES = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
];

const THUMBNAILS = [
  'https://images.unsplash.com/photo-1591814468924-caf87d1282aa?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555126634-323283e090f2?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1569058242567-93de6f492f5c?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598515214210-89f3b2d0cdba?w=600&auto=format&fit=crop',
];

const CAPTIONS = [
  'Phở bò Hà Nội nóng hổi — nước dùng ninh 6 tiếng #phobo #hanoi #foodie',
  'Bún bò Huế cay nồng đúng chất cố đô #bunbo #hue #spicy',
  'Bánh mì chảo Sài Gòn — trứng chảy lòng #banhmichao #saigon',
  'Gà nướng mật ong da giòn tan #chicken #honey #grill',
  'Cơm tấm sườn bì chả đầy đủ topping #comtam #vietnamese',
  'Trà sữa trân châu homemade ít ngọt #trasua #bubbletea',
  'Bánh flan caramel mềm tan #flan #dessert #baking',
  'Salad ức gà eat clean 15 phút #eatclean #healthy',
  'Lẩu thái cuối tuần cùng nhà #lauthai #hotpot',
  'Bánh xèo vàng giòn miền Tây #banhxeo #mientay',
  'Gỏi cuốn tôm thịt tươi mát #goicuon #fresh',
  'Bún chả Hà Nội than hoa #buncha #streetfood',
  'Pasta carbonara sốt kem trứng #pasta #italian',
  'Cháo lòng sáng sớm nóng hổi #chaolong #breakfast',
  'Cà phê sữa đá + bánh mì ốp la #caphe #morning',
];

const USER_KEYS = ['u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10', 'u1', 'u2', 'u4', 'u6', 'u8', 'u3'];

export const MOCK_REELS: Reel[] = CAPTIONS.map((description, i) => {
  const user = MOCK_USERS[USER_KEYS[i] as keyof typeof MOCK_USERS];
  const hoursAgo = (i + 1) * 5;
  return {
    _id: `reel-${i + 1}`,
    authorId: user._id,
    authorName: user.fullname,
    authorHandle: user.fullname.toLowerCase().replace(/\s+/g, ''),
    authorAvatar: user.avatar,
    description,
    videoUrl: VIDEO_SAMPLES[i % VIDEO_SAMPLES.length],
    thumbnailUrl: THUMBNAILS[i % THUMBNAILS.length],
    likesCount: 120 + i * 47,
    commentsCount: 8 + (i % 12),
    savesCount: 15 + (i % 20),
    viewCount: 800 + i * 320,
    likedByMe: i % 4 === 0,
    savedByMe: i % 5 === 0,
    createdAt: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
  };
});
