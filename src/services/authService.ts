import type { User } from '../types/models';
import { assertSupabaseConfigured, getSupabase, isSupabaseConfigured } from '../lib/supabase';
import * as authRepository from '../repositories/auth.repository';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

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
): Promise<{ requiresOtp: boolean; payload?: AuthPayload }> {
  assertSupabaseConfigured();
  const { data, error } = await authRepository.signUp(email, password, fullname);
  if (error) throw new Error(error.message);
  if (!data.session) {
    return { requiresOtp: true };
  }
  const profile = await authRepository.fetchProfileByUserId(data.user!.id);
  return { requiresOtp: false, payload: payloadFromSession(data.session, profile) };
}

export async function verifyOtp(email: string, token: string): Promise<AuthPayload> {
  assertSupabaseConfigured();
  const { data, error } = await getSupabase().auth.verifyOtp({ email, token, type: 'signup' });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error('Xác thực thất bại');
  const profile = await authRepository.fetchProfileByUserId(data.user!.id);
  return payloadFromSession(data.session, profile);
}

export async function resetPasswordWithOtp(email: string, token: string, newPassword: string): Promise<AuthPayload> {
  assertSupabaseConfigured();
  const { data, error } = await getSupabase().auth.verifyOtp({ email, token, type: 'recovery' });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error('Xác thực thất bại');
  
  const { error: updateError } = await getSupabase().auth.updateUser({ password: newPassword });
  if (updateError) throw new Error(updateError.message);
  
  const profile = await authRepository.fetchProfileByUserId(data.user!.id);
  return payloadFromSession(data.session, profile);
}

export async function login(email: string, password: string): Promise<AuthPayload> {
  assertSupabaseConfigured();
  const { data, error } = await authRepository.signInWithPassword(email, password);
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error('Đăng nhập thất bại');
  const profile = await authRepository.fetchProfileByUserId(data.user.id);
  return payloadFromSession(data.session, profile);
}

export async function getProfile(): Promise<User> {
  assertSupabaseConfigured();
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  if (!user) throw new Error('Chưa đăng nhập');
  return authRepository.fetchProfileByUserId(user.id);
}

export async function requestPasswordReset(email: string): Promise<void> {
  assertSupabaseConfigured();
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) throw new Error('Nhập email');
  await authRepository.requestPasswordReset(trimmed, makeRedirectUri({ path: 'reset-password' }));
}

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<AuthPayload | null> {
  assertSupabaseConfigured();
  const redirectTo = makeRedirectUri({ path: 'auth/callback' });
  const { data, error } = await getSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw new Error(error.message);
  if (!data.url) throw new Error('Không mở được đăng nhập Google');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) return null;

  const url = new URL(result.url);
  const code = url.searchParams.get('code');
  if (code) {
    const { data: sessionData, error: exchangeError } =
      await getSupabase().auth.exchangeCodeForSession(code);
    if (exchangeError) throw new Error(exchangeError.message);
    if (!sessionData.session?.user) return null;
    const profile = await authRepository.fetchProfileByUserId(sessionData.session.user.id);
    return payloadFromSession(sessionData.session, profile);
  }

  const { data: sessionData, error: sessionError } = await getSupabase().auth.getSession();
  if (sessionError) throw new Error(sessionError.message);
  if (!sessionData.session?.user) return null;
  const profile = await authRepository.fetchProfileByUserId(sessionData.session.user.id);
  return payloadFromSession(sessionData.session, profile);
}

export async function logout(): Promise<void> {
  assertSupabaseConfigured();
  await authRepository.signOut();
}

export async function restoreSession(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const session = await authRepository.getSession();
    if (!session?.user) return null;
    return await authRepository.fetchProfileByUserId(session.user.id);
  } catch {
    try {
      await authRepository.signOut();
    } catch {
      /* ignore */
    }
    return null;
  }
}
