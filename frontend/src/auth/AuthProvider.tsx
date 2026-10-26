import React, { useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { authService } from './auth.service';
import { AuthUser, LoginCredentials, SignupCredentials, AuthContextValue } from './auth.types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthLoading(true);
    try {
      const user = await authService.login(credentials);
      setCurrentUser(user);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    setAuthLoading(true);
    try {
      const user = await authService.signup(credentials);
      setCurrentUser(user);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthLoading(true);
    try {
      await authService.logout();
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await authService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (password: string, code?: string) => {
    await authService.resetPassword(password, code);
  }, []);

  const updateProfile = useCallback(async (profile: { displayName?: string; photoURL?: string }) => {
    await authService.updateProfile(profile);
  }, []);

  const getToken = useCallback(async () => {
    return authService.getToken();
  }, []);

  const value: AuthContextValue = {
    currentUser,
    authLoading,
    isAuthenticated: currentUser !== null,
    isFirebaseConfigured: authService.isConfigured(),
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
