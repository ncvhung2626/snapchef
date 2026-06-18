import { getSupabase } from '../lib/supabase';
import type { User } from '../types/models';
import { fetchUserProfile } from '../services/profileService';

export async function signInWithPassword(email: string, password: string) {
  return getSupabase().auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, fullname: string) {
  return getSupabase().auth.signUp({
    email,
    password,
    options: { data: { fullname } },
  });
}

export async function signOut() {
  return getSupabase().auth.signOut();
}

export async function getSession() {
  const { data, error } = await getSupabase().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function fetchProfileByUserId(userId: string): Promise<User> {
  return fetchUserProfile(userId);
}

export async function requestPasswordReset(email: string, redirectTo: string) {
  const { error } = await getSupabase().auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}
