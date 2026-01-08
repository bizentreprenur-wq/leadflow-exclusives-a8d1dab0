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

// Mock data generator for testing - supports up to 1000 leads
function generateMockResults(service: string, location: string, count: number = 25): GMBResult[] {
  const prefixes = ['Best', 'Elite', 'Premier', 'Top', 'Pro', 'Expert', 'Quality', 'Reliable', 'Trusted', 'Certified', 
    'Advanced', 'Supreme', 'Master', 'Prime', 'First', 'Royal', 'Grand', 'Ultra', 'Mega', 'Alpha'];
  const suffixes = ['Services', 'Solutions', 'Pros', 'Group', 'Co', 'Inc', 'LLC', 'Experts', 'Team', 'Masters',
    'Associates', 'Partners', 'Specialists', 'Consultants', 'Agency', 'Network', 'Hub', 'Works', 'Labs', 'Studio'];
  const middles = ['', ' & Sons', ' Bros', ' Plus', ' Pro', ' Max', ' Elite', ' Prime', ' Express', ' Direct'];
  
  const businessNames: string[] = [];
  for (let i = 0; i < count; i++) {
    const prefix = prefixes[i % prefixes.length];
    const suffix = suffixes[Math.floor(i / prefixes.length) % suffixes.length];
    const middle = middles[Math.floor(i / (prefixes.length * suffixes.length)) % middles.length];
    const cap = service.charAt(0).toUpperCase() + service.slice(1);
    businessNames.push(`${prefix} ${cap}${middle} ${suffix}`);
  }

  const platforms = ['WordPress', 'Wix', 'Squarespace', 'GoDaddy', 'Weebly', 'Joomla', 'Drupal', 'Shopify', 'Custom/Unknown', null];
  
  const issueOptions = [
    'Not mobile responsive',
    'Missing meta description',
    'Outdated jQuery version',
    'Large page size (slow loading)',
    'Outdated HTML structure',
    'No SSL certificate',
    'Missing alt tags on images',
    'Slow server response',
    'Broken links detected',
    'Missing favicon',
    'No social media integration',
    'Poor Core Web Vitals',
  ];

  const streetNames = ['Main St', 'Oak Ave', 'Maple Dr', 'Cedar Ln', 'Pine Blvd', 'Elm St', 'Park Ave', 'Lake Dr', 'Hill Rd', 'River Way'];
  const areaCodes = ['212', '310', '415', '305', '702', '512', '404', '303', '206', '617'];

  return businessNames.map((name, index) => {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    // Make ~20% have no website (high value prospects)
    const hasWebsite = Math.random() > 0.20;
    const issueCount = Math.floor(Math.random() * 5);
    const issues = hasWebsite 
      ? issueOptions.sort(() => Math.random() - 0.5).slice(0, issueCount)
      : ['No website found'];
    
    const areaCode = areaCodes[index % areaCodes.length];
    const streetName = streetNames[index % streetNames.length];
    const streetNumber = Math.floor(Math.random() * 9000) + 100;
    
    return {
      id: `mock_${index}_${Date.now()}`,
      name,
      url: hasWebsite ? `https://${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.com` : '',
      snippet: `Professional ${service} services in ${location}. We provide quality work with competitive pricing and excellent customer service. Call today for a free estimate!`,
      displayLink: hasWebsite ? `${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.com` : '',
      phone: `(${areaCode}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      address: `${streetNumber} ${streetName}, ${location}`,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
      reviewCount: Math.floor(Math.random() * 500) + 5,
      websiteAnalysis: {
        hasWebsite,
        platform: hasWebsite ? platform : null,
        needsUpgrade: !hasWebsite || issues.length >= 2 || platform === 'WordPress' || platform === 'Joomla' || platform === 'Drupal',
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

export async function searchGMB(service: string, location: string, limit: number = 100): Promise<GMBSearchResponse> {
  // Use mock data if no API URL is configured
  if (USE_MOCK_DATA) {
    // Simulate network delay - longer for larger requests
    const delay = Math.min(500 + (limit * 2), 3000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return {
      success: true,
      data: generateMockResults(service, location, limit),
      query: { service, location },
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/gmb-search.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ service, location, limit }),
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
