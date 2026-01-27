// AI Intelligence Decision Panel - Shows AI's self-questioning logic for sequence selection
import { useState, useEffect, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Brain, ChevronDown, ChevronUp, Globe, Store, Lightbulb, 
  AlertCircle, CheckCircle2, Flame, ThermometerSun, Snowflake,
  Target, Zap, MessageSquare, TrendingUp, Search, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  analyzeLeadForSequence, 
  LeadIntelligence, 
  SequenceDecision,
  SEARCH_A_PROFESSIONALS,
  SEARCH_B_PROFESSIONALS,
  generateUniqueInsights
} from '@/lib/aiSequenceIntelligence';
import { SearchType, LeadPriority } from '@/lib/emailSequences';

interface Lead {
  id?: string | number;
  email?: string;
  business_name?: string;
  name?: string;
  industry?: string;
  website?: string;
  aiClassification?: 'hot' | 'warm' | 'cold';
  rating?: number;
  reviewCount?: number;
  websiteAnalysis?: {
    hasWebsite: boolean;
    platform?: string;
    needsUpgrade: boolean;
    mobileScore?: number;
    loadTime?: number;
    issues?: string[];
    opportunities?: string[];
    hasSSL?: boolean;
  };
  painPoints?: string[];
  talkingPoints?: string[];
}

interface AIIntelligenceDecisionPanelProps {
  searchType: SearchType | null;
  leads: Lead[];
  selectedLeadIndex?: number;
  onApplySequence?: (sequenceIds: string[], decision: SequenceDecision) => void;
  className?: string;
}

