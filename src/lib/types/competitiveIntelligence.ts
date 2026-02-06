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
  
  // My business info (if provided)
  myBusiness?: MyBusinessInfo;
  
  // Market Overview
  marketOverview: MarketOverview;
  
  // SWOT Analysis
  swotAnalysis: SWOTAnalysis;
  
  // Core Competencies & Differentiators
  coreCompetencies: CoreCompetencies;
  
  // Competitor Comparison
  competitorComparison: CompetitorComparison;
  
  // Market Position Analysis
  marketPositioning: MarketPositioning;
  
  // AI Strategic Recommendations
  aiStrategicInsights: AIStrategicInsights;
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
