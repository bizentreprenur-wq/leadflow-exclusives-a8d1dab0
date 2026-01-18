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

// Lead Analysis (AI Grouping)
export { analyzeLeads } from './leadAnalysis';
export type {
  LeadAnalysis,
  LeadGroup,
  EmailStrategy,
  LeadSummary,
  AnalyzeLeadsResponse,
} from './leadAnalysis';

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

// Call Logs
export {
  saveCallLog,
  listCallLogs,
  updateCallLog,
  deleteCallLog,
  getCallStats,
} from './callLogs';
export type {
  CallLog,
  CallOutcome,
  CallStats,
  TranscriptMessage,
} from './callLogs';

// Google Calendar
export {
  connectGoogleCalendar,
  checkGoogleCalendarStatus,
  disconnectGoogleCalendar,
  listCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  scheduleMeetingWithLead,
} from './googleCalendar';
export type { CalendarEvent } from './googleCalendar';

// CRM Integration
export {
  getCRMStatus,
  connectCRM,
  disconnectCRM,
  saveCRMApiKey,
  exportLeadsToCRM,
  handleCRMCallbackParams,
} from './crmIntegration';
export type { CRMProvider, CRMConnection, CRMExportResult } from './crmIntegration';

// AI Lead Scoring
export {
  getAILeadScores,
  getAILeadPrioritization,
  getAILeadInsights,
  getAIEmailAngles,
  analyzeLeadWithAI,
} from './aiLeadScoring';
export type { ScoredLead, LeadPrioritization, LeadInsights, EmailAngle } from './aiLeadScoring';

// API Configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_URL || '',
  isConfigured: Boolean(import.meta.env.VITE_API_URL),
  endpoints: {
    gmbSearch: '/gmb-search.php',
    platformSearch: '/platform-search.php',
    verifyLead: '/verify-lead.php',
    analyzeWebsite: '/analyze-website.php',
    analyzeLeads: '/analyze-leads.php',
    emailOutreach: '/email-outreach.php',
    callLogs: '/call-logs.php',
    crmOAuth: '/crm-oauth.php',
    crmExport: '/crm-export.php',
    aiLeadScoring: '/ai-lead-scoring.php',
    googleCalendar: '/google-calendar-auth.php',
  },
};
