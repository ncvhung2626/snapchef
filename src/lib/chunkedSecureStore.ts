import * as SecureStore from 'expo-secure-store';

/** SecureStore giới hạn ~2048 bytes/chunk — chia session Supabase thành nhiều phần. */
const CHUNK_SIZE = 1800;

export async function chunkedGetItem(key: string): Promise<string | null> {
  const meta = await SecureStore.getItemAsync(`${key}__meta`);
  if (!meta) {
    return SecureStore.getItemAsync(key);
  }
  const count = parseInt(meta, 10);
  if (!count || Number.isNaN(count)) return null;

  let value = '';
  for (let i = 0; i < count; i++) {
    const part = await SecureStore.getItemAsync(`${key}__${i}`);
    if (part == null) return null;
    value += part;
  }
  return value;
}

export async function chunkedSetItem(key: string, value: string): Promise<void> {
  await chunkedRemoveItem(key);

  if (value.length <= CHUNK_SIZE) {
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const count = Math.ceil(value.length / CHUNK_SIZE);
  await SecureStore.setItemAsync(`${key}__meta`, String(count));
  for (let i = 0; i < count; i++) {
    await SecureStore.setItemAsync(
      `${key}__${i}`,
      value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
    );
  }
}

export async function chunkedRemoveItem(key: string): Promise<void> {
  const meta = await SecureStore.getItemAsync(`${key}__meta`);
  if (meta) {
    const count = parseInt(meta, 10);
    for (let i = 0; i < count; i++) {
      await SecureStore.deleteItemAsync(`${key}__${i}`).catch(() => undefined);
    }
    await SecureStore.deleteItemAsync(`${key}__meta`).catch(() => undefined);
  }
  await SecureStore.deleteItemAsync(key).catch(() => undefined);
}
