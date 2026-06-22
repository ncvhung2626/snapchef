import { getSupabase, assertSupabaseConfigured } from '../lib/supabase';
import { File } from 'expo-file-system';

export async function uploadPostImage(userId: string, localUri: string, onProgress?: (progress: number) => void): Promise<string> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  onProgress?.(10);
  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const file = new File(localUri);
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(50);

  const { error } = await supabase.storage.from('post-images').upload(path, arrayBuffer, {
    contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from('post-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadGroupImage(userId: string, localUri: string, onProgress?: (progress: number) => void): Promise<string> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  onProgress?.(10);
  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const file = new File(localUri);
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(50);

  const { error } = await supabase.storage.from('group-images').upload(path, arrayBuffer, {
    contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from('group-images').getPublicUrl(path);
  return data.publicUrl;
}
