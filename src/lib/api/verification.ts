/**
 * Lead Verification API Client
 * Connects to PHP backend on Hostinger
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const USE_MOCK_DATA = !API_BASE_URL;

export interface ContactInfo {
  phones: string[];
  emails: string[];
  address: string | null;
}

export interface BusinessInfo {
  name: string | null;
  description: string | null;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    yelp?: string;
  };
}

export interface WebsiteAnalysis {
  platform: string | null;
  issues: string[];
  pageSize?: number;
  mobileReady?: boolean;
}

export interface LeadVerificationResult {
  leadId: string;
  url: string;
  isAccessible: boolean;
  contactInfo: ContactInfo;
  businessInfo: BusinessInfo;
  websiteAnalysis: WebsiteAnalysis | null;
  hasContactPage?: boolean;
  verifiedAt: string;
}

export interface LeadVerificationResponse {
  success: boolean;
  data?: LeadVerificationResult;
  error?: string;
  cached?: boolean;
}

// Mock verification data
function generateMockVerification(url: string, leadId: string): LeadVerificationResult {
  const domain = new URL(url).hostname;
  
  return {
    leadId,
    url,
    isAccessible: true,
    contactInfo: {
      phones: [
        `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      ],
      emails: [`info@${domain}`, `contact@${domain}`],
      address: `${Math.floor(Math.random() * 9000) + 1000} Business Ave, Suite ${Math.floor(Math.random() * 500) + 1}`,
    },
    businessInfo: {
      name: domain.replace('.com', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      description: 'Professional services with quality you can trust. Serving the community since 2010.',
      socialLinks: {
        facebook: `https://facebook.com/${domain.replace('.com', '')}`,
        instagram: Math.random() > 0.5 ? `https://instagram.com/${domain.replace('.com', '')}` : undefined,
      },
    },
    websiteAnalysis: {
      platform: ['WordPress', 'Wix', 'Squarespace', 'Custom'][Math.floor(Math.random() * 4)],
      issues: ['Missing meta description', 'No SSL certificate'].slice(0, Math.floor(Math.random() * 3)),
      pageSize: Math.floor(Math.random() * 500000) + 50000,
      mobileReady: Math.random() > 0.3,
    },
    hasContactPage: Math.random() > 0.2,
    verifiedAt: new Date().toISOString(),
  };
}

export async function verifyLead(url: string, leadId: string): Promise<LeadVerificationResponse> {
  // Use mock data if no API URL is configured
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    
    return {
      success: true,
      data: generateMockVerification(url, leadId),
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/verify-lead.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, leadId }),
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
    console.error('Lead Verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify lead',
    };
  }
}

export interface WebsiteAnalysisResponse {
  success: boolean;
  data?: {
    url: string;
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
    loadTime: number | null;
    analyzedAt: string;
  };
  error?: string;
  cached?: boolean;
}

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysisResponse> {
  // Use mock data if no API URL is configured
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));
    
    const platforms = ['WordPress', 'Wix', 'Squarespace', 'GoDaddy', 'Custom PHP', 'Custom/Unknown'];
    const issues = [
      'Not mobile responsive',
      'Missing meta description',
      'Outdated jQuery version',
      'Large page size',
    ];
    
    const issueCount = Math.floor(Math.random() * 4);
    
    return {
      success: true,
      data: {
        url,
        hasWebsite: true,
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        needsUpgrade: issueCount >= 2,
        issues: issues.slice(0, issueCount),
        mobileScore: Math.floor(Math.random() * 50) + 50,
        loadTime: Math.floor(Math.random() * 3000) + 500,
        analyzedAt: new Date().toISOString(),
      },
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/analyze-website.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
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
    console.error('Website Analysis error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze website',
    };
  }
}
