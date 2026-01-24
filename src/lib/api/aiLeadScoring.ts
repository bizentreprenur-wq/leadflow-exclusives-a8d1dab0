import { API_BASE_URL, getAuthHeaders, USE_MOCK_AUTH } from './config';

export interface ScoredLead {
  id: string;
  name: string;
  score: number;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  successProbability: number; // 0-100
  recommendedAction: 'call' | 'email' | 'both';
  callScore: number; // 0-100 - how likely to convert via call
  emailScore: number; // 0-100 - how likely to convert via email
  urgency: 'immediate' | 'this_week' | 'nurture';
  painPoints: string[];
  bestTimeToContact?: string;
}

export interface LeadPrioritization {
  hot: string[];
  warm: string[];
  nurture: string[];
  insights: string;
  scored?: ScoredLead[];
}

export interface LeadInsights {
  patterns: string[];
  recommendations: string[];
  painPoints: string[];
  talkingPoints: string[];
}

export interface EmailAngle {
  id: string;
  subject_line: string;
  opening_hook: string;
  cta: string;
  tone: 'professional' | 'casual' | 'urgent';
}

export interface AIAnalysisResponse<T> {
  success: boolean;
  results?: T;
  method?: 'ai_powered' | 'rule_based';
  error?: string;
}

/**
 * Local AI scoring algorithm - works without backend
 * Uses rule-based analysis of lead data to predict conversion
 */
