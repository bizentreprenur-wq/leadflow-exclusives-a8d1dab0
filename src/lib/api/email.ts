import { API_BASE_URL, getAuthHeaders, apiRequest } from './config';

// Types
export interface EmailTemplate {
  id: number;
  user_id: number;
  name: string;
  subject: string;
  body_html: string;
  body_text?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailCampaign {
  id: number;
  user_id: number;
  name: string;
  template_id: number;
  template_name?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'paused';
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  total_recipients: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  replied_count: number;
  bounced_count: number;
  created_at: string;
  updated_at: string;
}

export interface EmailSend {
  id: number;
  campaign_id?: number;
  user_id: number;
  lead_id?: number;
  template_id?: number;
  recipient_email: string;
  recipient_name?: string;
  business_name?: string;
  subject: string;
  body_html?: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'failed';
  tracking_id?: string;
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
  bounced_at?: string;
  error_message?: string;
  created_at: string;
}

export interface EmailStats {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_replied: number;
  total_bounced: number;
  total_failed: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
}

export interface LeadForEmail {
  id?: number;
  email: string;
  business_name?: string;
  contact_name?: string;
  website?: string;
  platform?: string;
  issues?: string[];
  phone?: string;
}

export interface BulkSendResult {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  details: Array<{
    business: string;
    email?: string;
    status: string;
    reason?: string;
  }>;
}

// Endpoints
const EMAIL_ENDPOINTS = {
  templates: `${API_BASE_URL}/email-outreach.php?action=templates`,
  template: (id?: number) => `${API_BASE_URL}/email-outreach.php?action=template${id ? `&id=${id}` : ''}`,
  campaigns: `${API_BASE_URL}/email-outreach.php?action=campaigns`,
  campaign: `${API_BASE_URL}/email-outreach.php?action=campaign`,
  send: `${API_BASE_URL}/email-outreach.php?action=send`,
  sendBulk: `${API_BASE_URL}/email-outreach.php?action=send-bulk`,
  sends: `${API_BASE_URL}/email-outreach.php?action=sends`,
  stats: (period?: number) => `${API_BASE_URL}/email-outreach.php?action=stats${period ? `&period=${period}` : ''}`,
};

// Template API
export async function getTemplates(): Promise<{ success: boolean; templates: EmailTemplate[]; error?: string }> {
  try {
    return await apiRequest(EMAIL_ENDPOINTS.templates);
  } catch (error: any) {
    return { success: false, templates: [], error: error.message };
  }
}

export async function getTemplate(id: number): Promise<{ success: boolean; template?: EmailTemplate; error?: string }> {
  try {
    return await apiRequest(EMAIL_ENDPOINTS.template(id));
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createTemplate(template: Omit<EmailTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    return await apiRequest(EMAIL_ENDPOINTS.template(), {
      method: 'POST',
      body: JSON.stringify(template),
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTemplate(id: number, template: Partial<EmailTemplate>): Promise<{ success: boolean; error?: string }> {
  try {
    return await apiRequest(EMAIL_ENDPOINTS.template(id), {
      method: 'PUT',
      body: JSON.stringify(template),
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteTemplate(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    return await apiRequest(EMAIL_ENDPOINTS.template(id), {
      method: 'DELETE',
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Campaign API
export async function getCampaigns(): Promise<{ success: boolean; campaigns: EmailCampaign[]; error?: string }> {
  try {
    return await apiRequest(EMAIL_ENDPOINTS.campaigns);
  } catch (error: any) {
    return { success: false, campaigns: [], error: error.message };
  }
}

export async function createCampaign(campaign: { name: string; template_id: number; status?: string; scheduled_at?: string }): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    return await apiRequest(EMAIL_ENDPOINTS.campaign, {
      method: 'POST',
      body: JSON.stringify(campaign),
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Send API
export async function sendEmail(params: {
  to: string;
  subject: string;
  body_html: string;
  body_text?: string;
  template_id?: number;
  lead_id?: number;
  campaign_id?: number;
  recipient_name?: string;
  business_name?: string;
  personalization?: Record<string, string>;
  track_opens?: boolean;
}): Promise<{ success: boolean; send_id?: number; tracking_id?: string; error?: string }> {
  try {
    return await apiRequest(EMAIL_ENDPOINTS.send, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendBulkEmails(params: {
  leads: LeadForEmail[];
  template_id: number;
  campaign_id?: number;
  scheduled_for?: string;
}): Promise<{ success: boolean; results?: BulkSendResult; error?: string }> {
  try {
    return await apiRequest(EMAIL_ENDPOINTS.sendBulk, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getSends(params?: { limit?: number; offset?: number; status?: string }): Promise<{ success: boolean; sends: EmailSend[]; total: number; error?: string }> {
  try {
    let url = EMAIL_ENDPOINTS.sends;
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.offset) searchParams.append('offset', params.offset.toString());
      if (params.status) searchParams.append('status', params.status);
      url += `&${searchParams.toString()}`;
    }
    return await apiRequest(url);
  } catch (error: any) {
    return { success: false, sends: [], total: 0, error: error.message };
  }
}

// Stats API
export async function getEmailStats(period?: number): Promise<{ success: boolean; stats?: EmailStats; daily?: Array<{ date: string; sent: number; opened: number }>; error?: string }> {
  try {
    return await apiRequest(EMAIL_ENDPOINTS.stats(period));
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Helper to personalize template preview
export function personalizeTemplate(content: string, data: Record<string, string>): string {
  let result = content;
  const tokens: Record<string, string> = {
    '{{business_name}}': data.business_name || '[Business Name]',
    '{{first_name}}': data.first_name || '[First Name]',
    '{{website}}': data.website || '[Website]',
    '{{platform}}': data.platform || '[Platform]',
    '{{issues}}': data.issues || '[Issues]',
    '{{phone}}': data.phone || '[Phone]',
    '{{email}}': data.email || '[Email]',
  };
  
  for (const [token, value] of Object.entries(tokens)) {
    result = result.replace(new RegExp(token.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  
  return result;
}
