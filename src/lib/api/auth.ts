import { AUTH_ENDPOINTS, apiRequest } from './config';

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

// Register a new user
export async function register(data: RegisterData): Promise<AuthResponse> {
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
