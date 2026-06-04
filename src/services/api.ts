import { Platform } from 'react-native';
import { getAccessToken } from './tokenStorage';

const DEFAULT_HOST =
  Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_HOST;

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const accessToken = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const json: ApiResponse<T> = await res.json().catch(() => ({}));

  if (res.status === 401 && retry && path !== '/auth/refresh-token') {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return apiFetch<T>(path, options, false);
    }
    onUnauthorized?.();
  }

  if (!res.ok || json.success === false) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }

  return json.data as T;
}

async function tryRefreshToken(): Promise<boolean> {
  const { getRefreshToken, saveTokens } = await import('./tokenStorage');
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const json: ApiResponse<{ accessToken: string }> = await res.json();
    if (!res.ok || !json.data?.accessToken) return false;
    await saveTokens(json.data.accessToken, refreshToken);
    return true;
  } catch {
    return false;
  }
}
