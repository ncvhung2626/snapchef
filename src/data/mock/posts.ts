import type { Post } from '../../types/models';
import { MOCK_USERS } from './users';

const FOOD_IMAGES = [
  'https://images.unsplash.com/photo-1591814468924-caf87d1282aa?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555126634-323283e090f2?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1569058242567-93de6f492f5c?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598515214210-89f3b2d0cdba?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1625937286074-0fc416b3eda1?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1582878826629-29ae7d2b3be5?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1606491956689-2ea8668f88e2?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=800&auto=format&fit=crop',
];

const FEED_POSTS: Omit<Post, '_id' | 'author' | 'createdAt' | 'updatedAt'>[] = [
  { content: 'Sáng nay ghé quán phở quen, nước dùng trong veo, thơm quế hồi. Ai team phở bò tái nâu cho mình biết với!', hashtags: ['phobo', 'hanoi', 'breakfast'], likes: ['u2', 'u3', 'u5'], commentsCount: 42, shares: 8, images: [FOOD_IMAGES[0]], videos: [], visibility: 'public' },
  { content: 'Bún bò Huế chuẩn vị cố đô — cay nồng vừa phải, sả thơm lừng. Công thức nước lèo mình để ở bài recipe bên dưới nhé!', hashtags: ['bunbohue', 'hue', 'spicy'], likes: ['u1', 'u4', 'u7'], commentsCount: 38, shares: 12, images: [FOOD_IMAGES[1]], videos: [], visibility: 'public' },
  { content: 'Bánh mì chảo Sài Gòn — trứng ốp la, pate, xíu mại. Món ăn đường phố không bao giờ làm mình thất vọng.', hashtags: ['banhmichao', 'saigon', 'streetfood'], likes: ['u2', 'u6', 'u8', 'u9'], commentsCount: 56, shares: 15, images: [FOOD_IMAGES[2]], videos: [], visibility: 'public' },
  { content: 'Gà nướng mật ong da giòn — cả nhà khen hết lời. Marinade 4 tiếng là chuẩn nhất!', hashtags: ['chicken', 'honey', 'homemade'], likes: ['u3', 'u10'], commentsCount: 29, shares: 6, images: [FOOD_IMAGES[3]], videos: [], visibility: 'public' },
  { content: 'Cơm tấm sườn bì chả — đĩa đầy ú ụ cho ngày cuối tuần. Nước mắm pha chua ngọt là linh hồn.', hashtags: ['comtam', 'vietnamese', 'weekend'], likes: ['u1', 'u2', 'u4', 'u5'], commentsCount: 67, shares: 9, images: [FOOD_IMAGES[4]], videos: [], visibility: 'public' },
  { content: 'Trà sữa trân châu homemade — ít ngọt, trà đen đậm vị. Ai thích recipe comment nhé!', hashtags: ['trasua', 'bubbletea', 'diy'], likes: ['u6', 'u7', 'u8'], commentsCount: 91, shares: 22, images: [FOOD_IMAGES[5]], videos: [], visibility: 'public' },
  { content: 'Bánh flan caramel mềm tan — làm bằng lò hấp cách thủy, không bị rỗ. Dessert tối nay xong!', hashtags: ['flan', 'dessert', 'baking'], likes: ['u5', 'u9'], commentsCount: 34, shares: 4, images: [FOOD_IMAGES[6]], videos: [], visibility: 'public' },
  { content: 'Salad ức gà eat clean — bữa trưa 15 phút cho ngày bận. Vừa đủ chất không sợ béo.', hashtags: ['eatclean', 'salad', 'mealprep'], likes: ['u1', 'u10'], commentsCount: 18, shares: 3, images: [FOOD_IMAGES[10]], videos: [], visibility: 'public' },
  { content: 'Pasta carbonara kiểu Việt — thêm chút tiêu đen và phô mai Parmesan. Ngon không kém nhà hàng!', hashtags: ['pasta', 'italian', 'fusion'], likes: ['u3', 'u4'], commentsCount: 25, shares: 5, images: [FOOD_IMAGES[12]], videos: [], visibility: 'public' },
  { content: 'Lẩu thái chua cay cuối tuần — nhà đông người, nồi lẩu to đùng. Ai team hải sản vs bò?', hashtags: ['lauthai', 'hotpot', 'weekend'], likes: ['u2', 'u5', 'u6', 'u7'], commentsCount: 48, shares: 7, images: [FOOD_IMAGES[13]], videos: [], visibility: 'public' },
  { content: 'Bánh xèo miền Tây — vàng giòn, nhân tôm thịt đầy ắp. Rau sống ăn kèm không thể thiếu.', hashtags: ['banhxeo', 'mientay', 'crispy'], likes: ['u8', 'u9'], commentsCount: 31, shares: 4, images: [FOOD_IMAGES[14]], videos: [], visibility: 'public' },
  { content: 'Cháo lòng sáng sớm — nóng hổi, đủ topping. Món comfort food số 1 của mình.', hashtags: ['chaolong', 'breakfast', 'comfort'], likes: ['u4'], commentsCount: 22, shares: 2, images: [], videos: [], visibility: 'public' },
  { content: 'Gỏi cuốn tôm thịt — healthy, tươi mát. Nước chấm tương đen pha thêm đậu phộng.', hashtags: ['goicuon', 'healthy', 'fresh'], likes: ['u1', 'u3', 'u10'], commentsCount: 19, shares: 3, images: [FOOD_IMAGES[11]], videos: [], visibility: 'public' },
  { content: 'Bún chả Hà Nội — thịt nướng than hoa, nước mắm chua ngọt. Nhớ Hà Nội quá!', hashtags: ['buncha', 'hanoi', 'grill'], likes: ['u2', 'u7', 'u8'], commentsCount: 53, shares: 11, images: [FOOD_IMAGES[0]], videos: [], visibility: 'public' },
  { content: 'Cà phê sữa đá + bánh mì ốp la — combo sáng quốc dân. Ai cùng gu không?', hashtags: ['caphe', 'banhmi', 'morning'], likes: ['u5', 'u6', 'u9'], commentsCount: 44, shares: 6, images: [FOOD_IMAGES[2]], videos: [], visibility: 'public' },
];

