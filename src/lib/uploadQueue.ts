import { create } from 'zustand';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadPostImage } from '../services/storageService';
import { uploadReelVideo } from '../services/reelService';
import { createPost } from '../services/postService';
import { invalidateFeedQueries } from '../utils/invalidateFeed';

const QUEUE_KEY = 'snapchef_upload_queue';

export type UploadTaskType = 'image' | 'video' | 'recipe' | 'message';

export type UploadTaskStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';

export interface UploadTask {
  id: string;
  type: UploadTaskType;
  userId: string;
  localUri?: string;
  localUris?: string[];
  status: UploadTaskStatus;
  progress: number;
  resultUrl?: string;
  resultUrls?: string[];
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface UploadQueueState {
  tasks: UploadTask[];
  processing: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  enqueue: (task: Omit<UploadTask, 'status' | 'progress' | 'createdAt'>) => string;
  cancel: (taskId: string) => void;
  retry: (taskId: string) => void;
  processQueue: () => Promise<void>;
}

async function persistTasks(tasks: UploadTask[]) {
  const pending = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(pending));
}

async function executeTask(task: UploadTask): Promise<string> {
  if (task.type === 'video') {
    return uploadReelVideo(task.userId, task.localUri, (p) => {
      useUploadQueue.setState((s) => ({
        tasks: s.tasks.map((t) => (t.id === task.id ? { ...t, progress: p } : t)),
      }));
    });
  }
  
  let url = '';
  const urls: string[] = [];

  const updateProgress = (p: number) => {
    useUploadQueue.setState((s) => ({
      tasks: s.tasks.map((t) => (t.id === task.id ? { ...t, progress: p } : t)),
    }));
  };

  if (task.localUris && task.localUris.length > 0) {
    const total = task.localUris.length;
    const progressMap = new Array(total).fill(0);
    const uploadPromises = task.localUris.map((uri, index) =>
      uploadPostImage(task.userId, uri, (p) => {
        progressMap[index] = p;
        const overallProgress = progressMap.reduce((a, b) => a + b, 0) / total;
        updateProgress(overallProgress);
      })
    );
    const uploadedUrls = await Promise.all(uploadPromises);
    urls.push(...uploadedUrls);
  } else if (task.localUri) {
    url = await uploadPostImage(task.userId, task.localUri, updateProgress);
    urls.push(url);
  }

  if (task.metadata?.action === 'create_post') {
    await createPost(task.userId, {
      content: task.metadata.content as string,
      imageUris: urls,
      groupId: task.metadata.groupId as string | undefined,
      visibility: task.metadata.visibility as any,
      location: task.metadata.location as any,
    });
    invalidateFeedQueries();
  } else if (task.metadata?.action === 'create_recipe') {
    const { createRecipe } = await import('../services/postService');
    await createRecipe(task.userId, {
      title: task.metadata.title as string,
      description: task.metadata.description as string,
      category: task.metadata.category as string,
      ingredients: task.metadata.ingredients as string[],
      steps: task.metadata.steps as string[],
      cookTimeMinutes: task.metadata.cookTimeMinutes as number | undefined,
      imageUris: urls,
      groupId: task.metadata.groupId as string | undefined,
      location: task.metadata.location as any,
    });
    invalidateFeedQueries();
  }

  return url;
}

export const useUploadQueue = create<UploadQueueState>((set, get) => ({
  tasks: [],
  processing: false,
  hydrated: false,

  hydrate: async () => {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (raw) {
      try {
        const tasks = JSON.parse(raw) as UploadTask[];
        set({ tasks, hydrated: true });
        void get().processQueue();
        return;
      } catch {
        /* ignore */
      }
    }
    set({ hydrated: true });
  },

  enqueue: (input) => {
    const task: UploadTask = {
      ...input,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ tasks: [...s.tasks, task] }));
    void persistTasks(get().tasks);
    void get().processQueue();
    return task.id;
  },

  cancel: (taskId) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId && t.status !== 'uploading' ? { ...t, status: 'cancelled' } : t
      ),
    }));
    void persistTasks(get().tasks);
  },

  retry: (taskId) => {
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, status: 'pending', progress: 0, error: undefined } : t
      ),
    }));
    void persistTasks(get().tasks);
    void get().processQueue();
  },

  processQueue: async () => {
    const { processing, tasks } = get();
    if (processing) return;

    const next = tasks.find((t) => t.status === 'pending');
    if (!next) return;

    set({ processing: true });
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === next.id ? { ...t, status: 'uploading' } : t)),
    }));

    try {
      const url = await executeTask(next);
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === next.id ? { ...t, status: 'completed', progress: 100, resultUrl: url } : t
        ),
      }));
      if (next.metadata?.action === 'create_post' || next.metadata?.action === 'create_recipe') {
        Alert.alert('Thành công', 'Bài viết của bạn đã được đăng!');
      }
    } catch (err) {
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === next.id
            ? { ...t, status: 'failed', error: err instanceof Error ? err.message : 'Upload failed' }
            : t
        ),
      }));
      if (next.metadata?.action === 'create_post' || next.metadata?.action === 'create_recipe') {
        Alert.alert('Lỗi đăng bài', err instanceof Error ? err.message : 'Upload failed');
      }
    } finally {
      set({ processing: false });
      await persistTasks(get().tasks);
      void get().processQueue();
    }
  },
}));
