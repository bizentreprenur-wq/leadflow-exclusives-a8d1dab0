/**
 * Social Media Contact Scraping API
 * 
 * Scrapes public social media profiles for contact information
 * without logging into accounts - only reads publicly visible data.
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

/**
 * Scrape social media profiles for a business to find contact information
 * 
 * @param businessName - The business name to search for
 * @param location - Optional location to narrow down results
 * @returns Contact information found across social platforms
 */
export async function scrapeSocialContacts(
  businessName: string,
  location?: string
): Promise<SocialContactsResult> {
  try {
    const response = await fetch(SEARCH_ENDPOINTS.scrapeSocialContacts, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        business_name: businessName,
        location: location || '',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        cached: false,
        business_name: businessName,
        location: location || '',
        contacts: {
          emails: [],
          phones: [],
          profiles: {},
          sources: [],
        },
        error: data.error || 'Failed to scrape social contacts',
      };
    }

    return data as SocialContactsResult;
  } catch (error) {
    console.error('Social contacts scrape error:', error);
    return {
      success: false,
      cached: false,
      business_name: businessName,
      location: location || '',
      contacts: {
        emails: [],
        phones: [],
        profiles: {},
        sources: [],
      },
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

/**
 * Batch scrape social contacts for multiple businesses
 */
export async function scrapeSocialContactsBatch(
  businesses: Array<{ name: string; location?: string }>
): Promise<SocialContactsResult[]> {
  // Process in batches of 3 to avoid overwhelming the API
  const batchSize = 3;
  const results: SocialContactsResult[] = [];

  for (let i = 0; i < businesses.length; i += batchSize) {
    const batch = businesses.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((b) => scrapeSocialContacts(b.name, b.location))
    );
    results.push(...batchResults);

    // Small delay between batches
    if (i + batchSize < businesses.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}
