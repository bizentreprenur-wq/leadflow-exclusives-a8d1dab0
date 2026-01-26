/**
 * GMB Search API Client
 * IMPORTANT: Never fabricate results. If the backend isn't configured or returns mock/demo data,
 * we throw so the UI can show a real failure.
 */

import { API_BASE_URL, USE_MOCK_AUTH, getAuthHeaders } from './config';

const USE_MOCK_DATA = !API_BASE_URL;

console.log('[GMB API] Config:', { API_BASE_URL, USE_MOCK_AUTH, USE_MOCK_DATA });

function summarizeHtmlError(text: string): string {
  if (!text) return '';
  const trimmed = text.trim();
  // If it's not HTML, return as-is (trimmed).
  if (!/[<][a-z!/]/i.test(trimmed)) return trimmed;

  const pick = (re: RegExp) => {
    const m = trimmed.match(re);
    return m?.[1] ? m[1].replace(/<[^>]*>/g, '').trim() : '';
  };

  const h2 = pick(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  const p = pick(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const title = pick(/<title[^>]*>([\s\S]*?)<\/title>/i);

  return (
    h2 ||
    p ||
    title ||
    'Server returned an error (non-JSON response).'
  );
}

export interface WebsiteAnalysis {
  hasWebsite: boolean;
  platform: string | null;
  needsUpgrade: boolean;
  issues: string[];
  mobileScore: number | null;
}

export interface LeadVerification {
  isVerified: boolean;
  verifiedAt?: string;
  contactValid?: boolean;
  businessActive?: boolean;
  lastChecked?: string;
}

export interface GMBResult {
  id: string;
  name: string;
  url: string;
  snippet: string;
  displayLink: string;
  email?: string;
  phone?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  websiteAnalysis: WebsiteAnalysis;
  verification?: LeadVerification;
}

export interface GMBSearchResponse {
  success: boolean;
  data?: GMBResult[];
  error?: string;
  query?: {
    service: string;
    location: string;
  };
}

function isMockLeadId(id: string | undefined): boolean {
  return !!id && id.startsWith('mock_');
}

// (Legacy) mock generator kept intentionally unused; we never fabricate leads.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function generateMockResults(service: string, location: string, count: number = 25): GMBResult[] {
  const prefixes = ['Best', 'Elite', 'Premier', 'Top', 'Pro', 'Expert', 'Quality', 'Reliable', 'Trusted', 'Certified', 
    'Advanced', 'Supreme', 'Master', 'Prime', 'First', 'Royal', 'Grand', 'Ultra', 'Mega', 'Alpha'];
  const suffixes = ['Services', 'Solutions', 'Pros', 'Group', 'Co', 'Inc', 'LLC', 'Experts', 'Team', 'Masters',
    'Associates', 'Partners', 'Specialists', 'Consultants', 'Agency', 'Network', 'Hub', 'Works', 'Labs', 'Studio'];
  const middles = ['', ' & Sons', ' Bros', ' Plus', ' Pro', ' Max', ' Elite', ' Prime', ' Express', ' Direct'];
  
  const businessNames: string[] = [];
  for (let i = 0; i < count; i++) {
    const prefix = prefixes[i % prefixes.length];
    const suffix = suffixes[Math.floor(i / prefixes.length) % suffixes.length];
    const middle = middles[Math.floor(i / (prefixes.length * suffixes.length)) % middles.length];
    const cap = service.charAt(0).toUpperCase() + service.slice(1);
    businessNames.push(`${prefix} ${cap}${middle} ${suffix}`);
  }

  const platforms = ['WordPress', 'Wix', 'Squarespace', 'GoDaddy', 'Weebly', 'Joomla', 'Drupal', 'Shopify', 'Custom/Unknown', null];
  
  const issueOptions = [
    'Not mobile responsive',
    'Missing meta description',
    'Outdated jQuery version',
    'Large page size (slow loading)',
    'Outdated HTML structure',
    'No SSL certificate',
    'Missing alt tags on images',
    'Slow server response',
    'Broken links detected',
    'Missing favicon',
    'No social media integration',
    'Poor Core Web Vitals',
  ];

  const streetNames = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Blvd', 'Elm St', 'Park Ave', 'Lake Dr', 'Hill Rd', 'River Way'];
  const areaCodes = ['212', '310', '415', '305', '702', '512', '404', '303', '206', '617'];

  return businessNames.map((name, index) => {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    // Make ~20% have no website (high value prospects)
    const hasWebsite = Math.random() > 0.20;
    const issueCount = Math.floor(Math.random() * 5);
    const issues = hasWebsite 
      ? issueOptions.sort(() => Math.random() - 0.5).slice(0, issueCount)
      : ['No website found'];
    
    const areaCode = areaCodes[index % areaCodes.length];
    const streetName = streetNames[index % streetNames.length];
    const streetNumber = Math.floor(Math.random() * 9000) + 100;
    
    return {
      id: `mock_${index}_${Date.now()}`,
      name,
      url: hasWebsite ? `https://${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.com` : '',
      snippet: `Professional ${service} services in ${location}. We provide quality work with competitive pricing and excellent customer service. Call today for a free estimate!`,
      displayLink: hasWebsite ? `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.com` : '',
      phone: `(${areaCode}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      address: `${streetNumber} ${streetName}, ${location}`,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      reviewCount: Math.floor(Math.random() * 500) + 5,
      websiteAnalysis: {
        hasWebsite,
        platform: hasWebsite ? platform : null,
        needsUpgrade: !hasWebsite || issues.length >= 2 || platform === 'WordPress' || platform === 'Joomla' || platform === 'Drupal',
        issues,
        mobileScore: hasWebsite ? Math.floor(Math.random() * 60) + 40 : null,
      },
      verification: {
        isVerified: false,
        contactValid: undefined,
        businessActive: undefined,
      },
    };
  });
}

// Callback for progressive loading
export type ProgressCallback = (results: GMBResult[], progress: number) => void;

/**
 * Search GMB using Server-Sent Events for true streaming
 */
export async function searchGMB(
  service: string, 
  location: string, 
  limit: number = 100,
  onProgress?: ProgressCallback
): Promise<GMBSearchResponse> {
  // If there's no backend configured, do not fabricate dummy leads.
  if (USE_MOCK_DATA) {
    throw new Error('GMB search backend is not configured. Set VITE_API_URL or deploy /api.');
  }

  // Prefer streaming endpoint to avoid server timeouts.
  // We only fall back to the regular endpoint in a very narrow case
  // (streaming endpoint missing + small limits).
  try {
    return await searchGMBStreaming(service, location, limit, onProgress);
  } catch (streamError) {
    const err = streamError instanceof Error ? streamError : new Error(String(streamError));
    console.warn('[GMB API] Streaming failed:', err);

    const message = (err.message || '').toLowerCase();
    const streamMissing = message.includes('404') || message.includes('not found');

    // Only fall back if streaming endpoint is missing AND the requested lead count is small.
    // Otherwise, fail explicitly (no fake results, and no slow fallback that times out).
    if (streamMissing && limit <= 50) {
      console.warn('[GMB API] Streaming endpoint appears missing; falling back to regular endpoint for small limit');
      return await searchGMBRegular(service, location, limit, onProgress);
    }

    throw err;
  }
}

/**
 * Streaming search using Server-Sent Events
 */
async function searchGMBStreaming(
  service: string,
  location: string,
  limit: number,
  onProgress?: ProgressCallback
): Promise<GMBSearchResponse> {
  console.log('[GMB API] Starting SSE streaming search');
  
  const allResults: GMBResult[] = [];
  
  return new Promise((resolve, reject) => {
    let settled = false;
    const controller = new AbortController();
    const finish = (response: GMBSearchResponse) => {
      if (settled) return;
      settled = true;
      resolve(response);
    };
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };
    const initialTimeoutId = setTimeout(() => {
      controller.abort();
      fail(new Error('Search timed out before streaming started.'));
    }, 30000); // 30s to receive headers / first bytes

    // Scale timeout based on limit - 2min for small, 60min for massive searches (50000 leads)
    const totalTimeoutMs = limit <= 100 ? 120000 : limit <= 500 ? 300000 : limit <= 2000 ? 600000 : limit <= 10000 ? 1800000 : 3600000;
    const timeoutId = setTimeout(() => {
      controller.abort();
      fail(new Error(`Stream timeout after ${Math.round(totalTimeoutMs / 60000)} minutes`));
    }, totalTimeoutMs);
    
    fetch(`${API_BASE_URL}/gmb-search-stream.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ service, location, limit }),
      signal: controller.signal,
    })
      .then(async (response) => {
        clearTimeout(initialTimeoutId);
        if (!response.ok) {
          const text = await response.text();
          const summarized = summarizeHtmlError(text);
          throw new Error(summarized || `HTTP ${response.status}`);
        }
        
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }
        
        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent: string | null = null;
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer
          
          for (const rawLine of lines) {
            const line = rawLine.trimEnd();
            if (!line) {
              currentEvent = null;
              continue;
            }
            if (line.startsWith('event:')) {
              currentEvent = line.slice(6).trim();
              continue;
            }
            if (line.startsWith('data:')) {
              try {
                const payload = line.slice(5).trim();
                if (!payload) {
                  currentEvent = null;
                  continue;
                }
                const data = JSON.parse(payload);
                const eventType = currentEvent || (data.leads ? 'results' : data.error ? 'error' : '');
                
                // Handle different event types
                if (eventType === 'results' || data.leads) {
                  // New batch of leads arrived
                  for (const lead of data.leads) {
                    if (isMockLeadId(lead?.id)) {
                      throw new Error(
                        'Backend returned mock/demo GMB leads. This is disabled: deploy the updated /api endpoints and ensure SERPAPI_KEY is configured.'
                      );
                    }
                    allResults.push({
                      id: lead.id,
                      name: lead.name,
                      url: lead.url,
                      snippet: lead.snippet,
                      displayLink: lead.displayLink,
                      phone: lead.phone,
                      address: lead.address,
                      rating: lead.rating,
                      reviewCount: lead.reviews,
                      websiteAnalysis: lead.websiteAnalysis || {
                        hasWebsite: !!lead.url,
                        platform: null,
                        needsUpgrade: !lead.url,
                        issues: lead.url ? [] : ['No website found'],
                        mobileScore: null
                      }
                    });
                  }
                  
                  // Call progress callback with accumulated results
                  if (onProgress) {
                    onProgress([...allResults], data.progress || 0);
                  }
                  
                  console.log(`[GMB API] Stream: ${allResults.length} leads, ${data.progress}%`);
                } else if (eventType === 'complete') {
                  if (onProgress) {
                    onProgress([...allResults], 100);
                  }
                  if (allResults.length === 0) {
                    throw new Error('No results received from stream');
                  }
                  try {
                    await reader.cancel();
                  } catch {
                    // Ignore cancel errors; stream is already done.
                  }
                  clearTimeout(timeoutId);
                  clearTimeout(initialTimeoutId);
                  finish({
                    success: true,
                    data: allResults,
                    query: { service, location }
                  });
                  return;
                } else if (eventType === 'error' || data.error) {
                  throw new Error(data.error);
                }
                currentEvent = null;
              } catch (parseError) {
                // Ignore JSON parse errors for partial data
                if (line.includes('"error"')) {
                  console.error('[GMB API] SSE parse error:', parseError);
                }
              }
            }
          }
        }
        
        clearTimeout(timeoutId);
        clearTimeout(initialTimeoutId);
        
        if (allResults.length === 0) {
          throw new Error('No results received from stream');
        }
        
        finish({
          success: true,
          data: allResults,
          query: { service, location }
        });
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        clearTimeout(initialTimeoutId);

        if (error?.name === 'AbortError') {
          fail(new Error('Search timed out — server did not start streaming.'));
          return;
        }

        fail(error);
      });
  });
}

