// API configuration for backend
// Set VITE_API_URL environment variable to connect to your backend

// Mock auth is ONLY enabled in development.
// NEVER enable in production - this bypasses all server-side authentication.
//
// Note: Lovable preview environments cannot run the PHP backend locally, so we
// default to mock auth when running on a Lovable preview host. You can force
// real-backend behavior in dev by adding `?mockAuth=false` to the URL.
function isLovablePreviewHost(hostname: string): boolean {
  return hostname.endsWith('.lovable.app') || hostname.endsWith('.lovableproject.com');
}

function getMockAuthOverride(): 'true' | 'false' | null {
  try {
    if (typeof window === 'undefined') return null;
    const v = new URLSearchParams(window.location.search).get('mockAuth');
    return v === 'true' || v === 'false' ? v : null;
  } catch {
    return null;
  }
}

const mockAuthOverride = getMockAuthOverride();
const isLovableHost = (() => {
  try {
    if (typeof window === 'undefined') return false;
    return isLovablePreviewHost(window.location.hostname);
  } catch {
    return false;
  }
})();

export const USE_MOCK_AUTH =
  import.meta.env.DEV &&
  (mockAuthOverride === 'true' ||
    (mockAuthOverride !== 'false' &&
      (import.meta.env.VITE_ENABLE_MOCK_AUTH === 'true' || isLovableHost)));

// API Base URL
// If you want to point dev/staging somewhere else, set VITE_API_URL.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bamlead.com/api';

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

  const contentType = response.headers.get('content-type') || '';
  const rawBody = await response.text();

  let data: any = null;
  try {
    data = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    data = null;
  }

  // If we couldn't parse JSON, surface a helpful error (most commonly an HTML 404/500 page or PHP warnings)
  if (data === null) {
    const snippet = rawBody
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 220);

    throw new Error(
      `Backend response is not valid JSON (${response.status}) from ${url}. ` +
        `This usually means /api is missing or PHP is erroring. ` +
        `${snippet ? `Response starts with: "${snippet}"` : ''}`
    );
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${response.status})`);
  }

  // Extra safety: some hosts send JSON with wrong content-type; we accept it as long as it parses.
  if (!contentType.includes('application/json')) {
    // no-op
  }

  return data as T;
}