const RECIPE_POSTS: Omit<Post, '_id' | 'author' | 'createdAt' | 'updatedAt'>[] = [
  { title: 'Phở bò Hà Nội', content: 'Nước dùng ninh xương bò 6 tiếng, gia vị quế hồi thảo quả. Bánh phở trần qua nước sôi.', hashtags: ['pho', 'recipe', 'beef'], likes: ['u2', 'u3'], commentsCount: 24, shares: 5, images: [FOOD_IMAGES[0]], videos: [], visibility: 'public', isRecipe: true, category: 'vietnamese', cookTimeMinutes: 360, ingredients: ['Xương bò', 'Bánh phở', 'Thịt bò tái', 'Hành lá', 'Ngò gai'], steps: ['Ninh nước dùng', 'Trần bánh phở', 'Thái thịt', 'Trình bày'] },
  { title: 'Bún bò Huế', content: 'Nước lèo cay nồng từ sả, ớt, mắm ruốc. Chả cua và giò heo ăn kèm.', hashtags: ['bunbo', 'hue', 'recipe'], likes: ['u1', 'u7'], commentsCount: 18, shares: 4, images: [FOOD_IMAGES[1]], videos: [], visibility: 'public', isRecipe: true, category: 'vietnamese', cookTimeMinutes: 240, ingredients: ['Bún', 'Sả', 'Ớt', 'Giò heo', 'Chả cua'], steps: ['Nấu nước lèo', 'Luộc giò heo', 'Chần bún', 'Thưởng thức'] },
  { title: 'Bánh mì chảo', content: 'Trứng ốp la, pate, xíu mại, đậu bắp. Nướng bánh mì giòn.', hashtags: ['banhmichao', 'recipe'], likes: ['u4', 'u5'], commentsCount: 32, shares: 8, images: [FOOD_IMAGES[2]], videos: [], visibility: 'public', isRecipe: true, category: 'streetfood', cookTimeMinutes: 20, ingredients: ['Bánh mì', 'Trứng', 'Pate', 'Xíu mại', 'Đậu bắp'], steps: ['Chiên trứng', 'Hâm pate', 'Xếp topping', 'Ăn nóng'] },
  { title: 'Gà nướng mật ong', content: 'Marinade mật ong, tỏi, nước tương. Nướng 200°C 35 phút.', hashtags: ['chicken', 'honey', 'recipe'], likes: ['u3'], commentsCount: 15, shares: 3, images: [FOOD_IMAGES[3]], videos: [], visibility: 'public', isRecipe: true, category: 'grill', cookTimeMinutes: 50, ingredients: ['Gà nguyên con', 'Mật ong', 'Tỏi', 'Nước tương'], steps: ['Ướp gà', 'Nướng', 'Phết mật ong', 'Nghỉ thịt'] },
  { title: 'Cơm tấm sườn', content: 'Sườn nướng, bì, chả trứng. Nước mắm pha chua ngọt.', hashtags: ['comtam', 'recipe'], likes: ['u2', 'u6'], commentsCount: 28, shares: 6, images: [FOOD_IMAGES[4]], videos: [], visibility: 'public', isRecipe: true, category: 'vietnamese', cookTimeMinutes: 45, ingredients: ['Cơm tấm', 'Sườn', 'Bì', 'Chả', 'Nước mắm'], steps: ['Nướng sườn', 'Chiên chả', 'Pha nước mắm', 'Dọn đĩa'] },
  { title: 'Trà sữa homemade', content: 'Trà đen đậm, sữa tươi, trân châu tự làm. Ít đường hơn quán.', hashtags: ['trasua', 'recipe', 'drink'], likes: ['u7', 'u8', 'u9'], commentsCount: 45, shares: 12, images: [FOOD_IMAGES[5]], videos: [], visibility: 'public', isRecipe: true, category: 'drinks', cookTimeMinutes: 30, ingredients: ['Trà đen', 'Sữa tươi', 'Bột năng', 'Đường'], steps: ['Pha trà', 'Làm trân châu', 'Pha trà sữa', 'Thêm đá'] },
  { title: 'Bánh flan caramel', content: 'Lò hấp cách thủy 40 phút. Caramel đường vàng óng.', hashtags: ['flan', 'dessert', 'recipe'], likes: ['u5', 'u10'], commentsCount: 21, shares: 4, images: [FOOD_IMAGES[6]], videos: [], visibility: 'public', isRecipe: true, category: 'dessert', cookTimeMinutes: 60, ingredients: ['Trứng', 'Sữa', 'Đường', 'Vanilla'], steps: ['Làm caramel', 'Đánh trứng', 'Hấp', 'Làm lạnh'] },
  { title: 'Gỏi cuốn tôm thịt', content: 'Bánh tráng cuốn tôm, thịt luộc, rau sống. Nước chấm tương đen.', hashtags: ['goicuon', 'recipe', 'healthy'], likes: ['u1'], commentsCount: 12, shares: 2, images: [FOOD_IMAGES[11]], videos: [], visibility: 'public', isRecipe: true, category: 'healthy', cookTimeMinutes: 25, ingredients: ['Bánh tráng', 'Tôm', 'Thịt ba chỉ', 'Rau sống'], steps: ['Luộc tôm thịt', 'Cuốn', 'Pha nước chấm', 'Dọn bàn'] },
  { title: 'Bún chả Hà Nội', content: 'Thịt nướng than, nước mắm pha chua ngọt, bún tươi.', hashtags: ['buncha', 'recipe', 'hanoi'], likes: ['u2', 'u4'], commentsCount: 36, shares: 7, images: [FOOD_IMAGES[0]], videos: [], visibility: 'public', isRecipe: true, category: 'vietnamese', cookTimeMinutes: 55, ingredients: ['Thịt ba chỉ', 'Bún', 'Nước mắm', 'Đường', 'Chanh'], steps: ['Ướp thịt', 'Nướng than', 'Pha nước chấm', 'Ăn kèm bún'] },
  { title: 'Salad ức gà', content: 'Ức gà áp chảo, rau xà lách, sốt yogurt.', hashtags: ['salad', 'eatclean', 'recipe'], likes: ['u3', 'u10'], commentsCount: 14, shares: 2, images: [FOOD_IMAGES[10]], videos: [], visibility: 'public', isRecipe: true, category: 'healthy', cookTimeMinutes: 15, ingredients: ['Ức gà', 'Xà lách', 'Cà chua', 'Yogurt'], steps: ['Áp chảo gà', 'Rửa rau', 'Pha sốt', 'Trộn'] },
  { title: 'Lẩu thái', content: 'Nước lẩu chua cay, hải sản tươi, nấm, rau.', hashtags: ['lauthai', 'hotpot', 'recipe'], likes: ['u6', 'u7'], commentsCount: 27, shares: 5, images: [FOOD_IMAGES[13]], videos: [], visibility: 'public', isRecipe: true, category: 'vietnamese', cookTimeMinutes: 40, ingredients: ['Nước lẩu thái', 'Tôm', 'Mực', 'Nấm', 'Rau'], steps: ['Nấu nước lẩu', 'Sơ chế', 'Nhúng lẩu', 'Thưởng thức'] },
  { title: 'Bánh xèo miền Tây', content: 'Bột nghệ vàng, nhân tôm thịt, rau sống.', hashtags: ['banhxeo', 'recipe', 'mientay'], likes: ['u8'], commentsCount: 19, shares: 3, images: [FOOD_IMAGES[14]], videos: [], visibility: 'public', isRecipe: true, category: 'vietnamese', cookTimeMinutes: 35, ingredients: ['Bột gạo', 'Nghệ', 'Tôm', 'Thịt', 'Giá'], steps: ['Pha bột', 'Chiên bánh', 'Xếp nhân', 'Cuốn rau'] },
  { title: 'Pasta carbonara', content: 'Trứng, pecorino, guanciale, tiêu đen.', hashtags: ['pasta', 'italian', 'recipe'], likes: ['u4', 'u9'], commentsCount: 16, shares: 4, images: [FOOD_IMAGES[12]], videos: [], visibility: 'public', isRecipe: true, category: 'western', cookTimeMinutes: 25, ingredients: ['Pasta', 'Trứng', 'Pecorino', 'Guanciale'], steps: ['Luộc pasta', 'Xào guanciale', 'Trộn sốt trứng', 'Hoàn thiện'] },
  { title: 'Cháo lòng', content: 'Lòng heo sạch, ninh nhừ, gia vị tiêu.', hashtags: ['chaolong', 'recipe'], likes: ['u5'], commentsCount: 11, shares: 1, images: [], videos: [], visibility: 'public', isRecipe: true, category: 'vietnamese', cookTimeMinutes: 120, ingredients: ['Gạo', 'Lòng heo', 'Tiêu', 'Hành'], steps: ['Sơ chế lòng', 'Ninh cháo', 'Nêm nếm', 'Thưởng thức'] },
  { title: 'Cà phê sữa đá', content: 'Phin phê, sữa đặc, đá viên.', hashtags: ['caphe', 'recipe', 'drink'], likes: ['u1', 'u6'], commentsCount: 33, shares: 6, images: [FOOD_IMAGES[2]], videos: [], visibility: 'public', isRecipe: true, category: 'drinks', cookTimeMinutes: 10, ingredients: ['Cà phê bột', 'Sữa đặc', 'Đá', 'Nước sôi'], steps: ['Ủ phin', 'Pha sữa', 'Thêm đá', 'Khuấy đều'] },
];

function buildPosts(
  items: typeof FEED_POSTS,
  prefix: string,
  userKeys: string[]
): Post[] {
  return items.map((item, i) => {
    const hoursAgo = (i + 1) * 3;
    const ts = new Date(Date.now() - hoursAgo * 3600000).toISOString();
    const authorKey = userKeys[i % userKeys.length];
    return {
      _id: `${prefix}${i + 1}`,
      author: MOCK_USERS[authorKey as keyof typeof MOCK_USERS],
      ...item,
      createdAt: ts,
      updatedAt: ts,
    };
  });
}

export const MOCK_FEED_POSTS = buildPosts(FEED_POSTS, 'fp', ['u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10', 'u1']);
export const MOCK_RECIPE_POSTS = buildPosts(RECIPE_POSTS, 'rp', ['u2', 'u4', 'u6', 'u8', 'u10', 'u3', 'u5', 'u7', 'u9', 'u1']);
export const MOCK_POSTS = [...MOCK_FEED_POSTS, ...MOCK_RECIPE_POSTS];
