import { create } from 'zustand';
import type { User } from '../types/models';

interface AuthState {
  user: User | null;
  isBootstrapping: boolean;
  setUser: (user: User | null) => void;
  setBootstrapping: (value: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isBootstrapping: true,
  setUser: (user) => set({ user }),
  setBootstrapping: (isBootstrapping) => set({ isBootstrapping }),
  clear: () => set({ user: null }),
}));

export const selectUser = (s: AuthState) => s.user;
export const selectIsAuthenticated = (s: AuthState) => !!s.user;
