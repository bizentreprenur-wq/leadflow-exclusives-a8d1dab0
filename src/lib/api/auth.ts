import { AUTH_ENDPOINTS, apiRequest, USE_MOCK_AUTH } from './config';

export interface User {
  id: number;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  subscription_status: 'free' | 'trial' | 'active' | 'expired' | 'cancelled';
  subscription_plan: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  is_owner: boolean;
  has_active_subscription: boolean;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
  token: string;
  expires_at: string;
  message?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Mock user for testing when backend is not available
const MOCK_STORAGE_KEY = 'mock_user';

function getMockUser(): User | null {
  const stored = localStorage.getItem(MOCK_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

function setMockUser(user: User | null) {
  if (user) {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem('auth_token', 'mock_token_' + user.id);
  } else {
    localStorage.removeItem(MOCK_STORAGE_KEY);
    localStorage.removeItem('auth_token');
  }
}

function createMockUser(email: string, name?: string, isAdmin = false): User {
  const isOwner = email === 'admin@bamlead.com';
  return {
    id: Math.floor(Math.random() * 10000),
    email,
    name: name || email.split('@')[0],
    role: isOwner || isAdmin ? 'admin' : 'user',
    subscription_status: isOwner ? 'active' : 'trial',
    subscription_plan: isOwner ? 'free_granted' : null,
    trial_ends_at: isOwner ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    subscription_ends_at: null,
    is_owner: isOwner,
    has_active_subscription: true,
    created_at: new Date().toISOString(),
  };
}

// Register a new user
export async function register(data: RegisterData): Promise<AuthResponse> {
  if (USE_MOCK_AUTH) {
    const user = createMockUser(data.email, data.name);
    setMockUser(user);
    return {
      success: true,
      user,
      token: 'mock_token_' + user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      message: 'Account created (mock mode)',
    };
  }

  const response = await apiRequest<AuthResponse>(AUTH_ENDPOINTS.register, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (response.token) {
    localStorage.setItem('auth_token', response.token);
  }
  
  return response;
}

// Login user
export async function login(data: LoginData): Promise<AuthResponse> {
  if (USE_MOCK_AUTH) {
    // Demo accounts for testing
    const isAdmin = data.email === 'admin@bamlead.com' && data.password === 'admin123';
    const isValidUser = data.password.length >= 6;
    
    if (!isValidUser && !isAdmin) {
      throw new Error('Invalid email or password');
    }
    
    const user = createMockUser(data.email, undefined, isAdmin);
    setMockUser(user);
    return {
      success: true,
      user,
      token: 'mock_token_' + user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  const response = await apiRequest<AuthResponse>(AUTH_ENDPOINTS.login, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (response.token) {
    localStorage.setItem('auth_token', response.token);
  }
  
  return response;
}

// Logout user
export async function logout(): Promise<void> {
  if (USE_MOCK_AUTH) {
    setMockUser(null);
    return;
  }

  try {
    await apiRequest(AUTH_ENDPOINTS.logout, {
      method: 'POST',
    });
  } finally {
    localStorage.removeItem('auth_token');
  }
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    return null;
  }

  if (USE_MOCK_AUTH) {
    return getMockUser();
  }
  
  try {
    const response = await apiRequest<{ success: boolean; user: User }>(AUTH_ENDPOINTS.me);
    return response.user;
  } catch {
    localStorage.removeItem('auth_token');
    return null;
  }
}

// Refresh session
export async function refreshSession(): Promise<{ token: string; expires_at: string } | null> {
  if (USE_MOCK_AUTH) {
    const user = getMockUser();
    if (user) {
      return {
        token: 'mock_token_' + user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    }
    return null;
  }

  try {
    const response = await apiRequest<{ success: boolean; token: string; expires_at: string }>(
      AUTH_ENDPOINTS.refresh,
      { method: 'POST' }
    );
    
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  } catch {
    return null;
  }
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('auth_token');
}
