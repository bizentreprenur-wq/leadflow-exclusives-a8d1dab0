import { API_BASE_URL, getAuthHeaders } from './config';

export interface LeadAnalysis {
  id: string;
  name: string;
  url?: string;
  address?: string;
  phone?: string;
  rating?: number;
  reviews?: number;
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform: string | null;
    needsUpgrade: boolean;
    issues: string[];
    mobileScore: number | null;
    loadTime: number | null;
  };
  aiInsights?: string[];
  conversionProbability?: 'high' | 'medium' | 'low';
  recommendedApproach?: string;
  painPoints?: string[];
  talkingPoints?: string[];
}

export interface LeadGroup {
  label: string;
  description: string;
  priority: number;
  emailAngle: string;
  urgency: 'critical' | 'high' | 'medium' | 'low' | 'nurture';
  leads: LeadAnalysis[];
}

export interface EmailStrategy {
  subject: string;
  hook: string;
  cta: string;
  followUpDays: number[];
  toneRecommendation: string;
  leadCount: number;
  groupLabel: string;
}

export interface LeadSummary {
  total: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  groupCount: number;
  recommendation: string;
}

export interface AnalyzeLeadsResponse {
  success: boolean;
  data: Record<string, LeadGroup>;
  summary: LeadSummary;
  emailStrategies: Record<string, EmailStrategy>;
}

export async function analyzeLeads(leads: any[]): Promise<AnalyzeLeadsResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze-leads.php`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ leads }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to analyze leads' }));
    throw new Error(error.error || 'Failed to analyze leads');
  }

  return response.json();
}