function scoreLeadLocally(lead: any): ScoredLead {
  const analysis = lead.websiteAnalysis || {};
  let score = 50; // Base score
  let callScore = 50;
  let emailScore = 50;
  const painPoints: string[] = [];
  
  // === WEBSITE ANALYSIS SCORING ===
  
  // No website = HIGH priority (need web services)
  if (!lead.website || analysis.hasWebsite === false) {
    score += 25;
    callScore += 20; // Better to call - explain value
    emailScore += 10;
    painPoints.push('No online presence - missing potential customers');
  }
  
  // Has website but needs upgrade
  if (analysis.needsUpgrade) {
    score += 15;
    emailScore += 15; // Can show examples in email
    painPoints.push('Outdated website hurting credibility');
  }
  
  // Specific issues add urgency
  if (analysis.issues?.length > 0) {
    score += Math.min(analysis.issues.length * 5, 20);
    
    if (analysis.issues.includes('Not mobile responsive')) {
      score += 10;
      painPoints.push('Losing 60% of mobile visitors');
    }
    if (analysis.issues.includes('Broken links detected')) {
      score += 8;
      painPoints.push('Broken links damaging SEO');
    }
    if (analysis.issues.includes('No SSL certificate')) {
      score += 12;
      callScore += 10; // Urgent - needs call
      painPoints.push('Security warning scaring customers away');
    }
    if (analysis.issues.includes('Slow server response')) {
      score += 8;
      painPoints.push('Slow website losing impatient visitors');
    }
    if (analysis.issues.includes('Poor Core Web Vitals')) {
      score += 7;
      painPoints.push('Google ranking penalized by poor performance');
    }
    
    // NEW: No Facebook Pixel or Google Tag
    if (analysis.issues.includes('No Facebook Pixel installed')) {
      score += 10;
      emailScore += 8;
      painPoints.push('Missing Facebook Pixel - wasting ad spend with no tracking');
    }
    if (analysis.issues.includes('No Google Analytics or Tag Manager')) {
      score += 10;
      emailScore += 8;
      painPoints.push('No visitor tracking - flying blind on marketing ROI');
    }
    
    // NEW: No booking system or contact funnel
    if (analysis.issues.includes('No booking system or contact funnel')) {
      score += 15;
      callScore += 12;
      painPoints.push('No way for customers to book - losing leads every day');
    }
    if (analysis.issues.includes('No online booking system')) {
      score += 8;
      painPoints.push('Missing online booking - friction in customer journey');
    }
    
    // NEW: Social media issues
    if (analysis.issues.includes('No social media presence linked')) {
      score += 10;
      painPoints.push('No social proof - customers can\'t find them online');
    }
    if (analysis.issues.includes('Weak social media presence (only 1 platform)')) {
      score += 5;
      painPoints.push('Weak social presence - missing audience on other platforms');
    }
    
    // NEW: Severely outdated website
    if (analysis.issues.includes('Severely outdated website (needs complete rebuild)')) {
      score += 20;
      callScore += 15;
      painPoints.push('Website is severely outdated - embarrassing online presence');
    }
    
    // NEW: Spending on ads but leaking leads
    if (analysis.issues.includes('Spending on ads but no conversion tracking (leaking leads)')) {
      score += 18;
      callScore += 15;
      emailScore += 10;
      painPoints.push('Running ads with no tracking - money going down the drain');
    }
    
    // NEW: No clear CTAs
    if (analysis.issues.includes('No clear call-to-action buttons')) {
      score += 8;
      painPoints.push('No clear call-to-action - visitors don\'t know what to do');
    }
  }
  
  // Mobile score impacts conversion
  if (analysis.mobileScore !== null) {
    if (analysis.mobileScore < 50) {
      score += 15;
      painPoints.push(`Mobile score ${analysis.mobileScore}/100 - needs urgent fix`);
    } else if (analysis.mobileScore < 70) {
      score += 8;
      painPoints.push(`Mobile score ${analysis.mobileScore}/100 - room for improvement`);
    }
  }
  
  // Platform indicates opportunity
  const outdatedPlatforms = ['Wix', 'Weebly', 'GoDaddy', 'Joomla'];
  if (analysis.platform && outdatedPlatforms.includes(analysis.platform)) {
    score += 10;
    emailScore += 10; // Can share comparison in email
    painPoints.push(`${analysis.platform} limits growth - time to upgrade`);
  }
  
  // === CONTACT DATA SCORING ===
  
  // Has phone = can call
  if (lead.phone) {
    callScore += 15;
  } else {
    callScore -= 30; // Can't call without phone
  }
  
  // Has email = can email
  if (lead.email) {
    emailScore += 20;
  } else {
    emailScore -= 20; // Email less effective without direct contact
  }
  
  // Rating indicates business health
  if (lead.rating) {
    if (lead.rating >= 4.5) {
      score += 10; // Healthy business, likely has budget
      callScore += 5;
    } else if (lead.rating < 3.5) {
      score += 15; // Needs help desperately
      callScore += 10;
      painPoints.push('Low ratings hurting reputation - need improvement');
    }
    // NEW: Zero or very few reviews
    if (lead.rating === 0 || lead.reviewCount === 0) {
      score += 12;
      callScore += 8;
      painPoints.push('Zero reviews - no social proof, losing trust');
    }
  } else {
    // No rating data at all
    score += 8;
    painPoints.push('No online reviews found - missing credibility');
  }
  
  // === CALCULATE FINAL SCORES ===
  
  // Cap scores at 0-100
  score = Math.max(0, Math.min(100, score));
  callScore = Math.max(0, Math.min(100, callScore));
  emailScore = Math.max(0, Math.min(100, emailScore));
  
  // Success probability is weighted average
  const successProbability = Math.round(score * 0.7 + Math.max(callScore, emailScore) * 0.3);
  
  // Determine priority
  let priority: 'high' | 'medium' | 'low';
  if (score >= 70) priority = 'high';
  else if (score >= 45) priority = 'medium';
  else priority = 'low';
  
  // Determine recommended action
  let recommendedAction: 'call' | 'email' | 'both';
  const actionDiff = Math.abs(callScore - emailScore);
  if (actionDiff < 15) {
    recommendedAction = 'both';
  } else if (callScore > emailScore) {
    recommendedAction = 'call';
  } else {
    recommendedAction = 'email';
  }
  
  // Determine urgency
  let urgency: 'immediate' | 'this_week' | 'nurture';
  if (priority === 'high' && (painPoints.length >= 2 || score >= 80)) {
    urgency = 'immediate';
  } else if (priority === 'high' || priority === 'medium') {
    urgency = 'this_week';
  } else {
    urgency = 'nurture';
  }
  
  // Generate reasoning
  const topPainPoints = painPoints.slice(0, 3);
  const reasoning = topPainPoints.length > 0 
    ? `${topPainPoints.join('. ')}. ${recommendedAction === 'call' ? 'Best reached by phone.' : recommendedAction === 'email' ? 'Best reached by email.' : 'Try both channels.'}`
    : 'Standard lead - follow up with general outreach.';
  
  return {
    id: lead.id,
    name: lead.name || lead.business_name || 'Unknown Business',
    score,
    priority,
    reasoning,
    successProbability,
    recommendedAction,
    callScore,
    emailScore,
    urgency,
    painPoints: topPainPoints,
    bestTimeToContact: priority === 'high' ? 'Morning (9-11am)' : 'Afternoon (2-4pm)',
  };
}

