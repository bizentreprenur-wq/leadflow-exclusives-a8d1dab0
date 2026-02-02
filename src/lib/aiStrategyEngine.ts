// AI Strategy Engine - The "Brain" that combines search context, templates, and lead data
// to create intelligent outreach strategies for each campaign mode

import { EmailSequence, OPTION_A_SEQUENCES, OPTION_B_SEQUENCES } from './emailSequences';
import { getStoredLeadContext } from './leadContext';
import { 
  AutonomousSequence, 
  AUTONOMOUS_SEQUENCES, 
  determineSequence,
  getSequencesForSearchType 
} from './autonomousSequences';

// Storage key for persisting strategy selection
const STRATEGY_STORAGE_KEY = 'bamlead_selected_strategy';

export type StrategyApproach = 
  | 'direct-pitch'      // Straightforward service offer
  | 'problem-agitate'   // Highlight pain points then offer solution
  | 'value-first'       // Lead with free value before asking
  | 'social-proof'      // Use case studies and testimonials
  | 'educational'       // Teach then pitch
  | 'urgency'           // Time-sensitive opportunity
  | 'personalized-audit'; // Custom analysis of their business

export interface AIStrategy {
  id: string;
  name: string;
  description: string;
  approach: StrategyApproach;
  icon: string;
  recommendedFor: string[];
  sequenceIds: string[];
  templateIds: string[];
  urgencyLevel: 'high' | 'medium' | 'low';
  expectedResponseRate: string;
  aiReasoning: string[];
  keyTalkingPoints: string[];
  personalizedOpener: string;
  matchScore: number; // 0-100 based on context fit
  autonomousSequences?: string[]; // IDs for 7-step autonomous sequences
}

export interface StrategyContext {
  searchType: 'gmb' | 'platform' | null;
  searchQuery?: string;
  searchLocation?: string;
  leadCount: number;
  hotLeadCount: number;
  warmLeadCount: number;
  coldLeadCount: number;
  noWebsiteCount: number;
  needsUpgradeCount: number;
  hasPainPoints: number;
  lowReviewsCount: number;
  selectedTemplateId?: string;
  selectedTemplateName?: string;
  dominantIndustry?: string;
  averageLeadScore?: number;
}

// Persist strategy selection
export function saveSelectedStrategy(strategy: AIStrategy, userId?: string): void {
  try {
    const key = userId ? `${STRATEGY_STORAGE_KEY}_${userId}` : STRATEGY_STORAGE_KEY;
    localStorage.setItem(key, JSON.stringify({
      strategy,
      savedAt: new Date().toISOString(),
    }));
  } catch {}
}

// Retrieve persisted strategy
export function getPersistedStrategy(userId?: string): AIStrategy | null {
  try {
    const key = userId ? `${STRATEGY_STORAGE_KEY}_${userId}` : STRATEGY_STORAGE_KEY;
    const data = localStorage.getItem(key);
    if (!data) return null;
    const parsed = JSON.parse(data);
    return parsed.strategy as AIStrategy;
  } catch {
    return null;
  }
}

// Clear persisted strategy
export function clearPersistedStrategy(userId?: string): void {
  try {
    const key = userId ? `${STRATEGY_STORAGE_KEY}_${userId}` : STRATEGY_STORAGE_KEY;
    localStorage.removeItem(key);
  } catch {}
}

