/**
 * Advanced Business Intelligence Types
 * Comprehensive 11-category data model for Super AI Business Search
 */

// ============================================================================
// 1. Complete Business Identity & Profile
// ============================================================================
export interface BusinessIdentity {
  legalName: string;
  dba?: string;
  entityStatus: 'active' | 'inactive' | 'unknown';
  naicsCode?: string;
  naicsDescription?: string;
  sicCode?: string;
  sicDescription?: string;
  employeeCount?: number;
  employeeRange?: string; // e.g., "10-50", "50-200"
  revenueEstimate?: number;
  revenueRange?: string;
  fundingHistory?: FundingEvent[];
  isFranchise?: boolean;
  parentCompany?: string;
  subsidiaries?: string[];
  operatingMarkets?: string[];
  serviceAreas?: string[];
  isPublic?: boolean;
  ownershipType?: 'sole_proprietor' | 'partnership' | 'llc' | 'corporation' | 'nonprofit' | 'unknown';
  yearEstablished?: number;
}

export interface FundingEvent {
  date?: string;
  amount?: number;
  type?: 'seed' | 'series_a' | 'series_b' | 'series_c' | 'ipo' | 'acquisition' | 'grant' | 'unknown';
  investors?: string[];
}

// ============================================================================
// 2. Website Health & Digital Foundation
// ============================================================================
export interface WebsiteHealth {
  hasWebsite: boolean;
  url?: string;
  cms?: string; // WordPress, Wix, Squarespace, Shopify, etc.
  hostingProvider?: string;
  domainAge?: number; // in days
  domainAuthority?: number; // 0-100
  isMobileResponsive: boolean;
  mobileScore?: number; // 0-100
  pageSpeedScore?: number; // 0-100
  loadTime?: number; // in milliseconds
  seoQuality: SEOQuality;
  technicalHealth: TechnicalHealth;
  trackingInfrastructure: TrackingInfrastructure;
  accessibility: AccessibilityInfo;
  conversionReadiness: ConversionReadiness;
}

export interface SEOQuality {
  score?: number;
  hasMetaDescription: boolean;
  hasTitleTag: boolean;
  hasH1Tag: boolean;
  hasStructuredData: boolean;
  hasCanonicalTag: boolean;
  issues: string[];
}

export interface TechnicalHealth {
  score?: number;
  hasSsl: boolean;
  hasSitemap: boolean;
  hasRobotsTxt: boolean;
  brokenLinksCount?: number;
  issues: string[];
}

export interface TrackingInfrastructure {
  hasGoogleAnalytics: boolean;
  hasGoogleTagManager: boolean;
  hasFacebookPixel: boolean;
  hasOtherPixels: string[];
  issues: string[];
}

export interface AccessibilityInfo {
  score?: number;
  hasAltTags: boolean;
  hasAriaLabels: boolean;
  issues: string[];
}

export interface ConversionReadiness {
  hasForms: boolean;
  hasCTAs: boolean;
  hasChat: boolean;
  hasBookingSystem: boolean;
  conversionScore?: number;
  issues: string[];
}

// ============================================================================
// 3. Online Visibility & Market Presence
// ============================================================================
export interface OnlineVisibility {
  visibilityScore?: number; // 0-100
  searchRankings?: SearchRanking[];
  businessListings: BusinessListings;
  citationConsistency?: number; // 0-100 NAP accuracy
  backlinkProfile: BacklinkProfile;
}

export interface SearchRanking {
  keyword: string;
  position?: number;
  url?: string;
}

export interface BusinessListings {
  hasGoogleBusinessProfile: boolean;
  gbpOptimizationScore?: number;
  directoryListings: string[]; // Yelp, YellowPages, etc.
  completenessScore?: number;
  issues: string[];
}

export interface BacklinkProfile {
  totalBacklinks?: number;
  domainAuthority?: number;
  referringDomains?: number;
  healthScore?: number;
}

// ============================================================================
// 4. Reputation, Reviews & Sentiment
// ============================================================================
export interface ReputationData {
  overallRating?: number;
  totalReviews: number;
  reviewsByPlatform: PlatformReviews[];
  ratingDistribution?: RatingDistribution;
  reviewVelocity?: number; // reviews per month
  sentimentBreakdown: SentimentBreakdown;
  complaintPatterns: string[];
  responsePractices: ResponsePractices;
}

export interface PlatformReviews {
  platform: string;
  rating?: number;
  reviewCount: number;
  url?: string;
}

export interface RatingDistribution {
  five: number;
  four: number;
  three: number;
  two: number;
  one: number;
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
  topPositiveThemes: string[];
  topNegativeThemes: string[];
}

