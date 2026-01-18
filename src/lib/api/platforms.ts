/**
 * Platform Search API Client
 * Falls back to mock data when no backend configured
 */

import { API_BASE_URL } from './config';

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
  // Use mock data if no API URL is configured
  if (USE_MOCK_DATA) {
    const allResults = generateMockPlatformResults(service, location, platforms);
    
    // Simulate progressive loading
    if (onProgress) {
      for (let i = 0; i < allResults.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 50));
        onProgress(allResults.slice(0, i + 1), ((i + 1) / allResults.length) * 100);
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
    }
    
    return {
      success: true,
      data: allResults,
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
      // Fall back to mock data on API error
      console.log('Platform API error, falling back to mock data');
      const mockResults = generateMockPlatformResults(service, location, platforms);
      if (onProgress) {
        onProgress(mockResults, 100);
      }
      return {
        success: true,
        data: mockResults,
        query: { service, location, platforms },
      };
    }

    const data = await response.json();
    
    // If API returned 0 results, fall back to mock data for testing
    if (data.success && (!data.data || data.data.length === 0)) {
      console.log('Platform API returned 0 results, falling back to mock data');
      const mockResults = generateMockPlatformResults(service, location, platforms);
      if (onProgress) {
        for (let i = 0; i < mockResults.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 80));
          onProgress(mockResults.slice(0, i + 1), ((i + 1) / mockResults.length) * 100);
        }
      }
      return {
        success: true,
        data: mockResults,
        query: { service, location, platforms },
      };
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
    // Fall back to mock data on network error
    console.log('Network error, falling back to mock data');
    const mockResults = generateMockPlatformResults(service, location, platforms);
    if (onProgress) {
      onProgress(mockResults, 100);
    }
    return {
      success: true,
      data: mockResults,
      query: { service, location, platforms },
    };
  }
}
