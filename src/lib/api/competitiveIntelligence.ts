import { API_BASE_URL, getAuthHeaders } from './config';
import { CompetitiveIntelligence, MyBusinessInfo } from '@/lib/types/competitiveIntelligence';

export interface UserProduct {
  name: string;
  description?: string;
  capabilities?: string[];
}

export interface CompetitiveIntelligenceResponse {
  success: boolean;
  data?: CompetitiveIntelligence;
  error?: string;
  generatedAt?: string;
}

/**
 * Generate competitive intelligence analysis
 * Includes: SWOT Analysis, Core Competencies, Market Positioning, Buyer Matching
 */
export async function generateCompetitiveIntelligence(
  searchQuery: string,
  searchLocation: string,
  leads: any[] = [],
  myBusiness?: MyBusinessInfo,
  userProduct?: UserProduct
): Promise<CompetitiveIntelligenceResponse> {
  if (!API_BASE_URL) {
    throw new Error('API not configured');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/competitive-intelligence.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        searchQuery,
        searchLocation,
        leads,
        myBusiness,
        userProduct,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Competitive Intelligence API] Error:', errorText);
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Competitive Intelligence API] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate competitive intelligence',
    };
  }
}

/**
 * Get cached competitive intelligence from session storage
 */
export function getCachedCompetitiveIntelligence(searchQuery: string): CompetitiveIntelligence | null {
  try {
    const key = `competitive_intel_${searchQuery.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = sessionStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.error('Failed to get cached competitive intelligence:', e);
  }
  return null;
}

/**
 * Cache competitive intelligence in session storage
 */
export function cacheCompetitiveIntelligence(searchQuery: string, data: CompetitiveIntelligence): void {
  try {
    const key = `competitive_intel_${searchQuery.toLowerCase().replace(/\s+/g, '_')}`;
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to cache competitive intelligence:', e);
  }
}
