/**
 * BamLead API Client
 * Unified exports for all API functions
 */

// GMB Search
export { searchGMB } from './gmb';
export type { GMBResult, GMBSearchResponse, WebsiteAnalysis, LeadVerification } from './gmb';

// Platform Search
export { searchPlatforms } from './platforms';
export type { PlatformResult, PlatformSearchResponse } from './platforms';

// Lead Verification
export { verifyLead, analyzeWebsite } from './verification';
export type { 
  LeadVerificationResult, 
  LeadVerificationResponse,
  WebsiteAnalysisResponse,
  ContactInfo,
  BusinessInfo 
} from './verification';

// Email Outreach
export {
  getTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCampaigns,
  createCampaign,
  sendEmail,
  sendBulkEmails,
  getSends,
  getEmailStats,
  personalizeTemplate,
} from './email';
export type {
  EmailTemplate,
  EmailCampaign,
  EmailSend,
  EmailStats,
  LeadForEmail,
  BulkSendResult,
} from './email';

// API Configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || '',
  isConfigured: Boolean(import.meta.env.VITE_API_URL),
  endpoints: {
    gmbSearch: '/gmb-search.php',
    platformSearch: '/platform-search.php',
    verifyLead: '/verify-lead.php',
    analyzeWebsite: '/analyze-website.php',
    emailOutreach: '/email-outreach.php',
  },
};