export interface ResponsePractices {
  responseRate?: number;
  avgResponseTime?: string;
  ownerResponsesCount?: number;
}

// ============================================================================
// 5. AI Opportunity & Growth Recommendations
// ============================================================================
export interface OpportunityAnalysis {
  opportunityScore: number; // 0-100
  gapAnalysis: GapAnalysis;
  recommendedServices: ServiceRecommendation[];
  estimatedROIUplift?: number;
  urgencyScore: number; // 0-100
  priorityLevel: 'critical' | 'high' | 'medium' | 'low' | 'nurture';
}

export interface GapAnalysis {
  seoGaps: string[];
  contentGaps: string[];
  conversionGaps: string[];
  listingsGaps: string[];
  technologyGaps: string[];
}

export interface ServiceRecommendation {
  service: string;
  priority: 'high' | 'medium' | 'low';
  estimatedValue?: number;
  reasoning: string;
}

// ============================================================================
// 6. Technographics (Technology Stack)
// ============================================================================
export interface TechStack {
  analytics: string[];
  marketingAutomation: string[];
  crmTools: string[];
  adPlatforms: string[];
  ecommerceplatform?: string;
  chatTools: string[];
  cloudProviders: string[];
  apiIntegrations: string[];
  detectedTechnologies: string[];
}

// ============================================================================
// 7. Buyer Intent & Engagement Signals
// ============================================================================
export interface IntentSignals {
  intentScore: number; // 0-100
  hiringActivity: HiringActivity;
  fundingSignals: string[];
  websiteActivitySignals: string[];
  marketingActivitySignals: string[];
  reviewSurges: boolean;
  competitorShifts: string[];
  seasonalSignals: string[];
  predictedPurchaseLikelihood: number; // 0-100
}

export interface HiringActivity {
  isHiring: boolean;
  roles: string[];
  urgency?: 'high' | 'medium' | 'low';
}

// ============================================================================
// 8. Competitor Context & Market Positioning
// ============================================================================
export interface CompetitorAnalysis {
  directCompetitors: Competitor[];
  competitiveGaps: string[];
  marketShareIndicator?: 'leader' | 'challenger' | 'follower' | 'niche';
  performanceBenchmarks: Benchmark[];
  differentiationOpportunities: string[];
}

export interface Competitor {
  name: string;
  url?: string;
  rating?: number;
  reviewCount?: number;
  strengths: string[];
  weaknesses: string[];
}

export interface Benchmark {
  metric: string;
  businessValue: number;
  competitorAvg: number;
  industryAvg?: number;
}

// ============================================================================
// 9. Sales Outreach Intelligence
// ============================================================================
export interface OutreachIntelligence {
  decisionMakers: DecisionMaker[];
  contactPriorityScore: number; // 0-100
  suggestedApproach: OutreachApproach;
  objectionPredictions: Objection[];
  engagementLikelihood: number; // 0-100
  personalizedTriggers: string[];
}

export interface DecisionMaker {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  twitter?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface OutreachApproach {
  recommendedChannel: 'email' | 'phone' | 'linkedin' | 'multi-channel';
  bestTimeToContact?: string;
  messagingHooks: string[];
  toneRecommendation: string;
  subjectLineIdeas: string[];
}

export interface Objection {
  objection: string;
  likelihood: number;
  rebuttal: string;
}

// ============================================================================
// 10. Compliance, Trust & Security Indicators
// ============================================================================
export interface ComplianceData {
  privacyCompliance: PrivacyCompliance;
  accessibilityCompliance: AccessibilityCompliance;
  securityIndicators: SecurityIndicators;
  industryRegulations: string[];
  riskFlags: string[];
}

export interface PrivacyCompliance {
  hasCookieConsent: boolean;
  hasPrivacyPolicy: boolean;
  gdprCompliant?: boolean;
  ccpaCompliant?: boolean;
  issues: string[];
}

export interface AccessibilityCompliance {
  wcagLevel?: 'A' | 'AA' | 'AAA' | 'none';
  adaCompliant?: boolean;
  issues: string[];
}

export interface SecurityIndicators {
  sslValid: boolean;
  securityHeaders: boolean;
  trustScore?: number;
  issues: string[];
}

// ============================================================================
// 11. AI Summaries & Narrative Output
// ============================================================================
export interface AISummary {
  insightSummary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  outreachTalkingPoints: string[];
  suggestedPitchAngle: string;
  competitiveComparison?: string;
  priorityScore: number;
  classificationLabel: 'hot' | 'warm' | 'cold';
}

// ============================================================================
// Complete Business Intelligence Lead
// ============================================================================
export interface BusinessIntelligenceLead {
  id: string;
  