/**
 * Sort leads by priority and score
 */
function sortByPriority(leads: ScoredLead[]): ScoredLead[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return [...leads].sort((a, b) => {
    // First by priority
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    // Then by score (highest first)
    return b.score - a.score;
  });
}

/**
 * Get AI-powered lead scores - uses local scoring in demo mode
 */
export async function getAILeadScores(leads: any[]): Promise<AIAnalysisResponse<ScoredLead[]>> {
  // Use local scoring in demo mode or if no API
  if (USE_MOCK_AUTH || !API_BASE_URL) {
    console.log('[AI Scoring] Using local rule-based scoring for', leads.length, 'leads');
    const scored = leads.map(scoreLeadLocally);
    const sorted = sortByPriority(scored);
    return {
      success: true,
      results: sorted,
      method: 'rule_based',
    };
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/ai-lead-scoring.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ leads, type: 'score' }),
    });
    
    if (!response.ok) {
      // Fall back to local scoring
      console.log('[AI Scoring] API failed, falling back to local scoring');
      const scored = leads.map(scoreLeadLocally);
      return { success: true, results: sortByPriority(scored), method: 'rule_based' };
    }
    
    const data = await response.json();
    // Ensure sorted by priority
    if (data.results) {
      data.results = sortByPriority(data.results);
    }
    return data;
  } catch (error) {
    console.error('AI scoring error:', error);
    // Fall back to local scoring
    const scored = leads.map(scoreLeadLocally);
    return { success: true, results: sortByPriority(scored), method: 'rule_based' };
  }
}

/**
 * Get AI-powered lead prioritization
 */
