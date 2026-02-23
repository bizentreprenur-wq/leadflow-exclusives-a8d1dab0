/**
 * Competitive Intelligence Types
 * SWOT Analysis, Core Competencies, Market Positioning
 * Used for Competitive Analysis mode (vs. Niche Research)
 */

// ============================================================================
// Main Competitive Intelligence Interface
// ============================================================================

export interface CompetitiveIntelligence {
  reportId: string;
  searchQuery: string;
  searchLocation: string;
  analyzedAt: string;
  
  myBusiness?: MyBusinessInfo;
  marketOverview: MarketOverview;
  swotAnalysis: SWOTAnalysis;
  coreCompetencies: CoreCompetencies;
  competitorComparison: CompetitorComparison;
  marketPositioning: MarketPositioning;
  aiStrategicInsights: AIStrategicInsights;
  
  // Buyer Matching (product fit scoring)
  buyerMatching?: BuyerMatching;
  
  // NEW: Deep competitor analysis
  websiteComparison?: WebsiteComparison;
  socialMediaBenchmark?: SocialMediaBenchmark;
  productServiceGap?: ProductServiceGap;
  aiSuccessPlan?: AISuccessPlan;
  
  // NEW: 5 additional competitive research dimensions
  marketGapsWhiteSpace?: MarketGapsWhiteSpace;
  strategicDeepDives?: StrategicDeepDives;
  indirectThreats?: IndirectThreats;
  customerSentiment?: CustomerSentiment;
  benchmarkPerformance?: BenchmarkPerformance;
}

// ============================================================================
// Buyer Matching (Product Fit Scoring)
// ============================================================================

export interface BuyerMatching {
  productName: string;
  totalAnalyzed: number;
  potentialBuyers: PotentialBuyer[];
  summary: BuyerMatchingSummary;
  recommendedApproach: string;
}

export interface PotentialBuyer {
  name: string;
  website?: string;
  phone?: string;
  email?: string;
  fitScore: number;
  fitTier: 'high-fit' | 'medium-fit' | 'low-fit';
  fitReasons: string[];
  missingCapabilities: string[];
  rating?: number;
  reviewCount?: number;
}

export interface BuyerMatchingSummary {
  highFitCount: number;
  mediumFitCount: number;
  lowFitCount: number;
  avgFitScore: number;
  topOpportunity: string;
}

// ============================================================================
// My Business Info
// ============================================================================

export interface MyBusinessInfo {
  name?: string;
  website?: string;
  yearsInBusiness?: number;
  teamSize?: string;
  primaryServices?: string[];
  uniqueSellingPoints?: string[];
}

// ============================================================================
// Market Overview
// ============================================================================

export interface MarketOverview {
  totalCompetitors: number;
  marketMaturity: 'emerging' | 'growing' | 'mature' | 'saturated';
  competitionLevel: 'low' | 'moderate' | 'high' | 'intense';
  averageRating: number;
  averageReviewCount: number;
  marketLeadersCount: number;
  newEntrantsCount: number;
  marketTrends: string[];
  industryHealth: 'thriving' | 'stable' | 'challenging' | 'declining';
}

// ============================================================================
// SWOT Analysis
// ============================================================================

export interface SWOTAnalysis {
  // Strengths - Internal positive factors
  strengths: SWOTItem[];
  
  // Weaknesses - Internal negative factors
  weaknesses: SWOTItem[];
  
  // Opportunities - External positive factors
  opportunities: SWOTItem[];
  
  // Threats - External negative factors
  threats: SWOTItem[];
}

export interface SWOTItem {
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedAction?: string;
}

// ============================================================================
// Core Competencies
// ============================================================================

export interface CoreCompetencies {
  // What makes you stand out
  uniqueDifferentiators: Differentiator[];
  
  // Core strengths to leverage
  coreStrengths: CoreStrength[];
  
  // Competitive advantages
  competitiveAdvantages: CompetitiveAdvantage[];
  
  // Capability gaps to address
  capabilityGaps: CapabilityGap[];
  
  // Value proposition analysis
  valueProposition: ValueProposition;
}

export interface Differentiator {
  factor: string;
  description: string;
  competitorComparison: 'unique' | 'better' | 'similar' | 'behind';
  leverageStrategy: string;
}

