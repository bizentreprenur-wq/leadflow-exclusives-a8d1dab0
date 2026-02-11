/**
 * Social Media Contact Scraping API
 * 
 * Now powered by BamLead Unified Scraper for faster parallel results.
 * Legacy scrape-social-contacts.php is fully replaced.
 */

import { bamleadScrape, bamleadScrapeBatch, BamleadScrapeResult } from './bamleadScraper';

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

function toSocialResult(businessName: string, location: string, data: BamleadScrapeResult): SocialContactsResult {
  return {
    success: data.success,
    cached: data.cached ?? false,
    business_name: businessName,
    location,
    contacts: {
      emails: data.emails,
      phones: data.phones,
      profiles: data.profiles as Record<string, SocialProfile>,
      sources: data.sources,
    },
    error: data.error,
  };
}

/**
 * Scrape social media profiles for a business using BamLead Unified Scraper
 */
export async function scrapeSocialContacts(
  businessName: string,
  location?: string
): Promise<SocialContactsResult> {
  const result = await bamleadScrape('', businessName, location);
  return toSocialResult(businessName, location || '', result);
}

/**
 * Batch scrape social contacts for multiple businesses
 */
export async function scrapeSocialContactsBatch(
  businesses: Array<{ name: string; location?: string }>
): Promise<SocialContactsResult[]> {
  if (!businesses.length) return [];

  const batchResults = await bamleadScrapeBatch(
    businesses.map(b => ({ url: '', name: b.name, location: b.location }))
  );

  return businesses.map(b => {
    const key = b.name || '';
    const data = batchResults[key];
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
