/**
 * Platform Search API Client
 * IMPORTANT: Never fabricate results. If the backend isn't configured or returns mock/demo data,
 * we throw so the UI can show a real failure.
 */

import { API_BASE_URL, getAuthHeaders } from './config';

const USE_MOCK_DATA = !API_BASE_URL;

export interface PlatformResult {
  id: string;
  name: string;
  url: string;
  snippet: string;
  displayLink: string;
  source: string;
  phone?: string;
  address?: string;
  websiteAnalysis: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
    loadTime?: number | null;
  };
}

export interface PlatformSearchResponse {
  success: boolean;
  data?: PlatformResult[];
  error?: string;
  query?: {
    service: string;
    location: string;
    platforms: string[];
  };
  cached?: boolean;
}

function isMockPlatformResult(r: PlatformResult): boolean {
  return (
    r.source === 'mock' ||
    r.id.startsWith('mock_') ||
    r.id.startsWith('mock-platform') ||
    r.id.startsWith('mock_platform_')
  );
}

// Callback for progressive loading
export type PlatformProgressCallback = (results: PlatformResult[], progress: number) => void;

export async function searchPlatforms(
  service: string,
  location: string,
  platforms: string[],
  onProgress?: PlatformProgressCallback,
  limit: number = 100
): Promise<PlatformSearchResponse> {
  // If there's no backend configured, do not fabricate dummy leads.
  if (USE_MOCK_DATA) {
    throw new Error('Platform search backend is not configured. Set VITE_API_URL or deploy /api.');
  }

  try {
    const endpoint = `${API_BASE_URL}/platform-search.php`;
    let response: Response;

    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ service, location, platforms, limit }),
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Failed to reach the platform search API.';
      throw new Error(
        `Platform search API is unreachable at "${endpoint}". ${message} ` +
          'Start the API server or update VITE_API_URL.',
      );
    }

    const rawBody = await response.text();
    let data: PlatformSearchResponse | null = null;
    try {
      data = rawBody ? (JSON.parse(rawBody) as PlatformSearchResponse) : null;
    } catch {
      const looksLikeHtml = /<\s*html|<!doctype html/i.test(rawBody);
      throw new Error(
        looksLikeHtml
          ? `Platform search returned HTML instead of JSON. ` +
              `Check that VITE_API_URL points to your PHP API (e.g., http://localhost:8000/api) and the server is running.`
          : `Platform search returned invalid JSON (${response.status}). Check server logs for PHP warnings.`,
      );
    }

    if (!response.ok) {
      const msg = data?.error || data?.message || `Platform search failed (${response.status})`;
      throw new Error(msg);
    }

    if (!data) {
      throw new Error('Platform search returned an empty response.');
    }

    // If backend returns mock/demo results, treat it as a hard failure.
    if (data?.success && Array.isArray(data?.data) && data.data.some(isMockPlatformResult)) {
      throw new Error(
        'Backend returned mock/demo platform results. This is disabled: deploy the updated /api/platform-search.php and ensure SERPAPI_KEY is configured.'
      );
    }
    
    // If API returned 0 results, surface it (no dummy leads)
    if (data.success && (!data.data || data.data.length === 0)) {
      throw new Error('Platform search returned 0 results. Try different platforms/keywords or verify API keys.');
    }
    
    // Progressive reveal for platform results
    if (onProgress && data.success && data.data) {
      const allResults = data.data;
      const batchSize = Math.max(2, Math.floor(allResults.length / 4));
      let loaded = 0;
      
      while (loaded < allResults.length) {
        loaded = Math.min(loaded + batchSize, allResults.length);
        onProgress(allResults.slice(0, loaded), (loaded / allResults.length) * 100);
        if (loaded < allResults.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('Platform Search error:', error);
    throw error;
  }
}
