/**
 * AI Calling Script Generator
 * Generates intelligent call scripts based on:
 * - Search type (A: GMB / B: Platform)
 * - AI Strategy selected
 * - Lead intelligence data
 * - PreDone documents
 * - Email drip sequences
 * - Customer journey breadcrumbs
 */

import { AIStrategy, StrategyContext } from './aiStrategyEngine';

export interface CallScriptContext {
  // Search context
  searchType: 'gmb' | 'platform' | null;
  searchQuery?: string;
  searchLocation?: string;
  
  // Strategy context
  selectedStrategy?: AIStrategy;
  strategyApproach?: string;
  
  // Lead intelligence
  leadName?: string;
  businessName?: string;
  businessType?: string;
  industry?: string;
  phoneNumber?: string;
  websiteUrl?: string;
  
  // Website analysis from Step 2
  hasWebsite?: boolean;
  websiteScore?: number;
  websiteIssues?: string[];
  painPoints?: string[];
  mobileScore?: number;
  reviewCount?: number;
  
  // Email context - what emails were sent
  emailSequenceId?: string;
  emailSequenceName?: string;
  emailStepsSent?: number;
  lastEmailSubject?: string;
  
  // PreDone documents context
  proposalType?: string;
  contractType?: string;
  
  // Customer journey breadcrumbs
  breadcrumbs?: CustomerJourneyBreadcrumb[];
}

