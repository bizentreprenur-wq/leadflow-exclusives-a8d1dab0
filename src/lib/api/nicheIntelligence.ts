import { API_BASE_URL, getAuthHeaders } from './config';
import { NicheIntelligence } from '@/lib/types/nicheIntelligence';

export interface NicheIntelligenceResponse {
  success: boolean;
  data?: NicheIntelligence;
  error?: string;
  generatedAt?: string;
}

/**
 * Generate comprehensive niche intelligence for a search
 * Includes: Trend Analysis, Market Dynamics, Standard Products/Services
 */
export async function generateNicheIntelligence(
  searchQuery: string,
  searchLocation: string,
  leads: any[] = []
): Promise<NicheIntelligenceResponse> {
  if (!API_BASE_URL) {
    throw new Error('API not configured');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/niche-intelligence.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        searchQuery,
        searchLocation,
        leads,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Niche Intelligence API] Error:', errorText);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Niche Intelligence API] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate niche intelligence',
    };
  }
}

/**
 * Get cached niche intelligence from session storage
 */
export function getCachedNicheIntelligence(searchQuery: string): NicheIntelligence | null {
  try {
    const key = `niche_intel_${searchQuery.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = sessionStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error('Failed to get cached niche intelligence:', e);
  }
  return null;
}

/**
 * Cache niche intelligence in session storage
 */
export function cacheNicheIntelligence(searchQuery: string, data: NicheIntelligence): void {
  try {
    const key = `niche_intel_${searchQuery.toLowerCase().replace(/\s+/g, '_')}`;
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to cache niche intelligence:', e);
  }
}
