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
    // Use cached user ONLY if we also have a token.
    // This prevents redirect loops where cache exists but the session/token is gone.
    try {
      const hasToken = !!localStorage.getItem('auth_token');
      const cached = localStorage.getItem('bamlead_user_cache');

      if (!hasToken) {
        if (cached) localStorage.removeItem('bamlead_user_cache');
        return null;
      }

      if (cached) {
        const parsed = JSON.parse(cached);
        // Only use cached display info, not authorization data
        // Role/subscription status MUST be verified server-side
        return { ...parsed, _fromCache: true };
      }

      return null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  const hasToken = (() => {
    try {
      return !!localStorage.getItem('auth_token');
    } catch {
      return false;
    }
  })();

  const refreshUser = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
      
      const currentUser = await getCurrentUser();
      clearTimeout(timeoutId);
      
      setUser(currentUser);
      // Cache non-sensitive display data only
      if (currentUser) {
        // Don't cache role/subscription for security - always verify server-side
        const safeCache = {
          id: currentUser.id,
          email: currentUser.email,
          name: currentUser.name,
          // Authorization fields excluded from cache
        };
        localStorage.setItem('bamlead_user_cache', JSON.stringify(safeCache));
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
    // Cache only non-sensitive display fields - role/subscription MUST be verified server-side
    const safeCache = {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
    };
    localStorage.setItem('bamlead_user_cache', JSON.stringify(safeCache));
  };

  const register = async (email: string, password: string, name?: string) => {
    const response = await apiRegister({ email, password, name });
    setUser(response.user);
    // Cache only non-sensitive display fields - role/subscription MUST be verified server-side
    const safeCache = {
      id: response.user.id,
      email: response.user.email,
      name: response.user.name,
    };
    localStorage.setItem('bamlead_user_cache', JSON.stringify(safeCache));
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
        isAuthenticated: hasToken && !!user,
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
