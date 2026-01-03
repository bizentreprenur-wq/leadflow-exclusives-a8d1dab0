/**
 * Platform Search API Client
 * Connects to PHP backend on Hostinger
 * Falls back to mock data for testing
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
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

export async function searchPlatforms(
  service: string,
  location: string,
  platforms: string[]
): Promise<PlatformSearchResponse> {
  // Use mock data if no API URL is configured
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
    
    return {
      success: true,
      data: generateMockPlatformResults(service, location, platforms),
      query: { service, location, platforms },
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/platform-search.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ service, location, platforms }),
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
    console.error('Platform Search error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to search API',
    };
  }
}