// Generate strategies based on workflow context
export function generateStrategies(context: StrategyContext): AIStrategy[] {
  const strategies: AIStrategy[] = [];
  const isSearchA = context.searchType === 'gmb';
  const isSearchB = context.searchType === 'platform';

  // Strategy 1: Direct Pitch (for hot leads)
  if (context.hotLeadCount > 0) {
    strategies.push({
      id: 'direct-pitch',
      name: 'Direct Pitch Strategy',
      description: 'Get straight to the point with a compelling offer for high-intent leads',
      approach: 'direct-pitch',
      icon: '🎯',
      recommendedFor: ['Hot leads', 'Businesses actively seeking solutions', 'High-urgency situations'],
      sequenceIds: isSearchA ? ['a-hot-1', 'a-hot-2'] : ['b-hot-1', 'b-hot-2'],
      templateIds: ['urgent-audit', 'direct-value'],
      urgencyLevel: 'high',
      expectedResponseRate: '15-25%',
      aiReasoning: [
        `Found ${context.hotLeadCount} hot leads with high conversion probability`,
        'Direct approach works best for leads showing buying signals',
        isSearchA ? 'Super AI search indicates business-critical needs' : 'Agency finder suggests service-ready prospects',
      ],
      keyTalkingPoints: [
        'Immediate value proposition',
        'Clear next steps',
        'Time-limited opportunity',
      ],
      personalizedOpener: `I noticed {{business_name}} is looking to improve their ${isSearchA ? 'online presence' : 'client acquisition'} - I have a solution that can help immediately.`,
      matchScore: Math.min(100, 60 + (context.hotLeadCount / context.leadCount) * 100),
      autonomousSequences: ['auto-hot-lead'],
    });
  }

  // Strategy 2: Problem-Agitate (for leads with website issues)
  if (context.noWebsiteCount > 0 || context.needsUpgradeCount > 0) {
    const problemCount = context.noWebsiteCount + context.needsUpgradeCount;
    strategies.push({
      id: 'problem-agitate',
      name: 'Problem-Agitate Strategy',
      description: 'Highlight specific issues found in their business, then present your solution',
      approach: 'problem-agitate',
      icon: '⚠️',
      recommendedFor: ['Leads with no website', 'Outdated websites', 'Poor mobile experience'],
      sequenceIds: isSearchA ? ['a-hot-2', 'a-hot-3'] : ['b-hot-2', 'b-hot-3'],
      templateIds: ['website-audit', 'problem-solution'],
      urgencyLevel: 'high',
      expectedResponseRate: '12-20%',
      aiReasoning: [
        `${context.noWebsiteCount} leads have no website - missing all online opportunities`,
        `${context.needsUpgradeCount} leads have websites needing upgrades`,
        'Problem-aware leads respond better to specific issue callouts',
        'Step 2 analysis data enables hyper-personalized messaging',
      ],
      keyTalkingPoints: [
        'Specific issues found in their business',
        'Cost of inaction (lost customers)',
        'Your unique solution',
      ],
      personalizedOpener: context.noWebsiteCount > 0 
        ? `While researching {{industry}} businesses in {{location}}, I noticed {{business_name}} doesn't have a website yet. In today's digital-first world, this means potential customers are going to your competitors instead.`
        : `I analyzed {{business_name}}'s website and found several issues that are likely costing you customers - the good news is they're all fixable.`,
      matchScore: Math.min(100, 50 + (problemCount / context.leadCount) * 100),
      autonomousSequences: context.noWebsiteCount > 0 ? ['auto-no-website'] : ['auto-outdated-website'],
    });
  }

  // Strategy 3: Value-First (universal, good for cold leads)
  strategies.push({
    id: 'value-first',
    name: 'Value-First Strategy',
    description: 'Lead with free value, insights, or resources before making any ask',
    approach: 'value-first',
    icon: '🎁',
    recommendedFor: ['Cold leads', 'Building trust', 'Long-term relationship building'],
    sequenceIds: isSearchA ? ['a-warm-1', 'a-cold-1'] : ['b-warm-1', 'b-cold-1'],
    templateIds: ['free-audit', 'value-resource'],
    urgencyLevel: 'low',
    expectedResponseRate: '8-15%',
    aiReasoning: [
      `${context.coldLeadCount} cold leads need warming up first`,
      'Value-first approach builds trust before asking for commitment',
      'Positions you as a helpful expert rather than a salesperson',
    ],
    keyTalkingPoints: [
      'Free value upfront (audit, tips, resources)',
      'No strings attached offer',
      'Demonstrate expertise',
    ],
    personalizedOpener: `I put together a free ${isSearchA ? 'digital presence audit' : 'growth opportunity analysis'} for {{business_name}} - no strings attached. Would you like me to send it over?`,
    matchScore: Math.min(100, 40 + (context.coldLeadCount / context.leadCount) * 80),
    autonomousSequences: ['auto-warm-nurture'],
  });

  // Strategy 4: Social Proof (for skeptical audiences)
  strategies.push({
    id: 'social-proof',
    name: 'Social Proof Strategy',
    description: 'Lead with case studies, testimonials, and proven results',
    approach: 'social-proof',
    icon: '⭐',
    recommendedFor: ['Skeptical industries', 'Competitive markets', 'High-ticket services'],
    sequenceIds: isSearchA ? ['a-warm-1'] : ['b-hot-3', 'b-warm-2'],
    templateIds: ['case-study', 'testimonial-lead'],
    urgencyLevel: 'medium',
    expectedResponseRate: '10-18%',
    aiReasoning: [
      'Case studies and testimonials build credibility quickly',
      `${context.dominantIndustry || 'This industry'} responds well to proven results`,
      'Reduces perceived risk for the prospect',
    ],
    keyTalkingPoints: [
      'Similar business success story',
      'Specific results and metrics',
      'Easy next step to learn more',
    ],
    personalizedOpener: `I recently helped a {{industry}} business similar to {{business_name}} increase their leads by 340%. Would you like to see how we did it?`,
    matchScore: 55,
    autonomousSequences: ['auto-warm-nurture'],
  });

  // Strategy 5: Educational (for complex services)
  strategies.push({
    id: 'educational',
    name: 'Educational Strategy',
    description: 'Teach prospects something valuable, then naturally transition to your offer',
    approach: 'educational',
    icon: '📚',
    recommendedFor: ['Complex services', 'New concepts', 'Building authority'],
    sequenceIds: isSearchA ? ['a-cold-1', 'a-cold-2'] : ['b-cold-1', 'b-cold-2'],
    templateIds: ['educational-tip', 'industry-insight'],
    urgencyLevel: 'low',
    expectedResponseRate: '6-12%',
    aiReasoning: [
      'Education positions you as the expert',
      'Builds trust before asking for the sale',
      'Works especially well for nurturing cold leads over time',
    ],
    keyTalkingPoints: [
      'Valuable industry insight or tip',
      'How this applies to their business',
      'Offer to share more',
    ],
    personalizedOpener: `Quick tip for {{business_name}}: ${isSearchA ? 'Most local businesses miss 70% of potential customers because they don\'t show up in mobile searches.' : 'The #1 reason agencies fail to close clients is they pitch features instead of outcomes.'}`,
    matchScore: 40,
    autonomousSequences: ['auto-warm-nurture'],
  });

  // Strategy 6: Personalized Audit (highest engagement, requires Step 2 data)
  if (context.hasPainPoints > 0) {
    strategies.push({
      id: 'personalized-audit',
      name: 'Personalized Audit Strategy',
      description: 'Use Step 2 analysis data to create hyper-personalized outreach',
      approach: 'personalized-audit',
      icon: '🔬',
      recommendedFor: ['Leads with detailed analysis', 'High-value prospects', 'Custom solutions'],
      sequenceIds: isSearchA ? ['a-hot-2'] : ['b-hot-2'],
      templateIds: ['personalized-audit', 'custom-analysis'],
      urgencyLevel: 'high',
      expectedResponseRate: '20-35%',
      aiReasoning: [
        `${context.hasPainPoints} leads have identified pain points from Step 2 analysis`,
        'Personalized audits show you\'ve done your homework',
        'Highest response rates when messaging references specific findings',
        'AI can auto-insert website issues, mobile scores, and opportunities',
      ],
      keyTalkingPoints: [
        'Specific findings from their business',
        'Custom recommendations',
        'Offer to walk through the analysis',
      ],
      personalizedOpener: `I analyzed {{business_name}}'s digital presence and found {{pain_points_count}} specific opportunities to improve. Would you like me to share the full report?`,
      matchScore: Math.min(100, 70 + (context.hasPainPoints / context.leadCount) * 60),
      autonomousSequences: ['auto-low-visibility', 'auto-outdated-website'],
    });
  }

  // Strategy 7: Urgency (for time-sensitive offers)
  strategies.push({
    id: 'urgency',
    name: 'Urgency Strategy',
    description: 'Create time-sensitive offers to drive immediate action',
    approach: 'urgency',
    icon: '⏰',
    recommendedFor: ['Limited-time offers', 'Seasonal campaigns', 'Capacity-based scarcity'],
    sequenceIds: isSearchA ? ['a-hot-1'] : ['b-hot-1'],
    templateIds: ['limited-time', 'scarcity-offer'],
    urgencyLevel: 'high',
    expectedResponseRate: '12-22%',
    aiReasoning: [
      'Urgency drives faster decisions',
      'Works best with hot and warm leads',
      'Must be authentic - false scarcity backfires',
    ],
    keyTalkingPoints: [
      'Time-limited opportunity',
      'Clear deadline',
      'What they\'ll miss if they wait',
    ],
    personalizedOpener: `I'm reaching out because I have 3 spots open this month for new {{industry}} clients in {{location}} - and {{business_name}} caught my attention.`,
    matchScore: 50,
    autonomousSequences: ['auto-hot-lead'],
  });

  // Strategy 8: Review Booster (for low reviews, GMB only)
  if (isSearchA && context.lowReviewsCount > 0) {
    strategies.push({
      id: 'review-booster',
      name: 'Review Booster Strategy',
      description: 'Help businesses build their online reputation through reviews',
      approach: 'value-first',
      icon: '⭐',
      recommendedFor: ['Low review count', 'New businesses', 'Reputation building'],
      sequenceIds: ['a-warm-1'],
      templateIds: ['review-help', 'reputation-builder'],
      urgencyLevel: 'medium',
      expectedResponseRate: '12-18%',
      aiReasoning: [
        `${context.lowReviewsCount} leads have fewer than 10 reviews`,
        'Reviews are critical for local business trust',
        'Easy entry point to build relationship before larger services',
      ],
      keyTalkingPoints: [
        'Importance of reviews for local SEO',
        'Simple system to get more reviews',
        'Competitor review comparison',
      ],
      personalizedOpener: `I noticed {{business_name}} has great ratings but only {{review_count}} reviews. Your competitors have 50+. I can help you catch up quickly.`,
      matchScore: Math.min(100, 45 + (context.lowReviewsCount / context.leadCount) * 80),
      autonomousSequences: ['auto-low-reviews'],
    });
  }

  // Sort by match score
  return strategies.sort((a, b) => b.matchScore - a.matchScore);
}

