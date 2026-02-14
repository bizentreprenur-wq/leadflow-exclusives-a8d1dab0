/**
 * BamLead Hyper-Intelligence Scraper API v3
 * 
 * The fastest, most intelligent business contact discovery engine.
 * Proprietary to BamLead.com — features no other scraper has.
 */

import { API_BASE_URL, getAuthHeaders } from './config';

export interface ScrapeProfile {
  url: string;
  title?: string;
  snippet?: string;
}

export interface ContactConfidence {
  email?: string;
  phone?: string;
  confidence: number;
}

export interface PredictedEmail {
  email: string;
  confidence: number;
  type: 'predicted_role' | 'predicted_name' | 'role_address';
}

export interface DomainInfo {
  domain: string;
  tld: string;
  is_custom_domain: boolean;
  ssl: boolean;
  has_mx: boolean;
  mx_provider: string | null;
}

export interface ScraperIntelligence {
  business_type: string | null;
  tech_stack: string[];
  social_authority: number;
  contact_confidence: ContactConfidence[];
  predicted_emails: PredictedEmail[];
  domain_info: DomainInfo;
  structured_data: Record<string, unknown>[];
  og_metadata: Record<string, string>;
}

export interface BamleadScrapeResult {
  success: boolean;
  cached?: boolean;
  url?: string;
  emails: string[];
  phones: string[];
  profiles: Record<string, ScrapeProfile>;
  sources: string[];
  hasWebsite: boolean;
  intelligence: ScraperIntelligence | null;
  elapsed_ms?: number;
  error?: string;
}

export interface BamleadBatchResult {
  success: boolean;
  results: Record<string, BamleadScrapeResult>;
  count: number;
  elapsed_ms?: number;
}

const SCRAPER_ENDPOINT = `${API_BASE_URL}/bamlead-scraper.php`;
const SCRAPER_BATCH_LIMIT = 25;

function normalizeUrlKey(input?: string): string {
  const value = (input || '').trim();
  if (!value) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    const path = (url.pathname || '/').replace(/\/+$/, '') || '/';
    return `${host}${path === '/' ? '' : path}`;
  } catch {
    return value.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
  }
}

function buildResultLookup(
  backendResults: Record<string, BamleadScrapeResult>
): Record<string, BamleadScrapeResult> {
  const lookup: Record<string, BamleadScrapeResult> = {};
  for (const [key, result] of Object.entries(backendResults)) {
    lookup[key] = result;
    const normalizedKey = normalizeUrlKey(key);
    if (normalizedKey) lookup[normalizedKey] = result;
    if (result.url) {
      lookup[result.url] = result;
      const normalizedResultUrl = normalizeUrlKey(result.url);
      if (normalizedResultUrl) lookup[normalizedResultUrl] = result;
    }
  }
  return lookup;
}

/**
 * Scrape a single business for contacts + AI intelligence
 */
export async function bamleadScrape(
  url: string,
  businessName?: string,
  location?: string
): Promise<BamleadScrapeResult> {
  try {
    const response = await fetch(SCRAPER_ENDPOINT, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        url,
        business_name: businessName || '',
        location: location || '',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        emails: [],
        phones: [],
        profiles: {},
        sources: [],
        hasWebsite: false,
        intelligence: null,
        error: data.error || `HTTP ${response.status}`,
      };
    }

    return {
      success: data.success ?? false,
      cached: data.cached,
      url: data.url,
      emails: data.emails ?? [],
      phones: data.phones ?? [],
      profiles: data.profiles ?? {},
      sources: data.sources ?? [],
      hasWebsite: data.hasWebsite ?? false,
      intelligence: data.intelligence ?? null,
      elapsed_ms: data.elapsed_ms,
      error: data.error,
    };
  } catch (error) {
    console.error('[BamLead Scraper v3] Error:', error);
    return {
      success: false,
      emails: [],
      phones: [],
      profiles: {},
      sources: [],
      hasWebsite: false,
      intelligence: null,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Batch scrape multiple businesses (up to 25)
 */
export async function bamleadScrapeBatch(
  businesses: Array<{ url: string; name?: string; location?: string }>
): Promise<Record<string, BamleadScrapeResult>> {
  if (!businesses.length) return {};

  const allResults: Record<string, BamleadScrapeResult> = {};
  const chunks: Array<Array<{ url: string; name?: string; location?: string }>> = [];
  for (let i = 0; i < businesses.length; i += SCRAPER_BATCH_LIMIT) {
    chunks.push(businesses.slice(i, i + SCRAPER_BATCH_LIMIT));
  }

  for (const chunk of chunks) {
    try {
      const response = await fetch(SCRAPER_ENDPOINT, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          businesses: chunk.map((b) => ({
            url: b.url,
            name: b.name || '',
            location: b.location || '',
          })),
        }),
      });

      if (!response.ok) {
        console.error('[BamLead Scraper v3] Batch failed:', response.status);
        continue;
      }

      const data: BamleadBatchResult = await response.json();
      const batchResults = data.results ?? {};
      const lookup = buildResultLookup(batchResults);

      for (const biz of chunk) {
        const exactUrl = (biz.url || '').trim();
        const normalizedUrl = normalizeUrlKey(exactUrl);
        const nameKey = (biz.name || '').trim();
        const found =
          (exactUrl && (lookup[exactUrl] || lookup[normalizeUrlKey(exactUrl)])) ||
          (normalizedUrl && lookup[normalizedUrl]) ||
          (nameKey && lookup[nameKey]);
        if (!found) continue;

        if (exactUrl) {
          allResults[exactUrl] = found;
          const urlNorm = normalizeUrlKey(exactUrl);
          if (urlNorm) allResults[urlNorm] = found;
        }
        if (nameKey) {
          allResults[nameKey] = found;
        }
      }
    } catch (error) {
      console.error('[BamLead Scraper v3] Batch error:', error);
    }
  }

  return allResults;
}

/**
 * Batch scrape with concurrency control (processes in chunks)
 */
export async function bamleadScrapeSequential(
  businesses: Array<{ url: string; name?: string; location?: string }>,
  batchSize = 100,
  onProgress?: (completed: number, total: number) => void
): Promise<BamleadScrapeResult[]> {
  const results: BamleadScrapeResult[] = [];

  for (let i = 0; i < businesses.length; i += batchSize) {
    const batch = businesses.slice(i, i + batchSize);
    const batchResults = await bamleadScrapeBatch(batch);

    for (const biz of batch) {
      const key = biz.url || biz.name || '';
      results.push(
        batchResults[key] ?? {
          success: false,
          emails: [],
          phones: [],
          profiles: {},
          sources: [],
          hasWebsite: false,
          intelligence: null,
          error: 'Not found in batch results',
        }
      );
    }

    onProgress?.(Math.min(i + batchSize, businesses.length), businesses.length);

    // No delay — maximum throughput
  }

  return results;
}
