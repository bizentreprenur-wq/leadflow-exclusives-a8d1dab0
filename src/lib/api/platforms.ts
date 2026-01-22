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
    const response = await fetch(`${API_BASE_URL}/platform-search.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ service, location, platforms, limit }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let msg = `Platform search failed (${response.status})`;
      try {
        const parsed = errorText ? JSON.parse(errorText) : null;
        msg = parsed?.error || parsed?.message || msg;
      } catch {
        // ignore
      }
      throw new Error(msg);
    }

    const data = await response.json();

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