  // Basic contact info
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  
  // Source information
  source: 'gmb' | 'platform';
  sources?: string[];
  rating?: number;
  reviewCount?: number;
  snippet?: string;
  
  // The 11 intelligence categories
  businessIdentity: BusinessIdentity;
  websiteHealth: WebsiteHealth;
  onlineVisibility: OnlineVisibility;
  reputation: ReputationData;
  opportunityAnalysis: OpportunityAnalysis;
  techStack: TechStack;
  intentSignals: IntentSignals;
  competitorAnalysis: CompetitorAnalysis;
  outreachIntelligence: OutreachIntelligence;
  compliance: ComplianceData;
  aiSummary: AISummary;
  
  // Scorecard summary
  scorecards: BusinessScorecards;
  
  // Metadata
  analyzedAt: string;
  dataQualityScore: number;
}

export interface BusinessScorecards {
  opportunityScore: number;
  visibilityScore: number;
  reputationScore: number;
  intentScore: number;
  competitiveIndex: number;
  overallScore: number;
}

// Helper to create default empty intelligence structure
export function createDefaultBusinessIntelligence(): Omit<BusinessIntelligenceLead, 'id' | 'name' | 'source'> {
  return {
    businessIdentity: {
      legalName: '',
      entityStatus: 'unknown',
    },
    websiteHealth: {
      hasWebsite: false,
      isMobileResponsive: false,
      seoQuality: { hasMetaDescription: false, hasTitleTag: false, hasH1Tag: false, hasStructuredData: false, hasCanonicalTag: false, issues: [] },
      technicalHealth: { hasSsl: false, hasSitemap: false, hasRobotsTxt: false, issues: [] },
      trackingInfrastructure: { hasGoogleAnalytics: false, hasGoogleTagManager: false, hasFacebookPixel: false, hasOtherPixels: [], issues: [] },
      accessibility: { hasAltTags: false, hasAriaLabels: false, issues: [] },
      conversionReadiness: { hasForms: false, hasCTAs: false, hasChat: false, hasBookingSystem: false, issues: [] },
    },
    onlineVisibility: {
      businessListings: { hasGoogleBusinessProfile: false, directoryListings: [], issues: [] },
      backlinkProfile: {},
    },
    reputation: {
      totalReviews: 0,
      reviewsByPlatform: [],
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0, topPositiveThemes: [], topNegativeThemes: [] },
      complaintPatterns: [],
      responsePractices: {},
    },
    opportunityAnalysis: {
      opportunityScore: 0,
      gapAnalysis: { seoGaps: [], contentGaps: [], conversionGaps: [], listingsGaps: [], technologyGaps: [] },
      recommendedServices: [],
      urgencyScore: 0,
      priorityLevel: 'nurture',
    },
    techStack: {
      analytics: [],
      marketingAutomation: [],
      crmTools: [],
      adPlatforms: [],
      chatTools: [],
      cloudProviders: [],
      apiIntegrations: [],
      detectedTechnologies: [],
    },
    intentSignals: {
      intentScore: 0,
      hiringActivity: { isHiring: false, roles: [] },
      fundingSignals: [],
      websiteActivitySignals: [],
      marketingActivitySignals: [],
      reviewSurges: false,
      competitorShifts: [],
      seasonalSignals: [],
      predictedPurchaseLikelihood: 0,
    },
    competitorAnalysis: {
      directCompetitors: [],
      competitiveGaps: [],
      performanceBenchmarks: [],
      differentiationOpportunities: [],
    },
    outreachIntelligence: {
      decisionMakers: [],
      contactPriorityScore: 0,
      suggestedApproach: {
        recommendedChannel: 'email',
        messagingHooks: [],
        toneRecommendation: 'professional',
        subjectLineIdeas: [],
      },
      objectionPredictions: [],
      engagementLikelihood: 0,
      personalizedTriggers: [],
    },
    compliance: {
      privacyCompliance: { hasCookieConsent: false, hasPrivacyPolicy: false, issues: [] },
      accessibilityCompliance: { issues: [] },
      securityIndicators: { sslValid: false, securityHeaders: false, issues: [] },
      industryRegulations: [],
      riskFlags: [],
    },
    aiSummary: {
      insightSummary: '',
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
      outreachTalkingPoints: [],
      suggestedPitchAngle: '',
      priorityScore: 0,
      classificationLabel: 'cold',
    },
    scorecards: {
      opportunityScore: 0,
      visibilityScore: 0,
      reputationScore: 0,
      intentScore: 0,
      competitiveIndex: 0,
      overallScore: 0,
    },
    analyzedAt: new Date().toISOString(),
    dataQualityScore: 0,
  };
}
