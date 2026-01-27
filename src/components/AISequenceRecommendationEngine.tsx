import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain, Sparkles, Flame, ThermometerSun, Snowflake, Target,
  Globe, AlertTriangle, CheckCircle2, ArrowRight, Zap, Bot,
  Play, Eye, Layers, TrendingUp, Clock, Mail, Users, Crown, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EmailSequence,
  EmailStep,
  SearchType,
  LeadPriority,
  getSequencesBySearchType,
  getSequencesByPriority,
  personalizeSequenceStep,
} from '@/lib/emailSequences';
import { getStoredLeadContext, LeadAnalysisContext } from '@/lib/leadContext';

interface LeadBatchAnalysis {
  total: number;
  hotCount: number;
  warmCount: number;
  coldCount: number;
  noWebsiteCount: number;
  needsUpgradeCount: number;
  poorMobileCount: number;
  predominantType: LeadPriority;
  topPainPoints: string[];
  recommendedApproach: string;
}

interface SequenceRecommendation {
  sequence: EmailSequence;
  score: number;
  reason: string;
  matchedLeadCount: number;
  estimatedResponseRate: string;
}

interface AISequenceRecommendationEngineProps {
  searchType: SearchType | null;
  onSelectSequence: (sequence: EmailSequence) => void;
  onStartAutopilot?: (sequence: EmailSequence, leads: LeadAnalysisContext[]) => void;
  mode: 'campaign' | 'autopilot';
  compact?: boolean;
}

