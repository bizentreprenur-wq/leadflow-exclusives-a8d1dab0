/**
 * Unified Email Service for BamLead
 * Provides consistent email sending functionality across the entire application
 */

import { API_BASE_URL } from '@/lib/api/config';

const API_BASE = API_BASE_URL;

interface SMTPConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  fromEmail?: string;
  fromName?: string;
  secure?: boolean;
}

interface EmailBranding {
  enabled: boolean;
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  signature: string;
  footerText: string;
  socialLinks?: {
    website?: string;
    linkedin?: string;
  };
}

interface SendEmailParams {
  to: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  leadId?: string;
  templateId?: string;
  campaignId?: string;
  personalization?: Record<string, string>;
  applyBranding?: boolean;
}

interface BulkSendParams {
  leads: Array<{
    id?: string;
    email: string;
    business_name?: string;
    contact_name?: string;
    website?: string;
    phone?: string;
    platform?: string;
    issues?: string | string[];
  }>;
  templateId?: string;
  customSubject?: string;
  customBody?: string;
  sendMode?: 'instant' | 'drip' | 'scheduled';
  dripConfig?: {
    emailsPerHour?: number;
    delayMinutes?: number;
  };
  scheduledFor?: string;
  applyBranding?: boolean;
}

interface SendResult {
  success: boolean;
  sent?: number;
  failed?: number;
  scheduled?: number;
  error?: string;
  details?: Array<{
    business: string;
    email: string;
    status: string;
    reason?: string;
  }>;
}

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  to?: string;
  sentAt?: string;
}

/**
 * Get email branding from localStorage
 */
