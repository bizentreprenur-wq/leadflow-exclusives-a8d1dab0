// AI Sequence Intelligence - Decides which sequences to use based on search type and lead analysis

import { SearchType, LeadPriority, EmailSequence } from './emailSequences';

export interface LeadIntelligence {
  hasWebsite: boolean;
  websiteNeedsUpdate: boolean;
  websitePlatform?: string;
  mobileScore?: number;
  loadTime?: number;
  hasSSL?: boolean;
  reviewRating?: number;
  reviewCount?: number;
  painPoints: string[];
  opportunities: string[];
  uniqueOffering?: string;
  improvementAreas?: string[];
  competitorGaps?: string[];
  industry?: string;
  businessSize?: 'small' | 'medium' | 'large';
}

export interface SequenceDecision {
  recommendedSequenceIds: string[];
  reasoning: string[];
  personalizedOpener: string;
  keyTalkingPoints: string[];
  urgencyLevel: 'high' | 'medium' | 'low';
  approachType: 'direct' | 'educational' | 'value-first' | 'problem-agitate';
}

// AI Self-Questioning Logic - determines the best approach for each lead
export function analyzeLeadForSequence(
  searchType: SearchType,
  priority: LeadPriority,
  intelligence: LeadIntelligence
): SequenceDecision {
  const reasoning: string[] = [];
  const keyTalkingPoints: string[] = [];
  let recommendedSequenceIds: string[] = [];
  let personalizedOpener = '';
  let urgencyLevel: 'high' | 'medium' | 'low' = 'medium';
  let approachType: SequenceDecision['approachType'] = 'value-first';

  // AI Self-Questioning for Search A (Super AI Business Search)
  if (searchType === 'gmb') {
    reasoning.push('🧠 AI Analysis: Super AI Business Search - This lead needs insight-driven, diagnostic communication');

    // Question 1: Does this business have a website?
    if (!intelligence.hasWebsite) {
      reasoning.push('❓ Does this business have a website? → NO');
      reasoning.push('💡 Insight: High-opportunity lead - they need a complete digital presence');
      recommendedSequenceIds.push('a-hot-2'); // "We Found This" Audit Sequence
      keyTalkingPoints.push('You currently have no website - customers searching for your services cannot find you online');
      keyTalkingPoints.push('Your competitors with websites are capturing 100% of online searches');
      personalizedOpener = `I noticed {{business_name}} doesn't have a website yet - in today's digital-first world, this means potential customers searching for {{industry}} services in {{location}} can't find you online.`;
      urgencyLevel = 'high';
      approachType = 'problem-agitate';
    }
    // Question 2: Does the website need updating?
    else if (intelligence.websiteNeedsUpdate) {
      reasoning.push('❓ Does the website need updating? → YES');
      reasoning.push('💡 Insight: Website exists but has issues that hurt conversions');
      recommendedSequenceIds.push('a-hot-1'); // Cold Intro → Value Proof
      
      if (intelligence.mobileScore && intelligence.mobileScore < 50) {
        keyTalkingPoints.push(`Mobile score is ${intelligence.mobileScore}/100 - over 60% of searches are mobile`);
        personalizedOpener = `I analyzed {{business_name}}'s website and noticed it scores only ${intelligence.mobileScore}/100 on mobile - meaning most of your potential customers are having a frustrating experience.`;
      }
      if (intelligence.loadTime && intelligence.loadTime > 3) {
        keyTalkingPoints.push(`Page loads in ${intelligence.loadTime}s - customers leave after 3 seconds`);
      }
      if (!intelligence.hasSSL) {
        keyTalkingPoints.push('No SSL certificate - browsers show "Not Secure" warning to visitors');
      }
      urgencyLevel = 'high';
      approachType = 'direct';
    }
    // Question 3: What's the review situation?
    else if (intelligence.reviewRating && intelligence.reviewRating < 4) {
      reasoning.push('❓ How are their reviews? → NEEDS ATTENTION');
      reasoning.push('💡 Insight: Reputation issues may be hurting conversions');
      recommendedSequenceIds.push('a-warm-1'); // Social Proof & Authority
      keyTalkingPoints.push(`Current rating of ${intelligence.reviewRating} stars may be deterring customers`);
      keyTalkingPoints.push('Reputation management could significantly increase leads');
      personalizedOpener = `I noticed {{business_name}} has a ${intelligence.reviewRating}-star rating on Google - while you're doing good work, this rating might be causing potential customers to choose competitors instead.`;
      urgencyLevel = 'medium';
      approachType = 'educational';
    }
    // Question 4: Are there specific pain points?
    else if (intelligence.painPoints.length > 0) {
      reasoning.push('❓ What specific pain points were identified? → ' + intelligence.painPoints.join(', '));
      recommendedSequenceIds.push('a-hot-3'); // Pain-Focused Problem Agitation
      keyTalkingPoints.push(...intelligence.painPoints.slice(0, 3));
      personalizedOpener = `While researching {{industry}} businesses in {{location}}, I noticed {{business_name}} has some opportunities that could significantly boost your online presence.`;
      urgencyLevel = 'medium';
      approachType = 'problem-agitate';
    }
    // Default for Search A
    else {
      reasoning.push('❓ General analysis complete - lead appears stable');
      recommendedSequenceIds.push('a-cold-1'); // Gentle Introduction
      keyTalkingPoints.push('Strong online presence - focus on growth opportunities');
      keyTalkingPoints.push('Potential for advanced optimization');
      personalizedOpener = `I came across {{business_name}} while researching successful {{industry}} businesses in {{location}} - I'm impressed with what you've built!`;
      urgencyLevel = 'low';
      approachType = 'value-first';
    }

    // Add unique business insights
    if (intelligence.uniqueOffering) {
      keyTalkingPoints.push(`Unique Offering: ${intelligence.uniqueOffering}`);
    }
    if (intelligence.improvementAreas && intelligence.improvementAreas.length > 0) {
      keyTalkingPoints.push(`Improvement Areas: ${intelligence.improvementAreas.join(', ')}`);
    }
  }

  // AI Self-Questioning for Search B (Agency Lead Finder)
  else if (searchType === 'platform') {
    reasoning.push('🧠 AI Analysis: Agency Lead Finder - This lead needs ROI-focused, service-oriented communication');

    // Question 1: What platform are they on?
    if (intelligence.websitePlatform) {
      reasoning.push(`❓ What platform is this business on? → ${intelligence.websitePlatform}`);
      
      if (['wordpress', 'wix', 'weebly', 'squarespace'].includes(intelligence.websitePlatform.toLowerCase())) {
        reasoning.push('💡 Insight: Common DIY platform - likely needs professional help');
        recommendedSequenceIds.push('b-hot-1'); // "Get More Clients" Direct Offer
        keyTalkingPoints.push(`Currently using ${intelligence.websitePlatform} - potential for significant upgrade`);
        keyTalkingPoints.push('DIY platforms often lack professional optimization');
        personalizedOpener = `I noticed {{business_name}} is using ${intelligence.websitePlatform} - while it's a decent starting point, I help businesses like yours upgrade to professional solutions that actually convert visitors into customers.`;
        approachType = 'direct';
      }
    }

    // Question 2: Is the website causing problems?
    if (!intelligence.hasWebsite) {
      reasoning.push('❓ Does this potential agency client have a website? → NO');
      reasoning.push('💡 Insight: Perfect agency prospect - they need full service');
      recommendedSequenceIds.push('b-hot-1'); // Direct Offer
      recommendedSequenceIds.push('b-hot-2'); // Client Pain Matching
      keyTalkingPoints.push('No website = missing all online opportunities');
      keyTalkingPoints.push('Perfect candidate for full website design service');
      keyTalkingPoints.push('High-ticket opportunity: $3K-$10K website project');
      personalizedOpener = `I found {{business_name}} while looking for {{industry}} businesses that need digital help - you currently don't have a website, which means you're invisible to the 90% of customers who search online first.`;
      urgencyLevel = 'high';
      approachType = 'direct';
    }
    else if (intelligence.websiteNeedsUpdate) {
      reasoning.push('❓ Does their website need work? → YES');
      recommendedSequenceIds.push('b-hot-2'); // Client Pain Matching
      keyTalkingPoints.push('Website has visible issues that hurt credibility');
      keyTalkingPoints.push('Competitor comparison shows gaps');
      personalizedOpener = `I reviewed {{business_name}}'s website and spotted several issues that are likely costing you customers - the good news is they're all fixable.`;
      urgencyLevel = 'high';
      approachType = 'problem-agitate';
    }

    // Question 3: What's the industry opportunity?
    if (intelligence.industry) {
      reasoning.push(`❓ What industry is this? → ${intelligence.industry}`);
      recommendedSequenceIds.push('b-warm-1'); // Niche-Specific Sequence
      keyTalkingPoints.push(`${intelligence.industry} businesses are underserved in digital marketing`);
      keyTalkingPoints.push('Niche expertise positions you as the go-to agency');
    }

    // Question 4: What services would benefit them most?
    if (intelligence.competitorGaps && intelligence.competitorGaps.length > 0) {
      reasoning.push('❓ What gaps exist vs competitors? → ' + intelligence.competitorGaps.join(', '));
      keyTalkingPoints.push('Competitor analysis reveals specific service opportunities');
      keyTalkingPoints.push(...intelligence.competitorGaps.slice(0, 2));
    }

    // Default for Search B
    if (recommendedSequenceIds.length === 0) {
      reasoning.push('❓ General agency prospect analysis complete');
      recommendedSequenceIds.push('b-hot-3'); // Agency Growth Case Study
      keyTalkingPoints.push('Position as growth partner with proven results');
      keyTalkingPoints.push('Lead with case studies and ROI metrics');
      personalizedOpener = `I help agencies find and close clients faster - I noticed {{business_name}} and thought you might be interested in seeing how other {{industry}} businesses are growing their revenue.`;
      urgencyLevel = 'medium';
      approachType = 'value-first';
    }
  }

  // Adjust based on priority
  if (priority === 'hot') {
    urgencyLevel = 'high';
    if (approachType !== 'direct') {
      approachType = 'problem-agitate';
    }
  } else if (priority === 'cold') {
    urgencyLevel = 'low';
    approachType = 'educational';
  }

  return {
    recommendedSequenceIds,
    reasoning,
    personalizedOpener,
    keyTalkingPoints,
    urgencyLevel,
    approachType
  };
}

