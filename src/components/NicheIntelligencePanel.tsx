import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp, TrendingDown, Minus, Package, DollarSign, Users, 
  Target, Lightbulb, ChevronDown, ChevronUp, Sparkles, 
  BarChart3, Calendar, Zap, AlertTriangle, CheckCircle2,
  Building2, ShoppingBag, LineChart, Award, MessageSquare,
  ArrowUpRight, Clock, Star, Briefcase, FileText, RefreshCw,
  Globe, Monitor, Wifi, PieChart, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NicheIntelligence, NicheTrend, ServiceOffering, CustomerSegment, BusinessSampleEntry, IntelligenceTag } from '@/lib/types/nicheIntelligence';

interface NicheIntelligencePanelProps {
  nicheIntelligence: NicheIntelligence | null;
  isLoading?: boolean;
  searchQuery?: string;
  onRefresh?: () => void;
}

export default function NicheIntelligencePanel({
  nicheIntelligence,
  isLoading = false,
  searchQuery,
  onRefresh
}: NicheIntelligencePanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    trends: true,
    market: true,
    services: true,
    competitive: false,
    insights: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="py-12 text-center">
          <RefreshCw className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-lg font-medium text-foreground">Analyzing Niche Intelligence...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Generating trend analysis, market insights, and competitive landscape
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!nicheIntelligence) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/30 bg-muted/10">
        <CardContent className="py-8 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No niche intelligence available</p>
          <p className="text-sm text-muted-foreground/70">Run a search to generate market analysis</p>
        </CardContent>
      </Card>
    );
  }

  const { 
    nicheIdentification, 
    trendAnalysis, 
    marketAnalysis, 
    productsAndServices, 
    competitiveLandscape,
    aiNicheInsights,
    marketOverview,
    marketPatterns,
    businessSample,
  } = nicheIntelligence;

  const getTrendIcon = (trend: 'growing' | 'stable' | 'declining') => {
    switch (trend) {
      case 'growing': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'declining': return <TrendingDown className="w-5 h-5 text-red-400" />;
      default: return <Minus className="w-5 h-5 text-amber-400" />;
    }
  };

  const getTrendColor = (trend: 'growing' | 'stable' | 'declining') => {
    switch (trend) {
      case 'growing': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'declining': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    }
  };

  const getDemandBadge = (level: string) => {
    switch (level) {
      case 'very-high': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'high': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card with Market Overview */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {nicheIdentification.primaryIndustry} Market Intelligence
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={cn("font-semibold", getTrendColor(trendAnalysis.overallTrend))}>
                    {getTrendIcon(trendAnalysis.overallTrend)}
                    <span className="ml-1">{trendAnalysis.overallTrend} Market</span>
                  </Badge>
                  {trendAnalysis.growthRate && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {trendAnalysis.growthRate}
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Digital Maturity Score + Key Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {/* Digital Maturity Score */}
            <div className="col-span-2 md:col-span-1 p-4 rounded-xl bg-gradient-to-br from-primary/20 to-emerald-500/10 border border-primary/20 text-center">
              <Monitor className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-3xl font-bold text-foreground">
                {marketOverview?.digitalMaturityScore ?? competitiveLandscape.totalCompetitorsInArea}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                {marketOverview ? 'Digital Maturity' : 'Businesses Found'}
              </p>
              {marketOverview && (
                <Progress value={marketOverview.digitalMaturityScore} className="mt-2 h-1.5" />
              )}
            </div>
            
            <div className="text-center p-3 rounded-lg bg-background/50 border border-border">
              <Building2 className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-foreground">
                {marketOverview?.totalBusinessesFound ?? competitiveLandscape.totalCompetitorsInArea}
              </p>
              <p className="text-xs text-muted-foreground">Total Found</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50 border border-border">
              <Globe className="w-5 h-5 mx-auto mb-2 text-blue-400" />
              <p className="text-2xl font-bold text-foreground">
                {marketOverview?.percentWithWebsite ?? (competitiveLandscape.totalCompetitorsInArea > 0 ? '—' : '0')}%
              </p>
              <p className="text-xs text-muted-foreground">Have Website</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50 border border-border">
              <Star className="w-5 h-5 mx-auto mb-2 text-amber-400" />
              <p className="text-2xl font-bold text-foreground">
                {(marketOverview?.avgRating ?? competitiveLandscape.averageRating).toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50 border border-border">
              <MessageSquare className="w-5 h-5 mx-auto mb-2 text-blue-400" />
              <p className="text-2xl font-bold text-foreground">
                {marketOverview?.avgReviewCount ?? competitiveLandscape.averageReviewCount}
              </p>
              <p className="text-xs text-muted-foreground">Avg Reviews</p>
            </div>
          </div>

          {/* Additional Aggregated Metrics */}
          {marketOverview && (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              <MetricBadge label="No Website" value={`${marketOverview.percentNoWebsite}%`} impact={marketOverview.percentNoWebsite > 20 ? 'critical' : 'medium'} />
              <MetricBadge label="Outdated Sites" value={`${marketOverview.percentOutdatedWebsite}%`} impact={marketOverview.percentOutdatedWebsite > 30 ? 'critical' : 'medium'} />
              <MetricBadge label="Has Email" value={`${marketOverview.percentWithEmail}%`} impact={marketOverview.percentWithEmail < 30 ? 'low' : 'high'} />
              <MetricBadge label="Has Phone" value={`${marketOverview.percentWithPhone}%`} impact={marketOverview.percentWithPhone < 50 ? 'low' : 'high'} />
              <MetricBadge label="Site Quality" value={`${marketOverview.websiteQualityScore}/100`} impact={marketOverview.websiteQualityScore < 50 ? 'critical' : 'medium'} />
              <MetricBadge label="Competition" value={marketAnalysis.competitiveIntensity} impact={marketAnalysis.competitiveIntensity === 'high' ? 'critical' : 'medium'} />
            </div>
          )}

          {/* Top CMS Platforms */}
          {marketOverview?.topCMSPlatforms && marketOverview.topCMSPlatforms.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5">
                <PieChart className="w-3.5 h-3.5" /> Top Website Platforms
              </p>
              <div className="flex flex-wrap gap-2">
                {marketOverview.topCMSPlatforms.map((cms, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {cms.platform}: {cms.percentage}% ({cms.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* MARKET PATTERNS — Derived Insights */}
      {marketPatterns && marketPatterns.length > 0 && (
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-500/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Market Patterns & Insights</CardTitle>
                <CardDescription>Key findings from analyzing {marketOverview?.totalBusinessesFound ?? 0} businesses</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {marketPatterns.map((pattern, idx) => (
              <div 
                key={idx}
                className={cn(
                  "p-3 rounded-lg border flex items-start gap-3",
                  pattern.impact === 'critical' ? "bg-red-500/5 border-red-500/20" :
                  pattern.impact === 'high' ? "bg-amber-500/5 border-amber-500/20" :
                  "bg-muted/30 border-border"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  pattern.impact === 'critical' ? "bg-red-500/20" :
                  pattern.impact === 'high' ? "bg-amber-500/20" : "bg-primary/20"
                )}>
                  {pattern.category === 'digital_gap' ? <Globe className="w-4 h-4 text-primary" /> :
                   pattern.category === 'modernization' ? <Monitor className="w-4 h-4 text-amber-400" /> :
                   pattern.category === 'reputation' ? <Star className="w-4 h-4 text-amber-400" /> :
                   <Lightbulb className="w-4 h-4 text-primary" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground text-sm">{pattern.insight}</p>
                  <p className="text-xs text-muted-foreground mt-1">{pattern.opportunity}</p>
                  <Badge variant="outline" className={cn(
                    "text-xs mt-2",
                    pattern.impact === 'critical' ? "border-red-400/50 text-red-400" :
                    pattern.impact === 'high' ? "border-amber-400/50 text-amber-400" :
                    "border-slate-400/50 text-slate-400"
                  )}>
                    {pattern.impact} impact
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Business Sample with Intelligence Tags */}
      {businessSample && businessSample.length > 0 && (
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Business Sample</CardTitle>
                <CardDescription>Representative companies with intelligence classification (not leads)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {businessSample.map((biz, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{biz.name}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {biz.platform && <span>{biz.platform}</span>}
                        {biz.rating && <span>⭐ {biz.rating.toFixed(1)}</span>}
                        {biz.reviewCount !== undefined && <span>({biz.reviewCount} reviews)</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 shrink-0">
                      {biz.tags.map((tag, tagIdx) => (
                        <Badge key={tagIdx} variant="outline" className={cn("text-xs",
                          tag === 'Digitally Strong' ? "border-emerald-400/50 text-emerald-400 bg-emerald-400/10" :
                          tag === 'Digitally Weak' ? "border-red-400/50 text-red-400 bg-red-400/10" :
                          tag === 'Traditional' ? "border-slate-400/50 text-slate-400 bg-slate-400/10" :
                          "border-blue-400/50 text-blue-400 bg-blue-400/10"
                        )}>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}


      {/* AI Executive Summary */}
      <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Executive Summary</CardTitle>
              <CardDescription>Key insights from market analysis</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed">
            {aiNicheInsights.executiveSummary}
          </p>
          
          {/* Top Opportunities */}
          {aiNicheInsights.topOpportunities.length > 0 && (
            <div className="mt-4 grid gap-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Top Opportunities
              </h4>
              {aiNicheInsights.topOpportunities.map((opp, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-lg bg-background/50 border border-border flex items-start gap-3"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    opp.urgency === 'immediate' ? "bg-emerald-500/20" : 
                    opp.urgency === 'short-term' ? "bg-blue-500/20" : "bg-slate-500/20"
                  )}>
                    <Lightbulb className={cn(
                      "w-4 h-4",
                      opp.urgency === 'immediate' ? "text-emerald-400" : 
                      opp.urgency === 'short-term' ? "text-blue-400" : "text-slate-400"
                    )} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{opp.opportunity}</p>
                    <p className="text-sm text-muted-foreground mt-1">{opp.reasoning}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs capitalize">{opp.urgency}</Badge>
                      {opp.estimatedValue && (
                        <Badge variant="outline" className="text-xs">{opp.estimatedValue}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trend Analysis Section */}
      <Collapsible open={expandedSections.trends} onOpenChange={() => toggleSection('trends')}>
        <Card className="border border-border">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Trend Analysis</CardTitle>
                    <CardDescription>{trendAnalysis.currentTrends.length} current trends identified</CardDescription>
                  </div>
                </div>
                {expandedSections.trends ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {/* Current Trends */}
              {trendAnalysis.currentTrends.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Current Industry Trends
                  </h4>
                  <div className="grid gap-3">
                    {trendAnalysis.currentTrends.map((trend, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-foreground">{trend.name}</p>
                            {trend.description && (
                              <p className="text-sm text-muted-foreground mt-1">{trend.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className={cn(
                              "text-xs",
                              trend.impact === 'high' ? "border-red-400/50 text-red-400" :
                              trend.impact === 'medium' ? "border-amber-400/50 text-amber-400" :
                              "border-slate-400/50 text-slate-400"
                            )}>
                              {trend.impact} impact
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seasonality */}
              {trendAnalysis.seasonalPatterns.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Seasonal Patterns
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {trendAnalysis.seasonalPatterns.map((pattern, idx) => (
                      <Badge 
                        key={idx} 
                        variant="outline"
                        className={cn(
                          "capitalize",
                          pattern.demandLevel === 'peak' ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-400" :
                          pattern.demandLevel === 'high' ? "border-blue-400/50 bg-blue-400/10 text-blue-400" :
                          pattern.demandLevel === 'low' ? "border-red-400/50 bg-red-400/10 text-red-400" :
                          "border-slate-400/50 bg-slate-400/10 text-slate-400"
                        )}
                      >
                        {pattern.season}: {pattern.demandLevel}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Technology Trends */}
              {trendAnalysis.technologyTrends.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Technology Trends
                  </h4>
                  <div className="grid gap-2">
                    {trendAnalysis.technologyTrends.map((tech, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                        <span className="font-medium text-foreground">{tech.technology}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs capitalize">{tech.adoptionRate}</Badge>
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            tech.relevance === 'critical' ? "border-red-400/50 text-red-400" : ""
                          )}>
                            {tech.relevance}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Consumer Behavior Shifts */}
              {trendAnalysis.consumerBehaviorShifts.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Consumer Behavior Shifts
                  </h4>
                  <ul className="space-y-2">
                    {trendAnalysis.consumerBehaviorShifts.map((shift, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ArrowUpRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        {shift}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Threats */}
              {trendAnalysis.industryThreats.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Industry Challenges
                  </h4>
                  <ul className="space-y-2">
                    {trendAnalysis.industryThreats.map((threat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        {threat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Products & Services Section */}
      <Collapsible open={expandedSections.services} onOpenChange={() => toggleSection('services')}>
        <Card className="border border-border">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Package className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Standard Products & Services</CardTitle>
                    <CardDescription>
                      {productsAndServices.coreServices.length} core + {productsAndServices.additionalServices.length} additional services
                    </CardDescription>
                  </div>
                </div>
                {expandedSections.services ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {/* Core Services */}
              {productsAndServices.coreServices.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Core Services (Must-Have)
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {productsAndServices.coreServices.map((service, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-foreground">{service.name}</p>
                            {service.commonPriceRange && (
                              <p className="text-xs text-muted-foreground mt-1">{service.commonPriceRange}</p>
                            )}
                          </div>
                          <Badge variant="outline" className={getDemandBadge(service.demandLevel)}>
                            {service.demandLevel}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Services */}
              {productsAndServices.additionalServices.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    Additional Services (Upsells)
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {productsAndServices.additionalServices.map((service, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-muted/20 border border-border">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-foreground">{service.name}</p>
                          <Badge variant="outline" className={getDemandBadge(service.demandLevel)}>
                            {service.demandLevel}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Emerging Services */}
              {productsAndServices.emergingServices.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Emerging Services (Opportunities)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {productsAndServices.emergingServices.map((service, idx) => (
                      <Badge key={idx} variant="outline" className="border-amber-400/30 bg-amber-400/10 text-amber-400">
                        {service.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Benchmarks */}
              {productsAndServices.pricingBenchmarks.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    Pricing Benchmarks
                  </h4>
                  <div className="grid gap-2">
                    {productsAndServices.pricingBenchmarks.map((benchmark, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                        <span className="font-medium text-foreground">{benchmark.service}</span>
                        <span className="text-muted-foreground text-sm">{benchmark.range || benchmark.midRange || `${benchmark.lowEnd || ''} - ${benchmark.premium || ''}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Market Analysis Section */}
      <Collapsible open={expandedSections.market} onOpenChange={() => toggleSection('market')}>
        <Card className="border border-border">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <LineChart className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Market Analysis</CardTitle>
                    <CardDescription>Pricing, segments, and buying behavior</CardDescription>
                  </div>
                </div>
                {expandedSections.market ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-6">
              {/* Customer Segments */}
              {marketAnalysis.customerSegments.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Customer Segments
                  </h4>
                  <div className="grid gap-4">
                    {marketAnalysis.customerSegments.map((segment, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-foreground">{segment.name}</p>
                            <p className="text-sm text-muted-foreground">{segment.description}</p>
                          </div>
                          {segment.percentage && (
                            <Badge variant="outline" className="text-primary">{segment.percentage}%</Badge>
                          )}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3 mt-3">
                          <div>
                            <p className="text-xs font-medium text-red-400 mb-1">Pain Points</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {segment.painPoints.map((pp, i) => (
                                <li key={i} className="flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-red-400" />
                                  {pp}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-emerald-400 mb-1">Value Drivers</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {segment.valueDrivers.map((vd, i) => (
                                <li key={i} className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  {vd}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Success Factors */}
              {marketAnalysis.keySuccessFactors.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    Key Success Factors
                  </h4>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {marketAnalysis.keySuccessFactors.map((factor, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-foreground bg-muted/20 p-2 rounded-lg">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Marketing Channels */}
              {marketAnalysis.marketingChannels.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Marketing Channel Effectiveness
                  </h4>
                  <div className="grid gap-2">
                    {marketAnalysis.marketingChannels.map((channel, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                        <span className="font-medium text-foreground">{channel.channel}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline" className={cn(
                            "text-xs capitalize",
                            channel.effectiveness === 'very-effective' ? "border-emerald-400/50 text-emerald-400" :
                            channel.effectiveness === 'effective' ? "border-blue-400/50 text-blue-400" :
                            "border-slate-400/50 text-slate-400"
                          )}>
                            {channel.effectiveness}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {channel.costLevel} cost
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buying Patterns */}
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Buying Behavior
                </h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-3 rounded-lg bg-muted/20 border border-border">
                    <p className="text-xs text-muted-foreground">Buying Cycle</p>
                    <p className="font-medium text-foreground">{marketAnalysis.buyingPatterns.typicalBuyingCycle}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/20 border border-border">
                    <p className="text-xs text-muted-foreground">Decision Makers</p>
                    <p className="font-medium text-foreground">{marketAnalysis.buyingPatterns.decisionMakers.join(', ')}</p>
                  </div>
                </div>
                
                {marketAnalysis.buyingPatterns.triggerEvents.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Trigger Events</p>
                    <div className="flex flex-wrap gap-2">
                      {marketAnalysis.buyingPatterns.triggerEvents.map((event, idx) => (
                        <Badge key={idx} variant="outline">{event}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Common Objections & Rebuttals */}
      {aiNicheInsights.commonObjections.length > 0 && (
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Common Objections & Rebuttals</CardTitle>
                <CardDescription>Prepare for typical pushback in this niche</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiNicheInsights.commonObjections.map((obj, idx) => (
                <div key={idx} className="p-4 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">"{obj.objection}"</p>
                      <Badge variant="outline" className="text-xs mt-1 capitalize">{obj.frequency}</Badge>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pl-8">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground text-sm">{obj.rebuttal}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component for metric badges in market overview
function MetricBadge({ label, value, impact }: { label: string; value: string; impact: 'critical' | 'high' | 'medium' | 'low' }) {
  return (
    <div className={cn(
      "text-center p-2 rounded-lg border text-xs",
      impact === 'critical' ? "bg-red-500/10 border-red-500/20" :
      impact === 'high' ? "bg-emerald-500/10 border-emerald-500/20" :
      impact === 'low' ? "bg-slate-500/10 border-slate-500/20" :
      "bg-amber-500/10 border-amber-500/20"
    )}>
      <p className="font-bold text-foreground">{value}</p>
      <p className="text-muted-foreground text-[10px]">{label}</p>
    </div>
  );
}
