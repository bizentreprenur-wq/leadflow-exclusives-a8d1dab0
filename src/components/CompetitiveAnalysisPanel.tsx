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
  PieChart, Compass, Flag, Swords, Heart, DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompetitiveIntelligence, SWOTItem, CompetitorProfile } from '@/lib/types/competitiveIntelligence';

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
              <p className="text-sm text-muted-foreground mt-1">Generating SWOT analysis & market positioning...</p>
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

  const { swotAnalysis, coreCompetencies, competitorComparison, marketPositioning, aiStrategicInsights, marketOverview } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-500/20 rounded-lg">
          <Trophy className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Competitive Analysis</h2>
          <p className="text-sm text-muted-foreground">SWOT Analysis & Strategic Intelligence for "{searchQuery}"</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickStatCard
          icon={Building2}
          label="Competitors"
          value={marketOverview.totalCompetitors}
          color="blue"
        />
        <QuickStatCard
          icon={Star}
          label="Avg Rating"
          value={marketOverview.averageRating.toFixed(1)}
          color="amber"
        />
        <QuickStatCard
          icon={BarChart3}
          label="Competition"
          value={marketOverview.competitionLevel}
          color="purple"
        />
        <QuickStatCard
          icon={TrendingUp}
          label="Market Health"
          value={marketOverview.industryHealth}
          color="emerald"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full bg-muted/50">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <Eye className="w-4 h-4 mr-1.5 hidden sm:inline" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="swot" className="text-xs sm:text-sm">
            <Target className="w-4 h-4 mr-1.5 hidden sm:inline" />
            SWOT
          </TabsTrigger>
          <TabsTrigger value="competitors" className="text-xs sm:text-sm">
            <Users className="w-4 h-4 mr-1.5 hidden sm:inline" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="strategy" className="text-xs sm:text-sm">
            <Rocket className="w-4 h-4 mr-1.5 hidden sm:inline" />
            Strategy
          </TabsTrigger>
        </TabsList>

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
            {/* Market Overview */}
            <OverviewCard
              icon={PieChart}
              title="Market Overview"
              items={marketOverview.marketTrends.slice(0, 3)}
              color="blue"
              emptyText="Analyzing market trends..."
            />

            {/* Competitive Gaps */}
            <OverviewCard
              icon={Target}
              title="Market Gaps"
              items={competitorComparison.marketGaps.slice(0, 3).map(g => g.gap)}
              color="emerald"
              emptyText="Identifying gaps..."
            />

            {/* Strong Players */}
            <OverviewCard
              icon={Trophy}
              title="Market Leaders"
              items={competitorComparison.marketLeaders.slice(0, 3).map(c => c.name)}
              color="amber"
              emptyText="Analyzing leaders..."
            />

            {/* AI Recommendations */}
            <OverviewCard
              icon={Lightbulb}
              title="Top Recommendations"
              items={aiStrategicInsights.strategicRecommendations.slice(0, 3).map(r => r.recommendation)}
              color="purple"
              emptyText="Generating insights..."
            />
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
            {/* Strengths */}
            <SWOTSection
              title="Strengths"
              subtitle="Internal positive factors"
              icon={CheckCircle2}
              items={swotAnalysis.strengths}
              color="emerald"
              expanded={expandedSections.strengths}
              onToggle={() => toggleSection('strengths')}
            />

            {/* Weaknesses */}
            <SWOTSection
              title="Weaknesses"
              subtitle="Internal areas to improve"
              icon={AlertTriangle}
              items={swotAnalysis.weaknesses}
              color="red"
              expanded={expandedSections.weaknesses}
              onToggle={() => toggleSection('weaknesses')}
            />

            {/* Opportunities */}
            <SWOTSection
              title="Opportunities"
              subtitle="External growth potential"
              icon={TrendingUp}
              items={swotAnalysis.opportunities}
              color="blue"
              expanded={expandedSections.opportunities}
              onToggle={() => toggleSection('opportunities')}
            />

            {/* Threats */}
            <SWOTSection
              title="Threats"
              subtitle="External risks to monitor"
              icon={Shield}
              items={swotAnalysis.threats}
              color="amber"
              expanded={expandedSections.threats}
              onToggle={() => toggleSection('threats')}
            />
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
                      <Badge variant={
                        diff.competitorComparison === 'unique' ? 'default' :
                        diff.competitorComparison === 'better' ? 'secondary' : 'outline'
                      } className="text-xs">
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
          {/* Direct Competitors */}
          {competitorComparison.directCompetitors.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Swords className="w-4 h-4 text-red-400" />
                  Direct Competitors
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

          {/* Market Leaders */}
          {competitorComparison.marketLeaders.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Market Leaders to Watch
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
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  Benchmark Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {competitorComparison.benchmarkMetrics.map((metric, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{metric.metric}</span>
                        <Badge variant={
                          metric.assessment === 'ahead' ? 'default' :
                          metric.assessment === 'on-par' ? 'secondary' : 'destructive'
                        }>
                          {metric.assessment === 'ahead' ? <ArrowUp className="w-3 h-3 mr-1" /> :
                           metric.assessment === 'behind' ? <ArrowDown className="w-3 h-3 mr-1" /> :
                           <Minus className="w-3 h-3 mr-1" />}
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

        {/* Strategy Tab */}
        <TabsContent value="strategy" className="mt-4 space-y-4">
          {/* Quick Wins */}
          {aiStrategicInsights.quickWins.length > 0 && (
            <Card className="border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Quick Wins
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

          {/* Strategic Recommendations */}
          {aiStrategicInsights.strategicRecommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Compass className="w-4 h-4 text-blue-400" />
                  Strategic Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {aiStrategicInsights.strategicRecommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{rec.recommendation}</span>
                      <div className="flex gap-1">
                        <Badge variant={rec.priority === 'critical' ? 'destructive' : rec.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                          {rec.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{rec.rationale}</p>
                    <div className="flex gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="text-muted-foreground">Effort:</span>
                        <Badge variant="outline" className="text-xs">{rec.effort}</Badge>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-muted-foreground">Impact:</span>
                        <Badge variant="outline" className="text-xs">{rec.impact}</Badge>
                      </span>
                    </div>
                    {rec.implementationSteps.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-dashed">
                        <p className="text-xs text-muted-foreground mb-1">Steps:</p>
                        <ul className="text-xs space-y-0.5">
                          {rec.implementationSteps.map((step, stepIdx) => (
                            <li key={stepIdx} className="flex items-start gap-1">
                              <span className="text-muted-foreground">{stepIdx + 1}.</span>
                              {step}
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

          {/* Risks to Monitor */}
          {aiStrategicInsights.risksToMonitor.length > 0 && (
            <Card className="border-amber-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Risks to Monitor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiStrategicInsights.risksToMonitor.map((risk, idx) => (
                  <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{risk.risk}</span>
                      <div className="flex gap-1">
                        <Badge variant={risk.likelihood === 'high' ? 'destructive' : 'outline'} className="text-xs">
                          {risk.likelihood} likelihood
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <strong>Mitigation:</strong> {risk.mitigation}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* B2B Seller Insights */}
          {aiStrategicInsights.b2bSellerInsights && (
            <Card className="border-purple-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  Seller Insights
                </CardTitle>
                <CardDescription>Intelligence for selling products/services to this market</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Ideal Customer Profile</p>
                  <p className="text-sm">{aiStrategicInsights.b2bSellerInsights.idealCustomerProfile}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Pain Points to Address</p>
                    <ul className="text-xs space-y-0.5">
                      {aiStrategicInsights.b2bSellerInsights.painPointsToAddress.map((pp, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <Heart className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                          {pp}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Buying Triggers</p>
                    <ul className="text-xs space-y-0.5">
                      {aiStrategicInsights.b2bSellerInsights.buyingTriggers.map((trigger, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <Zap className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          {trigger}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper Components
function QuickStatCard({ 
  icon: Icon, 
  label, 
  value, 
  color 
}: { 
  icon: any; 
  label: string; 
  value: string | number; 
  color: 'blue' | 'amber' | 'purple' | 'emerald';
}) {
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

function OverviewCard({
  icon: Icon,
  title,
  items,
  color,
  emptyText
}: {
  icon: any;
  title: string;
  items: string[];
  color: 'blue' | 'amber' | 'purple' | 'emerald';
  emptyText: string;
}) {
  const iconColorClasses = {
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className={cn("w-4 h-4", iconColorClasses[color])} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <p key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", `bg-${color}-400`)} />
              {item}
            </p>
          ))
        ) : (
          <p className="text-xs text-muted-foreground/60 italic">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SWOTSection({
  title,
  subtitle,
  icon: Icon,
  items,
  color,
  expanded,
  onToggle
}: {
  title: string;
  subtitle: string;
  icon: any;
  items: SWOTItem[];
  color: 'emerald' | 'red' | 'blue' | 'amber';
  expanded: boolean;
  onToggle: () => void;
}) {
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: 'text-emerald-400',
      header: 'bg-emerald-500/20',
    },
    red: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      icon: 'text-red-400',
      header: 'bg-red-500/20',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      icon: 'text-blue-400',
      header: 'bg-blue-500/20',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: 'text-amber-400',
      header: 'bg-amber-500/20',
    },
  };

  const classes = colorClasses[color];

  return (
    <Card className={cn("border", classes.border)}>
      <Collapsible open={expanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className={cn("pb-2 cursor-pointer", classes.header)}>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Icon className={cn("w-5 h-5", classes.icon)} />
                {title}
                <Badge variant="secondary" className="text-xs ml-2">{items.length}</Badge>
              </span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
            </CardTitle>
            <CardDescription className="text-xs">{subtitle}</CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className={cn("space-y-2 pt-2", classes.bg)}>
            {items.length > 0 ? (
              items.map((item, idx) => (
                <div key={idx} className="p-2 bg-background/50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{item.title}</span>
                    <Badge variant={item.impact === 'high' ? 'default' : 'outline'} className="text-xs">
                      {item.impact}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  {item.suggestedAction && (
                    <p className="text-xs mt-1.5 flex items-center gap-1 text-primary">
                      <Lightbulb className="w-3 h-3" />
                      {item.suggestedAction}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground/60 text-center py-4">No items identified</p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function CompetitorCard({ competitor, isLeader = false }: { competitor: CompetitorProfile; isLeader?: boolean }) {
  return (
    <div className={cn(
      "p-3 rounded-lg border",
      isLeader ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/30"
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isLeader && <Trophy className="w-4 h-4 text-amber-400" />}
          <span className="font-medium">{competitor.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {competitor.rating && (
            <Badge variant="secondary" className="text-xs">
              ⭐ {competitor.rating.toFixed(1)} ({competitor.reviewCount || 0})
            </Badge>
          )}
          <Badge variant={
            competitor.threatLevel === 'high' ? 'destructive' :
            competitor.threatLevel === 'medium' ? 'default' : 'secondary'
          } className="text-xs">
            {competitor.threatLevel} threat
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs mt-2">
        <div>
          <p className="text-muted-foreground mb-1">Strengths:</p>
          <ul className="space-y-0.5">
            {competitor.strengths.slice(0, 2).map((s, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-muted-foreground mb-1">Weaknesses:</p>
          <ul className="space-y-0.5">
            {competitor.weaknesses.slice(0, 2).map((w, idx) => (
              <li key={idx} className="flex items-start gap-1">
                <XCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      {competitor.competitiveStrategy && (
        <div className="mt-2 pt-2 border-t border-dashed">
          <p className="text-xs">
            <span className="text-muted-foreground">Strategy:</span>{' '}
            <span className="text-primary">{competitor.competitiveStrategy}</span>
          </p>
        </div>
      )}
    </div>
  );
}