export const getEmailBranding = (): EmailBranding | null => {
  try {
    const saved = localStorage.getItem('email_branding');
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

/**
 * Apply branding to HTML email content
 */
export const applyBrandingToHtml = (html: string, branding?: EmailBranding | null): string => {
  const brandingConfig = branding || getEmailBranding();
  if (!brandingConfig?.enabled) return html;

  // Create header with logo or company name
  const headerHtml = brandingConfig.logoUrl 
    ? `<div style="text-align: center; padding: 20px; background-color: ${brandingConfig.primaryColor}10;">
         <img src="${brandingConfig.logoUrl}" alt="${brandingConfig.companyName}" style="height: 48px; max-width: 200px; object-fit: contain;" />
       </div>`
    : brandingConfig.companyName 
    ? `<div style="text-align: center; padding: 20px; background-color: ${brandingConfig.primaryColor}10;">
         <div style="font-size: 24px; font-weight: bold; color: ${brandingConfig.primaryColor};">${brandingConfig.companyName}</div>
       </div>`
    : '';

  // Create signature
  const signatureHtml = brandingConfig.signature 
    ? `<div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; white-space: pre-line; color: #4b5563; font-size: 14px;">${brandingConfig.signature}</div>`
    : '';

  // Create footer
  const footerHtml = `
    <div style="text-align: center; padding: 16px; background-color: ${brandingConfig.accentColor}10; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
      ${brandingConfig.footerText || `© ${new Date().getFullYear()} ${brandingConfig.companyName || ""}. All rights reserved.`}
      ${brandingConfig.socialLinks?.website ? `<div style="margin-top: 8px;"><a href="${brandingConfig.socialLinks.website}" style="color: #3b82f6;">${brandingConfig.socialLinks.website}</a></div>` : ''}
    </div>`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      ${headerHtml}
      <div style="padding: 24px;">${html}</div>
      ${signatureHtml}
      ${footerHtml}
    </div>`;
};

/**
 * Get saved SMTP configuration from localStorage
 * Checks both new key (bamlead_smtp_config) and legacy key (smtp_config) for backwards compatibility
 */
export const getSMTPConfig = (): SMTPConfig | null => {
  try {
    // Try new key first
    let saved = localStorage.getItem('bamlead_smtp_config');
    if (!saved) {
      // Fallback to legacy key
      saved = localStorage.getItem('smtp_config');
    }
    if (!saved) return null;
    return JSON.parse(saved);
  } catch {
    return null;
  }
};

/**
 * Save SMTP configuration to localStorage
 * Saves to both keys for backwards compatibility
 */
export const saveSMTPConfig = (config: SMTPConfig): void => {
  const configData = JSON.stringify({
    ...config,
    configured: true,
  });
  localStorage.setItem('bamlead_smtp_config', configData);
  localStorage.setItem('smtp_config', configData); // Legacy support
  
  // Also update status
  const statusData = JSON.stringify({
    isConnected: Boolean(config.username && config.password),
    isVerified: false,
    lastTestDate: new Date().toISOString(),
  });
  localStorage.setItem('bamlead_smtp_status', statusData);
  
  // Broadcast change
  window.dispatchEvent(new CustomEvent('bamlead_smtp_changed'));
};

/**
 * Check if SMTP is configured
 * Checks both status key and config for backwards compatibility
 */
export const isSMTPConfigured = (): boolean => {
  try {
    // Try status key first
    const status = localStorage.getItem('bamlead_smtp_status');
    if (status) {
      const parsed = JSON.parse(status);
      if (parsed.isConnected) return true;
    }
  } catch {}
  
  // Fallback to checking config directly
  const config = getSMTPConfig();
  return !!(config?.username && config?.password);
};

/**
 * Get auth headers for API requests
 */
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

/**
 * Test SMTP connection
 */
export const testSMTPConnection = async (config?: Partial<SMTPConfig>): Promise<TestResult> => {
  try {
    const smtpConfig = config || getSMTPConfig();
    
    if (!smtpConfig?.host || !smtpConfig?.username || !smtpConfig?.password) {
      return { success: false, error: 'Missing SMTP credentials' };
    }
    
    console.log('[SMTP Test] Starting connection test to:', smtpConfig.host);
    
    const response = await fetch(`${API_BASE}/email-outreach.php?action=test_smtp`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        host: smtpConfig.host,
        port: smtpConfig.port || '465',
        username: smtpConfig.username,
        password: smtpConfig.password,
        secure: smtpConfig.secure ?? true,
      }),
    });
    
    console.log('[SMTP Test] Response status:', response.status);
    
    // Check for non-OK response
    if (!response.ok) {
      const errorText = await response.text();
      console.warn('SMTP test returned non-OK status:', response.status, errorText);
      
      if (response.status === 401) {
        // Save config locally even without backend verification
        saveSMTPConfig(smtpConfig as SMTPConfig);
        return { 
          success: true, 
          message: 'Configuration saved locally. Backend verification requires login.' 
        };
      }
      
      return { 
        success: false, 
        error: `Server error (${response.status}). ${errorText || 'Please try again.'}` 
      };
    }
    
    const text = await response.text();
    
    // Try to parse JSON
    try {
      const data = JSON.parse(text);
      console.log('[SMTP Test] Response data:', data);
      return data;
    } catch {
      console.warn('SMTP test response not JSON:', text.substring(0, 100));
      return { 
        success: false, 
        error: 'Invalid server response. Please check API configuration.' 
      };
    }
  } catch (error) {
    console.error('SMTP test network error:', error);
    
    // Even if backend is unreachable, allow saving config locally
    const smtpConfig = config || getSMTPConfig();
    if (smtpConfig?.host && smtpConfig?.username && smtpConfig?.password) {
      saveSMTPConfig(smtpConfig as SMTPConfig);
      return {
        success: true,
        message: 'Configuration saved locally. Backend verification unavailable.',
      };
    }
    
    return {
      success: false,
      error: 'Unable to reach the test endpoint. Configuration saved locally.',
    };
  }
};

/**
 * Send a test email to verify configuration
 */
export const sendTestEmail = async (toEmail: string): Promise<TestResult> => {
  if (!toEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
    return { success: false, error: 'Please enter a valid email address' };
  }

  try {
    const smtpOverride = getSMTPConfig();
    const payload: Record<string, unknown> = {
      to_email: toEmail,
    };
    if (smtpOverride?.host && smtpOverride?.username && smtpOverride?.password) {
      payload.smtp_override = {
        host: smtpOverride.host,
        port: smtpOverride.port || '465',
        username: smtpOverride.username,
        password: smtpOverride.password,
        secure: smtpOverride.secure ?? true,
        from_email: smtpOverride.fromEmail || smtpOverride.username,
        from_name: smtpOverride.fromName || 'BamLead',
      };
    }

    const response = await fetch(`${API_BASE}/email-outreach.php?action=send_test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.warn('Send test email returned non-OK status:', response.status);
      return { 
        success: false, 
        error: `Server error (${response.status}). Please try again.` 
      };
    }
    
    const text = await response.text();
    
    try {
      const data = JSON.parse(text);
      return {
        success: data.success,
        message: data.message,
        error: data.error,
        to: toEmail,
        sentAt: data.sent_at,
      };
    } catch {
      console.warn('Send test email response not JSON:', text.substring(0, 100));
      return { 
        success: false, 
        error: 'Invalid server response. Please check API configuration.' 
      };
    }
  } catch (error) {
    console.error('Send test email error:', error);
    return {
      success: false,
      error: 'Failed to reach email server. Please check your connection.',
    };
  }
};

