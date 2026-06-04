import type { User, UserRole } from '../types/models';
import { assertSupabaseConfigured, getSupabase } from '../lib/supabase';
import { fetchUserProfile } from './profileService';

export interface AuthPayload {
  user: User;
  accessToken: string;
  refreshToken: string;
}

function payloadFromSession(
  session: { access_token: string; refresh_token: string },
  profile: User
): AuthPayload {
  return {
    user: profile,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
  };
}

export async function register(
  fullname: string,
  email: string,
  password: string
): Promise<AuthPayload> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { fullname } },
  });

  if (error) throw new Error(error.message);
  if (!data.session) {
    throw new Error(
      'Đăng ký thành công. Kiểm tra email xác nhận — hoặc tắt "Confirm email" trong Supabase Dashboard.'
    );
  }

  const profile = await fetchUserProfile(data.user!.id);
  return payloadFromSession(data.session, profile);
}

export async function login(email: string, password: string): Promise<AuthPayload> {
  assertSupabaseConfigured();
  const supabase = getSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error('Đăng nhập thất bại');

  const profile = await fetchUserProfile(data.user.id);
  return payloadFromSession(data.session, profile);
}

export async function getProfile(): Promise<User> {
  assertSupabaseConfigured();
  const supabase = getSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Chưa đăng nhập');
  return fetchUserProfile(user.id);
}

export async function logout(): Promise<void> {
  assertSupabaseConfigured();
  const { error } = await getSupabase().auth.signOut();
  if (error) throw new Error(error.message);
}

export async function restoreSession(): Promise<User | null> {
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL) return null;

  try {
    const supabase = getSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return null;
    return await fetchUserProfile(session.user.id);
  } catch {
    try {
      await getSupabase().auth.signOut();
    } catch {
      /* ignore */
    }
    return null;
  }
}
