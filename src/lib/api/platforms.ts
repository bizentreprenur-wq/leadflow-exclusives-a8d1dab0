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
  website?: string;
  snippet: string;
  displayLink: string;
  source: string;
  email?: string;
  phone?: string;
  address?: string;
  rating?: number;
  reviews?: number;
  contactCompleteness?: 'full' | 'partial';
  enrichment?: any;
  enrichmentStatus?: string;
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

export interface PlatformSearchFilters {
  phoneOnly?: boolean;
  noWebsite?: boolean;
  notMobile?: boolean;
  outdated?: boolean;
  platformMode?: boolean;
  platforms?: string[];
}

export interface PlatformProgressMeta {
  locationCount?: number;
  variantCount?: number;
  estimatedQueries?: number;
  sourceLabel?: string;
  statusMessage?: string;
  phase?: string;
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
export type PlatformProgressCallback = (
  results: PlatformResult[],
  progress: number,
  meta?: PlatformProgressMeta
) => void;

/**
 * Search platforms using SSE streaming (preferred) with fallback to regular endpoint
 */
export async function searchPlatforms(
  service: string,
  location: string,
  platforms: string[],
  onProgress?: PlatformProgressCallback,
  limit: number = 100,
  filters?: PlatformSearchFilters
): Promise<PlatformSearchResponse> {
  if (USE_MOCK_DATA) {
    throw new Error('Platform search backend is not configured. Set VITE_API_URL or deploy /api.');
  }

  // Try SSE streaming first
  try {
    const streamResponse = await searchPlatformsStreaming(service, location, platforms, onProgress, limit, filters);
    if (streamResponse.success && Array.isArray(streamResponse.data)) {
      const streamCount = streamResponse.data.length;
      const minAcceptableCoverage = Math.max(20, Math.floor(limit * 0.4));
      if (streamCount === 0 || streamCount < minAcceptableCoverage) {
        console.warn(`[Platform API] Streaming returned ${streamCount}/${limit}; trying regular endpoint for better coverage`);
        const regularResponse = await searchPlatformsRegular(service, location, platforms, onProgress, limit, filters);
        const regularCount = regularResponse.success && Array.isArray(regularResponse.data) ? regularResponse.data.length : 0;
        if (regularCount > streamCount) {
          return regularResponse;
        }
      }
    }
    return streamResponse;
  } catch (streamError) {
    const err = streamError instanceof Error ? streamError : new Error(String(streamError));
    const message = (err.message || '').toLowerCase();
    const streamMissing = message.includes('404') || message.includes('not found');
    const streamZeroResults = message.includes('0 results');

    if (streamMissing || streamZeroResults) {
      console.warn('[Platform API] Streaming unavailable/empty, falling back to regular endpoint');
      return await searchPlatformsRegular(service, location, platforms, onProgress, limit, filters);
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
  limit: number = 100,
  filters?: PlatformSearchFilters
): Promise<PlatformSearchResponse> {
  console.log('[Platform API] Starting SSE streaming search');

  const allResults: PlatformResult[] = [];
  let synonymsUsed: string[] = [];
  let progressMeta: PlatformProgressMeta | undefined;

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

    const timeoutMs = limit <= 100 ? 120000 : limit <= 500 ? 300000 : 600000;
    const timeoutId = setTimeout(() => {
      controller.abort();
      fail(new Error(`Platform search timed out after ${Math.round(timeoutMs / 60000)} minutes.`));
    }, timeoutMs);

    fetch(`${API_BASE_URL}/platform-search-stream.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ service, location, platforms, limit, filters }),
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
        
        // Throttle onProgress to batch UI updates (fire at most every 200ms)
        let progressTimer: ReturnType<typeof setTimeout> | null = null;
        let lastProgress = 0;
        const flushProgress = () => {
          progressTimer = null;
          if (onProgress) onProgress([...allResults], lastProgress, progressMeta);
        };
        const throttledProgress = (progress: number, meta?: PlatformProgressMeta) => {
          lastProgress = progress;
          if (meta) {
            progressMeta = { ...(progressMeta || {}), ...meta };
          }
          if (!progressTimer) {
            progressTimer = setTimeout(flushProgress, 80);
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
                const sourceLabel = Array.isArray(data.sources) && data.sources.length > 0
                  ? data.sources.join(' + ')
                  : undefined;
                progressMeta = {
                  ...(progressMeta || {}),
                  sourceLabel,
                  statusMessage: data.query ? `Starting search: ${data.query}` : 'Starting search...',
                  phase: 'start',
                };
                if (onProgress) {
                  onProgress([...allResults], 0, progressMeta);
                }
              }

              if (eventType === 'status') {
                throttledProgress(data.progress ?? lastProgress, {
                  statusMessage: data.message || progressMeta?.statusMessage,
                  phase: data.phase || progressMeta?.phase,
                  sourceLabel: data.source || data.provider || progressMeta?.sourceLabel,
                  locationCount: data.locationCount ?? progressMeta?.locationCount,
                  variantCount: data.variantCount ?? progressMeta?.variantCount,
                  estimatedQueries: data.estimatedQueries ?? progressMeta?.estimatedQueries,
                });
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
                      website: lead.website || undefined,
                      snippet: lead.snippet,
                      displayLink: lead.displayLink,
                      source: lead.source,
                      email: lead.email || undefined,
                      phone: lead.phone || undefined,
                      address: lead.address || undefined,
                      rating: lead.rating,
                      reviews: lead.reviews,
                      contactCompleteness: lead.contactCompleteness,
                      enrichment: lead.enrichment,
                      enrichmentStatus: lead.enrichmentStatus,
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
                throttledProgress(data.progress || 0, {
                  sourceLabel: data.source || progressMeta?.sourceLabel,
                  statusMessage: data.message || progressMeta?.statusMessage,
                  phase: data.phase || progressMeta?.phase,
                });
              }

              if (eventType === 'complete') {
                clearTimeout(timeoutId);
                if (progressTimer) { clearTimeout(progressTimer); progressTimer = null; }
                if (onProgress) {
                  onProgress([...allResults], 100, {
                    ...(progressMeta || {}),
                    statusMessage: data.message || 'Search complete',
                    phase: 'complete',
                    sourceLabel: data.source || progressMeta?.sourceLabel,
                  });
                }
                try { await reader.cancel(); } catch {}
                if (allResults.length === 0) {
                  fail(new Error('Platform search returned 0 results. Try different platforms/keywords or verify API keys.'));
                  return;
                }
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
  limit: number = 100,
  filters?: PlatformSearchFilters
): Promise<PlatformSearchResponse> {
  const endpoint = `${API_BASE_URL}/platform-search.php`;
  const timeoutMs = limit <= 100 ? 180000 : limit <= 500 ? 480000 : 900000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  if (onProgress) {
    onProgress([], 2, {
      sourceLabel: 'Platform API',
      statusMessage: 'Starting fallback search...',
      phase: 'fallback',
    });
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ service, location, platforms, limit, filters }),
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

  // Zero-result queries are valid; callers can decide UX messaging.
  if (data.success && !Array.isArray(data.data)) {
    data.data = [];
  }
  if (onProgress && data.success && Array.isArray(data.data) && data.data.length === 0) {
    onProgress([], 100, {
      sourceLabel: 'Platform API',
      statusMessage: 'Search complete (no leads found)',
      phase: 'complete',
    });
  }

  // Progressive reveal
  if (onProgress && data.success && data.data) {
    const allResults = data.data;
    const batchSize = Math.max(5, Math.floor(allResults.length / 3));
    let loaded = 0;
    while (loaded < allResults.length) {
      loaded = Math.min(loaded + batchSize, allResults.length);
      onProgress(allResults.slice(0, loaded), (loaded / allResults.length) * 100, {
        sourceLabel: 'Platform API',
        statusMessage: 'Loading search results...',
        phase: 'results',
      });
      if (loaded < allResults.length) {
        await new Promise(resolve => setTimeout(resolve, 25));
      }
    }
  }

  return data;
}
