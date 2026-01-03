// API configuration for Hostinger backend
// Update this URL to match your Hostinger domain

// Detect if we're in development or production
const isDev = import.meta.env.DEV;

// Set to true to use mock data when backend is unavailable
export const USE_MOCK_AUTH = true; // Set to false once your Hostinger backend is configured

// API Base URL - Update this with your Hostinger domain
export const API_BASE_URL = isDev 
  ? 'http://localhost/bamlead-backend/api'  // Local development
  : 'https://yourdomain.com/api';            // Production - UPDATE THIS!

// Auth endpoints
export const AUTH_ENDPOINTS = {
  register: `${API_BASE_URL}/auth.php?action=register`,
  login: `${API_BASE_URL}/auth.php?action=login`,
  logout: `${API_BASE_URL}/auth.php?action=logout`,
  me: `${API_BASE_URL}/auth.php?action=me`,
  refresh: `${API_BASE_URL}/auth.php?action=refresh`,
};

// Admin endpoints
export const ADMIN_ENDPOINTS = {
  users: `${API_BASE_URL}/admin.php?action=users`,
  user: (id: number) => `${API_BASE_URL}/admin.php?action=user&id=${id}`,
  grantFree: `${API_BASE_URL}/admin.php?action=grant-free`,
  stats: `${API_BASE_URL}/admin.php?action=stats`,
};

// Search endpoints
export const SEARCH_ENDPOINTS = {
  gmb: `${API_BASE_URL}/gmb-search.php`,
  platform: `${API_BASE_URL}/platform-search.php`,
  verify: `${API_BASE_URL}/verify-lead.php`,
  analyze: `${API_BASE_URL}/analyze-website.php`,
};

// Helper to get auth headers
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

// Generic API request helper
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }

  return data;
}
