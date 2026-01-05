/**
 * Verified Leads API Client
 * Connects to PHP backend on Hostinger for lead persistence
 */

import { API_BASE_URL } from './config';
import type { VerifiedLead } from '@/components/LeadVerificationModule';

const USE_MOCK_DATA = !API_BASE_URL;

export interface SavedLead extends VerifiedLead {
  dbId?: number;
  outreachStatus?: 'pending' | 'sent' | 'replied' | 'converted' | 'bounced';
  sourceType?: 'gmb' | 'google' | 'bing' | 'manual';
  sentAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VerifiedLeadsResponse {
  success: boolean;
  data?: {
    leads: SavedLead[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

export interface SaveLeadsResponse {
  success: boolean;
  data?: {
    saved: number;
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
 * Fetch verified leads from database
 */
export async function fetchVerifiedLeads(
  page = 1,
  limit = 50,
  filters?: { status?: string; emailValid?: boolean }
): Promise<VerifiedLeadsResponse> {
  if (USE_MOCK_DATA) {
    // Return empty for mock mode
    return {
      success: true,
      data: {
        leads: [],
        pagination: { page: 1, limit: 50, total: 0, totalPages: 0 }
      }
    };
  }

  try {
    const token = getAuthToken();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (filters?.status) {
      params.append('status', filters.status);
    }
    if (filters?.emailValid !== undefined) {
      params.append('email_valid', filters.emailValid.toString());
    }

    const response = await fetch(`${API_BASE_URL}/verified-leads.php?${params}`, {
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
    console.error('Fetch verified leads error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch leads'
    };
  }
}

/**
 * Save verified leads to database
 */
export async function saveVerifiedLeads(leads: VerifiedLead[]): Promise<SaveLeadsResponse> {
  if (USE_MOCK_DATA) {
    // Simulate success in mock mode
    return {
      success: true,
      data: { saved: leads.length, errors: [] }
    };
  }

  try {
    const token = getAuthToken();
    
    // Map frontend fields to database format
    const mappedLeads = leads.map(lead => ({
      lead_id: lead.id,
      business_name: lead.business_name,
      email: lead.email,
      contact_name: lead.contact_name,
      phone: lead.phone,
      website: lead.website,
      platform: lead.platform,
      verified: lead.verified,
      emailValid: lead.emailValid,
      leadScore: lead.leadScore,
      aiDraftedMessage: lead.aiDraftedMessage,
      verificationStatus: lead.verificationStatus,
      issues: lead.issues
    }));

    const response = await fetch(`${API_BASE_URL}/verified-leads.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ leads: mappedLeads })
    });

    return await response.json();
  } catch (error) {
    console.error('Save verified leads error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save leads'
    };
  }
}

/**
 * Update a lead's status or email
 */
export async function updateLeadStatus(
  id: number,
  updates: Partial<{
    outreachStatus: string;
    sentAt: string | 'now';
    email: string;
  }>
): Promise<{ success: boolean; error?: string }> {
  if (USE_MOCK_DATA) {
    return { success: true };
  }

  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/verified-leads.php`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ id, ...updates })
    });

    return await response.json();
  } catch (error) {
    console.error('Update lead error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update lead'
    };
  }
}

/**
 * Delete leads from database
 */
export async function deleteVerifiedLeads(
  ids: number[]
): Promise<{ success: boolean; data?: { deleted: number }; error?: string }> {
  if (USE_MOCK_DATA) {
    return { success: true, data: { deleted: ids.length } };
  }

  try {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}/verified-leads.php`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ ids })
    });

    return await response.json();
  } catch (error) {
    console.error('Delete leads error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete leads'
    };
  }
}

/**
 * Map database lead format to frontend format
 */
function mapDbLeadToFrontend(dbLead: Record<string, unknown>): SavedLead {
  return {
    id: String(dbLead.lead_id || dbLead.id),
    dbId: Number(dbLead.id),
    business_name: String(dbLead.business_name || ''),
    email: String(dbLead.email || ''),
    contact_name: dbLead.contact_name ? String(dbLead.contact_name) : undefined,
    phone: dbLead.phone ? String(dbLead.phone) : undefined,
    website: dbLead.website ? String(dbLead.website) : undefined,
    platform: dbLead.platform ? String(dbLead.platform) : undefined,
    verified: Boolean(dbLead.verified),
    emailValid: Boolean(dbLead.email_valid),
    leadScore: Number(dbLead.lead_score || 0),
    aiDraftedMessage: dbLead.ai_drafted_message ? String(dbLead.ai_drafted_message) : undefined,
    verificationStatus: (dbLead.verification_status as SavedLead['verificationStatus']) || 'verified',
    issues: Array.isArray(dbLead.issues) ? dbLead.issues : undefined,
    outreachStatus: dbLead.outreach_status as SavedLead['outreachStatus'],
    sourceType: dbLead.source_type as SavedLead['sourceType'],
    sentAt: dbLead.sent_at ? String(dbLead.sent_at) : undefined,
    createdAt: dbLead.created_at ? String(dbLead.created_at) : undefined,
    updatedAt: dbLead.updated_at ? String(dbLead.updated_at) : undefined
  };
}
