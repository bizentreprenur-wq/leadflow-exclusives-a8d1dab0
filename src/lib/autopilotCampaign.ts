import { EmailSequence } from '@/lib/emailSequences';

export type AutopilotCampaignStatus = 'active' | 'paused' | 'completed';

export interface AutopilotCampaignTemplate {
  id?: string;
  name: string;
  subject: string;
  body: string;
  rawSubject?: string;
  rawBody?: string;
  source?: 'priority' | 'gallery' | 'sequence' | 'auto';
}

export interface AutopilotCampaignLead {
  id?: string | number;
  email?: string;
  business_name?: string;
  name?: string;
  first_name?: string;
  industry?: string;
  website?: string;
  aiClassification?: 'hot' | 'warm' | 'cold';
  leadScore?: number;
  websiteIssues?: string[];
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform?: string;
    needsUpgrade: boolean;
    mobileScore?: number;
    loadTime?: number;
    issues: string[];
    opportunities: string[];
  };
  painPoints?: string[];
}

export interface AutopilotCampaign {
  id: string;
  status: AutopilotCampaignStatus;
  searchType: 'gmb' | 'platform' | null;
  createdAt: string;
  startedAt: string;
  template: AutopilotCampaignTemplate;
  sequence?: EmailSequence;
  leads: AutopilotCampaignLead[];
  totalLeads: number;
  sentCount: number;
  lastSentAt?: string;
  dripConfig?: {
    emailsPerHour: number;
    delayMinutes: number;
  };
  analysisSummary?: {
    totalLeads: number;
    noWebsiteCount: number;
    needsUpgradeCount: number;
    hotLeadsCount: number;
    warmLeadsCount: number;
    coldLeadsCount: number;
  };
}

const STORAGE_KEY = 'bamlead_autopilot_campaign';

export function getAutopilotCampaign(): AutopilotCampaign | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AutopilotCampaign;
  } catch {
    return null;
  }
}

export function saveAutopilotCampaign(campaign: AutopilotCampaign): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaign));
  } catch {
    // ignore storage failures
  }
}

export function updateAutopilotCampaign(
  partial: Partial<AutopilotCampaign>
): AutopilotCampaign | null {
  const existing = getAutopilotCampaign();
  if (!existing) return null;
  const updated = { ...existing, ...partial };
  saveAutopilotCampaign(updated);
  return updated;
}

export function clearAutopilotCampaign(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
