/**
 * Social Media Contact Scraping API
 *
 * Powered by custom one-shot fetcher enrichment endpoint.
 */

import { SEARCH_ENDPOINTS, getAuthHeaders } from './config';

export interface SocialProfile {
  url: string;
  username?: string;
  title?: string;
  snippet?: string;
}

export interface SocialContactsResult {
  success: boolean;
  cached: boolean;
  business_name: string;
  location: string;
  contacts: {
    emails: string[];
    phones: string[];
    profiles: Record<string, SocialProfile>;
    sources: string[];
  };
  error?: string;
}

interface CustomEnrichResponse {
  success: boolean;
  emails?: string[];
  phones?: string[];
  profiles?: Record<string, SocialProfile>;
  sources?: string[];
  error?: string;
}

interface CustomEnrichBatchResponse {
  success: boolean;
  results?: Record<string, CustomEnrichResponse>;
}

function toSocialResult(businessName: string, location: string, data: CustomEnrichResponse): SocialContactsResult {
  return {
    success: !!data.success,
    cached: false,
    business_name: businessName,
    location,
    contacts: {
      emails: data.emails || [],
      phones: data.phones || [],
      profiles: (data.profiles || {}) as Record<string, SocialProfile>,
      sources: data.sources || [],
    },
    error: data.error,
  };
}

/**
 * Scrape social media profiles for a business using the custom enrichment endpoint.
 */
export async function scrapeSocialContacts(
  businessName: string,
  location?: string
): Promise<SocialContactsResult> {
  const response = await fetch(SEARCH_ENDPOINTS.customFetcherEnrich, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      url: '',
      business_name: businessName,
      location: location || '',
    }),
  });
  const data = (await response.json()) as CustomEnrichResponse;
  if (!response.ok) {
    return toSocialResult(businessName, location || '', {
      success: false,
      emails: [],
      phones: [],
      profiles: {},
      sources: [],
      error: data?.error || `HTTP ${response.status}`,
    });
  }
  return toSocialResult(businessName, location || '', data);
}

/**
 * Batch scrape social contacts for multiple businesses
 */
export async function scrapeSocialContactsBatch(
  businesses: Array<{ name: string; location?: string }>
): Promise<SocialContactsResult[]> {
  if (!businesses.length) return [];

  const response = await fetch(SEARCH_ENDPOINTS.customFetcherEnrich, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      businesses: businesses.map((b) => ({
        url: '',
        name: b.name,
        location: b.location || '',
      })),
    }),
  });

  const payload = (await response.json()) as CustomEnrichBatchResponse;
  const batchResults = payload.results || {};

  return businesses.map(b => {
    const key = b.name || '';
    const data = batchResults[key] || batchResults[b.name];
    if (data) {
      return toSocialResult(b.name, b.location || '', data);
    }
    return {
      success: false,
      cached: false,
      business_name: b.name,
      location: b.location || '',
      contacts: { emails: [], phones: [], profiles: {}, sources: [] },
      error: 'Not found in batch results',
    };
  });
}