// Professionals who would use each search type
export const SEARCH_A_PROFESSIONALS = [
  'Marketing agencies',
  'Digital marketing consultants',
  'SEO agencies',
  'Local SEO specialists',
  'Google Ads managers',
  'Facebook Ads agencies',
  'Website design agencies',
  'Web developers',
  'Conversion rate optimization specialists',
  'Branding agencies',
  'Reputation management companies',
  'Growth hackers',
  'SaaS growth teams',
  'SaaS customer acquisition managers',
  'B2B sales teams',
  'B2B sales managers',
  'Outbound sales teams',
  'Lead generation companies',
  'Data enrichment companies',
  'Business intelligence analysts',
  'Market research firms',
  'Competitive intelligence analysts',
  'Private equity analysts',
  'Venture capital analysts',
  'Franchise developers',
  'Franchise brokers',
  'Real estate investment firms',
  'Commercial real estate analysts',
  'Economic development organizations',
  'Chambers of commerce',
  'City planners',
  'Government contractors',
  'Compliance consultants',
  'Business auditors',
  'Credit repair companies',
  'Financial consultants',
  'Lenders',
  'Merchant cash advance companies',
  'Insurance agencies',
  'Healthcare marketing firms',
  'Medical practice consultants',
  'Law firm marketing agencies',
  'Recruiting agencies',
  'Staffing firms',
  'HR consultants',
  'Logistics sales teams',
  'SaaS product marketing teams',
  'Startup founders validating markets'
];

