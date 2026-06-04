import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_KEY = 'snapchef_access_token';
const REFRESH_KEY = 'snapchef_refresh_token';

const memory: { access: string | null; refresh: string | null } = {
  access: null,
  refresh: null,
};

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    if (key === ACCESS_KEY) memory.access = value;
    else memory.refresh = value;
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return key === ACCESS_KEY ? memory.access : memory.refresh;
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    if (key === ACCESS_KEY) memory.access = null;
    else memory.refresh = null;
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveTokens(accessToken: string, refreshToken: string) {
  await setItem(ACCESS_KEY, accessToken);
  await setItem(REFRESH_KEY, refreshToken);
}

export async function getAccessToken() {
  return getItem(ACCESS_KEY);
}

export async function getRefreshToken() {
  return getItem(REFRESH_KEY);
}

export async function clearTokens() {
  await deleteItem(ACCESS_KEY);
  await deleteItem(REFRESH_KEY);
}
