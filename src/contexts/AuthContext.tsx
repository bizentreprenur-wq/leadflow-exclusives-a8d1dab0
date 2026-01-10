import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { User, login as apiLogin, logout as apiLogout, register as apiRegister, getCurrentUser } from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fast auth check with timeout to prevent blocking
const AUTH_TIMEOUT_MS = 3000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Try to get cached user from localStorage for instant display
    try {
      const cached = localStorage.getItem('bamlead_user_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  const refreshUser = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
      
      const currentUser = await getCurrentUser();
      clearTimeout(timeoutId);
      
      setUser(currentUser);
      // Cache for faster next load
      if (currentUser) {
        localStorage.setItem('bamlead_user_cache', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('bamlead_user_cache');
      }
    } catch {
      // On timeout/error, keep cached user if available for smooth UX
      const cached = localStorage.getItem('bamlead_user_cache');
      if (!cached) {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    const initAuth = async () => {
      // If we have cached user, show UI immediately
      if (user) {
        setIsLoading(false);
        // Refresh in background
        refreshUser();
      } else {
        await refreshUser();
        setIsLoading(false);
      }
    };
    
    initAuth();
  }, [refreshUser, user]);

  const login = async (email: string, password: string) => {
    const response = await apiLogin({ email, password });
    setUser(response.user);
    localStorage.setItem('bamlead_user_cache', JSON.stringify(response.user));
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await apiRegister({ email, password, name });
    setUser(response.user);
    localStorage.setItem('bamlead_user_cache', JSON.stringify(response.user));
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    localStorage.removeItem('bamlead_user_cache');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
