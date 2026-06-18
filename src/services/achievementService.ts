import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { getProfileStats } from './profileService';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

const ACHIEVEMENT_DEFS = [
  { id: 'first_recipe', title: 'Công thức đầu tiên', description: 'Đăng công thức đầu tiên', icon: 'book-open', target: 1 },
  { id: 'likes_50', title: '50 lượt thích', description: 'Nhận 50 lượt thích', icon: 'heart', target: 50 },
  { id: 'likes_100', title: '100 lượt thích', description: 'Nhận 100 lượt thích', icon: 'award', target: 100 },
  { id: 'top_contributor', title: 'Top Contributor', description: 'Đăng 10 bài viết', icon: 'star', target: 10 },
  { id: 'master_chef', title: 'Master Chef', description: 'Đăng 5 công thức', icon: 'zap', target: 5 },
  { id: 'recipe_expert', title: 'Recipe Expert', description: 'Lưu 10 công thức', icon: 'bookmark', target: 10 },
] as const;

async function getUserMetrics(userId: string) {
  const stats = await getProfileStats(userId);
  let recipeCount = 0;
  let totalLikes = 0;
  let savedCount = 0;

  if (isSupabaseConfigured) {
    const supabase = getSupabase();
    const [recipes, likes, saved] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId).not('title', 'is', null),
      supabase.from('post_likes').select('id', { count: 'exact', head: true }).in(
        'post_id',
        (await supabase.from('posts').select('id').eq('author_id', userId)).data?.map((p) => p.id) ?? []
      ),
      supabase.from('saved_recipes').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);
    recipeCount = recipes.count ?? 0;
    totalLikes = likes.count ?? 0;
    savedCount = saved.count ?? 0;
  }

  return {
    postsCount: stats.postsCount,
    recipeCount,
    totalLikes,
    savedCount,
    followersCount: stats.followersCount,
  };
}

export async function getUserAchievements(userId: string): Promise<Achievement[]> {
  const metrics = await getUserMetrics(userId);

  const progressMap: Record<string, number> = {
    first_recipe: metrics.recipeCount,
    likes_50: metrics.totalLikes,
    likes_100: metrics.totalLikes,
    top_contributor: metrics.postsCount,
    master_chef: metrics.recipeCount,
    recipe_expert: metrics.savedCount,
  };

  return ACHIEVEMENT_DEFS.map((def) => {
    const progress = progressMap[def.id] ?? 0;
    const unlocked = progress >= def.target;
    return {
      id: def.id,
      title: def.title,
      description: def.description,
      icon: def.icon,
      unlocked,
      progress,
      target: def.target,
      unlockedAt: unlocked ? new Date().toISOString() : undefined,
    };
  });
}