/**
 * Regular non-streaming search (fallback)
 */
async function searchGMBRegular(
  service: string,
  location: string,
  limit: number,
  onProgress?: ProgressCallback
): Promise<GMBSearchResponse> {
  console.log('[GMB API] Using regular (non-streaming) search');
  
  const response = await fetch(`${API_BASE_URL}/gmb-search.php`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ service, location, limit }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[GMB API] Error response:', errorText);
    
    let errorMessage = `API returned ${response.status}: ${response.statusText}`;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      if (errorText) {
        errorMessage = summarizeHtmlError(errorText).slice(0, 200);
      }
    }
    
    throw new Error(errorMessage);
  }

  const data = await response.json();

  if (data?.success && Array.isArray(data?.data) && data.data.some((r: GMBResult) => isMockLeadId(r?.id))) {
    throw new Error(
      'Backend returned mock/demo GMB leads. This is disabled: deploy the updated /api endpoints and ensure SERPAPI_KEY is configured.'
    );
  }
  
  if (data.success && (!data.data || data.data.length === 0)) {
    throw new Error('Search returned 0 results. Verify SERPAPI_KEY is correct.');
  }
  
  // Simulate progressive reveal for non-streaming
  if (onProgress && data.success && data.data) {
    const allResults = data.data;
    const batchSize = Math.max(15, Math.floor(allResults.length / 4));
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
