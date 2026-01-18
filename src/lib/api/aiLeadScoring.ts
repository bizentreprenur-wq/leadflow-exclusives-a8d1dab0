import { API_BASE_URL, getAuthHeaders } from './config';

export interface ScoredLead {
  id: string;
  name: string;
  score: number;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
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
 * Get AI-powered lead scores
 */
export async function getAILeadScores(leads: any[]): Promise<AIAnalysisResponse<ScoredLead[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/ai-lead-scoring.php`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ leads, type: 'score' }),
    });
    
    if (!response.ok) {
      return { success: false, error: 'Failed to score leads' };
    }
    
    return response.json();
  } catch (error) {
    console.error('AI scoring error:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get AI-powered lead prioritization
 */
export async function getAILeadPrioritization(leads: any[]): Promise<AIAnalysisResponse<LeadPrioritization>> {
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
}> {
  const [scoreResult, angleResult] = await Promise.all([
    getAILeadScores([lead]),
    getAIEmailAngles([lead]),
  ]);
  
  const scoredLead = scoreResult.results?.[0];
  const emailAngle = angleResult.results?.[0] || null;
  
  return {
    score: scoredLead?.score || 50,
    priority: scoredLead?.priority || 'medium',
    insights: scoredLead?.reasoning ? [scoredLead.reasoning] : [],
    emailAngle,
  };
}