/**
 * Send a single email
 */
export const sendSingleEmail = async (params: SendEmailParams): Promise<SendResult> => {
  // Validate email format
  if (!params.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.to)) {
    return {
      success: false,
      failed: 1,
      error: 'Invalid email address format',
    };
  }

  try {
    const smtpConfig = getSMTPConfig();
    // Apply branding if enabled
    let finalHtml = params.bodyHtml;
    if (params.applyBranding !== false) {
      const branding = getEmailBranding();
      if (branding?.enabled) {
        finalHtml = applyBrandingToHtml(params.bodyHtml, branding);
      }
    }
    
    const payload: Record<string, unknown> = {
      to: params.to,
      subject: params.subject,
      body_html: finalHtml,
      body_text: params.bodyText,
      lead_id: params.leadId,
      template_id: params.templateId,
      campaign_id: params.campaignId,
      personalization: params.personalization,
      track_opens: true,
    };
    if (smtpConfig?.host && smtpConfig?.username && smtpConfig?.password) {
      payload.smtp_override = {
        host: smtpConfig.host,
        port: smtpConfig.port,
        username: smtpConfig.username,
        password: smtpConfig.password,
        secure: smtpConfig.secure,
        from_email: smtpConfig.fromEmail || smtpConfig.username,
        from_name: smtpConfig.fromName || 'BamLead',
      };
    }

    const response = await fetch(`${API_BASE}/email-outreach.php?action=send`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Email API error:', response.status, errorText);
      return {
        success: false,
        failed: 1,
        error: `Server error (${response.status}). Please try again or check SMTP settings.`,
      };
    }
    
    const data = await response.json();
    
    if (!data.success) {
      return {
        success: false,
        failed: 1,
        error: data.error || 'Email delivery failed. Please verify your SMTP credentials.',
      };
    }
    
    return {
      success: true,
      sent: 1,
      failed: 0,
    };
  } catch (error) {
    console.error('Send email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Provide actionable error messages
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
      return {
        success: false,
        failed: 1,
        error: 'Network error. Please check your internet connection and try again.',
      };
    }
    
    return {
      success: false,
      failed: 1,
      error: `Failed to send email: ${errorMessage}. Please check your SMTP configuration.`,
    };
  }
};

/**
 * Send bulk emails to multiple leads
 */
