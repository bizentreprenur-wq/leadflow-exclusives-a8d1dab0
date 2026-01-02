/**
 * GMB Search API Client
 * Connects to PHP backend on Hostinger
 * Falls back to mock data for testing
 */

// Update this with your Hostinger domain
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Set to true to use mock data for testing
const USE_MOCK_DATA = !API_BASE_URL;

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
  phone?: string;
  address?: string;
  rating?: number;
  reviewCount?: number;
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

// Mock data generator for testing
function generateMockResults(service: string, location: string): GMBResult[] {
  const businessNames = [
    `${location} ${service.charAt(0).toUpperCase() + service.slice(1)} Pros`,
    `Elite ${service.charAt(0).toUpperCase() + service.slice(1)} Services`,
    `A+ ${service.charAt(0).toUpperCase() + service.slice(1)} Solutions`,
    `Quick ${service.charAt(0).toUpperCase() + service.slice(1)} Co`,
    `Premier ${service.charAt(0).toUpperCase() + service.slice(1)} Group`,
    `${service.charAt(0).toUpperCase() + service.slice(1)} Masters Inc`,
    `Reliable ${service.charAt(0).toUpperCase() + service.slice(1)} LLC`,
    `Best ${location} ${service.charAt(0).toUpperCase() + service.slice(1)}`,
  ];

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
