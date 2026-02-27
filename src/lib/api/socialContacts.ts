/**
 * Social Media Contact Scraping API
 *
 * Stub – custom fetcher enrichment has been removed.
 * These functions now return empty results since enrichment is disabled.
 * Contact data should come from the initial Serper search results instead.
 */

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

/**
 * Scrape social media profiles for a business.
 * Enrichment is disabled — returns empty results.
 */
export async function scrapeSocialContacts(
  businessName: string,
  location?: string
): Promise<SocialContactsResult> {
  return {
    success: false,
    cached: false,
    business_name: businessName,
    location: location || '',
    contacts: { emails: [], phones: [], profiles: {}, sources: [] },
    error: 'Enrichment is disabled',
  };
}

/**
 * Batch scrape social contacts — returns empty results (enrichment disabled).
 */
export async function scrapeSocialContactsBatch(
  businesses: Array<{ name: string; location?: string }>
): Promise<SocialContactsResult[]> {
  return businesses.map(b => ({
    success: false,
    cached: false,
    business_name: b.name,
    location: b.location || '',
    contacts: { emails: [], phones: [], profiles: {}, sources: [] },
    error: 'Enrichment is disabled',
  }));
}
