/**
 * Niche Intelligence Types
 * Comprehensive market-level analysis for the searched niche/industry
 * Includes trend analysis, market dynamics, and standard products/services
 */

// ============================================================================
// 12. Niche Market Intelligence (NEW - Market-Level Analysis)
// ============================================================================

export interface NicheIntelligence {
  nicheId: string;
  searchQuery: string;
  searchLocation: string;
  analyzedAt: string;
  
  // Core niche identification
  nicheIdentification: NicheIdentification;
  
  // Trend analysis
  trendAnalysis: TrendAnalysis;
  
  // Market dynamics
  marketAnalysis: MarketAnalysis;
  
  // Standard products & services
  productsAndServices: ProductsAndServices;
  
  // Competitive landscape summary
  competitiveLandscape: CompetitiveLandscape;
  
  // AI-generated insights
  aiNicheInsights: AINicheInsights;
}

// ============================================================================
// Niche Identification
// ============================================================================

export interface NicheIdentification {
  primaryIndustry: string;
  industryCode: string; // NAICS
  subCategory?: string;
  alternateNames: string[];
  relatedNiches: string[];
  targetMarket: string; // B2B, B2C, Both
  geographicScope: 'local' | 'regional' | 'national' | 'international';
}

// ============================================================================
// Trend Analysis
// ============================================================================

export interface TrendAnalysis {
  overallTrend: 'growing' | 'stable' | 'declining';
  growthRate?: string; // e.g., "5.2% YoY"
  
  // Current trends affecting this niche
  currentTrends: NicheTrend[];
  
  // Emerging opportunities
  emergingOpportunities: string[];
  
  // Threats & challenges
  industryThreats: string[];
  
  // Seasonality
  seasonalPatterns: SeasonalPattern[];
  
  // Technology trends
  technologyTrends: TechnologyTrend[];
  
  // Consumer behavior shifts
  consumerBehaviorShifts: string[];
  
  // Regulatory changes
  regulatoryChanges: string[];
}

export interface NicheTrend {
  name: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeline: 'immediate' | 'short-term' | 'long-term';
  opportunity?: string;
}

export interface SeasonalPattern {
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'holiday' | 'back-to-school';
  demandLevel: 'peak' | 'high' | 'normal' | 'low';
  notes?: string;
}

export interface TechnologyTrend {
  technology: string;
  adoptionRate: 'early-adopter' | 'growing' | 'mainstream' | 'declining';
  relevance: 'critical' | 'important' | 'optional';
  description?: string;
}

// ============================================================================
// Market Analysis
// ============================================================================

export interface MarketAnalysis {
  marketSize: MarketSize;
  competitiveIntensity: 'very-high' | 'high' | 'medium' | 'low';
  barrierToEntry: 'very-high' | 'high' | 'medium' | 'low';
  
  // Pricing dynamics
  pricingDynamics: PricingDynamics;
  
  // Customer segments
  customerSegments: CustomerSegment[];
  
  // Key success factors
  keySuccessFactors: string[];
  
  // Industry challenges
  industryChallenges: string[];
  
  // Buying patterns
  buyingPatterns: BuyingPattern;
  
  // Marketing channels effectiveness
  marketingChannels: MarketingChannel[];
}

export interface MarketSize {
  estimatedSize?: string; // e.g., "$50B nationally"
  localMarketSize?: string;
  numberOfCompetitors?: number;
  marketConcentration: 'fragmented' | 'moderate' | 'concentrated';
}

export interface PricingDynamics {
  typicalPriceRange: string;
  pricingModel: 'fixed' | 'hourly' | 'project' | 'subscription' | 'hybrid';
  priceElasticity: 'high' | 'medium' | 'low';
  premiumOpportunities: string[];
}

export interface CustomerSegment {
  name: string;
  description: string;
  percentage?: number;
  averageSpend?: string;
  painPoints: string[];
  valueDrivers: string[];
}

export interface BuyingPattern {
  typicalBuyingCycle: string; // e.g., "1-2 weeks", "immediate", "3-6 months"
  decisionMakers: string[];
  researchBehavior: string[];
  triggerEvents: string[];
}

export interface MarketingChannel {
  channel: string;
  effectiveness: 'very-effective' | 'effective' | 'moderate' | 'low';
  costLevel: 'high' | 'medium' | 'low';
  notes?: string;
}

// ============================================================================
// Products and Services
// ============================================================================

export interface ProductsAndServices {
  // Core services/products offered in this niche
  coreServices: ServiceOffering[];
  
  // Additional/upsell services
  additionalServices: ServiceOffering[];
  
  // Emerging service categories
  emergingServices: ServiceOffering[];
  
  // Service bundles commonly offered
  commonBundles: ServiceBundle[];
  
  // Pricing benchmarks
  pricingBenchmarks: PricingBenchmark[];
}

export interface ServiceOffering {
  name: string;
  description: string;
  category: string;
  commonPriceRange?: string;
  demandLevel: 'very-high' | 'high' | 'medium' | 'low';
  profitMargin?: 'high' | 'medium' | 'low';
  requiredCapabilities?: string[];
}

export interface ServiceBundle {
  name: string;
  includedServices: string[];
  typicalPrice?: string;
  targetCustomer?: string;
}

export interface PricingBenchmark {
  service: string;
  lowEnd?: string;
  midRange?: string;
  premium?: string;
  range?: string;
  notes?: string;
}

// ============================================================================
// Competitive Landscape
// ============================================================================