export const sendBulkEmails = async (params: BulkSendParams): Promise<SendResult> => {
  if (!params.leads || params.leads.length === 0) {
    return { success: false, error: 'No leads provided' };
  }
  
  if (!params.templateId && !params.customSubject) {
    return { success: false, error: 'Template or custom content required' };
  }
  
  try {
    const smtpConfig = getSMTPConfig();
    // Apply branding to custom body if enabled
    let finalBody = params.customBody;
    if (params.applyBranding !== false && finalBody) {
      const branding = getEmailBranding();
      if (branding?.enabled) {
        finalBody = applyBrandingToHtml(finalBody, branding);
      }
    }
    
    const payload: Record<string, unknown> = {
      leads: params.leads,
      template_id: params.templateId,
      custom_subject: params.customSubject,
      custom_body: finalBody,
      send_mode: params.sendMode || 'instant',
      drip_config: params.dripConfig,
      scheduled_for: params.scheduledFor,
    };
    if (smtpConfig?.host && smtpConfig?.username && smtpConfig?.password) {
      payload.smtp_override = {
        host: smtpConfig.host,
        port: smtpConfig.port,
        username: smtpConfig.username,
        password: smtpConfig.password,
        secure: smtpConfig.secure,
        from_email: smtpConfig.fromEmail || smtpConfig.username,
        from_name: smtpConfig.fromName || 'BamLead',
      };
    }

    const response = await fetch(`${API_BASE}/email-outreach.php?action=send-bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (data.success && data.results) {
      return {
        success: true,
        sent: data.results.sent,
        failed: data.results.failed,
        scheduled: data.results.scheduled,
        details: data.results.details,
      };
    }
    
    return {
      success: false,
      error: data.error || 'Unknown error occurred',
    };
  } catch (error) {
    console.error('Bulk send error:', error);
    return {
      success: false,
      error: 'Failed to send emails. Please check your connection.',
    };
  }
};

/**
 * Get email sending statistics
 */
export const getEmailStats = async (period: number = 30) => {
  try {
    const response = await fetch(
      `${API_BASE}/email-outreach.php?action=stats&period=${period}`,
      { headers: getAuthHeaders() }
    );
    
    const data = await response.json();
    return data.success ? data.stats : null;
  } catch (error) {
    console.error('Get stats error:', error);
    return null;
  }
};

/**
 * Get sent email history
 */
export const getSentEmails = async (limit: number = 50, offset: number = 0) => {
  try {
    const response = await fetch(
      `${API_BASE}/email-outreach.php?action=sends&limit=${limit}&offset=${offset}`,
      { headers: getAuthHeaders() }
    );
    
    const data = await response.json();
    return data.success ? data.sends : [];
  } catch (error) {
    console.error('Get sends error:', error);
    return [];
  }
};

/**
 * Get scheduled emails
 */
export const getScheduledEmails = async () => {
  try {
    const response = await fetch(
      `${API_BASE}/email-outreach.php?action=scheduled`,
      { headers: getAuthHeaders() }
    );
    
    const data = await response.json();
    return data.success ? data.emails : [];
  } catch (error) {
    console.error('Get scheduled error:', error);
    return [];
  }
};

/**
 * Cancel a scheduled email
 */
export const cancelScheduledEmail = async (emailId: string): Promise<boolean> => {
  try {
    const response = await fetch(
      `${API_BASE}/email-outreach.php?action=cancel-scheduled&id=${emailId}`,
      { method: 'DELETE', headers: getAuthHeaders() }
    );
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Cancel scheduled error:', error);
    return false;
  }
};

/**
 * Personalize email content with lead data including Step 2 analysis context
 */
export const personalizeContent = (
  content: string,
  data: Record<string, string>
): string => {
  let result = content;
  
  // Core placeholders
  const placeholders: Record<string, string> = {
    // Basic info
    '{{business_name}}': data.business_name || data.businessName || '',
    '{{first_name}}': data.first_name || data.firstName || extractFirstName(data.business_name || data.contact_name || '') || 'there',
    '{{website}}': data.website || '',
    '{{phone}}': data.phone || '',
    '{{email}}': data.email || '',
    '{{platform}}': data.platform || 'your platform',
    '{{issues}}': data.issues || '',
    '{{sender_name}}': data.sender_name || data.senderName || 'The BamLead Team',
    '{{location}}': data.location || data.city || 'your area',
    '{{industry}}': data.industry || 'your industry',
    
    // Step 2 Analysis Context - Website Analysis
    '{{website_status}}': data.website_status || (data.website ? 'has website' : 'no website'),
    '{{website_platform}}': data.website_platform || data.platform || '',
    '{{website_issues}}': data.website_issues || data.issues || '',
    '{{mobile_score}}': data.mobile_score || '',
    '{{needs_upgrade}}': data.needs_upgrade || '',
    
    // Step 2 Analysis Context - AI Insights
    '{{main_pain_point}}': data.main_pain_point || '',
    '{{pain_points}}': data.pain_points || '',
    '{{lead_priority}}': data.lead_priority || data.aiClassification || '',
    '{{recommended_approach}}': data.recommended_approach || '',
    '{{talking_points}}': data.talking_points || '',
    
    // Dynamic contextual openers based on analysis
    '{{personalized_opener}}': generatePersonalizedOpener(data),
    '{{value_proposition}}': generateValueProposition(data),
  };
  
  for (const [placeholder, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  
  return result;
};

/**
 * Generate a personalized opener based on lead analysis
 */
const generatePersonalizedOpener = (data: Record<string, string>): string => {
  const businessName = data.business_name || data.businessName || 'your business';
  
  // No website leads
  if (data.website_status === 'no website' || !data.website) {
    return `I noticed ${businessName} doesn't have a website yet, and I wanted to reach out because many of your competitors are attracting customers online`;
  }
  
  // Website needs upgrade
  if (data.needs_upgrade === 'yes' || data.website_issues) {
    const issues = data.website_issues || 'some areas that could be improved';
    return `I took a look at your website and noticed ${issues}. I've helped businesses like yours fix these issues`;
  }
  
  // Hot leads
  if (data.lead_priority === 'hot') {
    return `I came across ${businessName} and was impressed - I think there's a great opportunity for us to work together`;
  }
  
  // Use pain point if available
  if (data.main_pain_point) {
    return `I noticed ${businessName} might be dealing with ${data.main_pain_point}, and I wanted to share some insights`;
  }
  
  // Default
  return `I came across ${businessName} and thought of some ways we might be able to help`;
};

/**
 * Generate a value proposition based on lead context
 */
const generateValueProposition = (data: Record<string, string>): string => {
  // No website
  if (data.website_status === 'no website' || !data.website) {
    return 'help you establish a professional online presence that attracts more customers';
  }
  
  // Website issues
  if (data.needs_upgrade === 'yes') {
    if (data.mobile_score && parseInt(data.mobile_score) < 50) {
      return 'make your website mobile-friendly so you don\'t lose customers on phones';
    }
    return 'optimize your website to convert more visitors into paying customers';
  }
  
  // Hot lead
  if (data.lead_priority === 'hot') {
    return 'help you capitalize on your strong position and accelerate growth';
  }
  
  // Default
  return 'help you grow your business and reach more customers';
};

/**
 * Extract first name from a business or contact name
 */
const extractFirstName = (name: string): string => {
  if (!name) return '';
  
  const words = name.trim().split(' ');
  const firstWord = words[0] || '';
  
  const businessWords = ['the', 'inc', 'llc', 'corp', 'company', 'co', 'services', 'solutions'];
  
  if (firstWord.length > 2 && !businessWords.includes(firstWord.toLowerCase())) {
    return firstWord;
  }
  
  return '';
};

export default {
  getSMTPConfig,
  saveSMTPConfig,
  isSMTPConfigured,
  getEmailBranding,
  applyBrandingToHtml,
  testSMTPConnection,
  sendTestEmail,
  sendSingleEmail,
  sendBulkEmails,
  getEmailStats,
  getSentEmails,
  getScheduledEmails,
  cancelScheduledEmail,
  personalizeContent,
};