export interface CoreStrength {
  strength: string;
  evidence: string;
  marketValue: 'high' | 'medium' | 'low';
  sustainability: 'sustainable' | 'temporary' | 'at-risk';
}

export interface CompetitiveAdvantage {
  advantage: string;
  type: 'cost' | 'differentiation' | 'focus' | 'innovation' | 'service' | 'brand';
  description: string;
  defensibility: 'strong' | 'moderate' | 'weak';
  recommendations: string[];
}

export interface CapabilityGap {
  gap: string;
  impact: 'critical' | 'significant' | 'moderate' | 'minor';
  competitorsWithCapability: number;
  remediation: string;
  investmentRequired: 'high' | 'medium' | 'low';
}

export interface ValueProposition {
  currentValue: string;
  targetAudience: string;
  keyBenefits: string[];
  proofPoints: string[];
  improvementAreas: string[];
}

// ============================================================================
// Competitor Comparison
// ============================================================================

export interface CompetitorComparison {
  // Direct competitors
  directCompetitors: CompetitorProfile[];
  
  // Indirect competitors
  indirectCompetitors: CompetitorProfile[];
  
  // Market leaders to watch
  marketLeaders: CompetitorProfile[];
  
  // Comparison metrics
  benchmarkMetrics: BenchmarkMetric[];
  
  // Competitive gaps in the market
  marketGaps: MarketGap[];
}

export interface CompetitorProfile {
  name: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  yearsInBusiness?: number;
  estimatedSize: 'large' | 'medium' | 'small' | 'micro';
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
  
  // Their strengths
  strengths: string[];
  
  // Their weaknesses (your opportunities)
  weaknesses: string[];
  
  // Key differentiators
  differentiators: string[];
  
  // Threat level to your business
  threatLevel: 'high' | 'medium' | 'low';
  
  // Strategy recommendations
  competitiveStrategy: string;
}

export interface BenchmarkMetric {
  metric: string;
  yourScore?: number | string;
  competitorAverage: number | string;
  marketLeaderScore: number | string;
  assessment: 'ahead' | 'on-par' | 'behind';
  recommendation: string;
}

export interface MarketGap {
  gap: string;
  description: string;
  opportunitySize: 'large' | 'medium' | 'small';
  competitorsCovering: number;
  yourPosition: 'addressing' | 'partially' | 'not-addressing';
  recommendation: string;
}

// ============================================================================
// Market Positioning
// ============================================================================

export interface MarketPositioning {
  // Current position assessment
  currentPosition: PositionAssessment;
  
  // Position in competitive landscape
  competitivePosition: 'leader' | 'challenger' | 'follower' | 'niche-player';
  
  // Strategic positioning options
  positioningOptions: PositioningOption[];
  
  // Recommended positioning
  recommendedPosition: RecommendedPosition;
  
  // Brand perception analysis
  brandPerception: BrandPerception;
}

export interface PositionAssessment {
  quadrant: 'premium-specialized' | 'premium-broad' | 'value-specialized' | 'value-broad';
  pricePosition: 'premium' | 'mid-market' | 'value' | 'budget';
  qualityPosition: 'premium' | 'standard' | 'economy';
  specializationLevel: 'highly-specialized' | 'moderately-specialized' | 'generalist';
  description: string;
}

export interface PositioningOption {
  strategy: string;
  description: string;
  targetSegment: string;
  requiredChanges: string[];
  competitorDensity: 'low' | 'moderate' | 'high';
  viability: 'highly-viable' | 'viable' | 'challenging';
}

export interface RecommendedPosition {
  position: string;
  rationale: string;
  keyMessages: string[];
  implementationSteps: string[];
  timeline: string;
}

export interface BrandPerception {
  currentPerception: string[];
  desiredPerception: string[];
  perceptionGaps: string[];
  recommendations: string[];
}

// ============================================================================
// AI Strategic Insights
// ============================================================================

export interface AIStrategicInsights {
  // Executive summary
  executiveSummary: string;
  
  // Key findings
  keyFindings: KeyFinding[];
  
  // Strategic recommendations
  strategicRecommendations: StrategicRecommendation[];
  
  // Quick wins
  quickWins: QuickWin[];
  
  // Long-term strategies
  longTermStrategies: LongTermStrategy[];
  