export interface CompetitiveLandscape {
  totalCompetitorsInArea: number;
  marketLeaders: CompetitorProfile[];
  averageRating: number;
  averageReviewCount: number;
  
  // Competitive gaps identified
  competitiveGaps: CompetitiveGap[];
  
  // Differentiation opportunities
  differentiationOpportunities: DifferentiationOpportunity[];
  
  // Market positioning spectrum
  positioningSpectrum: PositioningOption[];
}

export interface CompetitorProfile {
  name: string;
  rating?: number;
  reviewCount?: number;
  yearsInBusiness?: number;
  strengths: string[];
  weaknesses: string[];
  marketShare?: 'leader' | 'challenger' | 'follower' | 'niche';
}

export interface CompetitiveGap {
  gap: string;
  description: string;
  opportunitySize: 'large' | 'medium' | 'small';
  difficultyToCapture: 'easy' | 'moderate' | 'hard';
}

export interface DifferentiationOpportunity {
  strategy: string;
  description: string;
  investmentRequired: 'high' | 'medium' | 'low';
  potentialImpact: 'high' | 'medium' | 'low';
}

export interface PositioningOption {
  position: 'premium' | 'value' | 'specialized' | 'convenience';
  description: string;
  targetCustomer: string;
  competitorDensity: 'crowded' | 'moderate' | 'underserved';
}

// ============================================================================
// AI Niche Insights
// ============================================================================

export interface AINicheInsights {
  executiveSummary: string;
  
  // Key opportunities
  topOpportunities: OpportunityInsight[];
  
  // Selling angle recommendations
  recommendedSellingAngles: SellingAngle[];
  
  // Objections to expect
  commonObjections: ObjectionWithRebuttal[];
  
  // Best approach for this niche
  recommendedApproach: RecommendedApproach;
  
  // Win probability factors
  successFactors: SuccessFactor[];
}

export interface OpportunityInsight {
  opportunity: string;
  reasoning: string;
  urgency: 'immediate' | 'short-term' | 'long-term';
  estimatedValue?: string;
}

export interface SellingAngle {
  angle: string;
  targetPainPoint: string;
  messagingHook: string;
  proofPoints: string[];
}

export interface ObjectionWithRebuttal {
  objection: string;
  frequency: 'very-common' | 'common' | 'occasional';
  rebuttal: string;
  supportingData?: string;
}

export interface RecommendedApproach {
  primaryChannel: 'email' | 'phone' | 'linkedin' | 'in-person' | 'multi-channel';
  bestTimeToReach: string;
  communicationStyle: string;
  followUpCadence: string;
  averageSaleCycle: string;
}

export interface SuccessFactor {
  factor: string;
  importance: 'critical' | 'important' | 'helpful';
  currentStatus: 'strong' | 'moderate' | 'weak' | 'unknown';
}

// ============================================================================
// Factory function to create default niche intelligence
// ============================================================================

export function createDefaultNicheIntelligence(
  searchQuery: string,
  searchLocation: string
): NicheIntelligence {
  return {
    nicheId: `niche_${Date.now()}`,
    searchQuery,
    searchLocation,
    analyzedAt: new Date().toISOString(),
    
    nicheIdentification: {
      primaryIndustry: extractIndustryFromQuery(searchQuery),
      industryCode: '',
      alternateNames: [],
      relatedNiches: [],
      targetMarket: 'B2C',
      geographicScope: 'local',
    },
    
    trendAnalysis: {
      overallTrend: 'stable',
      currentTrends: [],
      emergingOpportunities: [],
      industryThreats: [],
      seasonalPatterns: [],
      technologyTrends: [],
      consumerBehaviorShifts: [],
      regulatoryChanges: [],
    },
    
    marketAnalysis: {
      marketSize: {
        marketConcentration: 'fragmented',
      },
      competitiveIntensity: 'medium',
      barrierToEntry: 'medium',
      pricingDynamics: {
        typicalPriceRange: 'Varies',
        pricingModel: 'hybrid',
        priceElasticity: 'medium',
        premiumOpportunities: [],
      },
      customerSegments: [],
      keySuccessFactors: [],
      industryChallenges: [],
      buyingPatterns: {
        typicalBuyingCycle: 'Varies',
        decisionMakers: [],
        researchBehavior: [],
        triggerEvents: [],
      },
      marketingChannels: [],
    },
    
    productsAndServices: {
      coreServices: [],
      additionalServices: [],
      emergingServices: [],
      commonBundles: [],
      pricingBenchmarks: [],
    },
    
    competitiveLandscape: {
      totalCompetitorsInArea: 0,
      marketLeaders: [],
      averageRating: 0,
      averageReviewCount: 0,
      competitiveGaps: [],
      differentiationOpportunities: [],
      positioningSpectrum: [],
    },
    
    aiNicheInsights: {
      executiveSummary: '',
      topOpportunities: [],
      recommendedSellingAngles: [],
      commonObjections: [],
      recommendedApproach: {
        primaryChannel: 'email',
        bestTimeToReach: 'Tuesday-Thursday, 9-11 AM',
        communicationStyle: 'Professional and value-focused',
        followUpCadence: '3-5 touchpoints over 2 weeks',
        averageSaleCycle: 'Varies by service',
      },
      successFactors: [],
    },
  };
}

/**
 * Extract industry name from search query
 */
function extractIndustryFromQuery(query: string): string {
  // Remove location parts
  const cleanedQuery = query
    .replace(/\s+(in|near|around)\s+.*/i, '')
    .replace(/\s+(city|town|area|region|county)$/i, '')
    .trim();
  
  return cleanedQuery || 'General Services';
}
