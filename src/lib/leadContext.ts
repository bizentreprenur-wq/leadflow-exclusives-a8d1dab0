// Lead Context Utility for Email Personalization
// This module provides rich lead analysis data to email campaigns

export interface LeadAnalysisContext {
  // Basic info
  id: string;
  businessName: string;
  email?: string;
  phone?: string;
  website?: string;
  
  // AI Classification
  aiClassification?: 'hot' | 'warm' | 'cold';
  leadScore?: number;
  successProbability?: number;
  recommendedAction?: 'call' | 'email' | 'both';
  
  // Website Analysis
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform?: string;
    needsUpgrade: boolean;
    mobileScore?: number;
    loadTime?: number;
    issues: string[];
    opportunities: string[];
  };
  
  // AI Insights
  painPoints?: string[];
  talkingPoints?: string[];
  aiInsights?: string[];
  recommendedApproach?: string;
  urgency?: 'immediate' | 'this_week' | 'nurture';
  
  // Search context
  searchType?: 'gmb' | 'platform';
  searchQuery?: string;
  searchLocation?: string;
}

// Get lead context from storage
export function getStoredLeadContext(): LeadAnalysisContext[] {
  try {
    // Try sessionStorage first (current search results)
    const sessionResults = sessionStorage.getItem('bamlead_search_results');
    if (sessionResults) {
      const leads = JSON.parse(sessionResults);
      return leads.map(mapLeadToContext);
    }
    
    // Fall back to localStorage
    const localResults = localStorage.getItem('bamlead_search_results');
    if (localResults) {
      const leads = JSON.parse(localResults);
      return leads.map(mapLeadToContext);
    }
    
    return [];
  } catch {
    return [];
  }
}

// Map raw lead data to context
function mapLeadToContext(lead: any): LeadAnalysisContext {
  const websiteAnalysis = lead.websiteAnalysis || lead.website_analysis;
  
  return {
    id: lead.id || lead.lead_id || '',
    businessName: lead.business_name || lead.name || 'Unknown',
    email: lead.email,
    phone: lead.phone,
    website: lead.website,
    
    aiClassification: lead.aiClassification || lead.ai_classification,
    leadScore: lead.leadScore || lead.lead_score,
    successProbability: lead.successProbability || lead.success_probability,
    recommendedAction: lead.recommendedAction || lead.recommended_action,
    
    websiteAnalysis: websiteAnalysis ? {
      hasWebsite: websiteAnalysis.hasWebsite ?? !!lead.website,
      platform: websiteAnalysis.platform,
      needsUpgrade: websiteAnalysis.needsUpgrade ?? false,
      mobileScore: websiteAnalysis.mobileScore,
      loadTime: websiteAnalysis.loadTime,
      issues: websiteAnalysis.issues || lead.websiteIssues || [],
      opportunities: websiteAnalysis.opportunities || [],
    } : {
      hasWebsite: !!lead.website,
      platform: undefined,
      needsUpgrade: false,
      mobileScore: undefined,
      loadTime: undefined,
      issues: lead.websiteIssues || [],
      opportunities: [],
    },
    
    painPoints: lead.painPoints || lead.pain_points || [],
    talkingPoints: lead.talkingPoints || lead.talking_points || [],
    aiInsights: lead.aiInsights || lead.ai_insights || [],
    recommendedApproach: lead.recommendedApproach || lead.recommended_approach,
    urgency: lead.urgency,
    
    searchType: sessionStorage.getItem('bamlead_search_type') as 'gmb' | 'platform' || undefined,
    searchQuery: sessionStorage.getItem('bamlead_query') || localStorage.getItem('bamlead_query') || undefined,
    searchLocation: sessionStorage.getItem('bamlead_location') || localStorage.getItem('bamlead_location') || undefined,
  };
}

// Find context for a specific lead by email or ID
export function getLeadContextByEmail(email: string): LeadAnalysisContext | null {
  const allContexts = getStoredLeadContext();
  return allContexts.find(c => c.email === email) || null;
}

export function getLeadContextById(id: string): LeadAnalysisContext | null {
  const allContexts = getStoredLeadContext();
  return allContexts.find(c => c.id === id) || null;
}