export default function AISequenceRecommendationEngine({
  searchType,
  onSelectSequence,
  onStartAutopilot,
  mode,
  compact = false,
}: AISequenceRecommendationEngineProps) {
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);
  const [previewStep, setPreviewStep] = useState(0);
  const [selectedPriority, setSelectedPriority] = useState<LeadPriority>('hot');
  const [showAllSequences, setShowAllSequences] = useState(false);

  const effectiveSearchType: SearchType = searchType || 'gmb';
  const isSearchA = effectiveSearchType === 'gmb';

  // Get lead analysis data
  const leadAnalysis = useMemo(() => getStoredLeadContext(), []);

  // Analyze the batch of leads
  const batchAnalysis = useMemo<LeadBatchAnalysis>(() => {
    const total = leadAnalysis.length;
    if (total === 0) {
      return {
        total: 0,
        hotCount: 0,
        warmCount: 0,
        coldCount: 0,
        noWebsiteCount: 0,
        needsUpgradeCount: 0,
        poorMobileCount: 0,
        predominantType: 'warm',
        topPainPoints: [],
        recommendedApproach: 'Start with a general introduction sequence.',
      };
    }

    const hotCount = leadAnalysis.filter(l => l.aiClassification === 'hot').length;
    const warmCount = leadAnalysis.filter(l => l.aiClassification === 'warm').length;
    const coldCount = leadAnalysis.filter(l => l.aiClassification === 'cold' || !l.aiClassification).length;
    const noWebsiteCount = leadAnalysis.filter(l => !l.websiteAnalysis?.hasWebsite).length;
    const needsUpgradeCount = leadAnalysis.filter(l => l.websiteAnalysis?.needsUpgrade).length;
    const poorMobileCount = leadAnalysis.filter(l => 
      l.websiteAnalysis?.mobileScore !== undefined && l.websiteAnalysis.mobileScore < 50
    ).length;

    // Find predominant type
    let predominantType: LeadPriority = 'warm';
    if (hotCount >= warmCount && hotCount >= coldCount) predominantType = 'hot';
    else if (coldCount >= warmCount && coldCount >= hotCount) predominantType = 'cold';

    // Collect top pain points
    const painPointCounts: Record<string, number> = {};
    leadAnalysis.forEach(l => {
      l.painPoints?.forEach(pp => {
        painPointCounts[pp] = (painPointCounts[pp] || 0) + 1;
      });
    });
    const topPainPoints = Object.entries(painPointCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([point]) => point);

    // Generate recommended approach
    let recommendedApproach = '';
    if (noWebsiteCount > total * 0.4) {
      recommendedApproach = 'Focus on "No Website" sequences - 40%+ of leads lack web presence.';
    } else if (needsUpgradeCount > total * 0.3) {
      recommendedApproach = 'Use "Website Upgrade" sequences - many leads have outdated sites.';
    } else if (hotCount > total * 0.3) {
      recommendedApproach = 'Direct action sequences recommended - high concentration of hot leads.';
    } else if (coldCount > total * 0.5) {
      recommendedApproach = 'Educational nurture sequences recommended - mostly cold leads.';
    } else {
      recommendedApproach = 'Mixed approach with value-first messaging.';
    }

    return {
      total,
      hotCount,
      warmCount,
      coldCount,
      noWebsiteCount,
      needsUpgradeCount,
      poorMobileCount,
      predominantType,
      topPainPoints,
      recommendedApproach,
    };
  }, [leadAnalysis]);

  // Get all sequences for the search type
  const allSequences = useMemo(() => 
    getSequencesBySearchType(effectiveSearchType),
    [effectiveSearchType]
  );

  // Filter by priority
  const filteredSequences = useMemo(() => 
    getSequencesByPriority(effectiveSearchType, selectedPriority),
    [effectiveSearchType, selectedPriority]
  );

  // AI-recommended sequences based on batch analysis
  const recommendations = useMemo<SequenceRecommendation[]>(() => {
    if (allSequences.length === 0 || batchAnalysis.total === 0) return [];

    const scored: SequenceRecommendation[] = allSequences.map(seq => {
      let score = 50; // Base score
      let reason = '';
      let matchedLeadCount = 0;

      // Score based on priority match
      if (seq.priority === batchAnalysis.predominantType) {
        score += 20;
        reason = `Matches your predominant lead type (${batchAnalysis.predominantType})`;
        matchedLeadCount = seq.priority === 'hot' ? batchAnalysis.hotCount 
          : seq.priority === 'warm' ? batchAnalysis.warmCount 
          : batchAnalysis.coldCount;
      }

      // Score for no-website sequences when many leads lack websites
      if (seq.name.toLowerCase().includes('no website') || seq.name.toLowerCase().includes('visibility')) {
        if (batchAnalysis.noWebsiteCount > 0) {
          score += (batchAnalysis.noWebsiteCount / batchAnalysis.total) * 30;
          if (!reason) reason = `${batchAnalysis.noWebsiteCount} leads without websites`;
          matchedLeadCount = batchAnalysis.noWebsiteCount;
        }
      }

      // Score for upgrade sequences
      if (seq.name.toLowerCase().includes('upgrade') || seq.name.toLowerCase().includes('audit')) {
        if (batchAnalysis.needsUpgradeCount > 0) {
          score += (batchAnalysis.needsUpgradeCount / batchAnalysis.total) * 25;
          if (!reason) reason = `${batchAnalysis.needsUpgradeCount} leads need website upgrades`;
          matchedLeadCount = batchAnalysis.needsUpgradeCount;
        }
      }

      // Score for pain-focused sequences
      if (seq.name.toLowerCase().includes('pain') && batchAnalysis.topPainPoints.length > 0) {
        score += 15;
        if (!reason) reason = `Address top pain points: ${batchAnalysis.topPainPoints[0]}`;
      }

      // Score for case study / social proof
      if (seq.name.toLowerCase().includes('case study') || seq.name.toLowerCase().includes('proof')) {
        score += 10;
        if (!reason) reason = 'Build credibility with social proof';
      }

      // Estimate response rate based on sequence type
      let estimatedResponseRate = '8-12%';
      if (seq.priority === 'hot') estimatedResponseRate = '15-25%';
      else if (seq.priority === 'cold') estimatedResponseRate = '3-8%';

      return {
        sequence: seq,
        score: Math.min(100, Math.round(score)),
        reason: reason || `General ${seq.priority} lead sequence`,
        matchedLeadCount: matchedLeadCount || Math.floor(batchAnalysis.total / 3),
        estimatedResponseRate,
      };
    });

    return scored.sort((a, b) => b.score - a.score);
  }, [allSequences, batchAnalysis]);

  // Top 3 recommendations
  const topRecommendations = recommendations.slice(0, 3);

  const handleSelectSequence = (seq: EmailSequence) => {
    setSelectedSequence(seq);
    setPreviewStep(0);
    onSelectSequence(seq);
  };

  const handleStartAutopilot = () => {
    if (selectedSequence && onStartAutopilot) {
      onStartAutopilot(selectedSequence, leadAnalysis);
    }
  };

  const getPriorityIcon = (priority: LeadPriority) => {
    switch (priority) {
      case 'hot': return <Flame className="w-4 h-4 text-red-400" />;
      case 'warm': return <ThermometerSun className="w-4 h-4 text-amber-400" />;
      case 'cold': return <Snowflake className="w-4 h-4 text-blue-400" />;
    }
  };

  const getPriorityColor = (priority: LeadPriority) => {
    switch (priority) {
      case 'hot': return 'border-red-500/30 bg-red-500/10 text-red-400';
      case 'warm': return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
      case 'cold': return 'border-blue-500/30 bg-blue-500/10 text-blue-400';
    }
  };

  if (batchAnalysis.total === 0) {
    return (
      <Card className="border-2 border-dashed border-muted-foreground/30">
        <CardContent className="py-8 text-center">
          <Layers className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No leads available</p>
          <p className="text-sm text-muted-foreground/70">
            Run a search in Step 1 to get AI sequence recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", compact && "space-y-3")}>
      {/* Header with Search Type Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            isSearchA 
              ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/20" 
              : "bg-gradient-to-br from-violet-500/20 to-purple-500/20"
          )}>
            {isSearchA ? <Globe className="w-5 h-5 text-emerald-400" /> : <Target className="w-5 h-5 text-violet-400" />}
          </div>
          <div>
            <h3 className="font-bold text-lg">
              {isSearchA ? 'Super AI Business Sequences' : 'Agency Lead Finder Sequences'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isSearchA 
                ? 'Insight-driven sequences for niche-selling' 
                : 'Revenue-focused sequences for agency services'}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn(
          "gap-1",
          mode === 'autopilot' 
            ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
        )}>
          {mode === 'autopilot' ? <Bot className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
          {mode === 'autopilot' ? 'AI Autopilot' : 'Manual Campaign'}
        </Badge>
      </div>

      {/* Batch Analysis Summary */}
      <Card className="border border-border bg-muted/20">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Lead Batch Analysis</span>
            <Badge variant="secondary" className="text-xs">{batchAnalysis.total} leads</Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="text-lg font-bold text-red-400">{batchAnalysis.hotCount}</div>
              <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Flame className="w-3 h-3" /> Hot
              </div>
            </div>
            <div className="text-center p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="text-lg font-bold text-amber-400">{batchAnalysis.warmCount}</div>
              <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <ThermometerSun className="w-3 h-3" /> Warm
              </div>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="text-lg font-bold text-blue-400">{batchAnalysis.coldCount}</div>
              <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                <Snowflake className="w-3 h-3" /> Cold
              </div>
            </div>
          </div>

          {/* Additional insights */}
          <div className="flex flex-wrap gap-2 mb-3">
            {batchAnalysis.noWebsiteCount > 0 && (
              <Badge variant="outline" className="text-[10px] gap-1 border-orange-500/30 text-orange-400">
                <Globe className="w-3 h-3" />
                {batchAnalysis.noWebsiteCount} No Website
              </Badge>
            )}
            {batchAnalysis.needsUpgradeCount > 0 && (
              <Badge variant="outline" className="text-[10px] gap-1 border-amber-500/30 text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                {batchAnalysis.needsUpgradeCount} Needs Upgrade
              </Badge>
            )}
          </div>

          {/* AI Recommendation */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="text-foreground font-medium">{batchAnalysis.recommendedApproach}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            AI Recommendations
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAllSequences(!showAllSequences)}
            className="text-xs gap-1"
          >
            {showAllSequences ? 'Show Top 3' : 'View All'}
            <ChevronRight className={cn("w-3 h-3 transition-transform", showAllSequences && "rotate-90")} />
          </Button>
        </div>

        <div className="space-y-2">
          {(showAllSequences ? recommendations : topRecommendations).map((rec, idx) => (
            <motion.div
              key={rec.sequence.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "p-3 rounded-xl border-2 cursor-pointer transition-all",
                selectedSequence?.id === rec.sequence.id
                  ? "border-primary bg-primary/10 shadow-lg"
                  : "border-border bg-background hover:border-primary/50"
              )}
              onClick={() => handleSelectSequence(rec.sequence)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{rec.sequence.emoji}</span>
                    <h5 className="font-semibold text-sm">{rec.sequence.name}</h5>
                    <Badge className={cn("text-[9px]", getPriorityColor(rec.sequence.priority))}>
                      {getPriorityIcon(rec.sequence.priority)}
                      {rec.sequence.priority}
                    </Badge>
                    {idx === 0 && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] gap-1">
                        <Crown className="w-3 h-3" /> Best Match
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{rec.sequence.description}</p>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {rec.matchedLeadCount} leads matched
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      ~{rec.estimatedResponseRate} response
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {rec.sequence.steps.length} steps
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-primary">{rec.score}%</div>
                  <div className="text-[9px] text-muted-foreground">match</div>
                </div>
              </div>
              
              {selectedSequence?.id === rec.sequence.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="mt-3 pt-3 border-t border-border"
                >
                  <p className="text-xs text-muted-foreground mb-2">
                    <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
                    {rec.reason}
                  </p>
                  
                  {/* Step Preview */}
                  <div className="space-y-2 mb-3">
                    {rec.sequence.steps.map((step, stepIdx) => (
                      <div
                        key={stepIdx}
                        className={cn(
                          "p-2 rounded-lg text-xs transition-all cursor-pointer",
                          previewStep === stepIdx
                            ? "bg-primary/20 border border-primary/30"
                            : "bg-muted/50 hover:bg-muted"
                        )}
                        onClick={(e) => { e.stopPropagation(); setPreviewStep(stepIdx); }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[9px] h-5">Day {step.day}</Badge>
                          <span className="font-medium truncate">{step.action}</span>
                        </div>
                        {previewStep === stepIdx && (
                          <div className="mt-2 p-2 rounded bg-background text-[11px] font-mono">
                            <div className="text-muted-foreground mb-1">Subject:</div>
                            <div className="text-foreground mb-2">{step.subject}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={(e) => { e.stopPropagation(); handleSelectSequence(rec.sequence); }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Use This Sequence
                    </Button>
                    {mode === 'autopilot' && onStartAutopilot && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2 bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                        onClick={(e) => { e.stopPropagation(); handleStartAutopilot(); }}
                      >
                        <Bot className="w-4 h-4" />
                        Start Autopilot
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Browse by Priority */}
      {showAllSequences && (
        <Card className="border border-border">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Browse by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedPriority} onValueChange={(v) => setSelectedPriority(v as LeadPriority)}>
              <TabsList className="w-full mb-3">
                <TabsTrigger value="hot" className="flex-1 gap-1 text-xs">
                  <Flame className="w-3 h-3" /> Hot ({allSequences.filter(s => s.priority === 'hot').length})
                </TabsTrigger>
                <TabsTrigger value="warm" className="flex-1 gap-1 text-xs">
                  <ThermometerSun className="w-3 h-3" /> Warm ({allSequences.filter(s => s.priority === 'warm').length})
                </TabsTrigger>
                <TabsTrigger value="cold" className="flex-1 gap-1 text-xs">
                  <Snowflake className="w-3 h-3" /> Cold ({allSequences.filter(s => s.priority === 'cold').length})
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {filteredSequences.map((seq) => (
                    <div
                      key={seq.id}
                      className={cn(
                        "p-2 rounded-lg border cursor-pointer transition-all",
                        selectedSequence?.id === seq.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleSelectSequence(seq)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{seq.emoji}</span>
                        <span className="text-sm font-medium">{seq.name}</span>
                        <Badge variant="secondary" className="text-[9px] ml-auto">
                          {seq.steps.length} steps
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* AI Autopilot Mode Explanation */}
      {mode === 'autopilot' && (
        <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">AI Autopilot Mode</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  AI will automatically: Select the best sequence for each lead • Send follow-ups • 
                  Respond to replies • Detect buying signals • Recommend proposals/contracts when ready
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[9px] gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Auto Follow-ups
                  </Badge>
                  <Badge variant="outline" className="text-[9px] gap-1">
                    <Brain className="w-3 h-3 text-amber-400" /> Intent Detection
                  </Badge>
                  <Badge variant="outline" className="text-[9px] gap-1">
                    <Target className="w-3 h-3 text-amber-400" /> Smart Sequences
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
