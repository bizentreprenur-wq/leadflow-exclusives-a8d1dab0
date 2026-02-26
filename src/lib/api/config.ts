// API configuration for backend
// Set VITE_API_URL environment variable to connect to your backend

// Mock auth should never be enabled for your real production site.
// However, Lovable *preview* environments often run a production build where the
// PHP backend isn't available; for that sandbox we allow mock auth.
//
// You can always override with:
// - `?mockAuth=true`  (force mock)
// - `?mockAuth=false` (force real backend)
export function isLovablePreviewHost(hostname: string): boolean {
  // Preview URLs look like: id-preview--<uuid>.lovable.app
  // Published URLs look like: <project>.lovable.app
  if (hostname.startsWith('id-preview--')) return true;

  // Lovable sandbox preview environments use *.lovableproject.com
  // These are always preview/sandbox environments, never production
  if (hostname.endsWith('.lovableproject.com')) return true;

  return false;
}

// Demo/Mock auth is permanently disabled - always use real backend
export const USE_MOCK_AUTH = false;

// API Base URL
// If you want to point dev/staging somewhere else, set VITE_API_URL.
const rawApiBaseUrl = import.meta.env.VITE_API_URL;
const getDefaultApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${window.location.origin}/api`;
    }
  }
  return 'https://bamlead.com/api';
};
const resolvedApiBaseUrl = rawApiBaseUrl && rawApiBaseUrl.trim() ? rawApiBaseUrl : getDefaultApiBaseUrl();
const getProxyFriendlyBaseUrl = (value: string): string => {
  if (typeof window === 'undefined') return value;
  try {
    const parsed = new URL(value, window.location.origin);
    const isLocalApi =
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const isDifferentPort = parsed.port && parsed.port !== window.location.port;
    if (isLocalApi && isDifferentPort) {
      return `${window.location.origin}/api`;
    }
  } catch {
    // If URL parsing fails, keep the provided value
  }
  return value;
};
const normalizeApiBaseUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'https://bamlead.com/api';
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, '');
  }
  if (trimmed.startsWith('/')) {
    return trimmed.replace(/\/$/, '');
  }
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  return `${protocol}//${trimmed}`.replace(/\/$/, '');
};

export const API_BASE_URL = normalizeApiBaseUrl(getProxyFriendlyBaseUrl(resolvedApiBaseUrl));

// Log resolved API base URL on init so devs can quickly verify which backend they're hitting
console.log('[BamLead] API_BASE_URL resolved to:', API_BASE_URL);

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
  bamleadScraper: `${API_BASE_URL}/bamlead-scraper.php`,
  customFetcherEnrich: `${API_BASE_URL}/custom-fetcher-enrich.php`,
  socialSearchPreview: `${API_BASE_URL}/social-search-preview.php`,
};

// Helper to get auth headers
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  // In Demo Mode we may have a UI-only mock token. Never send it to the real backend.
  const shouldSendAuth = !!token && !USE_MOCK_AUTH && !token.startsWith('mock_token_');
  return {
    'Content-Type': 'application/json',
    ...(shouldSendAuth ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Generic API request helper
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    });
  } catch (err) {
    // Common in Lovable preview when the production backend blocks CORS preflight.
    const isNetworkError = err instanceof TypeError;
    const hint =
      'Cannot reach the backend API. This is usually caused by CORS/OPTIONS preflight being blocked or the /api server being down. ' +
      'If you are testing from a Lovable preview URL, make sure the API responds to OPTIONS with Access-Control-Allow-Origin for that origin.';

    throw new Error(isNetworkError ? `${hint} (URL: ${url})` : `Request failed (URL: ${url})`);
  }

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