  // Risks to monitor
  risksToMonitor: RiskItem[];
  
  // Partnership opportunities
  partnershipOpportunities: PartnershipOpportunity[];
  
  // B2B seller insights (for companies looking to sell to this market)
  b2bSellerInsights?: B2BSellerInsights;
}

export interface KeyFinding {
  finding: string;
  implication: string;
  urgency: 'immediate' | 'short-term' | 'long-term';
}

export interface StrategicRecommendation {
  recommendation: string;
  rationale: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  implementationSteps: string[];
}

export interface QuickWin {
  action: string;
  expectedOutcome: string;
  timeline: string;
  resources: string;
}

export interface LongTermStrategy {
  strategy: string;
  description: string;
  timeline: string;
  milestones: string[];
  investmentLevel: 'high' | 'medium' | 'low';
}

export interface RiskItem {
  risk: string;
  likelihood: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface PartnershipOpportunity {
  partnerType: string;
  description: string;
  benefits: string[];
  approach: string;
}

// For B2B companies researching who to sell to
export interface B2BSellerInsights {
  idealCustomerProfile: string;
  painPointsToAddress: string[];
  buyingTriggers: string[];
  decisionMakers: string[];
  sellingApproach: string;
  pricingSensitivity: 'high' | 'medium' | 'low';
  competitorsToDisplace: string[];
}

// ============================================================================
// Factory function
// ============================================================================

// ============================================================================
// Website Comparison
// ============================================================================

export interface WebsiteComparison {
  yourWebsite?: WebsiteProfile;
  competitorWebsites: WebsiteProfile[];
  industryBenchmarks: WebsiteBenchmark[];
  recommendations: string[];
}

export interface WebsiteProfile {
  name: string;
  url?: string;
  platform?: string;
  hasMobileOptimization: boolean;
  hasSSL: boolean;
  hasBlog: boolean;
  hasOnlineBooking: boolean;
  hasChatWidget: boolean;
  hasTestimonials: boolean;
  hasPricing: boolean;
  hasPortfolio: boolean;
  socialLinks: string[];
  missingFeatures: string[];
  score: number;
}

export interface WebsiteBenchmark {
  feature: string;
  yourStatus: 'has' | 'missing' | 'partial';
  competitorAdoption: number; // percentage
  priority: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

// ============================================================================
// Social Media Benchmark
// ============================================================================

export interface SocialMediaBenchmark {
  platforms: SocialPlatformAnalysis[];
  competitorPresence: CompetitorSocialPresence[];
  gaps: SocialGap[];
  contentStrategy: ContentStrategyRecommendation[];
  overallScore: number;
}

export interface SocialPlatformAnalysis {
  platform: string;
  icon: string;
  yourPresence: boolean;
  competitorsOnPlatform: number;
  competitorPercentage: number;
  importance: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface CompetitorSocialPresence {
  name: string;
  platforms: string[];
  estimatedFollowing: string;
  contentFrequency: string;
  engagement: 'high' | 'medium' | 'low';
}

export interface SocialGap {
  platform: string;
  gap: string;
  competitorsLeveraging: number;
  potentialImpact: string;
}

export interface ContentStrategyRecommendation {
  type: string;
  description: string;
  frequency: string;
  expectedImpact: string;
  examples: string[];
}

// ============================================================================
// Product & Service Gap Analysis
// ============================================================================

export interface ProductServiceGap {
  yourServices: string[];
  competitorOfferings: CompetitorOffering[];
  serviceGaps: ServiceGap[];
  pricingInsights: PricingInsight[];
  upsellOpportunities: UpsellOpportunity[];
  marketDemand: MarketDemandItem[];
}

export interface CompetitorOffering {
  competitorName: string;
  services: string[];
  uniqueOfferings: string[];
  pricingModel: string;
  valueAdds: string[];
}

export interface ServiceGap {
  service: string;
  competitorsOffering: number;
  competitorPercentage: number;
  demandLevel: 'high' | 'medium' | 'low';
  revenueImpact: 'high' | 'medium' | 'low';
  implementationDifficulty: 'easy' | 'moderate' | 'hard';
  recommendation: string;
}

export interface PricingInsight {
  service: string;
  marketLow: string;
  marketAverage: string;
  marketHigh: string;
  yourPosition?: string;
  recommendation: string;
}

export interface UpsellOpportunity {
  opportunity: string;
  description: string;
  targetCustomers: string;
  estimatedRevenue: string;
  competitorsDoingThis: number;
}

export interface MarketDemandItem {
  service: string;
  demandTrend: 'growing' | 'stable' | 'declining';
  searchVolume: string;
  competitorSaturation: 'low' | 'medium' | 'high';
  opportunity: string;
}

// ============================================================================
// AI Comprehensive Success Plan
// ============================================================================

export interface AISuccessPlan {
  overallGrade: string;
  executiveBrief: string;
  
