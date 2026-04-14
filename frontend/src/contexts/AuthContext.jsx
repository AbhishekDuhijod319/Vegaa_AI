import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/api/auth';
import { setAccessToken, clearAccessToken } from '@/api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // True until initial auth check completes

  const isAuthenticated = !!user;

  /**
   * On mount: try to restore session via refresh token cookie.
   * If the refresh token is valid, we get a new access token silently.
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const data = await authApi.refresh();
        setAccessToken(data.accessToken);
        setUser(data.user);
      } catch {
        // No valid refresh token — user is not logged in (expected)
        clearAccessToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for token expiry events from the API client
    const handleExpired = () => {
      clearAccessToken();
      setUser(null);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await authApi.login({ email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    const data = await authApi.register({ name, email, password });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const googleLogin = useCallback(async (googleAccessToken) => {
    const data = await authApi.googleLogin({ accessToken: googleAccessToken });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Logout might fail if the token is already expired — that's ok
    }
    clearAccessToken();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  const scheduleDeletion = useCallback(async () => {
    const data = await authApi.scheduleDeletion();
    // Update user state with deletion date
    setUser((prev) => prev ? { ...prev, deletionScheduledAt: data.deletionScheduledAt } : null);
    return data;
  }, []);

  const cancelDeletion = useCallback(async () => {
    await authApi.cancelDeletion();
    setUser((prev) => prev ? { ...prev, deletionScheduledAt: null } : null);
  }, []);

  const updateProfile = useCallback(async ({ name, email }) => {
    const data = await authApi.updateProfile({ name, email });
    setUser(data.user);
    return data;
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    googleLogin,
    logout,
    updateUser,
    updateProfile,
    scheduleDeletion,
    cancelDeletion,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