// Get context from current workflow state
export function buildStrategyContext(
  searchType: 'gmb' | 'platform' | null,
  leads: any[],
  selectedTemplate?: { id?: string; name?: string }
): StrategyContext {
  const analysisContext = getStoredLeadContext();
  
  const context: StrategyContext = {
    searchType,
    leadCount: leads.length,
    hotLeadCount: leads.filter(l => l.aiClassification === 'hot').length,
    warmLeadCount: leads.filter(l => l.aiClassification === 'warm').length,
    coldLeadCount: leads.filter(l => l.aiClassification === 'cold' || !l.aiClassification).length,
    noWebsiteCount: analysisContext.filter(l => !l.websiteAnalysis?.hasWebsite).length,
    needsUpgradeCount: analysisContext.filter(l => l.websiteAnalysis?.needsUpgrade).length,
    hasPainPoints: analysisContext.filter(l => l.painPoints && l.painPoints.length > 0).length,
    lowReviewsCount: leads.filter(l => (l.review_count || l.reviews || 0) < 10).length,
    selectedTemplateId: selectedTemplate?.id,
    selectedTemplateName: selectedTemplate?.name,
  };

  // Try to get search context
  try {
    context.searchQuery = sessionStorage.getItem('bamlead_search_query') || undefined;
    context.searchLocation = sessionStorage.getItem('bamlead_search_location') || undefined;
  } catch { }

  // Calculate dominant industry
  const industries = leads.map(l => l.industry).filter(Boolean);
  if (industries.length > 0) {
    const counts: Record<string, number> = {};
    industries.forEach(i => { counts[i] = (counts[i] || 0) + 1; });
    context.dominantIndustry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  // Calculate average lead score
  const scores = leads.map(l => l.leadScore).filter(s => typeof s === 'number');
  if (scores.length > 0) {
    context.averageLeadScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  return context;
}

// Get AI-recommended strategy based on context (for Co-Pilot mode)
export function getRecommendedStrategy(context: StrategyContext): AIStrategy | null {
  const strategies = generateStrategies(context);
  return strategies.length > 0 ? strategies[0] : null;
}

// Auto-select strategy for Autopilot mode
export function autoSelectStrategy(context: StrategyContext): AIStrategy {
  const strategies = generateStrategies(context);
  
  // Autopilot prioritizes personalized-audit if available
  const auditStrategy = strategies.find(s => s.id === 'personalized-audit');
  if (auditStrategy && auditStrategy.matchScore > 70) {
    return auditStrategy;
  }

  // Otherwise, use highest match score
  return strategies[0] || {
    id: 'default',
    name: 'AI Smart Strategy',
    description: 'AI-optimized approach based on lead data',
    approach: 'value-first',
    icon: '🤖',
    recommendedFor: ['All leads'],
    sequenceIds: context.searchType === 'gmb' ? ['a-warm-1'] : ['b-warm-1'],
    templateIds: ['default'],
    urgencyLevel: 'medium',
    expectedResponseRate: '8-15%',
    aiReasoning: ['AI automatically selected based on lead context'],
    keyTalkingPoints: ['Personalized approach', 'Value-first messaging'],
    personalizedOpener: 'AI will generate personalized opener',
    matchScore: 50,
    autonomousSequences: ['auto-warm-nurture'],
  };
}

// Get sequence recommendations for a strategy (legacy 4-step)
export function getSequencesForStrategy(
  strategy: AIStrategy, 
  searchType: 'gmb' | 'platform' | null
): EmailSequence[] {
  const sequences = searchType === 'gmb' ? OPTION_A_SEQUENCES : OPTION_B_SEQUENCES;
  return strategy.sequenceIds
    .map(id => sequences.find(s => s.id === id))
    .filter((s): s is EmailSequence => s !== undefined);
}

// Get 7-step autonomous sequences for a strategy (Autopilot mode)
export function getAutonomousSequencesForStrategy(
  strategy: AIStrategy
): AutonomousSequence[] {
  if (!strategy.autonomousSequences) return [];
  return strategy.autonomousSequences
    .map(id => AUTONOMOUS_SEQUENCES.find(s => s.id === id))
    .filter((s): s is AutonomousSequence => s !== undefined);
}

// Intelligently assign sequences to leads based on their analysis
export function assignSequencesToLeads(
  leads: any[],
  searchType: 'gmb' | 'platform',
  strategy: AIStrategy
): Array<{ lead: any; sequence: AutonomousSequence }> {
  return leads.map(lead => ({
    lead,
    sequence: determineSequence(lead, searchType),
  }));
}

// Get all available autonomous sequences for a search type
export function getAvailableAutonomousSequences(
  searchType: 'gmb' | 'platform'
): AutonomousSequence[] {
  return getSequencesForSearchType(searchType);
}