  // Website improvements
  websiteActions: SuccessAction[];
  
  // Social media improvements
  socialActions: SuccessAction[];
  
  // Product/service improvements
  productActions: SuccessAction[];
  
  // Marketing improvements
  marketingActions: SuccessAction[];
  
  // Operations improvements
  operationsActions: SuccessAction[];
  
  // Revenue growth strategies
  revenueActions: SuccessAction[];
  
  // 30-60-90 day plan
  thirtyDayPlan: MilestonePlan;
  sixtyDayPlan: MilestonePlan;
  ninetyDayPlan: MilestonePlan;
  
  // Competitive moat building
  moatStrategies: MoatStrategy[];
  
  // Cost optimization
  costOptimizations: CostOptimization[];
}

export interface SuccessAction {
  action: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  timeline: string;
  competitorsDoingThis: string;
  estimatedROI: string;
}

export interface MilestonePlan {
  label: string;
  goals: string[];
  actions: string[];
  expectedOutcomes: string[];
  kpis: string[];
}

export interface MoatStrategy {
  strategy: string;
  description: string;
  competitiveAdvantage: string;
  timeToImplement: string;
  defensibility: 'strong' | 'moderate' | 'weak';
}

export interface CostOptimization {
  area: string;
  currentApproach: string;
  competitorApproach: string;
  savings: string;
  recommendation: string;
}

// ============================================================================
// 1. Market Gaps & White Space
// ============================================================================

export interface MarketGapsWhiteSpace {
  underservedSegments: UnderservedSegment[];
  featureGaps: FeatureGap[];
  topicGaps: TopicGap[];
  summary: string;
}

export interface UnderservedSegment {
  segment: string;
  description: string;
  currentlyServedBy: string;
  opportunitySize: 'large' | 'medium' | 'small';
  entryDifficulty: 'easy' | 'moderate' | 'hard';
}

export interface FeatureGap {
  feature: string;
  customerDemand: 'high' | 'medium' | 'low';
  competitorsOffering: number;
  recommendation: string;
}

export interface TopicGap {
  topic: string;
  searchVolume: 'high' | 'medium' | 'low';
  competitorsCovering: number;
  contentType: string;
  potentialTraffic: string;
}

// ============================================================================
// 2. Strategic Deep Dives
// ============================================================================

export interface StrategicDeepDives {
  operationalIntelligence: OperationalIntel[];
  fourPsBreakdown: FourPsAnalysis;
  contentStrategy: ContentStrategyAnalysis[];
}

export interface OperationalIntel {
  competitorName: string;
  techStack: string[];
  hiringSignals: string[];
  partnerships: string[];
  strategicImplication: string;
}

export interface FourPsAnalysis {
  product: FourPsItem[];
  pricing: FourPsItem[];
  promotion: FourPsItem[];
  place: FourPsItem[];
}

export interface FourPsItem {
  competitorName: string;
  details: string;
  yourPosition: 'ahead' | 'on-par' | 'behind' | 'unknown';
  recommendation: string;
}

export interface ContentStrategyAnalysis {
  competitorName: string;
  topTopics: string[];
  contentTypes: string[];
  publishingFrequency: string;
  engagement: 'high' | 'medium' | 'low';
  gaps: string[];
}

// ============================================================================
// 3. Indirect & Replacement Threats
// ============================================================================

export interface IndirectThreats {
  indirectCompetitorsList: IndirectCompetitor[];
  replacementThreats: ReplacementThreat[];
  disruptionRisks: string[];
  defensiveStrategies: string[];
}

export interface IndirectCompetitor {
  name: string;
  type: 'indirect' | 'replacement';
  description: string;
  howTheyCompete: string;
  threatLevel: 'high' | 'medium' | 'low';
  customerOverlap: string;
}

export interface ReplacementThreat {
  alternative: string;
  description: string;
  customerReasoning: string;
  preventionStrategy: string;
}

// ============================================================================
// 4. Customer Sentiment & Brand Perception
// ============================================================================

export interface CustomerSentiment {
  competitorSentiment: CompetitorSentimentItem[];
  aiShareOfVoice: AIShareOfVoice[];
  reviewPlatforms: ReviewPlatformAnalysis[];
  overallInsight: string;
}

export interface CompetitorSentimentItem {
  competitorName: string;
  overallSentiment: 'positive' | 'mixed' | 'negative';
  positiveThemes: string[];
  negativeThemes: string[];
  notableQuotes: string[];
  exploitableWeakness: string;
}

export interface AIShareOfVoice {
  brand: string;
  mentionFrequency: 'frequent' | 'occasional' | 'rare' | 'none';
  context: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface ReviewPlatformAnalysis {
  platform: string;
  avgRating: number;
  totalReviews: number;
  trend: 'improving' | 'stable' | 'declining';
  keyInsight: string;
}

// ============================================================================
// 5. Benchmark Performance Metrics
// ============================================================================

export interface BenchmarkPerformance {
  technicalHealth: TechnicalHealthBenchmark[];
  marketingSpend: MarketingSpendEstimate[];
  keywordBidding: KeywordBiddingInsight[];
  performanceSummary: string;
}

export interface TechnicalHealthBenchmark {
  competitorName: string;
  pageSpeed: string;
  mobileScore: string;
  sslStatus: boolean;
  assessment: 'excellent' | 'good' | 'average' | 'poor';
}

export interface MarketingSpendEstimate {
  competitorName: string;
  estimatedMonthlySpend: string;
  primaryChannels: string[];
  spendTrend: 'increasing' | 'stable' | 'decreasing';
}

export interface KeywordBiddingInsight {
  keyword: string;
  estimatedCPC: string;
  topBidders: string[];
  competitionLevel: 'high' | 'medium' | 'low';
  recommendation: string;
}

// ============================================================================
// Factory function
// ============================================================================

export function createDefaultCompetitiveIntelligence(
  searchQuery: string,
  searchLocation: string,
  myBusiness?: MyBusinessInfo
): CompetitiveIntelligence {
  return {
    reportId: `comp_${Date.now()}`,
    searchQuery,
    searchLocation,
    analyzedAt: new Date().toISOString(),
    myBusiness,
    
    marketOverview: {
      totalCompetitors: 0,
      marketMaturity: 'growing',
      competitionLevel: 'moderate',
      averageRating: 0,
      averageReviewCount: 0,
      marketLeadersCount: 0,
      newEntrantsCount: 0,
      marketTrends: [],
      industryHealth: 'stable',
    },
    
    swotAnalysis: {
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: [],
    },
    
    coreCompetencies: {
      uniqueDifferentiators: [],
      coreStrengths: [],
      competitiveAdvantages: [],
      capabilityGaps: [],
      valueProposition: {
        currentValue: '',
        targetAudience: '',
        keyBenefits: [],
        proofPoints: [],
        improvementAreas: [],
      },
    },
    
    competitorComparison: {
      directCompetitors: [],
      indirectCompetitors: [],
      marketLeaders: [],
      benchmarkMetrics: [],
      marketGaps: [],
    },
    
    marketPositioning: {
      currentPosition: {
        quadrant: 'value-broad',
        pricePosition: 'mid-market',
        qualityPosition: 'standard',
        specializationLevel: 'generalist',
        description: '',
      },
      competitivePosition: 'follower',
      positioningOptions: [],
      recommendedPosition: {
        position: '',
        rationale: '',
        keyMessages: [],
        implementationSteps: [],
        timeline: '',
      },
      brandPerception: {
        currentPerception: [],
        desiredPerception: [],
        perceptionGaps: [],
        recommendations: [],
      },
    },
    
    aiStrategicInsights: {
      executiveSummary: '',
      keyFindings: [],
      strategicRecommendations: [],
      quickWins: [],
      longTermStrategies: [],
      risksToMonitor: [],
      partnershipOpportunities: [],
    },
  };
}
