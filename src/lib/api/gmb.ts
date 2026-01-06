/**
 * GMB Search API Client
 * Falls back to mock data when no backend configured
 */

import { API_BASE_URL } from './config';

// Set to true to use mock data for testing
const USE_MOCK_DATA = !API_BASE_URL;

export interface WebsiteAnalysis {
  hasWebsite: boolean;
  platform: string | null;
  needsUpgrade: boolean;
  issues: string[];
  mobileScore: number | null;
}

export interface LeadVerification {
  isVerified: boolean;
  verifiedAt?: string;
  contactValid?: boolean;
  businessActive?: boolean;
  lastChecked?: string;
}

export interface GMBResult {
  id: string;
  name: string;
  url: string;
  snippet: string;
  displayLink: string;
  phone?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
  websiteAnalysis: WebsiteAnalysis;
  verification?: LeadVerification;
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

// Mock data generator for testing
function generateMockResults(service: string, location: string): GMBResult[] {
  const prefixes = ['Best', 'Elite', 'Premier', 'Top', 'Pro', 'Expert', 'Quality', 'Reliable', 'Trusted', 'Certified'];
  const suffixes = ['Services', 'Solutions', 'Pros', 'Group', 'Co', 'Inc', 'LLC', 'Experts', 'Team', 'Masters'];
  
  const businessNames: string[] = [];
  for (let i = 0; i < 25; i++) {
    const prefix = prefixes[i % prefixes.length];
    const suffix = suffixes[Math.floor(i / prefixes.length) % suffixes.length];
    const cap = service.charAt(0).toUpperCase() + service.slice(1);
    businessNames.push(`${prefix} ${cap} ${suffix}`);
  }

  const platforms = ['WordPress', 'Wix', 'Squarespace', 'GoDaddy', 'Weebly', 'Custom/Unknown', null];
  
  const issueOptions = [
    'Not mobile responsive',
    'Missing meta description',
    'Outdated jQuery version',
    'Large page size (slow loading)',
    'Outdated HTML structure',
    'No SSL certificate',
    'Missing alt tags on images',
    'Slow server response',
  ];

  return businessNames.map((name, index) => {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const hasWebsite = Math.random() > 0.15;
    const issueCount = Math.floor(Math.random() * 4);
    const issues = hasWebsite 
      ? issueOptions.sort(() => Math.random() - 0.5).slice(0, issueCount)
      : ['No website found'];
    
    return {
      id: `mock_${index}_${Date.now()}`,
      name,
      url: hasWebsite ? `https://${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.com` : '',
      snippet: `Professional ${service} services in ${location}. We provide quality work with competitive pricing and excellent customer service. Call today for a free estimate!`,
      displayLink: hasWebsite ? `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.com` : '',
      phone: `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      address: `${Math.floor(Math.random() * 9000) + 1000} Main Street, ${location}`,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      reviewCount: Math.floor(Math.random() * 200) + 5,
      websiteAnalysis: {
        hasWebsite,
        platform: hasWebsite ? platform : null,
        needsUpgrade: !hasWebsite || issues.length >= 2 || platform === 'WordPress',
        issues,
        mobileScore: hasWebsite ? Math.floor(Math.random() * 60) + 40 : null,
      },
      verification: {
        isVerified: false,
        contactValid: undefined,
        businessActive: undefined,
      },
    };
  });
}

export async function searchGMB(service: string, location: string): Promise<GMBSearchResponse> {
  // Use mock data if no API URL is configured
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));
    
    return {
      success: true,
      data: generateMockResults(service, location),
      query: { service, location },
    };
  }

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
