import { useAuth } from '../../context/AuthContext';

/** Facade cho auth — dùng trong screen/hook mới. */
export function useAuthActions() {
  const auth = useAuth();
  return {
    user: auth.user,
    isLoading: auth.isLoading,
    isBootstrapping: auth.isBootstrapping,
    login: auth.login,
    register: auth.register,
    logout: auth.logout,
    loginWithGoogle: auth.loginWithGoogle,
    refreshProfile: auth.refreshProfile,
    setUser: auth.setUser,
    isSupabaseReady: auth.isSupabaseReady,
  };
}