// Generate personalization variables from lead context
export function generatePersonalizationFromContext(context: LeadAnalysisContext): Record<string, string> {
  const personalization: Record<string, string> = {
    business_name: context.businessName,
    first_name: context.businessName.split(' ')[0] || context.businessName,
  };
  
  if (context.email) personalization.email = context.email;
  if (context.phone) personalization.phone = context.phone;
  if (context.website) personalization.website = context.website;
  
  // Add website status
  if (context.websiteAnalysis) {
    const wa = context.websiteAnalysis;
    personalization.website_status = wa.hasWebsite ? 'has website' : 'no website';
    personalization.website_platform = wa.platform || 'unknown';
    personalization.website_issues = wa.issues.slice(0, 3).join(', ') || 'none detected';
    personalization.mobile_score = wa.mobileScore ? `${wa.mobileScore}%` : 'not tested';
    personalization.needs_upgrade = wa.needsUpgrade ? 'yes' : 'no';
  }
  
  // Add pain points
  if (context.painPoints?.length) {
    personalization.main_pain_point = context.painPoints[0];
    personalization.pain_points = context.painPoints.slice(0, 3).join(', ');
  }
  
  // Add AI classification
  if (context.aiClassification) {
    personalization.lead_priority = context.aiClassification;
  }
  
  // Add recommended approach
  if (context.recommendedApproach) {
    personalization.recommended_approach = context.recommendedApproach;
  }
  
  // Add talking points
  if (context.talkingPoints?.length) {
    personalization.talking_points = context.talkingPoints.slice(0, 3).join('; ');
  }
  
  return personalization;
}

// Generate AI-powered email content suggestions based on context
export function generateEmailSuggestionsFromContext(context: LeadAnalysisContext): {
  subjectHints: string[];
  openingHints: string[];
  ctaHints: string[];
  toneRecommendation: string;
} {
  const subjectHints: string[] = [];
  const openingHints: string[] = [];
  const ctaHints: string[] = [];
  let toneRecommendation = 'professional and friendly';
  
  // No website leads
  if (!context.websiteAnalysis?.hasWebsite) {
    subjectHints.push(
      `${context.businessName} - Noticed you're missing online visibility`,
      `Quick question about ${context.businessName}'s web presence`,
      `Helping ${context.businessName} get found online`
    );
    openingHints.push(
      `I noticed ${context.businessName} doesn't have a website yet, and I wanted to reach out because...`,
      `While researching businesses in your area, I saw that ${context.businessName} isn't showing up online...`,
      `Many of your competitors are attracting customers online while ${context.businessName} is missing out...`
    );
    ctaHints.push(
      'Would you be open to a 10-minute call to discuss your options?',
      'Can I send you a free mock-up of what your site could look like?',
      'Would a quick website audit for your business be helpful?'
    );
  }
  
  // Website needs upgrade
  else if (context.websiteAnalysis?.needsUpgrade) {
    const issues = context.websiteAnalysis.issues.slice(0, 2).join(' and ') || 'performance issues';
    subjectHints.push(
      `${context.businessName} website improvement opportunity`,
      `I found some quick wins for ${context.businessName}'s website`,
      `${context.businessName} - Your website could be working harder`
    );
    openingHints.push(
      `I took a look at your website and noticed ${issues}...`,
      `Your website at ${context.website} has a lot of potential, but I noticed...`,
      `I've helped businesses like yours fix ${issues} and increase conversions...`
    );
    ctaHints.push(
      'Want me to send over a free site audit with specific recommendations?',
      'Can I show you what a refreshed version could look like?',
      'Would you like to see how similar businesses improved their sites?'
    );
  }
  
  // Hot leads
  if (context.aiClassification === 'hot') {
    toneRecommendation = 'direct and action-oriented - this lead is ready to buy';
    ctaHints.unshift('Let\'s hop on a quick call today to get started');
  } else if (context.aiClassification === 'cold') {
    toneRecommendation = 'educational and value-first - nurture before pitching';
  }
  
  // Add pain point specific suggestions
  if (context.painPoints?.length) {
    const painPoint = context.painPoints[0];
    openingHints.push(`I noticed ${context.businessName} might be struggling with ${painPoint}...`);
  }
  
  return {
    subjectHints,
    openingHints,
    ctaHints,
    toneRecommendation,
  };
}

// Store active lead context for email composition
export function setActiveLeadContext(context: LeadAnalysisContext): void {
  try {
    sessionStorage.setItem('bamlead_active_lead_context', JSON.stringify(context));
    sessionStorage.setItem('bamlead_active_lead_email', context.email || '');
  } catch {
    // Silent fail
  }
}

// Get active lead context
export function getActiveLeadContext(): LeadAnalysisContext | null {
  try {
    const stored = sessionStorage.getItem('bamlead_active_lead_context');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

// Save campaign leads with their full context for Autopilot
export function saveCampaignLeadsWithContext(leads: LeadAnalysisContext[]): void {
  try {
    localStorage.setItem('bamlead_campaign_leads_context', JSON.stringify(leads));
    localStorage.setItem('bamlead_campaign_leads_context_timestamp', new Date().toISOString());
  } catch {
    // Silent fail
  }
}

// Get campaign leads with context
export function getCampaignLeadsWithContext(): LeadAnalysisContext[] {
  try {
    const stored = localStorage.getItem('bamlead_campaign_leads_context');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}
