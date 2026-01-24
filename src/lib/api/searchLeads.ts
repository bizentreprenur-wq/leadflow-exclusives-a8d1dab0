/**
 * Search Leads API Client
 * Persists search results per customer in the database
 * Leads are stored for 30 days for consistency across the system
 */

import { API_BASE_URL } from './config';

const USE_MOCK_DATA = !API_BASE_URL;

// Search result type matching Dashboard's SearchResult interface
export interface SearchLead {
  id: string;
  dbId?: number;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  rating?: number;
  source: 'gmb' | 'platform';
  platform?: string;
  
  // AI Scoring fields
  aiClassification?: 'hot' | 'warm' | 'cold';
  leadScore?: number;
  successProbability?: number;
  recommendedAction?: 'call' | 'email' | 'both';
  callScore?: number;
  emailScore?: number;
  urgency?: 'immediate' | 'this_week' | 'nurture';
  painPoints?: string[];
  readyToCall?: boolean;
  
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
    loadTime?: number | null;
  };
  
  // Search context
  searchQuery?: string;
  searchLocation?: string;
  searchSessionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchLeadsResponse {
  success: boolean;
  data?: {
    leads: SearchLead[];
    latestSearch?: {
      query: string;
      location: string;
      sessionId: string;
      sourceType: 'gmb' | 'platform';
      createdAt: string;
    };
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

export interface SaveSearchLeadsResponse {
  success: boolean;
  data?: {
    saved: number;
    updated: number;
    searchSessionId: string;
    errors: string[];
  };
  error?: string;
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  try {
    const authData = localStorage.getItem('bamlead_auth');
    if (authData) {
      const parsed = JSON.parse(authData);
      return parsed.token || null;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Fetch search leads from database
 */
export async function fetchSearchLeads(
  options?: {
    page?: number;
    limit?: number;
    sessionId?: string;
    sourceType?: 'gmb' | 'platform';
    aiClassification?: 'hot' | 'warm' | 'cold';
  }
): Promise<SearchLeadsResponse> {
  if (USE_MOCK_DATA) {
    return {
      success: true,
      data: {
        leads: [],
        pagination: { page: 1, limit: 100, total: 0, totalPages: 0 }
      }
    };
  }

  try {
    const token = getAuthToken();
    const params = new URLSearchParams();
    
    if (options?.page) params.append('page', options.page.toString());
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.sessionId) params.append('session_id', options.sessionId);
    if (options?.sourceType) params.append('source_type', options.sourceType);
    if (options?.aiClassification) params.append('ai_classification', options.aiClassification);

    const response = await fetch(`${API_BASE_URL}/search-leads.php?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    const data = await response.json();
    
    if (data.success && data.data?.leads) {
      // Map database fields to frontend format
      data.data.leads = data.data.leads.map(mapDbLeadToFrontend);
    }
    
    return data;
  } catch (error) {
    console.error('Fetch search leads error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch leads'
    };
  }
}

/**
 * Save search leads to database (after search completes)
 */
export async function saveSearchLeads(
  leads: SearchLead[],
  options: {
    searchQuery: string;
    searchLocation: string;
    sourceType: 'gmb' | 'platform';
    clearPrevious?: boolean;
  }
): Promise<SaveSearchLeadsResponse> {
  if (USE_MOCK_DATA) {
    return {
      success: true,
      data: { 
        saved: leads.length, 
        updated: 0, 
        searchSessionId: `mock_${Date.now()}`,
        errors: [] 
      }
    };
  }

  try {
    const token = getAuthToken();
    const searchSessionId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const response = await fetch(`${API_BASE_URL}/search-leads.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        leads: leads.map(mapFrontendLeadToDb),
        searchQuery: options.searchQuery,
        searchLocation: options.searchLocation,
        sourceType: options.sourceType,
        searchSessionId,
        clearPrevious: options.clearPrevious ?? true // Default: replace previous leads
      })
    });

    return await response.json();
  } catch (error) {
    console.error('Save search leads error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save leads'
    };
  }
}

/**
 * Delete search leads
 */
export async function deleteSearchLeads(
  options: { sessionId?: string; leadIds?: string[]; clearAll?: boolean }
): Promise<{ success: boolean; data?: { deleted: number }; error?: string }> {
  if (USE_MOCK_DATA) {
    return { success: true, data: { deleted: 0 } };
  }

  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/search-leads.php`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(options)
    });

    return await response.json();
  } catch (error) {
    console.error('Delete search leads error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete leads'
    };
  }
}

/**
 * Map database lead format to frontend format
 */
function mapDbLeadToFrontend(dbLead: Record<string, unknown>): SearchLead {
  return {
    id: String(dbLead.lead_id || dbLead.id),
    dbId: dbLead.id ? Number(dbLead.id) : undefined,
    name: String(dbLead.business_name || ''),
    address: dbLead.address ? String(dbLead.address) : undefined,
    phone: dbLead.phone ? String(dbLead.phone) : undefined,
    website: dbLead.website ? String(dbLead.website) : undefined,
    email: dbLead.email ? String(dbLead.email) : undefined,
    rating: dbLead.rating ? Number(dbLead.rating) : undefined,
    source: (dbLead.source_type as 'gmb' | 'platform') || 'gmb',
    platform: dbLead.platform ? String(dbLead.platform) : undefined,
    
    // AI fields
    aiClassification: dbLead.ai_classification as SearchLead['aiClassification'],
    leadScore: dbLead.lead_score ? Number(dbLead.lead_score) : undefined,
    successProbability: dbLead.success_probability ? Number(dbLead.success_probability) : undefined,
    recommendedAction: dbLead.recommended_action as SearchLead['recommendedAction'],
    callScore: dbLead.call_score ? Number(dbLead.call_score) : undefined,
    emailScore: dbLead.email_score ? Number(dbLead.email_score) : undefined,
    urgency: dbLead.urgency as SearchLead['urgency'],
    painPoints: Array.isArray(dbLead.pain_points) ? dbLead.pain_points : undefined,
    readyToCall: Boolean(dbLead.ready_to_call),
    
    websiteAnalysis: dbLead.website_analysis as SearchLead['websiteAnalysis'],
    
    // Context
    searchQuery: dbLead.search_query ? String(dbLead.search_query) : undefined,
    searchLocation: dbLead.search_location ? String(dbLead.search_location) : undefined,
    searchSessionId: dbLead.search_session_id ? String(dbLead.search_session_id) : undefined,
    createdAt: dbLead.created_at ? String(dbLead.created_at) : undefined,
    updatedAt: dbLead.updated_at ? String(dbLead.updated_at) : undefined
  };
}

/**
 * Map frontend lead format to database format
 */
function mapFrontendLeadToDb(lead: SearchLead): Record<string, unknown> {
  return {
    id: lead.id,
    name: lead.name,
    address: lead.address,
    phone: lead.phone,
    website: lead.website,
    email: lead.email,
    rating: lead.rating,
    platform: lead.platform,
    aiClassification: lead.aiClassification,
    leadScore: lead.leadScore,
    successProbability: lead.successProbability,
    recommendedAction: lead.recommendedAction,
    callScore: lead.callScore,
    emailScore: lead.emailScore,
    urgency: lead.urgency,
    painPoints: lead.painPoints,
    readyToCall: lead.readyToCall,
    websiteAnalysis: lead.websiteAnalysis
  };
}
