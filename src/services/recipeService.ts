import { assertSupabaseConfigured } from '../lib/supabase';
import type { Post } from '../types/models';
import { getPostById } from './postService';
import * as savedPostRepository from '../repositories/savedPost.repository';

export async function toggleSaveRecipe(userId: string, postId: string): Promise<boolean> {
  assertSupabaseConfigured();
  const existing = await savedPostRepository.isSaved(userId, postId);

  if (existing) {
    await savedPostRepository.unsaveRecipe(userId, postId);
    return false;
  }

  await savedPostRepository.saveRecipe(userId, postId);
  return true;
}

export async function getSavedRecipes(userId: string): Promise<Post[]> {
  assertSupabaseConfigured();
  const data = await savedPostRepository.listSaved(userId);
  const posts: Post[] = [];
  for (const row of data ?? []) {
    const p = await getPostById(row.post_id as string, userId);
    if (p) posts.push({ ...p, isSaved: true });
  }
  return posts;
}

export async function isPostSaved(userId: string, postId: string): Promise<boolean> {
  assertSupabaseConfigured();
  return savedPostRepository.isSaved(userId, postId);
}
