import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { uploadPostImage } from '../services/storageService';
import { uploadReelVideo } from '../services/reelService';

const QUEUE_KEY = 'snapchef_upload_queue';

export type UploadTaskType = 'image' | 'video' | 'recipe' | 'message';

export type UploadTaskStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';

export interface UploadTask {
  id: string;
  type: UploadTaskType;
  userId: string;
  localUri: string;
  status: UploadTaskStatus;
  progress: number;
  resultUrl?: string;
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
  return uploadPostImage(task.userId, task.localUri);
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
    } catch (err) {
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === next.id
            ? { ...t, status: 'failed', error: err instanceof Error ? err.message : 'Upload failed' }
            : t
        ),
      }));
    } finally {
      set({ processing: false });
      await persistTasks(get().tasks);
      void get().processQueue();
    }
  },
}));
