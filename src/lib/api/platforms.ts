/**
 * Platform Search API Client
 * Falls back to mock data when no backend configured
 */

import { API_BASE_URL, getAuthHeaders } from './config';

// IMPORTANT:
// Demo/Mock Auth is for logging into the UI in preview environments.
// It should NOT force dummy results if the real backend is reachable.
const USE_MOCK_DATA = !API_BASE_URL;

export interface PlatformResult {
  id: string;
  name: string;
  url: string;
  snippet: string;
  displayLink: string;
  source: string;
  phone?: string;
  address?: string;
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
  query?: {
    service: string;
    location: string;
    platforms: string[];
  };
  cached?: boolean;
}

// Mock data generator
function generateMockPlatformResults(service: string, location: string, platforms: string[]): PlatformResult[] {
  const businesses = [
    { name: `${location} ${service} Experts`, platform: 'WordPress' },
    { name: `Best ${service} Co`, platform: 'Wix' },
    { name: `Pro ${service} Services`, platform: 'Weebly' },
    { name: `${service} Masters LLC`, platform: 'GoDaddy' },
    { name: `Elite ${service} Group`, platform: 'Joomla' },
    { name: `Quality ${service} Inc`, platform: 'Custom PHP' },
    { name: `Premier ${service} Solutions`, platform: 'Squarespace' },
    { name: `${location} ${service} Pros`, platform: 'WordPress' },
  ];

  const issues = [
    'Not mobile responsive',
    'Missing meta description',
    'Outdated jQuery version',
    'Large page size',
    'Missing alt tags',
    'Tables used for layout',
    'Missing favicon',
  ];

  return businesses.map((biz, index) => {
    const domain = biz.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') + '.com';
    const issueCount = Math.floor(Math.random() * 4);
    const selectedIssues = issues.slice(0, issueCount);

    return {
      id: `mock_platform_${index}_${Date.now()}`,
      name: biz.name,
      url: `https://${domain}`,
      snippet: `Professional ${service} services in ${location}. Quality work, competitive prices.`,
      displayLink: domain,
      source: 'mock',
      phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      address: `${Math.floor(Math.random() * 9000) + 1000} Main St, ${location}`,
      websiteAnalysis: {
        hasWebsite: true,
        platform: biz.platform,
        needsUpgrade: issueCount >= 2 || ['WordPress', 'Wix', 'Weebly'].includes(biz.platform),
        issues: selectedIssues,
        mobileScore: Math.floor(Math.random() * 60) + 35,
        loadTime: Math.floor(Math.random() * 3700) + 800,
      },
    };
  });
}

// Callback for progressive loading
export type PlatformProgressCallback = (results: PlatformResult[], progress: number) => void;

export async function searchPlatforms(
  service: string,
  location: string,
  platforms: string[],
  onProgress?: PlatformProgressCallback
): Promise<PlatformSearchResponse> {
  // If there's no backend configured, do not fabricate dummy leads.
  if (USE_MOCK_DATA) {
    throw new Error('Platform search backend is not configured. Set VITE_API_URL or deploy /api.');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/platform-search.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ service, location, platforms }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let msg = `Platform search failed (${response.status})`;
      try {
        const parsed = errorText ? JSON.parse(errorText) : null;
        msg = parsed?.error || parsed?.message || msg;
      } catch {
        // ignore
      }
      throw new Error(msg);
    }

    const data = await response.json();
    
    // If API returned 0 results, surface it (no dummy leads)
    if (data.success && (!data.data || data.data.length === 0)) {
      throw new Error('Platform search returned 0 results. Try different platforms/keywords or verify API keys.');
    }
    
    // Progressive reveal for platform results
    if (onProgress && data.success && data.data) {
      const allResults = data.data;
      const batchSize = Math.max(2, Math.floor(allResults.length / 4));
      let loaded = 0;
      
      while (loaded < allResults.length) {
        loaded = Math.min(loaded + batchSize, allResults.length);
        onProgress(allResults.slice(0, loaded), (loaded / allResults.length) * 100);
        if (loaded < allResults.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
    
    return data;
  } catch (error) {
    console.error('Platform Search error:', error);
    throw error;
  }
}
