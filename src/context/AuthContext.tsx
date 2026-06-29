import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User } from '../types/models';
import * as authService from '../services/authService';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isBootstrapping: boolean;
  isSupabaseReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullname: string, email: string, password: string) => Promise<{ requiresOtp: boolean }>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const setStoreUser = useAuthStore((s) => s.setUser);

  const setUser = useCallback(
    (u: User | null) => {
      setUserState(u);
      setStoreUser(u);
    },
    [setStoreUser]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, [setUser]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsBootstrapping(false);
      return;
    }

    const BOOTSTRAP_MS = 12_000;
    const restoreWithTimeout = Promise.race([
      authService.restoreSession(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), BOOTSTRAP_MS)),
    ]);

    restoreWithTimeout
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => {
        setIsBootstrapping(false);
        useAuthStore.getState().setBootstrapping(false);
      });

    const supabase = getSupabase();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setUser(null);
        return;
      }
      try {
        const profile = await authService.getProfile();
        setUser(profile);
      } catch {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: u } = await authService.login(email, password);
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const register = useCallback(async (fullname: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await authService.register(fullname, email, password);
      if (!result.requiresOtp && result.payload) {
        setUser(result.payload.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const verifyOtp = useCallback(async (email: string, token: string) => {
    setIsLoading(true);
    try {
      const { user: u } = await authService.verifyOtp(email, token);
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const resetPassword = useCallback(async (email: string, token: string, newPassword: string) => {
    setIsLoading(true);
    try {
      const { user: u } = await authService.resetPasswordWithOtp(email, token, newPassword);
      setUser(u);
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const refreshProfile = useCallback(async () => {
    const u = await authService.getProfile();
    setUser(u);
  }, [setUser]);

  const loginWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const payload = await authService.signInWithGoogle();
      if (!payload) return false;
      setUser(payload.user);
      return true;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isBootstrapping,
      isSupabaseReady: isSupabaseConfigured,
      login,
      register,
      verifyOtp,
      resetPassword,
      logout,
      loginWithGoogle,
      refreshProfile,
      setUser,
    }),
    [user, isLoading, isBootstrapping, login, register, verifyOtp, resetPassword, logout, loginWithGoogle, refreshProfile, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
