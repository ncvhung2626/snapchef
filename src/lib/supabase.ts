import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { chunkedGetItem, chunkedRemoveItem, chunkedSetItem } from './chunkedSecureStore';

const memoryStore: Record<string, string> = {};

/** Session lớn: chunked SecureStore (Expo Go + APK, không cần AsyncStorage native). */
const SupabaseAuthStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') return memoryStore[key] ?? null;
    return chunkedGetItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      memoryStore[key] = value;
      return;
    }
    await chunkedSetItem(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      delete memoryStore[key];
      return;
    }
    await chunkedRemoveItem(key);
  },
};

/** Chấp nhận URL đầy đủ hoặc chỉ project ref (sxyjmynwwqzrgedybrai) */
export function normalizeSupabaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace(/\/$/, '');
  }
  if (!trimmed.includes('.')) {
    return `https://${trimmed}.supabase.co`;
  }
  return `https://${trimmed.replace(/^https?:\/\//, '')}`;
}

const supabaseUrl = normalizeSupabaseUrl(process.env.EXPO_PUBLIC_SUPABASE_URL ?? '');
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

const urlValid = /^https?:\/\/.+\..+/.test(supabaseUrl);

export const isSupabaseConfigured = Boolean(urlValid && supabaseAnonKey);

let _client: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Cấu hình Supabase không hợp lệ. Kiểm tra .env:\n' +
        'EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co\n' +
        'EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>'
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: SupabaseAuthStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

/** Client lazy — tránh crash khi URL chưa hợp lệ lúc import */
export function getSupabase(): SupabaseClient {
  if (!_client && isSupabaseConfigured) {
    _client = createSupabaseClient();
  }
  if (!_client) {
    throw new Error(
      'Supabase chưa cấu hình. Sửa file .env rồi chạy: npx expo start -c'
    );
  }
  return _client;
}

/** @deprecated Dùng getSupabase() — giữ để tương thích, chỉ gọi khi đã configured */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return Reflect.get(getSupabase() as object, prop);
  },
});

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Thiếu hoặc sai EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY trong .env'
    );
  }
}
