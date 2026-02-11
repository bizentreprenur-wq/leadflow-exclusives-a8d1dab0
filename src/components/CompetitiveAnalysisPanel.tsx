import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Target, TrendingUp, TrendingDown, Shield, AlertTriangle,
  Lightbulb, Trophy, Users, BarChart3, Zap, ChevronDown,
  CheckCircle2, XCircle, ArrowUp, ArrowDown, Minus, Star,
  Brain, Briefcase, Building2, Rocket, Eye, Award, 
  PieChart, Compass, Flag, Swords, Heart, DollarSign,
  Globe, Share2, Package, Map, Calendar, TrendingUp as Growth,
  Layout, MessageSquare, ShoppingBag, Wrench, Megaphone,
  Clock, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  CompetitiveIntelligence, SWOTItem, CompetitorProfile, PotentialBuyer,
  WebsiteComparison, SocialMediaBenchmark, ProductServiceGap, AISuccessPlan,
  SuccessAction
} from '@/lib/types/competitiveIntelligence';

interface CompetitiveAnalysisPanelProps {
  data: CompetitiveIntelligence | null;
  loading?: boolean;
  searchQuery?: string;
}

export default function CompetitiveAnalysisPanel({ 
  data, 
  loading = false,
  searchQuery = ''
}: CompetitiveAnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    strengths: true,
    weaknesses: true,
    opportunities: true,
    threats: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-amber-950/30 to-orange-950/20 border-amber-500/20">
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
              <Trophy className="w-6 h-6 text-amber-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-amber-100">Analyzing Competitive Landscape</p>
              <p className="text-sm text-muted-foreground mt-1">Generating SWOT analysis, website comparison, service gaps & AI success plan...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="p-8 text-center">
          <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No competitive analysis available yet.</p>
          <p className="text-sm text-muted-foreground/70 mt-1">Run a search to generate competitive intelligence.</p>
        </CardContent>
      </Card>
    );
  }

  const { swotAnalysis, coreCompetencies, competitorComparison, marketPositioning, aiStrategicInsights, marketOverview, buyerMatching, websiteComparison, socialMediaBenchmark, productServiceGap, aiSuccessPlan } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <Trophy className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Competitive Analysis</h2>
          <p className="text-sm text-muted-foreground">Full Business Intelligence for "{searchQuery}"</p>
        </div>
        {aiSuccessPlan && (
          <Badge className="ml-auto bg-amber-500/20 text-amber-300 text-sm px-3 py-1">
            Grade: {aiSuccessPlan.overallGrade}
          </Badge>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickStatCard icon={Building2} label="Competitors" value={marketOverview.totalCompetitors} color="blue" />
        <QuickStatCard icon={Star} label="Avg Rating" value={marketOverview.averageRating.toFixed(1)} color="amber" />
        <QuickStatCard icon={BarChart3} label="Competition" value={marketOverview.competitionLevel} color="purple" />
        <QuickStatCard icon={TrendingUp} label="Market Health" value={marketOverview.industryHealth} color="emerald" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto min-w-full bg-muted/50 gap-0.5 p-1">
            <TabsTrigger value="overview" className="text-xs">
              <Eye className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Overview
            </TabsTrigger>
            <TabsTrigger value="swot" className="text-xs">
              <Target className="w-3.5 h-3.5 mr-1 hidden sm:inline" />SWOT
            </TabsTrigger>
            <TabsTrigger value="competitors" className="text-xs">
              <Users className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Competitors
            </TabsTrigger>
            {websiteComparison && (
              <TabsTrigger value="website" className="text-xs">
                <Globe className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Website
              </TabsTrigger>
            )}
            {socialMediaBenchmark && (
              <TabsTrigger value="social" className="text-xs">
                <Share2 className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Social
              </TabsTrigger>
            )}
            {productServiceGap && (
              <TabsTrigger value="products" className="text-xs">
                <Package className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Products
              </TabsTrigger>
            )}
            {buyerMatching && (
              <TabsTrigger value="buyers" className="text-xs">
                <Target className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Buyers
              </TabsTrigger>
            )}
            <TabsTrigger value="strategy" className="text-xs">
              <Rocket className="w-3.5 h-3.5 mr-1 hidden sm:inline" />Strategy
            </TabsTrigger>
            {aiSuccessPlan && (
              <TabsTrigger value="success-plan" className="text-xs text-amber-400">
                <Brain className="w-3.5 h-3.5 mr-1 hidden sm:inline" />AI Plan
              </TabsTrigger>
            )}
          </TabsList>
        </ScrollArea>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Executive Summary */}
          <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="w-5 h-5 text-purple-400" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {aiStrategicInsights.executiveSummary || "Analysis in progress..."}
              </p>
            </CardContent>
          </Card>

          {/* 4-Column Quick Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <OverviewCard icon={PieChart} title="Market Overview" items={marketOverview.marketTrends.slice(0, 3)} color="blue" emptyText="Analyzing market trends..." />
            <OverviewCard icon={Target} title="Market Gaps" items={competitorComparison.marketGaps.slice(0, 3).map(g => g.gap)} color="emerald" emptyText="Identifying gaps..." />
            <OverviewCard icon={Trophy} title="Market Leaders" items={competitorComparison.marketLeaders.slice(0, 3).map(c => c.name)} color="amber" emptyText="Analyzing leaders..." />
            <OverviewCard icon={Lightbulb} title="Top Recommendations" items={aiStrategicInsights.strategicRecommendations.slice(0, 3).map(r => r.recommendation)} color="purple" emptyText="Generating insights..." />
          </div>

          {/* Key Findings */}
          {aiStrategicInsights.keyFindings.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Flag className="w-4 h-4 text-blue-400" />
                  Key Findings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiStrategicInsights.keyFindings.map((finding, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-2 bg-muted/30 rounded-lg">
                    <Badge variant={finding.urgency === 'immediate' ? 'destructive' : finding.urgency === 'short-term' ? 'default' : 'secondary'} className="text-xs shrink-0">
                      {finding.urgency}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{finding.finding}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{finding.implication}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SWOT Tab */}
        <TabsContent value="swot" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SWOTSection title="Strengths" subtitle="Internal positive factors" icon={CheckCircle2} items={swotAnalysis.strengths} color="emerald" expanded={expandedSections.strengths} onToggle={() => toggleSection('strengths')} />
            <SWOTSection title="Weaknesses" subtitle="Internal areas to improve" icon={AlertTriangle} items={swotAnalysis.weaknesses} color="red" expanded={expandedSections.weaknesses} onToggle={() => toggleSection('weaknesses')} />
            <SWOTSection title="Opportunities" subtitle="External growth potential" icon={TrendingUp} items={swotAnalysis.opportunities} color="blue" expanded={expandedSections.opportunities} onToggle={() => toggleSection('opportunities')} />
            <SWOTSection title="Threats" subtitle="External risks to monitor" icon={Shield} items={swotAnalysis.threats} color="amber" expanded={expandedSections.threats} onToggle={() => toggleSection('threats')} />
          </div>

          {/* Core Competencies */}
          {coreCompetencies.uniqueDifferentiators.length > 0 && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-400" />
                  What Makes You Stand Out
                </CardTitle>
                <CardDescription>Your unique differentiators in the market</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {coreCompetencies.uniqueDifferentiators.map((diff, idx) => (
                  <div key={idx} className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{diff.factor}</span>
                      <Badge variant={diff.competitorComparison === 'unique' ? 'default' : diff.competitorComparison === 'better' ? 'secondary' : 'outline'} className="text-xs">
                        {diff.competitorComparison}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{diff.description}</p>
                    {diff.leverageStrategy && (
                      <p className="text-xs text-purple-300 mt-2 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" />
                        {diff.leverageStrategy}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Competitors Tab */}
        <TabsContent value="competitors" className="mt-4 space-y-4">
          {competitorComparison.directCompetitors.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Swords className="w-4 h-4 text-red-400" />Direct Competitors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-3">
                    {competitorComparison.directCompetitors.map((competitor, idx) => (
                      <CompetitorCard key={idx} competitor={competitor} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {competitorComparison.marketLeaders.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />Market Leaders to Watch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {competitorComparison.marketLeaders.map((leader, idx) => (
                    <CompetitorCard key={idx} competitor={leader} isLeader />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benchmark Metrics */}
          {competitorComparison.benchmarkMetrics.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />Benchmark Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {competitorComparison.benchmarkMetrics.map((metric, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{metric.metric}</span>
                        <Badge variant={metric.assessment === 'ahead' ? 'default' : metric.assessment === 'on-par' ? 'secondary' : 'destructive'}>
                          {metric.assessment === 'ahead' ? <ArrowUp className="w-3 h-3 mr-1" /> : metric.assessment === 'behind' ? <ArrowDown className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
                          {metric.assessment}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-background/50 rounded">
                          <p className="text-muted-foreground">You</p>
                          <p className="font-semibold">{metric.yourScore || 'N/A'}</p>
                        </div>
                        <div className="text-center p-2 bg-background/50 rounded">
                          <p className="text-muted-foreground">Average</p>
                          <p className="font-semibold">{metric.competitorAverage}</p>
                        </div>
                        <div className="text-center p-2 bg-amber-500/10 rounded">
                          <p className="text-muted-foreground">Leader</p>
                          <p className="font-semibold text-amber-300">{metric.marketLeaderScore}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">{metric.recommendation}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Website Comparison Tab */}
        {websiteComparison && (
          <TabsContent value="website" className="mt-4 space-y-4">
            {/* Industry Benchmarks */}
            <Card className="border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-400" />
                  Website Feature Benchmarks
                </CardTitle>
                <CardDescription>How your website stacks up against competitors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {websiteComparison.industryBenchmarks.map((benchmark, idx) => (
                  <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{benchmark.feature}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={benchmark.priority === 'critical' ? 'destructive' : benchmark.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                          {benchmark.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{benchmark.competitorAdoption}% adoption</span>
                      </div>
                    </div>
                    <Progress value={benchmark.competitorAdoption} className="h-2 mb-2" />
                    <p className="text-xs text-muted-foreground">{benchmark.recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Competitor Websites */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layout className="w-4 h-4 text-purple-400" />
                  Competitor Website Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-3">
                    {websiteComparison.competitorWebsites.slice(0, 10).map((site, idx) => (
                      <div key={idx} className="p-3 bg-muted/20 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="font-medium text-sm">{site.name}</span>
                            {site.platform && <Badge variant="outline" className="ml-2 text-xs">{site.platform}</Badge>}
                          </div>
                          <Badge className={cn("text-xs", site.score >= 70 ? "bg-emerald-500/20 text-emerald-300" : site.score >= 40 ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300")}>
                            {site.score}/100
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {site.hasBlog && <FeatureBadge label="Blog" has />}
                          {site.hasOnlineBooking && <FeatureBadge label="Booking" has />}
                          {site.hasChatWidget && <FeatureBadge label="Chat" has />}
                          {site.hasTestimonials && <FeatureBadge label="Reviews" has />}
                          {site.hasPricing && <FeatureBadge label="Pricing" has />}
                          {site.hasPortfolio && <FeatureBadge label="Portfolio" has />}
                        </div>
                        {site.missingFeatures.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {site.missingFeatures.slice(0, 3).map((f, i) => (
                              <FeatureBadge key={i} label={f} has={false} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {websiteComparison.recommendations.length > 0 && (
              <Card className="border-emerald-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-emerald-400" />AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {websiteComparison.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-emerald-500/10 rounded-lg text-xs">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Social Media Tab */}
        {socialMediaBenchmark && (
          <TabsContent value="social" className="mt-4 space-y-4">
            {/* Overall Score */}
            <Card className="bg-gradient-to-br from-purple-950/30 to-blue-950/20 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Social Media Score</p>
                    <p className="text-3xl font-bold text-purple-300">{socialMediaBenchmark.overallScore}/100</p>
                  </div>
                  <Share2 className="w-10 h-10 text-purple-400/50" />
                </div>
                <Progress value={socialMediaBenchmark.overallScore} className="h-2 mt-3" />
              </CardContent>
            </Card>

            {/* Platform Analysis */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-blue-400" />Platform Presence vs Competitors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {socialMediaBenchmark.platforms.map((platform, idx) => (
                  <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{platform.icon} {platform.platform}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={platform.importance === 'critical' ? 'destructive' : platform.importance === 'high' ? 'default' : 'secondary'} className="text-xs">
                          {platform.importance}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{platform.competitorPercentage}% of competitors</span>
                      </div>
                    </div>
                    <Progress value={platform.competitorPercentage} className="h-1.5 mb-1.5" />
                    <p className="text-xs text-muted-foreground">{platform.recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Content Strategy */}
            {socialMediaBenchmark.contentStrategy.length > 0 && (
              <Card className="border-emerald-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-emerald-400" />Recommended Content Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {socialMediaBenchmark.contentStrategy.map((strategy, idx) => (
                    <div key={idx} className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{strategy.type}</span>
                        <Badge variant="outline" className="text-xs">{strategy.frequency}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{strategy.description}</p>
                      <p className="text-xs text-emerald-300 mb-2">📈 {strategy.expectedImpact}</p>
                      <div className="flex flex-wrap gap-1">
                        {strategy.examples.map((ex, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{ex}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Social Gaps */}
            {socialMediaBenchmark.gaps.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />Untapped Social Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {socialMediaBenchmark.gaps.map((gap, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 bg-amber-500/10 rounded-lg">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{gap.gap}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Only {gap.competitorsLeveraging} competitors doing this • {gap.potentialImpact}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Products & Services Tab */}
        {productServiceGap && (
          <TabsContent value="products" className="mt-4 space-y-4">
            {/* Service Gap Heatmap */}
            <Card className="border-orange-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-400" />
                  Service Gap Analysis
                </CardTitle>
                <CardDescription>Services your competitors offer — are you missing any?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {productServiceGap.serviceGaps.slice(0, 10).map((gap, idx) => (
                  <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-medium text-sm">{gap.service}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={gap.demandLevel === 'high' ? 'destructive' : gap.demandLevel === 'medium' ? 'default' : 'secondary'} className="text-xs">
                          {gap.demandLevel} demand
                        </Badge>
                        <Badge variant="outline" className="text-xs">{gap.implementationDifficulty}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Progress value={gap.competitorPercentage} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{gap.competitorPercentage}% offer this</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{gap.recommendation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Competitor Offerings */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-400" />What Competitors Offer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[400px]">
                  <div className="space-y-3">
                    {productServiceGap.competitorOfferings.slice(0, 8).map((comp, idx) => (
                      <div key={idx} className="p-3 bg-muted/20 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{comp.competitorName}</span>
                          <Badge variant="outline" className="text-xs">{comp.pricingModel}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {comp.services.map((s, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                        {comp.uniqueOfferings.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {comp.uniqueOfferings.map((u, i) => (
                              <Badge key={i} className="text-xs bg-amber-500/20 text-amber-300">⭐ {u}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Pricing Insights */}
            {productServiceGap.pricingInsights.length > 0 && (
              <Card className="border-emerald-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />Market Pricing Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {productServiceGap.pricingInsights.map((price, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                      <p className="font-medium text-sm mb-2">{price.service}</p>
                      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                        <div className="text-center p-2 bg-emerald-500/10 rounded">
                          <p className="text-muted-foreground">Low</p>
                          <p className="font-semibold text-emerald-300">{price.marketLow}</p>
                        </div>
                        <div className="text-center p-2 bg-blue-500/10 rounded">
                          <p className="text-muted-foreground">Average</p>
                          <p className="font-semibold text-blue-300">{price.marketAverage}</p>
                        </div>
                        <div className="text-center p-2 bg-purple-500/10 rounded">
                          <p className="text-muted-foreground">High</p>
                          <p className="font-semibold text-purple-300">{price.marketHigh}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{price.recommendation}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Upsell Opportunities */}
            {productServiceGap.upsellOpportunities.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-400" />Revenue Growth Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {productServiceGap.upsellOpportunities.map((opp, idx) => (
                    <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                      <p className="font-medium text-sm">{opp.opportunity}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opp.description}</p>
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        <span>💰 {opp.estimatedRevenue}</span>
                        <span>🏢 {opp.competitorsDoingThis} competitors do this</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Buyer Matching Tab */}
        {buyerMatching && (
          <TabsContent value="buyers" className="mt-4 space-y-4">
            <Card className="bg-gradient-to-br from-emerald-950/30 to-blue-950/20 border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  Potential Buyers for "{buyerMatching.productName}"
                </CardTitle>
                <CardDescription>
                  {buyerMatching.totalAnalyzed} businesses analyzed — {buyerMatching.summary.highFitCount} high-fit, {buyerMatching.summary.mediumFitCount} medium-fit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-2xl font-bold text-emerald-400">{buyerMatching.summary.highFitCount}</p>
                    <p className="text-xs text-muted-foreground">High Fit</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <p className="text-2xl font-bold text-blue-400">{buyerMatching.summary.mediumFitCount}</p>
                    <p className="text-xs text-muted-foreground">Medium Fit</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-slate-500/10 border border-slate-500/20">
                    <p className="text-2xl font-bold text-slate-400">{buyerMatching.summary.lowFitCount}</p>
                    <p className="text-xs text-muted-foreground">Low Fit</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-2xl font-bold text-amber-400">{buyerMatching.summary.avgFitScore}</p>
                    <p className="text-xs text-muted-foreground">Avg Fit Score</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{buyerMatching.recommendedApproach}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Strategic Targets</CardTitle></CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-3">
                    {buyerMatching.potentialBuyers.map((buyer, idx) => (
                      <BuyerCard key={idx} buyer={buyer} />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="mt-4 space-y-4">
          {aiStrategicInsights.quickWins.length > 0 && (
            <Card className="border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />Quick Wins
                </CardTitle>
                <CardDescription>Immediate actions for quick results</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiStrategicInsights.quickWins.map((win, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{win.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{win.expectedOutcome}</p>
                      <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                        <span>⏱️ {win.timeline}</span>
                        <span>📦 {win.resources}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {aiStrategicInsights.strategicRecommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-400" />Strategic Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiStrategicInsights.strategicRecommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{rec.recommendation}</span>
                      <Badge variant={rec.priority === 'critical' ? 'destructive' : rec.priority === 'high' ? 'default' : 'secondary'} className="text-xs">{rec.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{rec.rationale}</p>
                    <div className="flex gap-4 text-xs">
                      <span className="flex items-center gap-1"><span className="text-muted-foreground">Effort:</span><Badge variant="outline" className="text-xs">{rec.effort}</Badge></span>
                      <span className="flex items-center gap-1"><span className="text-muted-foreground">Impact:</span><Badge variant="outline" className="text-xs">{rec.impact}</Badge></span>
                    </div>
                    {rec.implementationSteps.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-dashed">
                        <ul className="text-xs space-y-0.5">
                          {rec.implementationSteps.map((step, stepIdx) => (
                            <li key={stepIdx} className="flex items-start gap-1">
                              <span className="text-muted-foreground">{stepIdx + 1}.</span>{step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {aiStrategicInsights.risksToMonitor.length > 0 && (
            <Card className="border-amber-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />Risks to Monitor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiStrategicInsights.risksToMonitor.map((risk, idx) => (
                  <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{risk.risk}</span>
                      <Badge variant={risk.likelihood === 'high' ? 'destructive' : 'outline'} className="text-xs">{risk.likelihood} likelihood</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground"><strong>Mitigation:</strong> {risk.mitigation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {aiStrategicInsights.b2bSellerInsights && (
            <Card className="border-purple-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-400" />Seller Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Ideal Customer Profile</p>
                  <p className="text-sm">{aiStrategicInsights.b2bSellerInsights.idealCustomerProfile}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Pain Points</p>
                    <ul className="text-xs space-y-0.5">
                      {aiStrategicInsights.b2bSellerInsights.painPointsToAddress.map((pp, idx) => (
                        <li key={idx} className="flex items-start gap-1"><Heart className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />{pp}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Buying Triggers</p>
                    <ul className="text-xs space-y-0.5">
                      {aiStrategicInsights.b2bSellerInsights.buyingTriggers.map((trigger, idx) => (
                        <li key={idx} className="flex items-start gap-1"><Zap className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />{trigger}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Success Plan Tab */}
        {aiSuccessPlan && (
          <TabsContent value="success-plan" className="mt-4 space-y-4">
            {/* Executive Brief */}
            <Card className="bg-gradient-to-br from-amber-950/30 to-orange-950/20 border-amber-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="w-5 h-5 text-amber-400" />
                  AI Comprehensive Success Plan
                  <Badge className="ml-auto bg-amber-500/20 text-amber-300">Grade: {aiSuccessPlan.overallGrade}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{aiSuccessPlan.executiveBrief}</p>
              </CardContent>
            </Card>

            {/* Action Categories */}
            <ActionCategoryCard title="🌐 Website Improvements" description="What to fix on your website based on competitor analysis" actions={aiSuccessPlan.websiteActions} color="blue" />
            <ActionCategoryCard title="📱 Social Media Actions" description="How to dominate social media in your market" actions={aiSuccessPlan.socialActions} color="purple" />
            <ActionCategoryCard title="📦 Product & Service Actions" description="What competitors offer that you should consider adding" actions={aiSuccessPlan.productActions} color="orange" />
            <ActionCategoryCard title="📣 Marketing Actions" description="Marketing strategies to outperform competitors" actions={aiSuccessPlan.marketingActions} color="emerald" />
            <ActionCategoryCard title="⚙️ Operations Actions" description="Operational improvements for efficiency and growth" actions={aiSuccessPlan.operationsActions} color="slate" />
            <ActionCategoryCard title="💰 Revenue Growth Actions" description="Strategies to increase revenue and customer value" actions={aiSuccessPlan.revenueActions} color="amber" />

            {/* 30-60-90 Day Plan */}
            <Card className="border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />30-60-90 Day Action Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[aiSuccessPlan.thirtyDayPlan, aiSuccessPlan.sixtyDayPlan, aiSuccessPlan.ninetyDayPlan].map((plan, idx) => (
                  <Collapsible key={idx} defaultOpen={idx === 0}>
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <span className="font-medium text-sm">{plan.label}</span>
                      <ChevronDown className="w-4 h-4" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-3 pl-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">🎯 Goals</p>
                        <ul className="text-xs space-y-0.5">
                          {plan.goals.map((g, i) => <li key={i} className="flex items-start gap-1"><Target className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />{g}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">✅ Actions</p>
                        <ul className="text-xs space-y-0.5">
                          {plan.actions.map((a, i) => <li key={i} className="flex items-start gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />{a}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">📈 Expected Outcomes</p>
                        <ul className="text-xs space-y-0.5">
                          {plan.expectedOutcomes.map((o, i) => <li key={i} className="flex items-start gap-1"><TrendingUp className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />{o}</li>)}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">📊 KPIs to Track</p>
                        <div className="flex flex-wrap gap-1">
                          {plan.kpis.map((k, i) => <Badge key={i} variant="outline" className="text-xs">{k}</Badge>)}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>

            {/* Competitive Moat */}
            {aiSuccessPlan.moatStrategies.length > 0 && (
              <Card className="border-purple-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />Build Your Competitive Moat
                  </CardTitle>
                  <CardDescription>Long-term strategies to make your business unbeatable</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiSuccessPlan.moatStrategies.map((moat, idx) => (
                    <div key={idx} className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{moat.strategy}</span>
                        <Badge variant={moat.defensibility === 'strong' ? 'default' : 'outline'} className="text-xs">{moat.defensibility} defense</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{moat.description}</p>
                      <p className="text-xs text-purple-300 mt-1.5">💡 {moat.competitiveAdvantage}</p>
                      <p className="text-xs text-muted-foreground mt-1">⏱️ {moat.timeToImplement}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Cost Optimizations */}
            {aiSuccessPlan.costOptimizations.length > 0 && (
              <Card className="border-emerald-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" />Cost Optimization vs Competitors
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiSuccessPlan.costOptimizations.map((cost, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                      <p className="font-medium text-sm mb-2">{cost.area}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div className="p-2 bg-red-500/10 rounded">
                          <p className="text-muted-foreground">Your Approach</p>
                          <p className="text-red-300">{cost.currentApproach}</p>
                        </div>
                        <div className="p-2 bg-emerald-500/10 rounded">
                          <p className="text-muted-foreground">Competitor Approach</p>
                          <p className="text-emerald-300">{cost.competitorApproach}</p>
                        </div>
                      </div>
                      <p className="text-xs text-emerald-300 font-medium">💰 Potential savings: {cost.savings}</p>
                      <p className="text-xs text-muted-foreground mt-1">{cost.recommendation}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function FeatureBadge({ label, has }: { label: string; has: boolean }) {
  return (
    <span className={cn("text-xs px-1.5 py-0.5 rounded", has ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/15 text-red-300/70 line-through")}>
      {has ? '✓' : '✗'} {label}
    </span>
  );
}

function ActionCategoryCard({ title, description, actions, color }: { title: string; description: string; actions: SuccessAction[]; color: string }) {
  if (!actions || actions.length === 0) return null;
  
  const borderColors: Record<string, string> = {
    blue: 'border-blue-500/20',
    purple: 'border-purple-500/20',
    orange: 'border-orange-500/20',
    emerald: 'border-emerald-500/20',
    slate: 'border-slate-500/20',
    amber: 'border-amber-500/20',
  };
  
  return (
    <Card className={borderColors[color] || ''}>
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{title}</span>
              <ChevronDown className="w-4 h-4" />
            </CardTitle>
            <CardDescription className="text-left">{description}</CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-2">
            {actions.map((action, idx) => (
              <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{action.action}</span>
                  <Badge variant={action.priority === 'critical' ? 'destructive' : action.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                    {action.priority}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{action.description}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">⏱️</span>
                    <span>{action.timeline}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">💪</span>
                    <span>Effort: {action.effort}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">🎯</span>
                    <span>Impact: {action.impact}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">🏢</span>
                    <span>{action.competitorsDoingThis}</span>
                  </div>
                </div>
                <p className="text-xs text-emerald-300 mt-1.5">📈 Expected ROI: {action.estimatedROI}</p>
              </div>
            ))}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function QuickStatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: 'blue' | 'amber' | 'purple' | 'emerald' }) {
  const colorClasses = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };
  return (
    <Card className={cn("border", colorClasses[color])}>
      <CardContent className="p-3 flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-semibold capitalize">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewCard({ icon: Icon, title, items, color, emptyText }: { icon: any; title: string; items: string[]; color: 'blue' | 'amber' | 'purple' | 'emerald'; emptyText: string }) {
  const iconColorClasses = { blue: 'text-blue-400', amber: 'text-amber-400', purple: 'text-purple-400', emerald: 'text-emerald-400' };
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className={cn("w-4 h-4", iconColorClasses[color])} />{title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.length > 0 ? items.map((item, idx) => (
          <p key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
            <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", `bg-${color}-400`)} />{item}
          </p>
        )) : <p className="text-xs text-muted-foreground/60 italic">{emptyText}</p>}
      </CardContent>
    </Card>
  );
}

function SWOTSection({ title, subtitle, icon: Icon, items, color, expanded, onToggle }: { title: string; subtitle: string; icon: any; items: SWOTItem[]; color: 'emerald' | 'red' | 'blue' | 'amber'; expanded: boolean; onToggle: () => void }) {
  const colorClasses = {
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: 'text-emerald-400', header: 'bg-emerald-500/20' },
    red: { bg: 'bg-red-500/10', border: 'border-red-500/20', icon: 'text-red-400', header: 'bg-red-500/20' },
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: 'text-blue-400', header: 'bg-blue-500/20' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: 'text-amber-400', header: 'bg-amber-500/20' },
  };
  const classes = colorClasses[color];
  return (
    <Card className={cn("border", classes.border)}>
      <Collapsible open={expanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className={cn("pb-2 cursor-pointer", classes.header)}>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Icon className={cn("w-5 h-5", classes.icon)} />{title}
                <Badge variant="secondary" className="text-xs ml-2">{items.length}</Badge>
              </span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
            </CardTitle>
            <CardDescription className="text-xs">{subtitle}</CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className={cn("space-y-2 pt-2", classes.bg)}>
            {items.length > 0 ? items.map((item, idx) => (
              <div key={idx} className="p-2 bg-background/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{item.title}</span>
                  <Badge variant={item.impact === 'high' ? 'default' : 'outline'} className="text-xs">{item.impact}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
                {item.suggestedAction && (
                  <p className="text-xs mt-1.5 flex items-center gap-1 text-primary">
                    <Lightbulb className="w-3 h-3" />{item.suggestedAction}
                  </p>
                )}
              </div>
            )) : <p className="text-xs text-muted-foreground/60 text-center py-4">No items identified</p>}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function CompetitorCard({ competitor, isLeader = false }: { competitor: CompetitorProfile; isLeader?: boolean }) {
  return (
    <div className={cn("p-3 rounded-lg border", isLeader ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/30")}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isLeader && <Trophy className="w-4 h-4 text-amber-400" />}
          <span className="font-medium">{competitor.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {competitor.rating && (
            <Badge variant="secondary" className="text-xs">⭐ {competitor.rating.toFixed(1)} ({competitor.reviewCount || 0})</Badge>
          )}
          <Badge variant={competitor.threatLevel === 'high' ? 'destructive' : competitor.threatLevel === 'medium' ? 'default' : 'secondary'} className="text-xs">
            {competitor.threatLevel} threat
          </Badge>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs mt-2">
        <div>
          <p className="text-muted-foreground mb-1">Strengths:</p>
          <ul className="space-y-0.5">
            {competitor.strengths.slice(0, 2).map((s, idx) => (
              <li key={idx} className="flex items-start gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Weaknesses:</p>
          <ul className="space-y-0.5">
            {competitor.weaknesses.slice(0, 2).map((w, idx) => (
              <li key={idx} className="flex items-start gap-1"><XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />{w}</li>
            ))}
          </ul>
        </div>
      </div>
      {competitor.competitiveStrategy && (
        <div className="mt-2 pt-2 border-t border-dashed">
          <p className="text-xs"><span className="text-muted-foreground">Strategy:</span> <span className="text-primary">{competitor.competitiveStrategy}</span></p>
        </div>
      )}
    </div>
  );
}

function BuyerCard({ buyer }: { buyer: PotentialBuyer }) {
  const fitColors = { 'high-fit': 'bg-emerald-500/10 border-emerald-500/20', 'medium-fit': 'bg-blue-500/10 border-blue-500/20', 'low-fit': 'bg-slate-500/10 border-slate-500/20' };
  const fitBadgeColors = { 'high-fit': 'bg-emerald-500/20 text-emerald-400', 'medium-fit': 'bg-blue-500/20 text-blue-400', 'low-fit': 'bg-slate-500/20 text-slate-400' };
  return (
    <div className={cn("p-3 rounded-lg border", fitColors[buyer.fitTier])}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{buyer.name}</span>
        <div className="flex items-center gap-2">
          <Badge className={cn("text-xs", fitBadgeColors[buyer.fitTier])}>{buyer.fitScore}% fit</Badge>
          <Badge variant="secondary" className="text-xs capitalize">{buyer.fitTier.replace('-', ' ')}</Badge>
        </div>
      </div>
      {buyer.fitReasons.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-muted-foreground mb-1">Why they're a fit:</p>
          <div className="flex flex-wrap gap-1">
            {buyer.fitReasons.map((reason, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">{reason}</Badge>
            ))}
          </div>
        </div>
      )}
      {buyer.missingCapabilities.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Missing capabilities:</p>
          <div className="flex flex-wrap gap-1">
            {buyer.missingCapabilities.map((cap, idx) => (
              <Badge key={idx} variant="destructive" className="text-xs">{cap}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