export interface CustomerJourneyBreadcrumb {
  step: string;
  action: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface GeneratedCallScript {
  greeting: string;
  introduction: string;
  valueProposition: string;
  qualifyingQuestions: string[];
  objectionHandlers: { objection: string; response: string }[];
  closingStatement: string;
  fallbackMessage: string;
  // Metadata
  generatedFor: string;
  searchTypeContext: string;
  strategyUsed: string;
  emailSequenceReference?: string;
  toneStyle: string;
}

export type ScriptTone = 'professional' | 'friendly' | 'direct' | 'conversational';

/**
 * Generate a comprehensive call script from all available context
 */
export function generateCallScript(
  context: CallScriptContext,
  tone: ScriptTone = 'professional'
): GeneratedCallScript {
  const isSearchA = context.searchType === 'gmb';
  const isSearchB = context.searchType === 'platform';
  
  const businessName = context.businessName || context.leadName || 'there';
  const industry = context.industry || context.businessType || 'your industry';
  const location = context.searchLocation || 'your area';
  const query = context.searchQuery || industry;
  
  // Build value proposition based on search type and strategy
  const valueProposition = buildValueProposition(context, isSearchA);
  
  // Build qualifying questions based on intelligence
  const qualifyingQuestions = buildQualifyingQuestions(context, isSearchA);
  
  // Build objection handlers based on strategy
  const objectionHandlers = buildObjectionHandlers(context, tone);
  
  return {
    greeting: buildGreeting(context, tone),
    introduction: buildIntroduction(context, isSearchA, tone),
    valueProposition,
    qualifyingQuestions,
    objectionHandlers,
    closingStatement: buildClosing(context, tone),
    fallbackMessage: buildFallback(context),
    // Metadata
    generatedFor: businessName,
    searchTypeContext: isSearchA ? 'Super AI Business Search (GMB)' : isSearchB ? 'Agency Lead Finder' : 'General',
    strategyUsed: context.selectedStrategy?.name || 'AI Auto-Select',
    emailSequenceReference: context.emailSequenceName,
    toneStyle: tone,
  };
}

function buildGreeting(context: CallScriptContext, tone: ScriptTone): string {
  const leadName = context.leadName || 'there';
  const timeOfDay = getTimeOfDay();
  
  const greetings: Record<ScriptTone, string> = {
    professional: `Good ${timeOfDay}, this is [Your Name] calling from BamLead. Am I speaking with ${leadName}?`,
    friendly: `Hi ${leadName}! This is [Your Name] from BamLead. How are you doing today?`,
    direct: `Hello ${leadName}, I'm [Your Name] from BamLead. I'll be brief - got 2 minutes?`,
    conversational: `Hey ${leadName}, this is [Your Name] over at BamLead. Caught you at a good time?`,
  };
  
  return greetings[tone];
}

function buildIntroduction(
  context: CallScriptContext,
  isSearchA: boolean,
  tone: ScriptTone
): string {
  const businessName = context.businessName || 'your business';
  const industry = context.industry || context.businessType || 'businesses';
  const strategy = context.selectedStrategy;
  
  // Reference email if one was sent
  const emailReference = context.lastEmailSubject 
    ? `I recently sent you an email about "${context.lastEmailSubject}" - did you have a chance to look at it? `
    : '';
  
  // Build introduction based on strategy approach
  if (strategy?.approach === 'problem-agitate' && context.websiteIssues?.length) {
    return `${emailReference}I was analyzing ${industry} businesses in your area and noticed some things about ${businessName}'s online presence that I think you'd want to know about.`;
  }
  
  if (strategy?.approach === 'personalized-audit' && context.painPoints?.length) {
    return `${emailReference}I ran a detailed analysis on ${businessName} and found ${context.painPoints.length} specific opportunities to improve your visibility online.`;
  }
  
  if (strategy?.approach === 'value-first') {
    return `${emailReference}I help ${industry} businesses get more customers through better online visibility. I came across ${businessName} and thought we might be able to help.`;
  }
  
  if (strategy?.approach === 'social-proof') {
    return `${emailReference}I just helped a ${industry} business similar to yours increase their leads by 340%. I thought you might be interested in hearing how we did it.`;
  }
  
  // Default introduction based on search type
  if (isSearchA) {
    return `${emailReference}I work with local ${industry} businesses to improve their online presence and get more customers. I found ${businessName} during my research and noticed some opportunities.`;
  }
  
  return `${emailReference}I help ${industry} businesses grow their client base through digital marketing. I was researching companies like ${businessName} and thought we might be a good fit to work together.`;
}

function buildValueProposition(context: CallScriptContext, isSearchA: boolean): string {
  const strategy = context.selectedStrategy;
  const industry = context.industry || 'businesses';
  const location = context.searchLocation || 'your area';
  
  // Use pain points if available
  if (context.painPoints?.length) {
    const painPoint = context.painPoints[0];
    return `Based on my analysis, I noticed ${painPoint}. We've helped over 50 ${industry} in ${location} fix exactly this issue, typically seeing a 40% increase in leads within the first 90 days.`;
  }
  
  // Use website issues if available
  if (context.websiteIssues?.length) {
    return `Your website has some issues that are likely costing you customers - specifically ${context.websiteIssues[0]}. We specialize in fixing these exact problems for ${industry} businesses.`;
  }
  
  // Use strategy-specific value prop
  if (strategy?.approach === 'urgency') {
    return `I'm reaching out because I have 3 spots open this month for new ${industry} clients in ${location}. Given what I've seen about your business, you'd be a great fit.`;
  }
  
  if (strategy?.approach === 'educational') {
    return `Quick insight - most ${industry} businesses miss 70% of potential customers because they don't show up properly in local searches. I can show you exactly where you stand.`;
  }
  
  // Default value proposition
  return `We've helped over 50 ${industry} businesses in ${location} increase their leads by an average of 40% in the first 90 days. Our AI-powered system finds and qualifies leads automatically so you can focus on what you do best.`;
}

function buildQualifyingQuestions(context: CallScriptContext, isSearchA: boolean): string[] {
  const questions: string[] = [];
  const industry = context.industry || 'your business';
  
  // Base questions
  questions.push(`What's your biggest challenge right now when it comes to finding new customers?`);
  questions.push(`On a scale of 1-10, how satisfied are you with your current lead generation efforts?`);
  
  // Context-specific questions
  if (context.hasWebsite === false) {
    questions.push(`Have you considered having a website built? What's held you back so far?`);
  }
  
  if (context.reviewCount !== undefined && context.reviewCount < 10) {
    questions.push(`I noticed you have ${context.reviewCount} reviews. Are you actively trying to get more customer reviews?`);
  }
  
  if (context.websiteScore !== undefined && context.websiteScore < 50) {
    questions.push(`How important is your website to your business? Do most of your customers find you online?`);
  }
  
  // Email sequence reference
  if (context.emailStepsSent && context.emailStepsSent > 0) {
    questions.push(`I've sent you ${context.emailStepsSent} emails with some insights. Did any of those resonate with you?`);
  }
  
  questions.push(`Who typically handles marketing and lead follow-up for ${context.businessName || industry}?`);
  questions.push(`If you could wave a magic wand, what would your ideal customer pipeline look like?`);
  
  return questions.slice(0, 5); // Max 5 questions
}

function buildObjectionHandlers(
  context: CallScriptContext,
  tone: ScriptTone
): { objection: string; response: string }[] {
  const handlers = [
    {
      objection: "I'm not interested",
      response: "I completely understand. Before I let you go, may I ask - is it the timing, or have you already solved this problem another way?"
    },
    {
      objection: "We're already working with someone",
      response: "That's great to hear! Out of curiosity, what do you like most about what they're doing? I'd love to know what's working in your market."
    },
    {
      objection: "Send me some information",
      response: "Absolutely! To make sure I send you the most relevant case studies, what's your biggest priority right now - more leads, better quality leads, or saving time?"
    },
    {
      objection: "This isn't a good time",
      response: "No problem at all. When would be a better time for a 5-minute call this week? I promise to be brief and bring real value."
    },
    {
      objection: "How much does it cost?",
      response: "Great question! Our pricing depends on your specific needs. To give you an accurate quote, can you tell me a bit about what you're looking to accomplish?"
    }
  ];
  
  // Add context-specific handlers
  if (context.websiteIssues?.length) {
    handlers.push({
      objection: "Our website is fine",
      response: `I hear you, and I'm sure it serves you well. The issues I found are technical things most people wouldn't notice - but they can affect how Google shows your business to potential customers. Would you like to see what I mean?`
    });
  }
  
  if (context.emailSequenceName) {
    handlers.push({
      objection: "I've been getting your emails",
      response: `Yes! I wanted to follow up personally because I think there's a real opportunity here for ${context.businessName || 'your business'}. Did any of those insights stand out to you?`
    });
  }
  
  return handlers;
}

function buildClosing(context: CallScriptContext, tone: ScriptTone): string {
  const businessName = context.businessName || 'your business';
  
  const closings: Record<ScriptTone, string> = {
    professional: `Based on what you've shared, I'd love to show you exactly how we can help ${businessName}. Would you have 15 minutes this week for a quick demo?`,
    friendly: `This sounds like it could be a really good fit! Want to grab a virtual coffee this week and I can show you how it all works?`,
    direct: `You're clearly a good fit for what we do. Let's book 15 minutes. When works for you?`,
    conversational: `I think you'd really like what we've built. How about we hop on a quick call later this week to dig deeper?`,
  };
  
  return closings[tone];
}

function buildFallback(context: CallScriptContext): string {
  const proposalMention = context.proposalType 
    ? ` I can also include a customized ${context.proposalType} showing exactly what we'd do for you.`
    : '';
  
  return `I understand you're busy. Could I send you some information via email and follow up later this week?${proposalMention}`;
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/**
 * Build context from stored session data
 */
export function buildCallScriptContext(): CallScriptContext {
  const context: CallScriptContext = {
    searchType: null,
    breadcrumbs: [],
  };
  
  try {
    // Get search context
    const searchType = sessionStorage.getItem('bamlead_search_type') as 'gmb' | 'platform' | null;
    context.searchType = searchType;
    context.searchQuery = sessionStorage.getItem('bamlead_search_query') || undefined;
    context.searchLocation = sessionStorage.getItem('bamlead_search_location') || undefined;
    
    // Get strategy
    const strategyData = localStorage.getItem('bamlead_selected_strategy');
    if (strategyData) {
      const parsed = JSON.parse(strategyData);
      context.selectedStrategy = parsed.strategy;
      context.strategyApproach = parsed.strategy?.approach;
    }
    
    // Get lead context
    const leadData = sessionStorage.getItem('bamlead_current_lead');
    if (leadData) {
      const lead = JSON.parse(leadData);
      context.leadName = lead.name || lead.title;
      context.businessName = lead.business || lead.name;
      context.industry = lead.industry || lead.category;
      context.phoneNumber = lead.phone;
      context.websiteUrl = lead.website;
      context.reviewCount = lead.review_count || lead.reviews;
    }
    
    // Get website analysis
    const analysisData = sessionStorage.getItem('bamlead_lead_analysis');
    if (analysisData) {
      const analysis = JSON.parse(analysisData);
      context.hasWebsite = analysis.hasWebsite;
      context.websiteScore = analysis.score;
      context.websiteIssues = analysis.issues;
      context.painPoints = analysis.painPoints;
      context.mobileScore = analysis.mobileScore;
    }
    
    // Get email sequence context
    const emailData = localStorage.getItem('bamlead_active_sequence');
    if (emailData) {
      const email = JSON.parse(emailData);
      context.emailSequenceId = email.id;
      context.emailSequenceName = email.name;
      context.emailStepsSent = email.stepsSent;
      context.lastEmailSubject = email.lastSubject;
    }
    
    // Get document context
    const docsData = sessionStorage.getItem('bamlead_selected_documents');
    if (docsData) {
      const docs = JSON.parse(docsData);
      context.proposalType = docs.proposalType;
      context.contractType = docs.contractType;
    }
    
    // Build breadcrumbs from various sources
    const breadcrumbs: CustomerJourneyBreadcrumb[] = [];
    
    if (context.searchType) {
      breadcrumbs.push({
        step: 'Search',
        action: context.searchType === 'gmb' ? 'Super AI Business Search' : 'Agency Lead Finder',
        timestamp: new Date().toISOString(),
        details: { query: context.searchQuery, location: context.searchLocation }
      });
    }
    
    if (context.selectedStrategy) {
      breadcrumbs.push({
        step: 'Strategy',
        action: `Selected: ${context.selectedStrategy.name}`,
        timestamp: new Date().toISOString(),
        details: { approach: context.selectedStrategy.approach }
      });
    }
    
    if (context.emailSequenceName) {
      breadcrumbs.push({
        step: 'Email',
        action: `Sequence: ${context.emailSequenceName}`,
        timestamp: new Date().toISOString(),
        details: { stepsSent: context.emailStepsSent }
      });
    }
    
    context.breadcrumbs = breadcrumbs;
    
  } catch (error) {
    console.error('Error building call script context:', error);
  }
  
  return context;
}

/**
 * Storage key for editable scripts
 */
const SCRIPT_STORAGE_KEY = 'bamlead_call_script';

/**
 * Save edited script to localStorage
 */
export function saveEditedScript(script: GeneratedCallScript, userId?: string): void {
  try {
    const key = userId ? `${SCRIPT_STORAGE_KEY}_${userId}` : SCRIPT_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify({
      script,
      savedAt: new Date().toISOString(),
      isEdited: true,
    }));
  } catch {}
}

/**
 * Get saved script from localStorage
 */
export function getSavedScript(userId?: string): GeneratedCallScript | null {
  try {
    const key = userId ? `${SCRIPT_STORAGE_KEY}_${userId}` : SCRIPT_STORAGE_KEY;
    const data = localStorage.getItem(key);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return parsed.script as GeneratedCallScript;
  } catch {
    return null;
  }
}

/**
 * Clear saved script
 */
export function clearSavedScript(userId?: string): void {
  try {
    const key = userId ? `${SCRIPT_STORAGE_KEY}_${userId}` : SCRIPT_STORAGE_KEY;
    localStorage.removeItem(key);
  } catch {}
}
