import { getSupabase, assertSupabaseConfigured } from '../lib/supabase';

export async function uploadPostImage(userId: string, localUri: string): Promise<string> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from('post-images').upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from('post-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadGroupImage(userId: string, localUri: string): Promise<string> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage.from('group-images').upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from('group-images').getPublicUrl(path);
  return data.publicUrl;
}