export async function getAILeadPrioritization(leads: any[]): Promise<AIAnalysisResponse<LeadPrioritization>> {
  // Use local scoring in demo mode
  if (USE_MOCK_AUTH || !API_BASE_URL) {
    const scored = leads.map(scoreLeadLocally);
    const sorted = sortByPriority(scored);
    return {
      success: true,
      results: {
        hot: sorted.filter(l => l.priority === 'high').map(l => l.id),
        warm: sorted.filter(l => l.priority === 'medium').map(l => l.id),
        nurture: sorted.filter(l => l.priority === 'low').map(l => l.id),
        insights: `Found ${sorted.filter(l => l.priority === 'high').length} hot leads ready for immediate outreach. Focus on these first for best ROI.`,
        scored: sorted,
      },
      method: 'rule_based',
    };
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/ai-lead-scoring.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ leads, type: 'prioritize' }),
    });
    
    if (!response.ok) {
      return { success: false, error: 'Failed to prioritize leads' };
    }
    
    return response.json();
  } catch (error) {
    console.error('AI prioritization error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get AI-powered lead insights
 */
export async function getAILeadInsights(leads: any[]): Promise<AIAnalysisResponse<LeadInsights>> {
  // Use local insights in demo mode
  if (USE_MOCK_AUTH || !API_BASE_URL) {
    const scored = leads.map(scoreLeadLocally);
    const allPainPoints = scored.flatMap(l => l.painPoints);
    const uniquePainPoints = [...new Set(allPainPoints)];
    
    const hotCount = scored.filter(l => l.priority === 'high').length;
    const noWebsiteCount = scored.filter(l => l.painPoints.some(p => p.includes('No online presence'))).length;
    const mobileIssues = scored.filter(l => l.painPoints.some(p => p.includes('mobile') || p.includes('Mobile'))).length;
    
    return {
      success: true,
      results: {
        patterns: [
          `${hotCount} leads are hot prospects ready for immediate outreach`,
          `${noWebsiteCount} businesses have no website - high opportunity`,
          `${mobileIssues} leads have mobile issues affecting their business`,
        ].filter(p => !p.startsWith('0')),
        recommendations: [
          hotCount > 0 ? `Call your ${hotCount} hot leads first - they have the highest conversion probability` : '',
          noWebsiteCount > 0 ? `${noWebsiteCount} leads need websites - lead with portfolio examples` : '',
          mobileIssues > 0 ? `Show mobile comparison screenshots to ${mobileIssues} leads with mobile issues` : '',
          'Use the AI Email Writer to generate personalized pitches for each pain point',
        ].filter(Boolean),
        painPoints: uniquePainPoints.slice(0, 8),
        talkingPoints: [
          'Ask about their current customer acquisition costs',
          'Inquire about their biggest business challenge this quarter',
          'Mention specific issues you found on their website',
          'Offer a free audit or consultation as a hook',
        ],
      },
      method: 'rule_based',
    };
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/ai-lead-scoring.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ leads, type: 'insights' }),
    });
    
    if (!response.ok) {
      return { success: false, error: 'Failed to get insights' };
    }
    
    return response.json();
  } catch (error) {
    console.error('AI insights error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get AI-powered email angle suggestions
 */
export async function getAIEmailAngles(leads: any[]): Promise<AIAnalysisResponse<EmailAngle[]>> {
  // Use local angles in demo mode
  if (USE_MOCK_AUTH || !API_BASE_URL) {
    const angles: EmailAngle[] = [
      {
        id: 'no-website',
        subject_line: 'Quick question about [Business Name]\'s online presence',
        opening_hook: 'I noticed your business doesn\'t have a website yet, and I think you might be missing out on local customers searching for your services.',
        cta: 'Would you be open to a 10-minute call to explore how a simple website could bring in more customers?',
        tone: 'casual',
      },
      {
        id: 'mobile-issues',
        subject_line: 'Your website on mobile - found something important',
        opening_hook: 'I was checking out your business on my phone and noticed a few things that might be costing you customers.',
        cta: 'I put together a quick video showing what I found. Want me to send it over?',
        tone: 'professional',
      },
      {
        id: 'outdated-platform',
        subject_line: 'Time to upgrade from [Platform]?',
        opening_hook: 'I see you\'re using [Platform] for your website. While it got you started, it might be limiting your growth now.',
        cta: 'I\'d love to show you what a modern website could do for your business. Free consultation, no strings attached.',
        tone: 'professional',
      },
    ];
    
    return { success: true, results: angles, method: 'rule_based' };
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/ai-lead-scoring.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ leads, type: 'email_angle' }),
    });
    
    if (!response.ok) {
      return { success: false, error: 'Failed to get email angles' };
    }
    
    return response.json();
  } catch (error) {
    console.error('AI email angles error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Analyze a single lead with AI
 */
export async function analyzeLeadWithAI(lead: any): Promise<{
  score: number;
  priority: string;
  insights: string[];
  emailAngle: EmailAngle | null;
  successProbability: number;
  recommendedAction: 'call' | 'email' | 'both';
}> {
  const scored = scoreLeadLocally(lead);
  const [angleResult] = await Promise.all([
    getAIEmailAngles([lead]),
  ]);
  
  const emailAngle = angleResult.results?.[0] || null;
  
  return {
    score: scored.score,
    priority: scored.priority,
    insights: scored.painPoints.length > 0 ? scored.painPoints : [scored.reasoning],
    emailAngle,
    successProbability: scored.successProbability,
    recommendedAction: scored.recommendedAction,
  };
}

/**
 * Quick score leads and sort by priority - for use in Dashboard after search
 */
export function quickScoreLeads(leads: any[]): any[] {
  const scored = leads.map(lead => {
    const analysis = scoreLeadLocally(lead);
    return {
      ...lead,
      aiClassification: analysis.priority === 'high' ? 'hot' : analysis.priority === 'medium' ? 'warm' : 'cold',
      leadScore: analysis.score,
      successProbability: analysis.successProbability,
      recommendedAction: analysis.recommendedAction,
      callScore: analysis.callScore,
      emailScore: analysis.emailScore,
      urgency: analysis.urgency,
      painPoints: analysis.painPoints,
      readyToCall: lead.phone && analysis.callScore >= 50,
    };
  });
  
  // Sort by priority (hot first) then by score
  const priorityOrder = { hot: 0, warm: 1, cold: 2 };
  return scored.sort((a, b) => {
    const priorityDiff = priorityOrder[a.aiClassification as keyof typeof priorityOrder] - priorityOrder[b.aiClassification as keyof typeof priorityOrder];
    if (priorityDiff !== 0) return priorityDiff;
    return (b.leadScore || 0) - (a.leadScore || 0);
  });
}
