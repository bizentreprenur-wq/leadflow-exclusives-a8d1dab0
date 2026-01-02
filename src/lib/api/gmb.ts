/**
 * GMB Search API Client
 * Connects to PHP backend on Hostinger
 */

// Update this with your Hostinger domain
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/api';

export interface WebsiteAnalysis {
  hasWebsite: boolean;
  platform: string | null;
  needsUpgrade: boolean;
  issues: string[];
  mobileScore: number | null;
}

export interface GMBResult {
  id: string;
  name: string;
  url: string;
  snippet: string;
  displayLink: string;
  websiteAnalysis: WebsiteAnalysis;
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

export async function searchGMB(service: string, location: string): Promise<GMBSearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/gmb-search.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ service, location }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Request failed with status ${response.status}`,
      };
    }

    return await response.json();
  } catch (error) {
    console.error('GMB Search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to search API',
    };
  }
}