export default function AIIntelligenceDecisionPanel({
  searchType,
  leads,
  selectedLeadIndex = 0,
  onApplySequence,
  className
}: AIIntelligenceDecisionPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showProfessionals, setShowProfessionals] = useState(false);

  const currentLead = useMemo(() => leads[selectedLeadIndex] || null, [leads, selectedLeadIndex]);

  // Convert lead data to intelligence format
  const leadIntelligence: LeadIntelligence = useMemo(() => {
    if (!currentLead) {
      return {
        hasWebsite: true,
        websiteNeedsUpdate: false,
        painPoints: [],
        opportunities: [],
      };
    }

    const analysis = currentLead.websiteAnalysis;
    return {
      hasWebsite: analysis?.hasWebsite ?? !!currentLead.website,
      websiteNeedsUpdate: analysis?.needsUpgrade ?? false,
      websitePlatform: analysis?.platform,
      mobileScore: analysis?.mobileScore,
      loadTime: analysis?.loadTime,
      hasSSL: analysis?.hasSSL,
      reviewRating: currentLead.rating,
      painPoints: currentLead.painPoints || analysis?.issues || [],
      opportunities: analysis?.opportunities || [],
      industry: currentLead.industry,
    };
  }, [currentLead]);

  // Get AI decision for current lead
  const aiDecision = useMemo(() => {
    if (!currentLead) return null;
    const priority = (currentLead.aiClassification || 'cold') as LeadPriority;
    const type = (searchType || 'gmb') as SearchType;
    return analyzeLeadForSequence(type, priority, leadIntelligence);
  }, [currentLead, searchType, leadIntelligence]);

  // Generate unique insights
  const uniqueInsights = useMemo(() => {
    if (!currentLead) return null;
    return generateUniqueInsights({
      hasWebsite: leadIntelligence.hasWebsite,
      rating: currentLead.rating,
      reviewCount: currentLead.reviewCount,
      mobileScore: leadIntelligence.mobileScore,
      loadTime: leadIntelligence.loadTime,
      hasSSL: leadIntelligence.hasSSL,
    });
  }, [currentLead, leadIntelligence]);

  // Get summary stats for all leads
  const leadStats = useMemo(() => {
    const noWebsite = leads.filter(l => !l.websiteAnalysis?.hasWebsite && !l.website).length;
    const needsUpgrade = leads.filter(l => l.websiteAnalysis?.needsUpgrade).length;
    const hot = leads.filter(l => l.aiClassification === 'hot').length;
    const warm = leads.filter(l => l.aiClassification === 'warm').length;
    const cold = leads.filter(l => l.aiClassification === 'cold' || !l.aiClassification).length;
    return { noWebsite, needsUpgrade, hot, warm, cold, total: leads.length };
  }, [leads]);

  const getPriorityIcon = (priority?: 'hot' | 'warm' | 'cold') => {
    switch (priority) {
      case 'hot': return <Flame className="w-3.5 h-3.5 text-red-400" />;
      case 'warm': return <ThermometerSun className="w-3.5 h-3.5 text-amber-400" />;
      default: return <Snowflake className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'medium': return 'text-amber-400 bg-amber-500/20 border-amber-500/30';
      default: return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    }
  };

  const professionals = searchType === 'gmb' ? SEARCH_A_PROFESSIONALS : SEARCH_B_PROFESSIONALS;

  if (!currentLead && leads.length === 0) {
    return (
      <div className={cn("p-4 rounded-xl bg-muted/30 border border-border", className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Brain className="w-5 h-5" />
          <span className="text-sm">Run a search to see AI intelligence analysis</span>
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded} className={className}>
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-background to-amber-500/5 overflow-hidden">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-foreground">AI Intelligence Decision Panel</h4>
                  <Badge className={cn(
                    "text-[9px]",
                    searchType === 'gmb' 
                      ? "bg-primary/20 text-primary border-primary/30" 
                      : "bg-violet-500/20 text-violet-400 border-violet-500/30"
                  )}>
                    {searchType === 'gmb' ? (
                      <><Globe className="w-2.5 h-2.5 mr-1" />Super AI Search</>
                    ) : (
                      <><Store className="w-2.5 h-2.5 mr-1" />Agency Finder</>
                    )}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  AI self-questioning logic for {leads.length} leads
                </p>
              </div>
            </div>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {/* Lead Stats Summary */}
            <div className="grid grid-cols-5 gap-2">
              <div className="p-2 rounded-lg bg-background/50 border border-border text-center">
                <div className="text-lg font-bold text-foreground">{leadStats.total}</div>
                <div className="text-[9px] text-muted-foreground">Total</div>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
                <div className="text-lg font-bold text-red-400">{leadStats.hot}</div>
                <div className="text-[9px] text-muted-foreground">Hot</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="text-lg font-bold text-amber-400">{leadStats.warm}</div>
                <div className="text-[9px] text-muted-foreground">Warm</div>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                <div className="text-lg font-bold text-blue-400">{leadStats.cold}</div>
                <div className="text-[9px] text-muted-foreground">Cold</div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="text-lg font-bold text-emerald-400">{leadStats.noWebsite}</div>
                <div className="text-[9px] text-muted-foreground">No Site</div>
              </div>
            </div>

            {/* Current Lead Analysis */}
            {currentLead && aiDecision && (
              <div className="p-4 rounded-xl bg-muted/30 border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground text-sm">
                      {currentLead.business_name || currentLead.name || 'Current Lead'}
                    </span>
                    <Badge variant="outline" className="text-[10px] gap-1">
                      {getPriorityIcon(currentLead.aiClassification)}
                      {currentLead.aiClassification || 'cold'}
                    </Badge>
                  </div>
                  <Badge className={cn("text-[10px]", getUrgencyColor(aiDecision.urgencyLevel))}>
                    {aiDecision.urgencyLevel} urgency
                  </Badge>
                </div>

                {/* AI Reasoning */}
                <div className="space-y-2 mb-4">
                  <h5 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    AI Self-Questioning Process:
                  </h5>
                  <ScrollArea className="h-[120px]">
                    <div className="space-y-1.5">
                      {aiDecision.reasoning.map((reason, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "text-xs p-2 rounded-lg",
                            reason.startsWith('🧠') ? "bg-primary/10 text-primary font-medium" :
                            reason.startsWith('❓') ? "bg-blue-500/10 text-blue-400" :
                            reason.startsWith('💡') ? "bg-amber-500/10 text-amber-400" :
                            "bg-muted text-muted-foreground"
                          )}
                        >
                          {reason}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Key Talking Points */}
                <div className="mb-4">
                  <h5 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Key Talking Points:
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {aiDecision.keyTalkingPoints.slice(0, 4).map((point, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px] bg-background">
                        {point.length > 50 ? point.substring(0, 50) + '...' : point}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Personalized Opener Preview */}
                <div className="p-3 rounded-lg bg-background/50 border border-border">
                  <h5 className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    AI-Generated Opener:
                  </h5>
                  <p className="text-xs text-foreground leading-relaxed italic">
                    "{aiDecision.personalizedOpener}"
                  </p>
                </div>

                {/* Unique Insights */}
                {uniqueInsights && (
                  <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-emerald-500/5 border border-primary/20">
                    <h5 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-primary" />
                      Unique Business Insights:
                    </h5>
                    <div className="space-y-1.5 text-xs">
                      {uniqueInsights.uniqueOffering && (
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">
                            <span className="text-foreground font-medium">Offering:</span> {uniqueInsights.uniqueOffering}
                          </span>
                        </div>
                      )}
                      {uniqueInsights.marketPosition && (
                        <div className="flex items-start gap-2">
                          <Target className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">
                            <span className="text-foreground font-medium">Position:</span> {uniqueInsights.marketPosition}
                          </span>
                        </div>
                      )}
                      {uniqueInsights.improvementAreas.length > 0 && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">
                            <span className="text-foreground font-medium">Improve:</span> {uniqueInsights.improvementAreas.slice(0, 3).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Apply Button */}
                {onApplySequence && (
                  <Button
                    onClick={() => onApplySequence(aiDecision.recommendedSequenceIds, aiDecision)}
                    className="w-full mt-4 bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90 gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    Apply AI Recommendation
                  </Button>
                )}
              </div>
            )}

            {/* Professional Use Cases */}
            <Collapsible open={showProfessionals} onOpenChange={setShowProfessionals}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Who uses {searchType === 'gmb' ? 'Super AI Business Search' : 'Agency Lead Finder'}?
                    </span>
                  </div>
                  {showProfessionals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-3 rounded-lg bg-background/50 border border-border">
                  <div className="flex flex-wrap gap-1.5">
                    {professionals.slice(0, 20).map((prof, idx) => (
                      <Badge key={idx} variant="outline" className="text-[10px]">
                        {prof}
                      </Badge>
                    ))}
                    {professionals.length > 20 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{professionals.length - 20} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
