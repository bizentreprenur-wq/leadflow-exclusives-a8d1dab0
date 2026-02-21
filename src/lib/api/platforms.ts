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
  email?: string;
  phone?: string;
  address?: string;
  contactCompleteness?: 'full' | 'partial';
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
  message?: string;
  query?: {
    service: string;
    location: string;
    platforms: string[];
  };
  cached?: boolean;
  synonymsUsed?: string[];
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

/**
 * Search platforms using SSE streaming (preferred) with fallback to regular endpoint
 */
export async function searchPlatforms(
  service: string,
  location: string,
  platforms: string[],
  onProgress?: PlatformProgressCallback,
  limit: number = 100
): Promise<PlatformSearchResponse> {
  if (USE_MOCK_DATA) {
    throw new Error('Platform search backend is not configured. Set VITE_API_URL or deploy /api.');
  }

  // Try SSE streaming first
  try {
    return await searchPlatformsStreaming(service, location, platforms, onProgress, limit);
  } catch (streamError) {
    const err = streamError instanceof Error ? streamError : new Error(String(streamError));
    const message = (err.message || '').toLowerCase();
    const streamMissing = message.includes('404') || message.includes('not found');

    if (streamMissing) {
      console.warn('[Platform API] Streaming endpoint not found, falling back to regular endpoint');
      return await searchPlatformsRegular(service, location, platforms, onProgress, limit);
    }

    throw err;
  }
}

/**
 * SSE streaming search for platforms
 */
async function searchPlatformsStreaming(
  service: string,
  location: string,
  platforms: string[],
  onProgress?: PlatformProgressCallback,
  limit: number = 100
): Promise<PlatformSearchResponse> {
  console.log('[Platform API] Starting SSE streaming search');

  const allResults: PlatformResult[] = [];
  let synonymsUsed: string[] = [];

  return new Promise((resolve, reject) => {
    let settled = false;
    const controller = new AbortController();

    const finish = (response: PlatformSearchResponse) => {
      if (settled) return;
      settled = true;
      resolve(response);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const timeoutMs = limit <= 100 ? 180000 : limit <= 500 ? 480000 : 900000;
    const timeoutId = setTimeout(() => {
      controller.abort();
      fail(new Error(`Platform search timed out after ${Math.round(timeoutMs / 60000)} minutes.`));
    }, timeoutMs);

    fetch(`${API_BASE_URL}/platform-search-stream.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ service, location, platforms, limit }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `HTTP ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent: string | null = null;
        
        // Throttle onProgress to batch UI updates (fire at most every 300ms)
        let progressTimer: ReturnType<typeof setTimeout> | null = null;
        let lastProgress = 0;
        const flushProgress = () => {
          progressTimer = null;
          if (onProgress) onProgress([...allResults], lastProgress);
        };
        const throttledProgress = (progress: number) => {
          lastProgress = progress;
          if (!progressTimer) {
            progressTimer = setTimeout(flushProgress, 100);
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const rawLine of lines) {
            const line = rawLine.trimEnd();
            if (!line) { currentEvent = null; continue; }
            if (line.startsWith('event:')) { currentEvent = line.slice(6).trim(); continue; }
            if (line.startsWith('data:')) {
              const payload = line.slice(5).trim();
              if (!payload) { currentEvent = null; continue; }

              let data: any;
              try { data = JSON.parse(payload); } catch { continue; }

              const eventType = currentEvent || (data.leads ? 'results' : data.error ? 'error' : '');

              if (eventType === 'error') {
                clearTimeout(timeoutId);
                if (allResults.length > 0) {
                  finish({ success: true, data: allResults, error: data.error, query: { service, location, platforms } });
                } else {
                  fail(new Error(data.error || 'Search failed.'));
                }
                try { await reader.cancel(); } catch {}
                return;
              }

              if (eventType === 'start') {
                synonymsUsed = data.synonymsUsed || [];
              }

              if (eventType === 'results' || data.leads) {
                for (const lead of data.leads) {
                  if (isMockPlatformResult(lead)) {
                    clearTimeout(timeoutId);
                    try { await reader.cancel(); } catch {}
                    fail(new Error('Backend returned mock/demo platform results.'));
                    return;
                  }

                  const existing = allResults.find(r => r.id === lead.id);
                  if (!existing) {
                    allResults.push({
                      id: lead.id,
                      name: lead.name,
                      url: lead.url,
                      snippet: lead.snippet,
                      displayLink: lead.displayLink,
                      source: lead.source,
                      email: lead.email || undefined,
                      phone: lead.phone || undefined,
                      address: lead.address || undefined,
                      contactCompleteness: lead.contactCompleteness,
                      websiteAnalysis: lead.websiteAnalysis || {
                        hasWebsite: !!lead.url,
                        platform: null,
                        needsUpgrade: false,
                        issues: [],
                        mobileScore: null,
                      },
                    });
                  }
                }

                // Throttled — UI updates in bulk
                throttledProgress(data.progress || 0);
              }

              if (eventType === 'complete') {
                clearTimeout(timeoutId);
                if (progressTimer) { clearTimeout(progressTimer); progressTimer = null; }
                if (onProgress) onProgress([...allResults], 100);
                try { await reader.cancel(); } catch {}
                finish({
                  success: true,
                  data: allResults,
                  query: { service, location, platforms },
                  synonymsUsed,
                });
                return;
              }

              currentEvent = null;
            }
          }
        }

        clearTimeout(timeoutId);
        if (allResults.length === 0) {
          throw new Error('Platform search returned 0 results. Try different platforms/keywords or verify API keys.');
        }
        finish({ success: true, data: allResults, query: { service, location, platforms }, synonymsUsed });
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        if (error?.name === 'AbortError') {
          fail(new Error('Search timed out.'));
          return;
        }
        fail(error);
      });
  });
}

/**
 * Regular (non-streaming) fallback
 */
async function searchPlatformsRegular(
  service: string,
  location: string,
  platforms: string[],
  onProgress?: PlatformProgressCallback,
  limit: number = 100
): Promise<PlatformSearchResponse> {
  const endpoint = `${API_BASE_URL}/platform-search.php`;
  const timeoutMs = limit <= 100 ? 180000 : limit <= 500 ? 480000 : 900000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ service, location, platforms, limit }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Platform search timed out after ${Math.round(timeoutMs / 60000)} minutes.`);
    }
    throw new Error(`Platform search API is unreachable at "${endpoint}".`);
  }

  const rawBody = await response.text();
  let data: PlatformSearchResponse | null = null;
  try {
    data = rawBody ? (JSON.parse(rawBody) as PlatformSearchResponse) : null;
  } catch {
    throw new Error('Platform search returned invalid JSON.');
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || `Platform search failed (${response.status})`);
  }
  if (!data) throw new Error('Platform search returned an empty response.');

  if (data?.success && Array.isArray(data?.data) && data.data.some(isMockPlatformResult)) {
    throw new Error('Backend returned mock/demo platform results.');
  }

  if (data.success && (!data.data || data.data.length === 0)) {
    throw new Error('Platform search returned 0 results.');
  }

  // Progressive reveal
  if (onProgress && data.success && data.data) {
    const allResults = data.data;
    const batchSize = Math.max(5, Math.floor(allResults.length / 3));
    let loaded = 0;
    while (loaded < allResults.length) {
      loaded = Math.min(loaded + batchSize, allResults.length);
      onProgress(allResults.slice(0, loaded), (loaded / allResults.length) * 100);
      if (loaded < allResults.length) {
        await new Promise(resolve => setTimeout(resolve, 25));
      }
    }
  }

  return data;
}
