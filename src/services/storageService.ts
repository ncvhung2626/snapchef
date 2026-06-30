import { getSupabase, assertSupabaseConfigured } from '../lib/supabase';
import { File } from 'expo-file-system';

export async function uploadPostImage(userId: string, localUri: string, onProgress?: (progress: number) => void): Promise<string> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  onProgress?.(10);
  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const file = new File(localUri);
  onProgress?.(30);
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(50);

  let currentProgress = 50;
  const progressInterval = setInterval(() => {
    if (currentProgress < 90) {
      currentProgress += Math.floor(Math.random() * 5) + 2; // Tăng ngẫu nhiên từ 2% đến 6%
      if (currentProgress > 90) currentProgress = 90;
      onProgress?.(currentProgress);
    }
  }, 300);

  let uploadError;
  try {
    const { error } = await supabase.storage.from('post-images').upload(path, arrayBuffer, {
      contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      upsert: false,
    });
    uploadError = error;
  } finally {
    clearInterval(progressInterval);
  }

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  onProgress?.(95);
  const { data } = supabase.storage.from('post-images').getPublicUrl(path);
  onProgress?.(100);
  return data.publicUrl;
}

export async function uploadGroupImage(userId: string, localUri: string, onProgress?: (progress: number) => void): Promise<string> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  onProgress?.(10);
  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const file = new File(localUri);
  onProgress?.(30);
  const arrayBuffer = await file.arrayBuffer();
  onProgress?.(50);

  let currentProgress = 50;
  const progressInterval = setInterval(() => {
    if (currentProgress < 90) {
      currentProgress += Math.floor(Math.random() * 5) + 2;
      if (currentProgress > 90) currentProgress = 90;
      onProgress?.(currentProgress);
    }
  }, 300);

  let uploadError;
  try {
    const { error } = await supabase.storage.from('group-images').upload(path, arrayBuffer, {
      contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      upsert: false,
    });
    uploadError = error;
  } finally {
    clearInterval(progressInterval);
  }

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  onProgress?.(95);
  const { data } = supabase.storage.from('group-images').getPublicUrl(path);
  onProgress?.(100);
  return data.publicUrl;
}