export const SEARCH_B_PROFESSIONALS = [
  'Website design agencies',
  'SMMA owners',
  'Freelance web designers',
  'Freelance marketers',
  'Cold email agencies',
  'Cold calling agencies',
  'Appointment setting agencies',
  'Lead generation agencies',
  'Outbound sales agencies',
  'Marketing consultants',
  'Google Ads freelancers',
  'Facebook Ads freelancers',
  'SEO freelancers',
  'Local marketing agencies',
  'White-label marketing agencies',
  'Branding consultants',
  'CRM consultants',
  'Automation consultants',
  'AI automation agencies',
  'Chatbot agencies',
  'Email marketing agencies',
  'SMS marketing agencies',
  'Funnel builders',
  'Copywriters',
  'Video marketing agencies',
  'YouTube marketing agencies',
  'TikTok marketing agencies',
  'Influencer outreach agencies',
  'PR agencies',
  'SaaS affiliate managers',
  'SaaS resellers',
  'SaaS partners',
  'Virtual assistant agencies',
  'Outsourcing agencies',
  'Business brokers',
  'Franchise sales consultants',
  'Real estate marketing agencies',
  'Roofing marketing agencies',
  'Dental marketing agencies',
  'Chiropractic marketing agencies',
  'Medical spa marketers',
  'Home service marketers',
  'HVAC marketers',
  'Plumbing marketers',
  'Solar sales agencies',
  'Insurance lead agencies',
  'Financial advisor marketers'
];

// Generate unique business insights from lead data
export function generateUniqueInsights(leadData: any): {
  uniqueOffering: string;
  improvementAreas: string[];
  competitiveAdvantage: string;
  marketPosition: string;
} {
  const insights = {
    uniqueOffering: '',
    improvementAreas: [] as string[],
    competitiveAdvantage: '',
    marketPosition: ''
  };

  // Analyze review content for unique offering
  if (leadData.reviewCount > 50 && leadData.rating >= 4.5) {
    insights.uniqueOffering = 'High customer satisfaction with excellent review volume';
    insights.competitiveAdvantage = 'Strong reputation and social proof';
  } else if (leadData.rating >= 4.0) {
    insights.uniqueOffering = 'Good customer relationships with room for growth';
    insights.competitiveAdvantage = 'Established local presence';
  }

  // Identify improvement areas
  if (!leadData.hasWebsite) {
    insights.improvementAreas.push('Create professional website');
    insights.improvementAreas.push('Establish online booking capability');
  }
  if (leadData.mobileScore && leadData.mobileScore < 70) {
    insights.improvementAreas.push('Improve mobile experience');
  }
  if (!leadData.hasSSL) {
    insights.improvementAreas.push('Add SSL security certificate');
  }
  if (leadData.loadTime && leadData.loadTime > 3) {
    insights.improvementAreas.push('Optimize website speed');
  }
  if (leadData.reviewCount < 20) {
    insights.improvementAreas.push('Implement review generation strategy');
  }

  // Market position
  if (leadData.rating >= 4.5 && leadData.reviewCount > 100) {
    insights.marketPosition = 'Market Leader';
  } else if (leadData.rating >= 4.0) {
    insights.marketPosition = 'Established Player';
  } else if (leadData.rating >= 3.0) {
    insights.marketPosition = 'Growth Opportunity';
  } else {
    insights.marketPosition = 'Turnaround Candidate';
  }

  return insights;
}
